import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";
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
} from "./src/utils/helpers/NotificationService";
import { notifyOnline, notifyOffline, disconnectPusher } from "./src/utils/helpers/socket";
import { getDB } from "./src/db/sqlite";
import CallOverlay from "./src/components/CallOverlay";

function Routes() {
  const { token } = useAppSelector(state => state.auth);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    configureGoogleSignIn();
    getDB(); // Initialize SQLite schema on app start
  }, []);

  useEffect(() => {
    const setup = async () => {
      await initNotification();
      const token = await getFcmToken();
      if (token) store.dispatch(setDeviceToken(token));
    };
    setup();
    const unsubscribeForeground = listenForegroundNotification();

    // Handle notification tap from background
    onNotificationOpened((data) => {
      if (data?.type === 'incoming_call') {
        dispatchIncomingCall(data);
      }
    });

    // Handle notification tap from killed state
    getInitialNotification((data) => {
      if (data?.type === 'incoming_call') {
        dispatchIncomingCall(data);
      }
    });

    return () => unsubscribeForeground();
  }, []);

  // Online / offline based on app foreground state
  useEffect(() => {
    if (!token) return;

    const broadcastOnline = () => notifyOnline();
    const broadcastOffline = () => notifyOffline();

    broadcastOnline();

    const subscription = AppState.addEventListener('change', nextState => {
      const prev = appState.current;
      appState.current = nextState;
      if (nextState === 'active') {
        broadcastOnline();
      } else if (prev === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        broadcastOffline();
      }
    });

    return () => {
      broadcastOffline();
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