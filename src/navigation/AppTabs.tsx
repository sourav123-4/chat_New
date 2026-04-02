import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Main/HomeScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import CallHistoryScreen from '../screens/Call/CallHistoryScreen';
import { StyleSheet } from 'react-native';
import { AppTabParamList } from '../types';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { normalize } from '../utils/orientation';

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6A11CB',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color }) => {
          const icons: Record<string, string> = {
            Home: 'house',
            Calls: 'phone',
            Profile: 'user',
          };
          return <FontAwesome6 name={icons[route.name]} iconStyle="solid" size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="Calls" component={CallHistoryScreen} options={{ title: 'Calls' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: normalize(64),
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  label: { fontSize: 12, fontWeight: '600' },
});
