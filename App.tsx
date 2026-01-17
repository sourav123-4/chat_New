import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./src/navigation/AuthStack";
import AppStack from "./src/navigation/AppStack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store, useAppSelector } from "./src/store";
import { configureGoogleSignIn } from "./src/utils/googleSignIn";

function Routes() {
  const {token} = useAppSelector(state => state.auth);
  
  useEffect(() => {
    // Initialize Google Sign-In
    configureGoogleSignIn();
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
