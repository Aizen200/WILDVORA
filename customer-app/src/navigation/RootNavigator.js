import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// App screens
import HomeScreen from '../screens/HomeScreen';
import ExperienceDetailScreen from '../screens/ExperienceDetailScreen';
import FilterScreen from '../screens/FilterScreen';
import BookingScreen from '../screens/BookingScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WishlistScreen from '../screens/WishlistScreen';

import SettingsScreen from '../screens/Settingsscreen';
import ReviewHistoryScreen from '../screens/Reviewhistoryscreen';
import HelpCenterScreen from '../screens/Helpcenterscreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const PRIMARY = '#11694b';

// Map each tab to a MaterialCommunityIcons name (active / inactive pair)
const TAB_ICONS = {
  Home:    { active: 'compass',       inactive: 'compass-outline' },
  Search:  { active: 'magnify',       inactive: 'magnify' },
  Trips:   { active: 'hiking',        inactive: 'hiking' },
  Profile: { active: 'account',       inactive: 'account-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.active : icons.inactive}
              size={24}
              color={focused ? PRIMARY : '#6f7a73'}
            />
          );
        },
        tabBarActiveTintColor:   PRIMARY,
        tabBarInactiveTintColor: '#6f7a73',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: 'rgba(247,250,246,0.97)',
          borderTopWidth: 1,
          borderTopColor: '#bec9c1' + '50',
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarLabel: 'Home'    }} />
      <Tab.Screen name="Search"  component={FilterScreen}  options={{ tabBarLabel: 'Search'  }} />
      <Tab.Screen name="Trips"   component={MyTripsScreen} options={{ tabBarLabel: 'Trips'   }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"             component={MainTabs} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
      <Stack.Screen name="Booking"          component={BookingScreen} />
      <Stack.Screen name="Wishlist"         component={WishlistScreen} />
      <Stack.Screen name="Settings"       component={SettingsScreen} />
      <Stack.Screen name="ReviewHistory"  component={ReviewHistoryScreen} />
      <Stack.Screen name="HelpCenter"     component={HelpCenterScreen} />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7faf6' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}