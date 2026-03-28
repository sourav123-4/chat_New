import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack";
import AppStack from "./src/navigation/AppStack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store, useAppSelector } from "./src/store";
import { configureGoogleSignIn } from "./src/utils/googleSignIn";
import {
  initNotification,
  listenForegroundNotification,
  onNotificationOpened,
  getInitialNotification,
} from "./src/utils/helpers/NotificationService";

function Routes() {
  const { token } = useAppSelector(state => state.auth);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    // Initialize permissions, FCM token, and background handler
    initNotification();

    // Listen for foreground notifications (manual display via Notifee)
    const unsubscribeForeground = listenForegroundNotification();

    // Handle notification tap when app is in background
    onNotificationOpened(data => {
      console.log("Opened from background:", data);
      // TODO: navigate based on data
      // e.g. navigation.navigate("Chat", { chatId: data.chatId });
    });

    // Handle notification tap when app was killed
    getInitialNotification(data => {
      console.log("Opened from killed state:", data);
      // TODO: navigate based on data
      // e.g. navigation.navigate("Chat", { chatId: data.chatId });
    });

    // Cleanup foreground listener on unmount
    return () => {
      unsubscribeForeground();
    };
  }, []);

  return token ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}