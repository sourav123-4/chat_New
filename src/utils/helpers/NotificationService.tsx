import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  EventType,
} from '@notifee/react-native';
import { store } from '../../store';
import { receiveIncomingCall } from '../../store/slice/call.slice';

// ── Channel setup ─────────────────────────────────────────────────
const createChannels = async () => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: 'incoming_call',
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
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
  try {
    return await messaging().getToken();
  } catch (e) {
    console.log('FCM ERROR:', e);
    return null;
  }
};

// ── Regular notification ──────────────────────────────────────────
const showNotification = async (title: string, body: string, data?: any) => {
  await createChannels();
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: 'default',
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
    },
  });
};

// ── Show incoming call notification (background/killed) ───────────
const showIncomingCallNotification = async (data: any) => {
  await createChannels();
  await notifee.displayNotification({
    id: 'incoming_call',
    title: `📞 Incoming ${data.callType === 'video' ? 'Video' : 'Voice'} Call`,
    body: `${data.callerName} is calling you`,
    data,
    android: {
      channelId: 'incoming_call',
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [
        { title: '✅ Accept', pressAction: { id: 'accept', launchActivity: 'default' } },
        { title: '❌ Decline', pressAction: { id: 'decline' } },
      ],
      fullScreenAction: { id: 'default', launchActivity: 'default' },
    },
    ios: {
      categoryId: 'incoming_call',
    },
  });
};

// ── Dispatch incoming call to Redux ───────────────────────────────
export const dispatchIncomingCall = (data: any) => {
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
    isGroup: data.isGroup === 'true',
    groupName: data.groupName,
  }));
};

// ── Handle incoming call FCM ──────────────────────────────────────
const handleIncomingCallData = async (data: any, isForeground: boolean): Promise<boolean> => {
  if (data?.type !== 'incoming_call') return false;

  if (isForeground) {
    // App is open — dispatch directly to Redux
    dispatchIncomingCall(data);
  } else {
    // Background/killed — show a full-screen notification
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
      remoteMessage.data
    );
  });
};

// ── Background handler (runs in separate JS context) ─────────────
export const registerBackgroundHandler = () => {
  // FCM background
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    await handleIncomingCallData(remoteMessage.data, false);
  });

  // Notifee background action handler (Accept / Decline buttons)
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
      const data = detail.notification?.data;
      if (detail.pressAction?.id === 'accept' && data) {
        dispatchIncomingCall(data);
      }
      // Decline or dismiss — just cancel the notification
      await notifee.cancelNotification('incoming_call');
    }
  });
};

// ── Handle notification tap (background → foreground) ────────────
export const onNotificationOpened = (callback: (data: any) => void) => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage?.data) callback(remoteMessage.data);
  });

  // Notifee foreground event (Accept button tap while app is open)
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'accept') {
      const data = detail.notification?.data;
      if (data) dispatchIncomingCall(data);
      notifee.cancelNotification('incoming_call');
    }
  });
};

// ── Killed state — app opened via notification tap ────────────────
export const getInitialNotification = async (callback: (data: any) => void) => {
  // FCM killed state
  const fcmMessage = await messaging().getInitialNotification();
  if (fcmMessage?.data) {
    callback(fcmMessage.data);
    return;
  }
  // Notifee killed state
  const notifeeInitial = await notifee.getInitialNotification();
  if (notifeeInitial?.notification?.data) {
    callback(notifeeInitial.notification.data);
  }
};

// ── Init ──────────────────────────────────────────────────────────
export const initNotification = async () => {
  await requestNotificationPermission();
  await createChannels();
  registerBackgroundHandler();
};
