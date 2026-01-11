import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatScreen from "../screens/Main/ChatScreen";
import ProfileScreen from "../screens/Main/ProfileScreen";
import { AppStackParamList } from "../types";
import AppTabs from "./AppTabs";
import EditProfileScreen from "../screens/Main/EditProfileScreen";
import AddFriendsScreen from "../screens/Main/AddFriendsScreen";
import ChangePasswordScreen from "../screens/Main/ChangePasswordScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Tabs"
        component={AppTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AddFriends" component={AddFriendsScreen}/>
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen}/>
    </Stack.Navigator>
  );
}
