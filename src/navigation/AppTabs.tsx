import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/Main/HomeScreen";
import { View, Text, StyleSheet } from "react-native";
import { AppTabParamList } from "../types";
import FontAwesome6 from "@react-native-vector-icons/fontawesome6";
import { normalize } from "../utils/orientation";
import ProfileScreen from "../screens/Main/ProfileScreen";
import ScreenA from "../screens/Main/ScreenA";

const Tab = createBottomTabNavigator<AppTabParamList>();



export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#6A11CB",
        tabBarInactiveTintColor: "#9ca3af",

        tabBarLabelStyle: styles.label,

        tabBarIcon: ({ focused, color }) => {
          let iconName: string = "circle";

          if (route.name === "Home") iconName = "house";
          if (route.name === "Chats") iconName = "comments";
          if (route.name === "Profile") iconName = "user";

          return (
            <FontAwesome6
              name={iconName}
              iconStyle="solid"
              size={20}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Chats"
        component={ScreenA}
        options={{ title: "Chats" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: normalize(64),
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 0,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
