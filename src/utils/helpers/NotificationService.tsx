import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  AndroidDefaults,
  AndroidFlags,
  AndroidLaunchActivityFlag,
  EventType,
} from '@notifee/react-native';
import { store } from '../../store';
import { receiveIncomingCall, endCall } from '../../store/slice/call.slice';
import { signalCall, extractConversationId, markMessagesRead, getStoredAuthToken, getStoredUserId } from './socket';
import { Platform } from 'react-native';
import { BASE_URL } from '@env';
import { saveMessage } from '../../db/messageRepository';
import { clearUnread, updateChatLastMessage, updateChatReadStatus } from '../../db/mmkv';

const CH_MSG     = 'messages';
const CH_CALL    = 'incoming_call';
const CH_ONGOING = 'ongoing_call';
const ID_CALL    = 'incoming_call';
const ID_ONGOING = 'ongoing_call';
let backgroundHandlerRegistered = false;

const callActivityFlags = [
  AndroidLaunchActivityFlag.NEW_TASK,
  AndroidLaunchActivityFlag.SINGLE_TOP,
  AndroidLaunchActivityFlag.NO_USER_ACTION,
];

// ── Create channels ───────────────────────────────────────────────
export const createChannels = async () => {
  // Delete ALL possible old channel IDs (Android caches permanently)
  const oldIds = ['default', 'messages', 'incoming_call', 'ongoing_call', 'msg_channel'];
  for (const id of oldIds) {
    try { await notifee.deleteChannel(id); } catch {}
  }

  await notifee.createChannel({
    id: CH_MSG,
    name: 'Messages',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: CH_CALL,
    name: 'Incoming Calls',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [0, 900, 500, 900],
    lights: true,
  });

  await notifee.createChannel({
    id: CH_ONGOING,
    name: 'Ongoing Call',
    importance: AndroidImportance.LOW,
    sound: '',
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
  catch (e) { console.log('[NS] FCM token error:', e); return null; }
};

export const registerDeviceToken = async (deviceToken: string | null) => {
  if (!deviceToken) return;
  const token = store.getState().auth.token;
  if (!token) return;

  try {
    await fetch(`${BASE_URL}/api/notification/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deviceToken, deviceType: Platform.OS }),
    });
  } catch (e) {
    console.log('[NS] registerDeviceToken error:', e);
  }
};

export const listenFcmTokenRefresh = (callback: (token: string) => void) => {
  return messaging().onTokenRefresh(callback);
};

// ── Message notification with Reply + Mark as Read ────────────────
export const showMessageNotification = async (
  title: string,
  body: string,
  data?: any,
) => {
  const conversationId = data?.conversationId;
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: CH_MSG,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      actions: conversationId
        ? [
            {
              title: '💬 Reply',
              pressAction: { id: 'reply' },
              input: {
                allowFreeFormInput: true,
                placeholder: 'Type a reply...',
              },
            },
            {
              title: '✓ Mark as Read',
              pressAction: { id: 'mark_read' },
            },
          ]
        : undefined,
    },
  });
};

// ── Incoming call notification ────────────────────────────────────
const showIncomingCallNotification = async (data: any) => {
  await notifee.displayNotification({
    id: ID_CALL,
    title: `${data.callType === 'video' ? '📹 Video' : '📞 Voice'} Call`,
    body: `${data.callerName} is calling...`,
    data,
    android: {
      channelId: CH_CALL,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_launcher',
      ongoing: true,
      onlyAlertOnce: false,
      autoCancel: false,
      defaults: [AndroidDefaults.SOUND, AndroidDefaults.VIBRATE, AndroidDefaults.LIGHTS],
      flags: [AndroidFlags.FLAG_INSISTENT, AndroidFlags.FLAG_NO_CLEAR],
      timeoutAfter: 45000,
      vibrationPattern: [0, 900, 500, 900],
      lights: ['#22C55E', 300, 600],
      fullScreenAction: {
        id: 'default',
        launchActivity: 'com.chatappnew.IncomingCallActivity',
        launchActivityFlags: callActivityFlags,
      },
      pressAction: {
        id: 'default',
        launchActivity: 'com.chatappnew.IncomingCallActivity',
        launchActivityFlags: callActivityFlags,
      },
      actions: [
        {
          title: '✅ Accept',
          pressAction: {
            id: 'accept',
            launchActivity: 'com.chatappnew.IncomingCallActivity',
            launchActivityFlags: callActivityFlags,
          },
        },
        {
          title: '❌ Decline',
          pressAction: { id: 'decline' },
        },
      ],
    },
    ios: {
      categoryId: 'incoming_call',
      foregroundPresentationOptions: { alert: true, sound: true, badge: false },
    },
  });
};

// ── Ongoing call notification ─────────────────────────────────────
export const showOngoingCallNotification = async (
  callerName: string,
  callType: string,
) => {
  await notifee.displayNotification({
    id: ID_ONGOING,
    title: `${callType === 'video' ? '📹' : '📞'} Call in progress`,
    body: `With ${callerName} · Tap to return`,
    android: {
      channelId: CH_ONGOING,
      importance: AndroidImportance.LOW,
      smallIcon: 'ic_launcher',
      ongoing: true,
      onlyAlertOnce: true,
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [{ title: '🔴 End Call', pressAction: { id: 'end_call' } }],
    },
  });
};

export const cancelIncomingCallNotification = () =>
  notifee.cancelNotification(ID_CALL).catch(() => {});

export const cancelOngoingCallNotification = () =>
  notifee.cancelNotification(ID_ONGOING).catch(() => {});

// ── Dispatch incoming call to Redux ───────────────────────────────
export const dispatchIncomingCall = (data: any, autoAccepted = false) => {
  console.log('[NS] dispatchIncomingCall autoAccepted:', autoAccepted);
  store.dispatch(
    receiveIncomingCall({
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
    }),
  );
};

// ── Send reply message via API ────────────────────────────────────
const sendReplyMessage = async (conversationId: string, text: string) => {
  const token = await getStoredAuthToken();
  try {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId, text }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    return payload?.message ?? null;
  } catch (e) {
    console.log('[NS] sendReply error:', e);
    return null;
  }
};

// ── Handle incoming call FCM ──────────────────────────────────────
const handleIncomingCallData = async (
  data: any,
  isForeground: boolean,
): Promise<boolean> => {
  if (data?.type !== 'incoming_call') return false;
  console.log('[NS] incoming call foreground:', isForeground);

  if (isForeground) {
    dispatchIncomingCall(data);
  } else {
    // Show notification — fullScreenAction launches IncomingCallActivity
    await showIncomingCallNotification(data);
    // Also dispatch so Redux is ready when app opens
    dispatchIncomingCall(data);
  }
  return true;
};

// ── Foreground FCM ────────────────────────────────────────────────
export const listenForegroundNotification = () => {
  return messaging().onMessage(async remoteMessage => {
    const handled = await handleIncomingCallData(remoteMessage.data, true);
    if (handled) return;
    await showMessageNotification(
      (remoteMessage.data?.title as string) ||
        remoteMessage.notification?.title ||
        'New Message',
      (remoteMessage.data?.body as string) ||
        remoteMessage.notification?.body ||
        '',
      remoteMessage.data,
    );
  });
};

// ── Handle action (shared between foreground + background) ────────
const handleAction = async (
  actionId: string,
  data: any,
  notifId: string | undefined,
  inputText?: string,
) => {
  const convId =
    data?.conversationId || extractConversationId(data?.channelName ?? '');

  if (actionId === 'reply' && data?.conversationId && inputText) {
    const sentMessage = await sendReplyMessage(data.conversationId, inputText);
    if (sentMessage) {
      const userId = await getStoredUserId();
      await saveMessage(sentMessage);
      updateChatLastMessage(data.conversationId, sentMessage);
      clearUnread(data.conversationId);
      await markMessagesRead(data.conversationId);
      updateChatReadStatus(data.conversationId, userId);
    }
    // Update notification to show reply was sent
    await notifee.displayNotification({
      id: notifId || 'msg',
      title: data.title || 'Message',
      body: `You: ${inputText}`,
      data,
      android: {
        channelId: CH_MSG,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });

  } else if (actionId === 'mark_read' && data?.conversationId) {
    const userId = await getStoredUserId();
    await markMessagesRead(data.conversationId);
    clearUnread(data.conversationId);
    updateChatReadStatus(data.conversationId, userId);
    if (notifId) await notifee.cancelNotification(notifId).catch(() => {});

  } else if (actionId === 'accept' && data) {
    if (convId && data.channelName) {
      try { await signalCall(convId, 'accepted', data.channelName); } catch {}
    }
    await cancelIncomingCallNotification();
    dispatchIncomingCall(data, true);

  } else if (actionId === 'decline' && data) {
    if (convId && data.channelName) {
      try { await signalCall(convId, 'declined', data.channelName); } catch {}
    }
    store.dispatch(endCall());
    await cancelIncomingCallNotification();

  } else if (actionId === 'end_call') {
    const state = store.getState().call;
    const cId =
      state.conversationId || extractConversationId(state.channelName ?? '');
    if (cId && state.channelName) {
      try { await signalCall(cId, 'ended', state.channelName); } catch {}
    }
    store.dispatch(endCall());
    await cancelOngoingCallNotification();
  }
};

// ── Background handler ────────────────────────────────────────────
export const registerBackgroundHandler = () => {
  if (backgroundHandlerRegistered) return;
  backgroundHandlerRegistered = true;

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    const handled = await handleIncomingCallData(remoteMessage.data, false);
    if (handled) return;
    await showMessageNotification(
      (remoteMessage.data?.title as string) ||
        remoteMessage.notification?.title ||
        'New Message',
      (remoteMessage.data?.body as string) ||
        remoteMessage.notification?.body ||
        '',
      remoteMessage.data,
    );
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.ACTION_PRESS && type !== EventType.DISMISSED) return;

    const data = detail.notification?.data as any;
    const actionId = detail.pressAction?.id ?? '';
    const inputText = detail.input;

    if (type === EventType.DISMISSED && detail.notification?.id === ID_CALL) {
      const convId =
        data?.conversationId || extractConversationId(data?.channelName ?? '');
      if (convId && data?.channelName) {
        try { await signalCall(convId, 'declined', data.channelName); } catch {}
      }
      store.dispatch(endCall());
      return;
    }

    await handleAction(
      actionId,
      data,
      detail.notification?.id,
      inputText,
    );
  });
};

// ── Foreground notifee events ─────────────────────────────────────
export const onNotificationOpened = (callback: (data: any) => void) => {
  messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage?.data) callback(remoteMessage.data);
  });

  notifee.onForegroundEvent(({ type, detail }) => {
    if (type !== EventType.ACTION_PRESS) return;

    const actionId = detail.pressAction?.id ?? '';
    const data = detail.notification?.data as any;
    const inputText = detail.input;

    handleAction(actionId, data, detail.notification?.id, inputText);
  });
};

// ── Killed state ──────────────────────────────────────────────────
export const getInitialNotification = async (
  callback: (data: any) => void,
) => {
  const fcmMessage = await messaging().getInitialNotification();
  if (fcmMessage?.data) {
    callback(fcmMessage.data);
    return;
  }
  const notifeeInitial = await notifee.getInitialNotification();
  if (notifeeInitial?.notification?.data)
    callback(notifeeInitial.notification.data);
};

// ── Init ──────────────────────────────────────────────────────────
export const initNotification = async () => {
  await requestNotificationPermission();
  await createChannels();
  registerBackgroundHandler();
};
