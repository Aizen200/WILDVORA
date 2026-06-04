import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingAPI } from '../services/api';

const C = {
  primary:             '#1A5F45',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
  secondaryContainer:  '#92d8fe',
  onSecondaryContainer:'#005f7f',
  background:          '#f7faf6',
  surface:             '#f7faf6',
  surfaceContainerLow: '#f1f4f0',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
  error:               '#ba1a1a',
  white:               '#ffffff',
};

const TRIP_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAax3TDADoeJkxVKYKSEDHXo7pUIHYxgA2lsnc7l63uuDPfTxxguvRtmhaLBpo43d1aQ3zlnASwkRKCCyUdhqkdWxKHTOCdMpBHhOP1msmeDGaO1rgCOdttj2I5C6vD7sS--V2U93fZRpxPzXPOtiREopR0lSt1KDtvU01Qas5LjcyNgNRVYGHYYxnp1KIR0r-Mwp-LqkDw-eBRnL8cx8nVWHtyMqkyCUjJaxfLFsT819JNtfM2gIEAsZhqTqPjKwBMVslDT03XyKg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB3UTezCwYFnuU8G8C5-iKrL12D_Ipij6fWwczQRoRoGqb3auguQRiPYSpBfijz2NgjQRdAtnxrE9QsV1fm8H_1WiABw9ndfai2ZC1KuS1LyqGN5PiEbWA-Ng5QJ1KI65Jxn4WrI2NHGTbGDq7p61hwbPdJhYxKtVd5CeaYsNtqmZtP2JS1jcT9yrVmdTIYRDafanW5Haq9ccunJTJHwc2FtihVNwkh-qt6l2oaI5y2zSTSC4g6SqfOja5D8lcOlFvqwNNwPJdA7Xc',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDy9c2GadzvjzUDarr8LLjGN8LYYLsI2-5FEISigJiTDx_oEbWIVx7plvF64DYlvlmftUxdkSXcyvx5osDa3PmMskeSzJRir5pnCZSZ12XSZYFqQrprwLy8CPILOyTK1RQvYRtBDQOODPPLEk8d1YWlFf276cdf43OEiMl4X0hCf65p3okdh2NAxuEs55f9tfQy8xa2A_XW14-nbdP42SkaXL-dR88_JkKpOMg-06nBFVy1vOM-8Z_bkCYUWa5r4y7IOeV2okC6_AE',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1CqwyoBsIckHlchextMq4IGrV1nMzbgUjYBv71Ox0wif8vIDCH3W6jFbkbnRaKlLuo8ky4szXK567L_039Ez2TMe0dgLJeb7RrGPrto4ECfO7lq0TzV7h_fQ-UE08BNYub_9Mz5jKK9xDoqbbGdRrwJyRlODzsnttpBg3EXnbb1UA084OLN3IdjgCNugubNrPQ_lfeqIp_trNGtyrTV4g2rzfwjgA7EJLxZ2ShHK7zaYRjejRqRjlKPJKLPIZQo5Fi9IkMJ7M4K0',
];

function CountdownBanner({ booking }) {
  if (!booking) return null;
  return (
    <View style={s.countdownBanner}>
      <View>
        <Text style={s.countdownLabel}>NEXT ADVENTURE IN</Text>
        <View style={s.countdownRow}>
          {[['04','DAYS'],['12','HRS'],['45','MIN']].map(([num, lbl], i) => (
            <React.Fragment key={lbl}>
              <View style={s.countUnit}>
                <Text style={s.countNum}>{num}</Text>
                <Text style={s.countUnitLabel}>{lbl}</Text>
              </View>
              {i < 2 && <Text style={s.countSep}>:</Text>}
            </React.Fragment>
          ))}
        </View>
      </View>
      <View style={s.countDivider} />
      <View>
        <Text style={s.countTitle} numberOfLines={1}>{booking.experience?.title}</Text>
        <Text style={s.countSub}>{booking.startDate} – {booking.endDate} • {booking.experience?.location?.city}</Text>
      </View>
    </View>
  );
}

function UpcomingCard({ booking, index, onCancel, onPress }) {
  const imgUri = booking.experience?.images?.[0] || TRIP_IMAGES[index % TRIP_IMAGES.length];
  return (
    <TouchableOpacity style={s.upCard} onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri: imgUri }} style={s.upCardImg} resizeMode="cover" />
      <View style={s.upCardBody}>
        <View style={s.upCardTopRow}>
          <Text style={s.upCardTitle} numberOfLines={2}>{booking.experience?.title}</Text>
          <View style={s.confirmedBadge}>
            <Text style={s.confirmedText}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={s.upCardMeta}>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={C.onSurfaceVariant} />
          <Text style={s.metaText}>
            {booking.startDate} · {booking.experience?.duration || `${booking.adults} guest${booking.adults > 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={s.upCardActions}>
          <TouchableOpacity style={s.dirBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="near-me" size={15} color={C.white} />
            <Text style={s.dirBtnText}>Get Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.hostBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="chat-outline" size={15} color={C.primary} />
            <Text style={s.hostBtnText}>Contact Host</Text>
          </TouchableOpacity>
        </View>
        {(booking.status === 'confirmed' || booking.status === 'pending') && (
          <TouchableOpacity style={s.cancelLink} onPress={() => onCancel(booking._id)}>
            <Text style={s.cancelLinkText}>Cancel booking</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PastCard({ booking, index, onPress }) {
  const imgUri = booking.experience?.images?.[0] || TRIP_IMAGES[index % TRIP_IMAGES.length];
  return (
    <TouchableOpacity style={s.pastCard} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: imgUri }} style={s.pastCardImg} resizeMode="cover" />
      <View style={s.pastCardBody}>
        <Text style={s.pastCardTitle} numberOfLines={1}>{booking.experience?.title}</Text>
        <Text style={s.pastCardMeta}>Finished {booking.endDate?.split('-').slice(0, 2).join('/')}</Text>
        <TouchableOpacity style={s.reviewBtn}>
          <MaterialCommunityIcons name="pencil-outline" size={15} color={C.onSurfaceVariant} />
          <Text style={s.reviewBtnText}>Write a Review</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function MyTripsScreen({ navigation }) {
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState('All');
  const [uiTab, setUiTab]           = useState('upcoming');

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchBookings);
    return unsubscribe;
  }, [navigation, fetchBookings]);

  const handleCancel = (id) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive',
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

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings     = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
  const goToExp = (b)    => navigation.navigate('ExperienceDetail', { experienceId: b.experience?._id });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App bar */}
      <View style={s.appBar}>
        <View style={s.appBarLeft}>
          <MaterialCommunityIcons name="menu" size={24} color={C.onSurfaceVariant} />
          <Text style={s.appBarLogo}>Wildvora</Text>
        </View>
        <View style={s.appBarAvatar}>
          <Text style={s.appBarAvatarText}>A</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={C.primary} />
        }
      >
        <View style={s.content}>
          <Text style={s.pageTitle}>My Trips</Text>

          {/* Segmented control */}
          <View style={s.segWrap}>
            {['upcoming', 'past'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.segBtn, uiTab === tab && s.segBtnActive]}
                onPress={() => setUiTab(tab)}
                activeOpacity={0.85}
              >
                <Text style={[s.segText, uiTab === tab && s.segTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
          ) : uiTab === 'upcoming' ? (
            <>
              <CountdownBanner booking={upcomingBookings[0]} />
              {upcomingBookings.length === 0 ? (
                <View style={s.empty}>
                  <MaterialCommunityIcons name="map-search-outline" size={48} color={C.outlineVariant} style={{ marginBottom: 12 }} />
                  <Text style={s.emptyTitle}>No upcoming trips</Text>
                  <Text style={s.emptyText}>Your confirmed adventures will appear here.</Text>
                  <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate('Home')}>
                    <Text style={s.exploreBtnText}>Explore Experiences</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                upcomingBookings.map((b, i) => (
                  <UpcomingCard key={b._id} booking={b} index={i} onCancel={handleCancel} onPress={() => goToExp(b)} />
                ))
              )}
            </>
          ) : (
            <>
              {pastBookings.length === 0 ? (
                <View style={s.empty}>
                  <MaterialCommunityIcons name="history" size={48} color={C.outlineVariant} style={{ marginBottom: 12 }} />
                  <Text style={s.emptyTitle}>No past trips</Text>
                  <Text style={s.emptyText}>Completed adventures will appear here.</Text>
                </View>
              ) : (
                pastBookings.map((b, i) => (
                  <PastCard key={b._id} booking={b} index={i} onPress={() => goToExp(b)} />
                ))
              )}
            </>
          )}
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.background },
  center:  { paddingTop: 60, alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 6 },

  appBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surface + 'CC', borderBottomWidth: 1, borderColor: C.outlineVariant + '40' },
  appBarLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appBarLogo:       { fontSize: 20, fontWeight: '700', color: C.primary, letterSpacing: -0.3 },
  appBarAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceContainerLow, borderWidth: 2, borderColor: C.primary + '30', justifyContent: 'center', alignItems: 'center' },
  appBarAvatarText: { fontSize: 14, fontWeight: '700', color: C.primary },

  pageTitle: { fontSize: 28, fontWeight: '700', color: C.onSurface, marginBottom: 18, marginTop: 6, letterSpacing: -0.3 },

  segWrap:       { flexDirection: 'row', backgroundColor: C.surfaceContainerLow, borderRadius: 50, padding: 4, marginBottom: 20 },
  segBtn:        { flex: 1, paddingVertical: 11, borderRadius: 50, alignItems: 'center' },
  segBtnActive:  { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 3 },
  segText:       { fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
  segTextActive: { color: C.white, fontWeight: '700' },

  countdownBanner: { backgroundColor: C.primaryContainer, borderRadius: 16, padding: 20, marginBottom: 20 },
  countdownLabel:  { fontSize: 11, fontWeight: '700', color: C.onPrimaryContainer + 'BB', letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
  countdownRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  countUnit:       { alignItems: 'center' },
  countNum:        { fontSize: 36, fontWeight: '700', color: C.onPrimaryContainer, lineHeight: 40 },
  countUnitLabel:  { fontSize: 10, fontWeight: '700', color: C.onPrimaryContainer + 'AA', letterSpacing: 1, textTransform: 'uppercase' },
  countSep:        { fontSize: 30, fontWeight: '300', color: C.onPrimaryContainer + '50', marginHorizontal: 10, marginBottom: 12 },
  countDivider:    { height: 1, backgroundColor: C.onPrimaryContainer + '25', marginBottom: 14 },
  countTitle:      { fontSize: 18, fontWeight: '700', color: C.onPrimaryContainer, marginBottom: 3 },
  countSub:        { fontSize: 13, color: C.onPrimaryContainer + 'CC' },

  upCard:       { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  upCardImg:    { width: '100%', height: 200 },
  upCardBody:   { padding: 16 },
  upCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  upCardTitle:  { fontSize: 18, fontWeight: '700', color: C.onSurface, flex: 1, marginRight: 10, lineHeight: 24 },
  confirmedBadge:{ backgroundColor: C.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50 },
  confirmedText: { fontSize: 11, fontWeight: '700', color: C.onSecondaryContainer },
  upCardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  metaText:     { fontSize: 13, color: C.onSurfaceVariant },
  upCardActions:{ flexDirection: 'row', gap: 10, marginBottom: 8 },
  dirBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 50, paddingVertical: 11, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
  dirBtnText:   { color: C.white, fontWeight: '700', fontSize: 13 },
  hostBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.outline, borderRadius: 50, paddingVertical: 11 },
  hostBtnText:  { color: C.primary, fontWeight: '700', fontSize: 13 },
  cancelLink:   { alignItems: 'center', paddingTop: 4 },
  cancelLinkText: { fontSize: 12, color: C.error, textDecorationLine: 'underline' },

  pastCard:     { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', overflow: 'hidden', marginBottom: 14 },
  pastCardImg:  { width: '100%', height: 160, opacity: 0.75 },
  pastCardBody: { padding: 14 },
  pastCardTitle:{ fontSize: 16, fontWeight: '700', color: C.onSurface + 'BB', marginBottom: 3 },
  pastCardMeta: { fontSize: 13, color: C.onSurfaceVariant, marginBottom: 12 },
  reviewBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 50, paddingVertical: 9 },
  reviewBtnText:{ fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },

  empty:          { alignItems: 'center', paddingTop: 50, paddingHorizontal: 24 },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  emptyText:      { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  exploreBtn:     { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28 },
  exploreBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
});