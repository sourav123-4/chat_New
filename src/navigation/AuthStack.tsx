import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignupScreen from "../screens/Auth/SignupScreen";
import SigninScreen from "../screens/Auth/SigninScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import VerifyOtpScreen from "../screens/Auth/VerifyOtpScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";
import { AuthStackParamList } from "../types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Signin" component={SigninScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
