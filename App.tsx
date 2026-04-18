import React, { useEffect, useRef } from "react";
import { AppState, DeviceEventEmitter } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack";
import AppStack from "./src/navigation/AppStack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store, useAppSelector } from "./src/store";
import { setDeviceToken } from "./src/store/slice/auth.slice";
import { configureGoogleSignIn } from "./src/utils/googleSignIn";
import {
  initNotification,
  getFcmToken,
  listenForegroundNotification,
  onNotificationOpened,
  getInitialNotification,
  dispatchIncomingCall,
  cancelIncomingCallNotification,
} from "./src/utils/helpers/NotificationService";
import {
  signalCall,
  extractConversationId,
  notifyOnline,
  notifyOffline,
  disconnectPusher,
} from "./src/utils/helpers/socket";
import { endCall } from "./src/store/slice/call.slice";
import { getDB } from "./src/db/sqlite";
import CallOverlay from "./src/components/CallOverlay";
import { setupCallKeep } from "./src/utils/helpers/CallKeepService";

function Routes() {
  const { token } = useAppSelector(state => state.auth);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    configureGoogleSignIn();
    getDB();
    setupCallKeep();
  }, []);

  useEffect(() => {
    const setup = async () => {
      await initNotification();
      const fcmToken = await getFcmToken();
      if (fcmToken) store.dispatch(setDeviceToken(fcmToken));
    };
    setup();

    const unsubscribeForeground = listenForegroundNotification();

    // Handle accept/decline from native IncomingCallActivity
    // This fires when app is in background OR killed (via onResume flush)
    const callActionSub = DeviceEventEmitter.addListener(
      "onCallAction",
      params => {
        console.log("[App] onCallAction:", params);
        const convId =
          params.conversationId || extractConversationId(params.channelName);

        if (params.action === "accept") {
          // Dispatch incoming call first so Redux has the data
          dispatchIncomingCall(
            {
              callType: params.callType,
              channelName: params.channelName,
              token: params.token,
              uid: params.uid,
              conversationId: params.conversationId,
              callerId: params.callerId,
              callerName: params.callerName,
              callerAvatar: params.callerAvatar,
            },
            true, // autoAccepted = true → goes straight to ActiveCallScreen
          );
          if (convId && params.channelName) {
            signalCall(convId, "accepted", params.channelName).catch(() => {});
          }
        } else if (params.action === "decline") {
          if (convId && params.channelName) {
            signalCall(convId, "declined", params.channelName).catch(() => {});
          }
          store.dispatch(endCall());
          cancelIncomingCallNotification();
        }
      },
    );

    // Notification tap from background
    onNotificationOpened(data => {
      if (data?.type === "incoming_call") {
        dispatchIncomingCall(data);
      }
    });

    // Notification tap from killed state
    getInitialNotification(data => {
      if (data?.type === "incoming_call") {
        dispatchIncomingCall(data);
      }
    });

    return () => {
      unsubscribeForeground();
      callActionSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    notifyOnline();

    const subscription = AppState.addEventListener("change", nextState => {
      const prev = appState.current;
      appState.current = nextState;
      if (nextState === "active") {
        notifyOnline();
      } else if (
        prev === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        notifyOffline();
      }
    });

    return () => {
      notifyOffline();
      disconnectPusher();
      subscription.remove();
    };
  }, [token]);

  return token ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Routes />
          <CallOverlay />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
