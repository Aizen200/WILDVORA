import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { StatusBadge } from '../components/SharedComponents';

const BAR_DATA = [40, 60, 55, 80, 70, 90, 100];
const BAR_MAX_HEIGHT = 80;

export default function DashboardHome({ bookings, setActiveTab }) {
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const revenue = confirmedBookings.reduce((s, b) => s + b.amount, 0);
  const upcomingBookings = bookings.slice(0, 3);

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* ── Welcome Banner ── */}
      <View style={styles.banner}>
        <View style={styles.blobTR} />
        <View style={styles.blobBL} />

        <Text style={styles.bannerLabel}>DASHBOARD</Text>
        <Text style={styles.bannerTitle}>Good morning, Everest Basecamp Tours</Text>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.bannerBtnWhite}
            onPress={() => { setActiveTab('listings'); }}
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
            ₹{(revenue / 1000).toFixed(0)}k
            <Text style={styles.revenueUnit}> / mo</Text>
          </Text>
        </View>
        <Text style={styles.revenueSubtitle}>12% increase from last month</Text>
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
          <Text style={styles.listingRowLabel}>Live Experiences</Text>
          <Text style={styles.listingRowValue}>8</Text>
        </View>
        <View style={[styles.listingRow, { marginTop: 10 }]}>
          <Text style={styles.listingRowLabel}>Drafts</Text>
          <Text style={styles.listingRowValue}>2</Text>
        </View>
      </View>

      {/* ── Conversion Rate ── */}
      <View style={styles.card}>
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: '#C2E8FF' }]}>
            <Feather name="trending-up" size={20} color={theme.secondary} />
          </View>
          <View>
            <Text style={styles.metricTitle}>Conversion Rate</Text>
            <Text style={styles.metricSubtitle}>Checkout completions</Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricBig}>4.8%</Text>
          <Text style={styles.metricPositive}>  +0.6%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '65%', backgroundColor: theme.primary }]} />
        </View>
      </View>

      {/* ── Booking Growth ── */}
      <View style={styles.card}>
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: theme.tertiaryFixed }]}>
            <Ionicons name="bar-chart-outline" size={20} color={theme.tertiary} />
          </View>
          <View>
            <Text style={styles.metricTitle}>Booking Growth</Text>
            <Text style={styles.metricSubtitle}>Monthly volume</Text>
          </View>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricBig, { color: theme.text }]}>312</Text>
          <Text style={styles.metricNegative}>  -2.1%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: '45%', backgroundColor: theme.tertiary }]} />
        </View>
      </View>

      {/* ── Upcoming Bookings ── */}
      <View style={[styles.rowBetween, { marginBottom: 12 }]}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        <TouchableOpacity onPress={() => setActiveTab('bookings')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {upcomingBookings.map(b => (
        <TouchableOpacity key={b.id} style={styles.bookingCard} activeOpacity={0.85}>
          <View style={styles.bookingThumb}>
            <Ionicons name="image-outline" size={28} color={theme.outlineVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingTitle} numberOfLines={2}>{b.listingTitle}</Text>
            <View style={styles.bookingMeta}>
              <Ionicons name="calendar-outline" size={12} color={theme.textLight} />
              <Text style={styles.bookingMetaText}>  {b.date}</Text>
              <Ionicons name="people-outline" size={12} color={theme.textLight} style={{ marginLeft: 10 }} />
              <Text style={styles.bookingMetaText}>  {b.groupSize} Guests</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <StatusBadge status={b.status} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.outlineVariant} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },

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
  metricNegative: { color: theme.danger, fontSize: 14, fontWeight: '600' },
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
});