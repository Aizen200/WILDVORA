import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { operatorAPI } from '../services/api';

const STATUS_MAP = {
  pending:   { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  confirmed: { bg: '#D1FAE5', text: '#065F46', label: 'Confirmed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Completed' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getTodayLabel = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export default function DashboardHome({ setActiveTab, goToCreate }) {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        operatorAPI.getStats(),
        operatorAPI.getBookings(),
      ]);
      if (statsRes.data.success)   setStats(statsRes.data.stats);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings || []);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .slice(0, 3);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  const totalBookings  = bookings.length;
  const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;

  const statItems = [
    { value: totalBookings,  label: 'Total bookings' },
    { value: activeBookings, label: 'Active bookings' },
    {
      value: stats?.averageRating ? stats.averageRating.toFixed(1) : '—',
      label: 'Avg rating',
      suffix: stats?.averageRating ? ' ★' : '',
    },
    { value: stats?.totalListings ?? '—', label: 'Listings' },
  ];

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add listing', onPress: () => goToCreate?.()          },
    { icon: 'calendar-outline',   label: 'Bookings',    onPress: () => setActiveTab('bookings') },
    { icon: 'chatbubble-outline', label: 'Messages',    onPress: () => setActiveTab('inbox')    },
    { icon: 'list-outline',       label: 'My listings', onPress: () => setActiveTab('listings') },
  ];

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchDashboardData(true); }}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      {/* ── Greeting ── */}
      <View style={styles.greeting}>
        <Text style={styles.greetingDate}>{getTodayLabel()}</Text>
        <Text style={styles.greetingName}>{getGreeting()}, {firstName}</Text>
      </View>

      {/* ── Revenue card ── */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>Revenue this month</Text>
        <Text style={styles.revenueValue}>
          ₹{(stats?.revenueThisMonth || 0).toLocaleString()}
        </Text>
        <Text style={styles.revenueNote}>Confirmed &amp; completed bookings</Text>
      </View>

      {/* ── Stats grid ── */}
      <View style={styles.statsGrid}>
        {statItems.map(item => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statNumber}>
              {item.value}{item.suffix ?? ''}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Create new experience CTA ── */}
      <TouchableOpacity style={styles.createBtn} onPress={goToCreate} activeOpacity={0.85}>
        <View style={styles.createBtnLeft}>
          <View style={styles.createBtnIcon}>
            <Ionicons name="add" size={20} color={theme.primary} />
          </View>
          <View>
            <Text style={styles.createBtnTitle}>Create new experience</Text>
            <Text style={styles.createBtnSub}>List a new adventure for customers</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textLight} />
      </TouchableOpacity>

      {/* ── Quick actions ── */}
      <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Quick actions</Text>
      <View style={styles.quickRow}>
        {quickActions.map(a => (
          <TouchableOpacity key={a.label} style={styles.quickItem} onPress={a.onPress} activeOpacity={0.7}>
            <View style={styles.quickIcon}>
              <Ionicons name={a.icon} size={22} color={theme.primary} />
            </View>
            <Text style={styles.quickLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Upcoming bookings ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming bookings</Text>
        <TouchableOpacity onPress={() => setActiveTab('bookings')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {upcomingBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={34} color={theme.outlineVariant} />
          <Text style={styles.emptyTitle}>No upcoming bookings</Text>
          <Text style={styles.emptySubtitle}>Confirmed bookings will show here</Text>
        </View>
      ) : (
        upcomingBookings.map(b => {
          const thumb = b.experience?.images?.[0];
          const dateStr = b.startDate
            ? new Date(b.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Date TBD';
          return (
            <View key={b._id} style={styles.bookingCard}>
              <View style={styles.bookingThumb}>
                {thumb
                  ? <Image source={{ uri: thumb }} style={styles.thumbImg} />
                  : <Ionicons name="image-outline" size={22} color={theme.outlineVariant} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle} numberOfLines={1}>
                  {b.experience?.title || 'Experience'}
                </Text>
                <View style={styles.bookingMeta}>
                  <Ionicons name="calendar-outline" size={11} color={theme.textLight} />
                  <Text style={styles.bookingMetaText}>{dateStr}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Ionicons name="people-outline" size={11} color={theme.textLight} />
                  <Text style={styles.bookingMetaText}>{b.guests ?? 1} guests</Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <StatusBadge status={b.status} />
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: theme.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Greeting
  greeting: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20,
  },
  greetingDate: {
    fontSize: 12, color: theme.textLight, fontWeight: '500', marginBottom: 4,
  },
  greetingName: {
    fontSize: 24, fontWeight: '700', color: theme.text, letterSpacing: -0.3,
  },

  // Revenue card
  revenueCard: {
    backgroundColor: theme.primary,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 20,
  },
  revenueLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  revenueValue: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 4, letterSpacing: -0.5 },
  revenueNote:  { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 12, gap: 10, marginBottom: 28,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: theme.card,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  statNumber: { fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },
  statLabel:  { fontSize: 12, color: theme.textLight, marginTop: 4, fontWeight: '500' },

  // Create new experience button
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  createBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  createBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.primaryFixed + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  createBtnSub: { fontSize: 12, color: theme.textLight, marginTop: 1 },

  // Quick actions
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 32,
  },
  quickItem: { alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: theme.primaryFixed + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '500', textAlign: 'center' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text, marginHorizontal: 16 },
  seeAll: { fontSize: 14, color: theme.primary, fontWeight: '600' },

  // Booking cards
  bookingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.card,
    borderRadius: 16, padding: 14,
    marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  bookingThumb: {
    width: 58, height: 58, borderRadius: 10,
    backgroundColor: theme.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg:      { width: '100%', height: '100%' },
  bookingTitle:  { fontSize: 14, fontWeight: '600', color: theme.text },
  bookingMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bookingMetaText:{ fontSize: 12, color: theme.textLight },
  dot:           { fontSize: 12, color: theme.outlineVariant, marginHorizontal: 2 },

  // Status badge
  statusPill:  { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText:  { fontSize: 11, fontWeight: '600' },

  // Empty state
  emptyState: {
    alignItems: 'center', paddingVertical: 36, gap: 6, marginHorizontal: 16,
    backgroundColor: theme.card, borderRadius: 16,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  emptyTitle:    { fontSize: 15, fontWeight: '600', color: theme.text },
  emptySubtitle: { fontSize: 13, color: theme.textLight },
});
