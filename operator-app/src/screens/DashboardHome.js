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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { operatorAPI } from '../services/api';

const STATUS_MAP = {
  pending:   { bg: '#FDDDBD', text: '#5C3D11',  label: 'Pending' },
  confirmed: { bg: '#A3F3CD', text: '#002115',  label: 'Confirmed' },
  cancelled: { bg: '#FFDAD6', text: '#93000A',  label: 'Cancelled' },
  completed: { bg: '#C2E8FF', text: '#001E2C',  label: 'Completed' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

const BAR_DATA = [40, 60, 55, 80, 70, 90, 100];
const BAR_MAX_HEIGHT = 80;

export default function DashboardHome({ setActiveTab, goToCreate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        operatorAPI.getStats(),
        operatorAPI.getBookings()
      ]);
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .slice(0, 3);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const hostName = user?.name || 'Operator';
  const totalRevenue = stats?.revenueThisMonth || 0;
  const liveListings = stats?.totalListings || 0;

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    >
      {/* ── Welcome Banner ── */}
      <View style={styles.banner}>
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />

        <Text style={styles.bannerLabel}>DASHBOARD</Text>
        <Text style={styles.bannerTitle}>Welcome back, {hostName}</Text>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.bannerBtnWhite}
            onPress={() => goToCreate?.()}
          >
            <Ionicons name="add" size={16} color={theme.primary} />
            <Text style={styles.bannerBtnWhiteText}>  Add Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bannerBtnGreen}
            onPress={() => setActiveTab('bookings')}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.bannerBtnGreenText}>  View Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Revenue Overview ── */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Revenue Overview</Text>
          <Text style={styles.revenueAmount}>
            ₹{totalRevenue.toLocaleString()}
            <Text style={styles.revenueUnit}> / mo</Text>
          </Text>
        </View>
        <Text style={styles.revenueSubtitle}>Based on confirmed & completed bookings this month</Text>
        <View style={styles.chartRow}>
          {BAR_DATA.map((pct, i) => (
            <View key={i} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (pct / 100) * BAR_MAX_HEIGHT,
                    backgroundColor:
                      i === BAR_DATA.length - 1
                        ? theme.primary
                        : theme.primaryFixed + 'AA',
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* ── Active Listings ── */}
      <View style={[styles.card, styles.activeListingsCard]}>
        <Text style={[styles.cardTitle, { color: theme.onSecondaryContainer }]}>
          Active Listings
        </Text>
        <View style={[styles.listingRow, { marginTop: 16 }]}>
          <Text style={styles.listingRowLabel}>Total Listed Experiences</Text>
          <Text style={styles.listingRowValue}>{liveListings}</Text>
        </View>
        <View style={[styles.listingRow, { marginTop: 10 }]}>
          <Text style={styles.listingRowLabel}>Total Reviews</Text>
          <Text style={styles.listingRowValue}>{stats?.totalReviews || 0}</Text>
        </View>
      </View>

      {/* ── Conversion Rate ── */}
      <View style={styles.card}>
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: '#C2E8FF' }]}>
            <Feather name="trending-up" size={20} color={theme.secondary} />
          </View>
          <View>
            <Text style={styles.metricTitle}>Average Rating</Text>
            <Text style={styles.metricSubtitle}>Quality feedback</Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricBig}>{stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}</Text>
          <Text style={styles.metricPositive}>  / 5.0</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${(stats?.averageRating || 0) * 20}%`, backgroundColor: theme.primary }]} />
        </View>
      </View>

      {/* ── Upcoming Bookings ── */}
      <View style={[styles.rowBetween, { marginBottom: 12, marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        <TouchableOpacity onPress={() => setActiveTab('bookings')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {upcomingBookings.map(b => {
        const thumb = b.experience?.images?.[0];
        const groupSize = b.guests || 1;
        const dateFormatted = b.startDate ? new Date(b.startDate).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : 'Recent';

        return (
          <TouchableOpacity key={b._id} style={styles.bookingCard} activeOpacity={0.85}>
            <View style={styles.bookingThumb}>
              {thumb ? (
                <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              ) : (
                <Ionicons name="image-outline" size={28} color={theme.outlineVariant} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle} numberOfLines={2}>{b.experience?.title || 'Unknown Experience'}</Text>
              <View style={styles.bookingMeta}>
                <Ionicons name="calendar-outline" size={12} color={theme.textLight} />
                <Text style={styles.bookingMetaText}>  {dateFormatted}</Text>
                <Ionicons name="people-outline" size={12} color={theme.textLight} style={{ marginLeft: 10 }} />
                <Text style={styles.bookingMetaText}>  {groupSize} Guests</Text>
              </View>
              <View style={{ marginTop: 8 }}>
                <StatusBadge status={b.status} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.outlineVariant} />
          </TouchableOpacity>
        );
      })}

      {upcomingBookings.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={32} color={theme.outlineVariant} />
          <Text style={styles.emptyStateText}>No upcoming bookings</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: theme.textLight, fontSize: 14 },

  banner: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  blobTR: {
    position: 'absolute', right: -40, top: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#92D8FE44',
  },
  blobBL: {
    position: 'absolute', left: -20, bottom: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#88D6B244',
  },
  bannerLabel: {
    color: theme.primaryFixed,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 20,
  },
  bannerActions: { flexDirection: 'row', gap: 10 },
  bannerBtnWhite: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  bannerBtnWhiteText: { color: theme.primary, fontWeight: '700', fontSize: 14 },
  bannerBtnGreen: {
    flex: 1, backgroundColor: theme.primaryContainer,
    borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  bannerBtnGreenText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },

  revenueAmount: { color: theme.text, fontSize: 22, fontWeight: '800' },
  revenueUnit: { color: theme.textLight, fontSize: 14, fontWeight: '400' },
  revenueSubtitle: { color: theme.textLight, fontSize: 13, marginTop: 2, marginBottom: 16 },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: BAR_MAX_HEIGHT + 10,
  },
  barWrapper: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 },

  activeListingsCard: { backgroundColor: theme.secondaryContainer },
  listingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  listingRowLabel: { color: theme.text, fontSize: 14, fontWeight: '600' },
  listingRowValue: { color: theme.text, fontSize: 20, fontWeight: '800' },

  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  metricIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  metricTitle: { color: theme.text, fontSize: 15, fontWeight: '600' },
  metricSubtitle: { color: theme.textLight, fontSize: 12, marginTop: 1 },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  metricBig: { color: theme.primary, fontSize: 32, fontWeight: '800' },
  metricPositive: { color: theme.primary, fontSize: 14, fontWeight: '600' },
  progressBg: { height: 8, backgroundColor: theme.surfaceVariant, borderRadius: 99 },
  progressFill: { height: 8, borderRadius: 99 },

  sectionTitle: { color: theme.text, fontSize: 18, fontWeight: '700' },
  viewAll: { color: theme.primary, fontSize: 14, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  bookingCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  bookingThumb: {
    width: 60, height: 60, borderRadius: 12,
    backgroundColor: theme.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  bookingTitle: { color: theme.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  bookingMetaText: { color: theme.textLight, fontSize: 12 },

  statusPill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  emptyStateText: { color: theme.textLight, fontSize: 14 },
});