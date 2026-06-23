import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar,
  ActivityIndicator, Alert, Image, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from './src/theme';

import DashboardHome     from './src/screens/DashboardHome';
import MyListings        from './src/screens/MyListings';
import CreateEditListing from './src/screens/CreateEditListing';
import BookingsManager   from './src/screens/BookingsManager';
import Payouts           from './src/screens/Payouts';
import ReviewsRatings    from './src/screens/ReviewsRatings';
import InquiriesScreen   from './src/screens/InquiriesScreen';
import RegisterScreen    from './src/screens/RegisterScreen';
import LoginScreen       from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { operatorAPI, notificationAPI } from './src/services/api';

const TABS = [
  { id: 'home',      label: 'Home',     icon: 'home-outline',         activeIcon: 'home'           },
  { id: 'listings',  label: 'Listings', icon: 'list-outline',         activeIcon: 'list'           },
  { id: 'bookings',  label: 'Bookings', icon: 'calendar-outline',     activeIcon: 'calendar'       },
  { id: 'inbox',     label: 'Inbox',    icon: 'chatbubble-outline',   activeIcon: 'chatbubble'     },
  { id: 'reviews',   label: 'More',     icon: 'menu-outline',         activeIcon: 'menu'           },
];

function TabIcon({ tab, isActive }) {
  const iconName = isActive ? tab.activeIcon : tab.icon;
  const color    = isActive ? theme.primary : theme.textLight;
  return <Ionicons name={iconName} size={22} color={color} />;
}

function MainApp() {
  const { user, loading, logout } = useAuth();
  const [activeTab,    setActiveTab]    = useState('home');
  const [listings,     setListings]     = useState([]);
  const [editListing,  setEditListing]  = useState(null);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [authScreen,   setAuthScreen]   = useState('login');
  
  const [notifications, setNotifications] = useState([]);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getAll();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleMarkNotifRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const res = await operatorAPI.getListings();
      if (res.data.success) {
        setListings(res.data.experiences || []);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err?.response?.data?.message || err.message);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchListings();
    } else {
      setListings([]);
    }
  }, [user, fetchListings]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#156b4e" />
      </View>
    );
  }

  if (!user) {
    if (authScreen === 'register') {
      return <RegisterScreen onToggleScreen={(target) => setAuthScreen(target)} />;
    } else if (authScreen === 'forgot') {
      return <ForgotPasswordScreen onToggleScreen={(target) => setAuthScreen(target)} />;
    } else {
      return <LoginScreen onToggleScreen={(target) => setAuthScreen(target)} />;
    }
  }

  const handleSaveSuccess = () => {
    fetchListings();
    setActiveTab('listings');
  };

  const goToCreate = () => {
    setEditListing(null);
    setActiveTab('create');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome setActiveTab={setActiveTab} goToCreate={goToCreate} />;
      case 'listings':
        return (
          <MyListings
            listings={listings}
            listingsLoading={listingsLoading}
            fetchListings={fetchListings}
            setEditListing={setEditListing}
            setActiveTab={setActiveTab}
          />
        );
      case 'create':
        return (
          <CreateEditListing
            editListing={editListing}
            onSaveSuccess={handleSaveSuccess}
            setActiveTab={setActiveTab}
          />
        );
      case 'bookings':
        return <BookingsManager />;
      case 'inbox':
        return <InquiriesScreen />;
      case 'payouts':
        return <Payouts />;
      case 'reviews':
        return <ReviewsRatings />;
      default:
        return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  const showTabs  = activeTab !== 'create';
  const isCreate  = activeTab === 'create';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.bg} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        {isCreate ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveTab('listings')}>
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.brandRow}>
            <View style={styles.avatarCircle}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Ionicons name="person" size={18} color={theme.primary} />
              )}
            </View>
            <Text style={styles.brandName}>Wildvora</Text>
          </View>
        )}

        <View style={styles.topActionsRow}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={theme.danger || '#EF4444'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifModalVisible(true)}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {notifications.filter(n => !n.read).length > 0 && (
              <View style={styles.notifBadge} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={notifModalVisible} transparent animationType="slide" onRequestClose={() => setNotifModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '80%', margin: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {notifications.length === 0 ? (
                <Text style={{ textAlign: 'center', color: theme.textLight, marginTop: 40, fontStyle: 'italic' }}>
                  No notifications yet.
                </Text>
              ) : (
                notifications.map(n => (
                  <TouchableOpacity
                    key={n._id}
                    style={{
                      backgroundColor: n.read ? '#fff' : theme.primaryContainer + '10',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: n.read ? '#E2E8F0' : theme.primary + '30',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                    onPress={() => {
                      handleMarkNotifRead(n._id);
                      setNotifModalVisible(false);
                      if (n.referenceId) {
                        const isInquiry = n.badges?.some(b => b.text === 'Inquiry');
                        setActiveTab(isInquiry ? 'inbox' : 'bookings');
                      }
                    }}
                  >
                    <View style={{
                      backgroundColor: n.read ? '#E2E8F0' : theme.primary,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginTop: 6,
                    }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: n.read ? '600' : '700', color: theme.text, fontSize: 14 }}>{n.title}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}>{n.desc}</Text>
                      <Text style={{ color: theme.textLight, fontSize: 10, marginTop: 4 }}>
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Screen ── */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* ── Bottom Tab Bar ── */}
      {showTabs && (
        <View style={styles.tabBar}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <View style={styles.tabActiveWrapper}>
                    <TabIcon tab={tab} isActive />
                    <Text style={styles.tabLabelActive}>{tab.label}</Text>
                  </View>
                ) : (
                  <>
                    <TabIcon tab={tab} isActive={false} />
                    <Text style={styles.tabLabel}>{tab.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f3ed',
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16,
    height: 56 + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 44),
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
    backgroundColor: theme.bg,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.primaryFixed, overflow: 'hidden',
  },
  brandName: { color: theme.primary, fontSize: 20, fontWeight: '800' },
  topActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutBtn: { padding: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  backText: { color: theme.primary, fontSize: 16, fontWeight: '600' },
  notifBtn: { padding: 8, position: 'relative' },
  notifBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.card, borderRadius: 24, padding: 24, margin: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },

  tabBar: {
    flexDirection: 'row', backgroundColor: theme.navBg,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 10,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 14,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabActiveWrapper: {
    backgroundColor: theme.primaryContainer + '28',
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 99, alignItems: 'center', gap: 2,
  },
  tabLabel:       { color: theme.textLight, fontSize: 10, marginTop: 3, fontWeight: '500' },
  tabLabelActive: { color: theme.primary, fontSize: 10, fontWeight: '700' },
});
