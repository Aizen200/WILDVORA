import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : styles.inactiveTab}>
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={22}
                color={focused ? '#11694b' : '#6f7a73'}
              />
              <Text style={focused ? styles.activeTabText : styles.inactiveTabText}>Home</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={FilterScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : styles.inactiveTab}>
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={22}
                color={focused ? '#11694b' : '#6f7a73'}
              />
              <Text style={focused ? styles.activeTabText : styles.inactiveTabText}>Search</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Trips"
        component={MyTripsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : styles.inactiveTab}>
              <MaterialCommunityIcons
                name="hiking"
                size={22}
                color={focused ? '#11694b' : '#6f7a73'}
              />
              <Text style={focused ? styles.activeTabText : styles.inactiveTabText}>Trips</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : styles.inactiveTab}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? '#11694b' : '#6f7a73'}
              />
              <Text style={focused ? styles.activeTabText : styles.inactiveTabText}>Profile</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
    </Stack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#11694b" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 72,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(190, 201, 193, 0.2)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.03, shadowRadius: 8 },
    }),
  },
  // Active tab displays as a horizontal pill/capsule containing icon & text side-by-side
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ebefea',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 40,
    gap: 8,
    marginTop: -4,
  },
  // Inactive tab displays standard vertical layout with icon on top and label below
  inactiveTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 2,
    marginTop: -4,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#11694b',
    fontFamily: 'Quicksand',
  },
  inactiveTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6f7a73',
    fontFamily: 'Quicksand',
  },
});