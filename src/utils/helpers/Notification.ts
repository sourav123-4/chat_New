// src/services/NotificationService.ts

import { Platform } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission as firebaseRequestPermission,
  getToken,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import notifee, {
  EventType,
  AndroidImportance,
  AndroidStyle,
  Notification as NotifeeNotification,
} from '@notifee/react-native';
import { store } from '../../store/index';

/************************************************
 * TYPES
 ************************************************/
export type RemoteMessage = {
  data?: Record<string, any>;
  messageId?: string;
  from?: string;
};

export type ExtractedData = {
  type?: string;
  title: string;
  body: string;
  session_id?: string;
  notification_id?: string;
  uid: string; // must ALWAYS be string (Notifee requirement)
};

/************************************************
 * GLOBAL STATE
 ************************************************/
let cachedChannelId: string | null = null;
let isInitialized = false;

let unsubscribeForeground: (() => void) | null = null;
let unsubscribeBackground: (() => void) | null = null;
let unsubscribeForegroundEvent: (() => void) | null = null;

/************************************************
 * FIXED: UNIFIED DATA PARSER
 ************************************************/
const extractNotificationData = (msg: RemoteMessage): ExtractedData => {
  if (!msg || !msg.data) {
    return {
      title: 'Notification',
      body: '',
      uid: `${Date.now()}`,
    };
  }

  // FIX: your payload is { data: {...} }
  const raw = msg.data;

  const uid = String(raw.uid || msg.messageId || Date.now());

  return {
    type: raw.type,
    title: raw.title || 'Notification',
    body: raw.body || '',
    session_id: raw.session_id,
    notification_id: raw._id || msg.messageId,
    uid,
  };
};

/************************************************
 * NOTIFICATION PERMISSION
 ************************************************/
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    await notifee.requestPermission();

    const app = getApp();
    const messaging = getMessaging(app);

    const authStatus = await firebaseRequestPermission(messaging);

    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.log('[Notification] Permission Error:', error);
    return false;
  }
};

/************************************************
 * GET FCM TOKEN
 ************************************************/
export const getFcmToken = async (): Promise<string | null> => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    const token = await getToken(messaging);

    // if (token) store.dispatch(setDeviceToken(token));

    return token;
  } catch (error) {
    console.log('[Notification] FCM Token Error:', error);
    return null;
  }
};

/************************************************
 * NAVIGATION HANDLER
 ************************************************/
export const handleNotificationNavigation = (msg: any) => {
  const data = extractNotificationData(msg);

  console.log('data is ===>', data);

  if (!data.type) {
    // navigate('Notifications');
    return;
  }

  const _goto = (type: string) => {
    // navigate('DrawerNavigation', {
    //   screen: 'Dashboard',
    //   params: {
    //     screen: 'SessionDetails',
    //     params: {
    //       details: {
    //         _id: data.session_id,
    //         title: data.title,
    //         description: data.body,
    //         notification_id: data.notification_id,
    //       },
    //       type,
    //     },
    //   },
    // });
  };

  switch (data.type) {
    case 'session_accepted':
      _goto('RequestDetails');
      break;

    case 'session_updated':
    case 'session_update_req_accepted':
      _goto('ScheduledDetails');
      break;
    case 'session_update_req_rejected':
    //   navigate('Notifications');
      break;

    default:
    //   navigate('Notifications');
  }
};

/************************************************
 * CLEAN LISTENERS
 ************************************************/
const cleanupListeners = () => {
  try {
    unsubscribeForeground?.();
    unsubscribeForeground = null;

    unsubscribeBackground?.();
    unsubscribeBackground = null;

    unsubscribeForegroundEvent?.();
    unsubscribeForegroundEvent = null;
  } catch (err) {
    console.warn('[Notification] cleanupListeners Error:', err);
  }
};

/************************************************
 * REGISTER ALL FCM + NOTIFEE LISTENERS
 ************************************************/
export const registerListenerWithFCM = (): (() => void) => {
  cleanupListeners();

  const app = getApp();
  const messaging = getMessaging(app);

  /************************************************
   * 🔥 FOREGROUND MESSAGE RECEIVED
   ************************************************/
  unsubscribeForeground = onMessage(messaging, async remoteMessage => {
    console.log('🔥 [FCM] Foreground Message:', remoteMessage);

    const data = extractNotificationData(remoteMessage);
    console.log('🔥 [FCM] Foreground Extracted Data:', data);

    await displayNotification(data.title, data.body, data);
  });

  /************************************************
   * 🔥 NOTIFEE FOREGROUND TAP
   ************************************************/
  unsubscribeForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
    console.log('🔥 [Notifee] Foreground Event:', type, detail);

    if (type === EventType.PRESS && detail.notification?.data) {
      console.log(
        '🔥 [Notifee] Foreground Tap Data:',
        detail.notification.data,
      );

      const parsed = extractNotificationData({
        data: detail.notification.data,
      });

      handleNotificationNavigation({ data: parsed, from: 'foreground_tap' });
    }
  });

  /************************************************
   * 🔥 BACKGROUND TAP WHEN APP IN BACKGROUND
   ************************************************/
  unsubscribeBackground = onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('🔥 [FCM] Background Tap:', remoteMessage);

    const data = extractNotificationData(remoteMessage);
    console.log('🔥 [FCM] Background Tap Extracted:', data);

    handleNotificationNavigation({ data, from: 'background_tap' });
  });

  /************************************************
   * 🔥 INITIAL NOTIFICATION WHEN APP COLD STARTS
   ************************************************/
  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('🔥 [FCM] Initial Notification:', remoteMessage);

        const data = extractNotificationData(remoteMessage);
        console.log('🔥 [FCM] Initial Extracted Data:', data);

        handleNotificationNavigation({ data, from: 'cold_start' });
      } else {
        console.log('ℹ️ [FCM] Initial Notification: none');
      }
    })
    .catch(err => console.warn('[FCM] getInitialNotification Error:', err));

  /************************************************
   * 🔥 BACKGROUND MESSAGE (DATA ONLY)
   ************************************************/
  setBackgroundMessageHandler(messaging, async remoteMessage => {
    console.log('🔥 [FCM] Background Message:', remoteMessage);

    const data = extractNotificationData(remoteMessage);

    console.log('🔥 [FCM] Background Extracted:', data);

    await displayNotification(data.title, data.body, data);

    return Promise.resolve();
  });

  return cleanupListeners;
};

/************************************************
 * DISPLAY NOTIFICATION
 ************************************************/
const displayNotification = async (
  title: string,
  body: string,
  data: ExtractedData,
): Promise<void> => {
  try {
    console.log('data===>', data, title, body);
    if (!cachedChannelId && Platform.OS === 'android') {
      cachedChannelId = await notifee.createChannel({
        id: 'default',
        name: 'Default',
        importance: AndroidImportance.HIGH,
      });
    }

    const safeBody = typeof body === 'string' ? body : '';

    await notifee.displayNotification({
      id: data.uid,
      title,
      body: safeBody,
      data,
      android: {
        channelId: cachedChannelId!,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        style:
          data.session_id &&
          String(data.session_id).trim().length > 0 &&
          safeBody.trim().length > 0
            ? {
                type: AndroidStyle.BIGTEXT,
                text: safeBody,
              }
            : undefined,
        pressAction: { id: 'default' },
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          sound: true,
          badge: true,
        },
      },
    } as NotifeeNotification);
  } catch (err) {
    console.log('[Notification] Display Error:', err);
  }
};

/************************************************
 * SERVICE WRAPPER
 ************************************************/
class NotificationService {
  private cleanupFn: (() => void) | null = null;

  async initialize(): Promise<void> {
    try {
      if (isInitialized) {
        if (!this.cleanupFn) this.cleanupFn = registerListenerWithFCM();
        return;
      }

      const permitted = await requestNotificationPermission();
      if (permitted) await getFcmToken();

      this.cleanupFn = registerListenerWithFCM();
      isInitialized = true;
    } catch (err) {
      console.warn('[NotificationService] initialize Error:', err);
    }
  }

  cleanup(): void {
    try {
      this.cleanupFn?.();
      this.cleanupFn = null;
    } catch (err) {
      console.warn('[NotificationService] cleanup Error:', err);
    } finally {
      isInitialized = false;
    }
  }

  async reinitialize(): Promise<void> {
    this.cleanup();
    await this.initialize();
  }
}

export default new NotificationService();
