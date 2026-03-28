import messaging from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";

/**
 * =========================
 * CREATE ANDROID CHANNEL
 * =========================
 */
const createChannel = async () => {
  await notifee.createChannel({
    id: "default",
    name: "Default Notifications",
    importance: AndroidImportance.HIGH,
  });
};

/**
 * =========================
 * REQUEST PERMISSION
 * =========================
 */
export const requestNotificationPermission = async () => {
  await notifee.requestPermission();
  const status = await messaging().requestPermission();

  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
};

/**
 * =========================
 * GET FCM TOKEN
 * =========================
 */
export const getFcmToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    console.log("FCM TOKEN: ", token);
    return token;
  } catch (e) {
    console.log("FCM ERROR:", e);
    return null;
  }
};

/**
 * =========================
 * SHOW NOTIFICATION (via Notifee)
 * =========================
 */
const showNotification = async (
  title: string,
  body: string,
  data?: any
) => {
  await createChannel();

  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: "default",
      pressAction: { id: "default" },
      smallIcon: "ic_launcher",
    },
  });
};

/**
 * =========================
 * FOREGROUND NOTIFICATION
 * Firebase does NOT auto-display in foreground,
 * so we manually show it using Notifee.
 * =========================
 */
export const listenForegroundNotification = () => {
  return messaging().onMessage(async remoteMessage => {
    await showNotification(
      remoteMessage.data?.title as string || remoteMessage.notification?.title || "New Notification",
      remoteMessage.data?.body as string || remoteMessage.notification?.body || "",
      remoteMessage.data
    );
  });
};

/**
 * =========================
 * BACKGROUND HANDLER
 * If your backend sends a `notification` key, Firebase will
 * auto-display it — do NOT call showNotification here to avoid duplicates.
 *
 * If your backend sends data-only messages (recommended),
 * uncomment showNotification below for full control.
 * =========================
 */
export const registerBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log("Background message received:", remoteMessage.data);

    // ✅ Uncomment below ONLY if your backend sends data-only messages
    // (i.e., no "notification" key in the FCM payload)

    // await showNotification(
    //   remoteMessage.data?.title as string || "New Notification",
    //   remoteMessage.data?.body as string || "",
    //   remoteMessage.data
    // );
  });
};

/**
 * =========================
 * NOTIFICATION TAP (BACKGROUND)
 * Fires when user taps a notification while app is in background.
 * =========================
 */
export const onNotificationOpened = (
  callback: (data: any) => void
) => {
  messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage?.data) {
      callback(remoteMessage.data);
    }
  });
};

/**
 * =========================
 * NOTIFICATION TAP (KILLED STATE)
 * Fires when user taps a notification that launched the app from killed state.
 * =========================
 */
export const getInitialNotification = async (
  callback: (data: any) => void
) => {
  const message = await messaging().getInitialNotification();
  if (message?.data) {
    callback(message.data);
  }
};

/**
 * =========================
 * INIT NOTIFICATION (CALL ONCE on App Start)
 * =========================
 */
export const initNotification = async () => {
  const granted = await requestNotificationPermission();
  if (granted) {
    await getFcmToken();
    registerBackgroundHandler();
  }
};