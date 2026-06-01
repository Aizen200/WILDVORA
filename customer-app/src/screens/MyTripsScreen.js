import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingAPI } from '../services/api';

const STATUS_TABS = ['All', 'confirmed', 'pending', 'completed', 'cancelled'];

function BookingCard({ booking, onCancel, onPress }) {
  const exp = booking.experience;
  const statusColor = {
    confirmed: '#3B6D11', pending: '#185FA5', completed: '#555', cancelled: '#CC4444',
  };
  const statusBg = {
    confirmed: '#DFEFD0', pending: '#D8E8F8', completed: '#F0F0F0', cancelled: '#FDE8E8',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardImg}>
        <Text style={styles.cardImgText}>{exp?.category || 'Adventure'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg[booking.status] }]}>
          <Text style={[styles.statusText, { color: statusColor[booking.status] }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{exp?.title || 'Experience'}</Text>
        <Text style={styles.cardMeta}>📅 {booking.startDate} · {booking.adults} adult{booking.adults > 1 ? 's' : ''}{booking.children > 0 ? `, ${booking.children} child` : ''}</Text>
        <Text style={styles.cardMeta}>📍 {exp?.location?.city}, {exp?.location?.country}</Text>
        <Text style={styles.cardPrice}>Total: ${booking.totalPrice}</Text>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Get Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Contact Host</Text>
          </TouchableOpacity>
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => onCancel(booking._id)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MyTripsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchBookings = useCallback(async () => {
    try {
      const params = activeTab !== 'All' ? { status: activeTab } : {};
      const res = await bookingAPI.getMy(params);
      setBookings(res.data.bookings);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchBookings(); }, [activeTab]);

  const handleCancel = (id) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.cancel(id);
              fetchBookings();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not cancel booking');
            }
          },
        },
      ]
    );
  };

  const filteredBookings = activeTab === 'All'
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.pageTitle}>My Trips</Text>

      {/* Status tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={STATUS_TABS}
          keyExtractor={(i) => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item && styles.tabActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(i) => i._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancel={handleCancel}
              onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.experience?._id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyText}>Your upcoming adventures will appear here.</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.exploreBtnText}>Explore Experiences</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: '#111', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  tabsWrapper: { borderBottomWidth: 1, borderColor: '#EEE', marginBottom: 8 },
  tabs: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#111', borderColor: '#111' },
  tabText: { fontSize: 13, color: '#555' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  card: { marginHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EEE', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  cardImg: { height: 100, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardImgText: { fontSize: 14, color: '#888', fontWeight: '600' },
  statusBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#666', marginBottom: 3 },
  cardPrice: { fontSize: 13, fontWeight: '600', color: '#111', marginTop: 4, marginBottom: 10 },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#DDD', borderRadius: 6 },
  actionBtnText: { fontSize: 12, color: '#333' },
  cancelBtn: { borderColor: '#E24B4A' },
  cancelBtnText: { fontSize: 12, color: '#E24B4A' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  exploreBtn: { backgroundColor: '#111', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28 },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});