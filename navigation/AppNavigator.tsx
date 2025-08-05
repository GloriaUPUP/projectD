import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import OrderStep1Screen from '../screens/Order/OrderStep1Screen';
import OrderStep2Screen from '../screens/Order/OrderStep2Screen';
import RecommendationScreen from '../screens/Order/RecommendationScreen';
import PaymentScreen from '../screens/Order/PaymentScreen';
import OrderConfirmScreen from '../screens/Order/OrderConfirmScreen';
import TrackingScreen from '../screens/Tracking/TrackingScreen';
import MyParcelsScreen from '../screens/Tracking/MyParcelsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AddressEditScreen from '../screens/Profile/AddressEditScreen';
import CustomerSupportScreen from '../screens/Support/CustomerSupportScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="MyParcels" 
        component={MyParcelsScreen}
        options={{ tabBarLabel: 'My Parcels' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isLoggedIn } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="OrderStep1" component={OrderStep1Screen} />
          <Stack.Screen name="OrderStep2" component={OrderStep2Screen} />
          <Stack.Screen name="Recommendation" component={RecommendationScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="AddressEdit" component={AddressEditScreen} />
          <Stack.Screen name="Support" component={CustomerSupportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}