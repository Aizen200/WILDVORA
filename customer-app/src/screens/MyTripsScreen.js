import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../utils/alert';

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

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// ── Countdown banner for next upcoming trip ──────────────────────────────────
function CountdownBanner({ booking }) {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00' });

  useEffect(() => {
    if (!booking?.startDate) return;
    const calc = () => {
      const parts = booking.startDate.split('-');
      if (parts.length !== 3) return { days: '00', hours: '00', minutes: '00' };
      const target = new Date(+parts[0], +parts[1] - 1, +parts[2] + 1);
      const diff   = target.getTime() - Date.now();
      if (diff <= 0) return { days: '00', hours: '00', minutes: '00' };
      return {
        days:    String(Math.floor(diff / 86400000)).padStart(2, '0'),
        hours:   String(Math.floor((diff / 3600000) % 24)).padStart(2, '0'),
        minutes: String(Math.floor((diff / 60000) % 60)).padStart(2, '0'),
      };
    };
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 60000);
    return () => clearInterval(t);
  }, [booking]);

  if (!booking) return null;
  return (
    <View style={s.countdownBanner}>
      <View>
        <Text style={s.countdownLabel}>NEXT ADVENTURE IN</Text>
        <View style={s.countdownRow}>
          {[[timeLeft.days, 'DAYS'], [timeLeft.hours, 'HRS'], [timeLeft.minutes, 'MIN']].map(([num, lbl], i) => (
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
        <Text style={s.countSub}>{booking.startDate} – {booking.endDate} · {booking.experience?.location?.city}</Text>
      </View>
    </View>
  );
}

const STATUS_BADGE_CFG = {
  pending:   { bg: '#FFF3E0', text: '#7C4700' },
  confirmed: { bg: C.secondaryContainer, text: C.onSecondaryContainer },
  ongoing:   { bg: '#E3F2FD', text: '#0D47A1' },
  postponed: { bg: '#FFF8E1', text: '#7C5800' },
};

// ── Upcoming booking card ─────────────────────────────────────────────────────
function UpcomingCard({ booking, index, onCancel, onPress }) {
  const imgUri   = booking.experience?.images?.[0] || TRIP_IMAGES[index % TRIP_IMAGES.length];
  const badgeCfg = STATUS_BADGE_CFG[booking.status] || STATUS_BADGE_CFG.confirmed;
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'postponed';

  return (
    <TouchableOpacity style={s.upCard} onPress={onPress} activeOpacity={0.92}>
      <Image source={{ uri: imgUri }} style={s.upCardImg} resizeMode="cover" />
      <View style={s.upCardBody}>
        <View style={s.upCardTopRow}>
          <Text style={s.upCardTitle} numberOfLines={2}>{booking.experience?.title}</Text>
          <View style={[s.confirmedBadge, { backgroundColor: badgeCfg.bg }]}>
            <Text style={[s.confirmedText, { color: badgeCfg.text }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Postponed note */}
        {booking.status === 'postponed' && booking.statusNote ? (
          <View style={s.statusNoteRow}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#7C5800" />
            <Text style={s.statusNoteText}>{booking.statusNote}</Text>
          </View>
        ) : null}

        <View style={s.upCardMeta}>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={C.onSurfaceVariant} />
          <Text style={s.metaText}>
            {booking.startDate} · {booking.experience?.duration || `${booking.adults} guest${booking.adults > 1 ? 's' : ''}`}
          </Text>
        </View>

        {booking.status !== 'ongoing' && (
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
        )}

        {booking.status === 'ongoing' && (
          <View style={s.ongoingBanner}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color="#0D47A1" />
            <Text style={s.ongoingBannerText}>Trip is currently underway</Text>
          </View>
        )}

        {canCancel && (
          <TouchableOpacity style={s.cancelLink} onPress={() => onCancel(booking._id)} activeOpacity={0.75}>
            <MaterialCommunityIcons name="calendar-remove-outline" size={14} color={C.error} />
            <Text style={s.cancelLinkText}>Cancel booking</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Past booking card ─────────────────────────────────────────────────────────
function PastCard({ booking, index, onPress, onReview, hasReviewed }) {
  const imgUri    = booking.experience?.images?.[0] || TRIP_IMAGES[index % TRIP_IMAGES.length];
  const completed = booking.status === 'completed';
  const cancelled = booking.status === 'cancelled';

  return (
    <TouchableOpacity style={s.pastCard} onPress={onPress} activeOpacity={0.88}>
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: imgUri }} style={[s.pastCardImg, cancelled && { opacity: 0.5 }]} resizeMode="cover" />
        {/* Status badge on image */}
        <View style={[s.statusBadge, cancelled ? s.statusBadgeCancelled : s.statusBadgeCompleted]}>
          <MaterialCommunityIcons
            name={cancelled ? 'close-circle-outline' : 'check-circle-outline'}
            size={12}
            color={cancelled ? '#b91c1c' : '#15803d'}
          />
          <Text style={[s.statusBadgeText, { color: cancelled ? '#b91c1c' : '#15803d' }]}>
            {cancelled ? 'Cancelled' : 'Completed'}
          </Text>
        </View>
      </View>

      <View style={s.pastCardBody}>
        <Text style={s.pastCardTitle} numberOfLines={1}>{booking.experience?.title}</Text>
        <Text style={s.pastCardMeta}>
          {booking.startDate} · {booking.experience?.location?.city || ''}
        </Text>

        {/* Only completed trips get the review option */}
        {completed && (
          hasReviewed ? (
            <View style={s.reviewedBadge}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#15803d" />
              <Text style={s.reviewedText}>Review submitted</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.reviewBtn} onPress={onReview} activeOpacity={0.8}>
              <MaterialCommunityIcons name="star-outline" size={15} color={C.primary} />
              <Text style={s.reviewBtnText}>Leave a Review</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Interactive star picker ───────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
          <MaterialCommunityIcons
            name={n <= value ? 'star' : 'star-outline'}
            size={40}
            color={n <= value ? '#f59e0b' : C.outlineVariant}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MyTripsScreen({ navigation }) {
  const { user } = useAuth();

  const [bookings,       setBookings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [activeTab,      setActiveTab]      = useState('All');
  const [uiTab,          setUiTab]          = useState('upcoming');

  // Which experience IDs this user has already reviewed
  const [reviewedExpIds, setReviewedExpIds] = useState(new Set());

  // Review modal state
  const [reviewModal,    setReviewModal]    = useState(null); // { bookingId, experienceId, title }
  const [reviewRating,   setReviewRating]   = useState(0);
  const [reviewComment,  setReviewComment]  = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  const fetchMyReviews = async () => {
    try {
      const res = await reviewAPI.getMy();
      const ids = new Set(
        res.data.reviews.map(r => (typeof r.experience === 'object' ? r.experience._id : r.experience))
      );
      setReviewedExpIds(ids);
    } catch { /* silently ignore — review state is non-critical */ }
  };

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

  useEffect(() => {
    fetchBookings();
    fetchMyReviews();
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBookings();
      fetchMyReviews();
    });
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

  const openReviewModal = (booking) => {
    setReviewRating(0);
    setReviewComment('');
    setReviewModal({
      bookingId:    booking._id,
      experienceId: booking.experience?._id,
      title:        booking.experience?.title || 'this experience',
    });
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewRating(0);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) {
      Alert.alert('Rating required', 'Please tap a star to rate your experience.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Review required', 'Please write a short review before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await reviewAPI.create({
        experienceId: reviewModal.experienceId,
        bookingId:    reviewModal.bookingId,
        rating:       reviewRating,
        comment:      reviewComment.trim(),
      });
      setReviewedExpIds(prev => new Set([...prev, reviewModal.experienceId]));
      closeReviewModal();
      Alert.alert('Thank you!', 'Your review has been submitted and will appear on the experience page.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingBookings = bookings.filter(b => ['pending', 'confirmed', 'ongoing', 'postponed'].includes(b.status));
  const pastBookings     = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  // Countdown banner only for trips that haven't started yet
  const nextCountdownBooking = upcomingBookings.find(b => b.status === 'confirmed' || b.status === 'pending');
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
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
            : <Text style={s.appBarAvatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
          }
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBookings(); fetchMyReviews(); }}
            tintColor={C.primary}
          />
        }
      >
        <View style={s.content}>
          <Text style={s.pageTitle}>My Trips</Text>

          {/* Segmented control */}
          <View style={s.segWrap}>
            {['upcoming', 'past'].map(tab => (
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
              <CountdownBanner booking={nextCountdownBooking} />
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
                  <PastCard
                    key={b._id}
                    booking={b}
                    index={i}
                    onPress={() => goToExp(b)}
                    hasReviewed={reviewedExpIds.has(b.experience?._id)}
                    onReview={() => openReviewModal(b)}
                  />
                ))
              )}
            </>
          )}
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ── Review modal ── */}
      <Modal
        visible={!!reviewModal}
        transparent
        animationType="slide"
        onRequestClose={closeReviewModal}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeReviewModal} activeOpacity={1} />

          <View style={s.modalSheet}>
            {/* Handle */}
            <View style={s.modalHandle} />

            <Text style={s.modalTitle}>Leave a Review</Text>
            <Text style={s.modalSubtitle} numberOfLines={2}>{reviewModal?.title}</Text>

            {/* Star picker */}
            <StarPicker value={reviewRating} onChange={setReviewRating} />

            {/* Rating label */}
            <Text style={[s.ratingLabel, !reviewRating && { opacity: 0 }]}>
              {RATING_LABELS[reviewRating] || ' '}
            </Text>

            {/* Comment input */}
            <TextInput
              style={s.reviewInput}
              placeholder="What did you love about this experience? Any tips for future adventurers?"
              placeholderTextColor="#bbb"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={reviewComment}
              onChangeText={setReviewComment}
              maxLength={500}
            />
            <Text style={s.charCount}>{reviewComment.length}/500</Text>

            {/* Submit */}
            <TouchableOpacity
              style={[s.submitBtn, (!reviewRating || submitting) && s.submitBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.submitBtnText}>Submit Review</Text>
              }
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity style={s.cancelModalBtn} onPress={closeReviewModal} activeOpacity={0.7}>
              <Text style={s.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.background },
  center:  { paddingTop: 60, alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 6 },

  /* App bar */
  appBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surface + 'CC', borderBottomWidth: 1, borderColor: C.outlineVariant + '40' },
  appBarLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appBarLogo:       { fontSize: 20, fontWeight: '700', color: C.primary, letterSpacing: -0.3 },
  appBarAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceContainerLow, borderWidth: 2, borderColor: C.primary + '30', justifyContent: 'center', alignItems: 'center' },
  appBarAvatarText: { fontSize: 14, fontWeight: '700', color: C.primary },

  pageTitle: { fontSize: 28, fontWeight: '700', color: C.onSurface, marginBottom: 18, marginTop: 6, letterSpacing: -0.3 },

  /* Segment */
  segWrap:       { flexDirection: 'row', backgroundColor: C.surfaceContainerLow, borderRadius: 50, padding: 4, marginBottom: 20 },
  segBtn:        { flex: 1, paddingVertical: 11, borderRadius: 50, alignItems: 'center' },
  segBtnActive:  { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 3 },
  segText:       { fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
  segTextActive: { color: C.white, fontWeight: '700' },

  /* Countdown */
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

  /* Upcoming card */
  upCard:        { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  upCardImg:     { width: '100%', height: 200 },
  upCardBody:    { padding: 16 },
  upCardTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  upCardTitle:   { fontSize: 18, fontWeight: '700', color: C.onSurface, flex: 1, marginRight: 10, lineHeight: 24 },
  confirmedBadge:{ backgroundColor: C.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 50 },
  confirmedText: { fontSize: 11, fontWeight: '700', color: C.onSecondaryContainer },
  upCardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  metaText:      { fontSize: 13, color: C.onSurfaceVariant },
  upCardActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dirBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 50, paddingVertical: 11, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
  dirBtnText:    { color: C.white, fontWeight: '700', fontSize: 13 },
  hostBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.outline, borderRadius: 50, paddingVertical: 11 },
  hostBtnText:   { color: C.primary, fontWeight: '700', fontSize: 13 },
  cancelLink:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: C.error + '35', borderRadius: 50, backgroundColor: 'rgba(186,26,26,0.04)', alignSelf: 'center' },
  cancelLinkText:{ fontSize: 12, fontWeight: '600', color: C.error },

  statusNoteRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF8E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 4 },
  statusNoteText: { fontSize: 12, color: '#7C5800', flex: 1, lineHeight: 17 },
  ongoingBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  ongoingBannerText: { fontSize: 13, fontWeight: '600', color: '#0D47A1' },

  /* Past card */
  pastCard:     { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  pastCardImg:  { width: '100%', height: 160 },
  pastCardBody: { padding: 14 },
  pastCardTitle:{ fontSize: 16, fontWeight: '700', color: C.onSurface, marginBottom: 3 },
  pastCardMeta: { fontSize: 13, color: C.onSurfaceVariant, marginBottom: 12 },

  /* Status badge on image */
  statusBadge:           { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeCompleted:  { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  statusBadgeCancelled:  { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  statusBadgeText:       { fontSize: 11, fontWeight: '700' },

  /* Review button / badge */
  reviewBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 50, borderWidth: 1.5, borderColor: C.primary + '50', backgroundColor: C.primary + '08' },
  reviewBtnText:{ fontSize: 13, fontWeight: '700', color: C.primary },
  reviewedBadge:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 50, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  reviewedText: { fontSize: 13, fontWeight: '600', color: '#15803d' },

  /* Empty state */
  empty:          { alignItems: 'center', paddingTop: 50, paddingHorizontal: 24 },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  emptyText:      { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  exploreBtn:     { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28 },
  exploreBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },

  /* Review modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:   {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16,
    elevation: 20,
  },
  modalHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: 22 },
  modalTitle:    { fontSize: 22, fontWeight: '800', color: C.onSurface, marginBottom: 4, letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 14, color: C.onSurfaceVariant, marginBottom: 24, lineHeight: 20 },

  starRow:    { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  ratingLabel:{ fontSize: 15, fontWeight: '700', color: '#f59e0b', textAlign: 'center', marginBottom: 20, height: 22 },

  reviewInput: {
    borderWidth: 1.5, borderColor: C.outlineVariant,
    borderRadius: 14, padding: 14,
    fontSize: 14, color: C.onSurface, lineHeight: 21,
    minHeight: 120, marginBottom: 6,
    backgroundColor: C.surfaceContainerLow,
  },
  charCount: { fontSize: 11, color: C.outline, textAlign: 'right', marginBottom: 20 },

  submitBtn: { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginBottom: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  cancelModalBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelModalText:{ fontSize: 14, color: C.outline, fontWeight: '600' },
});
