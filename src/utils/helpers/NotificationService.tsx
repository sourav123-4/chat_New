import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import { store } from '../../store';
import { receiveIncomingCall, endCall } from '../../store/slice/call.slice';
import { signalCall, extractConversationId } from './socket';
import { addCallHistory } from '../../store/slice/call.slice';

// ── Channel IDs ───────────────────────────────────────────────────
const CH_DEFAULT = 'default';
const CH_INCOMING = 'incoming_call';
const CH_ONGOING = 'ongoing_call';
const NOTIF_INCOMING_ID = 'incoming_call';
const NOTIF_ONGOING_ID = 'ongoing_call';

// ── Create all channels ───────────────────────────────────────────
const createChannels = async () => {
  // Default messages channel
  await notifee.createChannel({
    id: CH_DEFAULT,
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
  });

  // Incoming call channel — with ringtone sound
  await notifee.createChannel({
    id: CH_INCOMING,
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    sound: 'ringtone',          // plays android/app/src/main/res/raw/ringtone.mp3
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
  });

  // Ongoing call channel — silent, non-dismissible
  await notifee.createChannel({
    id: CH_ONGOING,
    name: 'Ongoing Call',
    importance: AndroidImportance.DEFAULT,
    sound: '',                  // no sound for ongoing
    vibration: false,
  });
};

// ── Permissions ───────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  await notifee.requestPermission();
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
};

// ── FCM Token ─────────────────────────────────────────────────────
export const getFcmToken = async (): Promise<string | null> => {
  try { return await messaging().getToken(); }
  catch (e) { console.log('FCM ERROR:', e); return null; }
};

// ── Regular notification ──────────────────────────────────────────
const showNotification = async (title: string, body: string, data?: any) => {
  await createChannels();
  await notifee.displayNotification({
    title, body, data,
    android: {
      channelId: CH_DEFAULT,
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
    },
  });
};

// ── Show incoming call notification (background/killed) ───────────
const showIncomingCallNotification = async (data: any) => {
  await createChannels();
  await notifee.displayNotification({
    id: NOTIF_INCOMING_ID,
    title: `📞 Incoming ${data.callType === 'video' ? 'Video' : 'Voice'} Call`,
    body: `${data.callerName} is calling you`,
    data,
    android: {
      channelId: CH_INCOMING,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_launcher',
      sound: 'ringtone',
      // Full-screen intent — shows even on locked screen like WhatsApp
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: '✅ Accept', pressAction: { id: 'accept', launchActivity: 'default' } },
        { title: '❌ Decline', pressAction: { id: 'decline' } },
      ],
      // Cannot be dismissed by user swipe
      ongoing: true,
      onlyAlertOnce: false,
    },
    ios: { categoryId: 'incoming_call' },
  });
};

// ── Show ongoing call notification (persistent, non-dismissible) ──
export const showOngoingCallNotification = async (callerName: string, callType: string) => {
  await createChannels();
  await notifee.displayNotification({
    id: NOTIF_ONGOING_ID,
    title: `${callType === 'video' ? '📹' : '📞'} Call in progress`,
    body: `With ${callerName} · Tap to return`,
    android: {
      channelId: CH_ONGOING,
      importance: AndroidImportance.DEFAULT,
      smallIcon: 'ic_launcher',
      ongoing: true,          // cannot be swiped away
      onlyAlertOnce: true,
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: '🔴 End Call', pressAction: { id: 'end_call' } },
      ],
    },
  });
};

// ── Cancel notifications ──────────────────────────────────────────
export const cancelIncomingCallNotification = () =>
  notifee.cancelNotification(NOTIF_INCOMING_ID);

export const cancelOngoingCallNotification = () =>
  notifee.cancelNotification(NOTIF_ONGOING_ID);

// ── Dispatch incoming call to Redux ───────────────────────────────
export const dispatchIncomingCall = (data: any, autoAccepted = false) => {
  console.log('[NS] dispatchIncomingCall autoAccepted:', autoAccepted, JSON.stringify(data));
  store.dispatch(receiveIncomingCall({
    callType: data.callType as 'audio' | 'video',
    channelName: data.channelName,
    token: data.token,
    uid: Number(data.uid),
    conversationId: data.conversationId ?? null,
    remoteUser: {
      _id: data.callerId,
      name: data.callerName,
      avatar: data.callerAvatar || undefined,
    },
    isGroup: data.isGroup === 'true' || data.isGroup === true,
    groupName: data.groupName,
    autoAccepted,
  }));
};

// ── Handle incoming call FCM ──────────────────────────────────────
const handleIncomingCallData = async (data: any, isForeground: boolean): Promise<boolean> => {
  if (data?.type !== 'incoming_call') return false;
  if (isForeground) {
    dispatchIncomingCall(data);
  } else {
    await showIncomingCallNotification(data);
  }
  return true;
};

// ── Foreground listener ───────────────────────────────────────────
export const listenForegroundNotification = () => {
  return messaging().onMessage(async (remoteMessage) => {
    const handled = await handleIncomingCallData(remoteMessage.data, true);
    if (handled) return;
    await showNotification(
      remoteMessage.data?.title as string || remoteMessage.notification?.title || 'New Notification',
      remoteMessage.data?.body as string || remoteMessage.notification?.body || '',
      remoteMessage.data,
    );
  });
};

// ── Background handler ────────────────────────────────────────────
export const registerBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    await handleIncomingCallData(remoteMessage.data, false);
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const data = detail.notification?.data as any;
    const actionId = detail.pressAction?.id;

    if (type === EventType.ACTION_PRESS) {
      const convId = data?.conversationId || extractConversationId(data?.channelName);

      if (actionId === 'accept' && data) {
        if (convId && data.channelName) {
          try { await signalCall(convId, 'accepted', data.channelName); } catch {}
        }
        await cancelIncomingCallNotification();
        dispatchIncomingCall(data, true);

      } else if (actionId === 'decline' && data) {
        if (convId && data.channelName) {
          try { await signalCall(convId, 'declined', data.channelName); } catch {}
        }
        // Log missed call
        store.dispatch(addCallHistory({
          callerId: data.callerId,
          callerName: data.callerName,
          callerAvatar: data.callerAvatar,
          callType: data.callType,
          direction: 'incoming',
          status: 'missed',
          timestamp: Date.now(),
        }));
        store.dispatch(endCall());
        await cancelIncomingCallNotification();

      } else if (actionId === 'end_call') {
        // End call from ongoing notification
        const state = store.getState().call;
        if (state.conversationId && state.channelName) {
          try { await signalCall(state.conversationId, 'ended', state.channelName); } catch {}
        }
        store.dispatch(endCall());
        await cancelOngoingCallNotification();
      }
    }

    // Notification dismissed
    if (type === EventType.DISMISSED && detail.notification?.id === NOTIF_INCOMING_ID) {
      const convId = data?.conversationId || extractConversationId(data?.channelName);
      if (convId && data?.channelName) {
        try { await signalCall(convId, 'declined', data.channelName); } catch {}
      }
      store.dispatch(endCall());
    }
  });
};

// ── Foreground notifee events ─────────────────────────────────────
export const onNotificationOpened = (callback: (data: any) => void) => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage?.data) callback(remoteMessage.data);
  });

  notifee.onForegroundEvent(({ type, detail }) => {
    const actionId = detail.pressAction?.id;
    const data = detail.notification?.data as any;
    const convId = data?.conversationId || extractConversationId(data?.channelName);

    if (type === EventType.ACTION_PRESS) {
      if (actionId === 'accept' && data) {
        cancelIncomingCallNotification();
        dispatchIncomingCall(data);
      } else if (actionId === 'decline' && data) {
        if (convId && data.channelName) {
          signalCall(convId, 'declined', data.channelName).catch(() => {});
        }
        store.dispatch(endCall());
        cancelIncomingCallNotification();
      } else if (actionId === 'end_call') {
        const state = store.getState().call;
        if (state.conversationId && state.channelName) {
          signalCall(state.conversationId, 'ended', state.channelName).catch(() => {});
        }
        store.dispatch(endCall());
        cancelOngoingCallNotification();
      }
    }
  });
};

// ── Killed state ──────────────────────────────────────────────────
export const getInitialNotification = async (callback: (data: any) => void) => {
  const fcmMessage = await messaging().getInitialNotification();
  if (fcmMessage?.data) { callback(fcmMessage.data); return; }
  const notifeeInitial = await notifee.getInitialNotification();
  if (notifeeInitial?.notification?.data) callback(notifeeInitial.notification.data);
};

// ── Init ──────────────────────────────────────────────────────────
export const initNotification = async () => {
  await requestNotificationPermission();
  await createChannels();
  registerBackgroundHandler();
};
