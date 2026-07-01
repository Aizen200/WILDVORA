import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Image,
  ImageBackground, Modal, TextInput, KeyboardAvoidingView, Platform,
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
  const imgUri = booking.experience?.images?.[0];
  return (
    <ImageBackground
      source={imgUri ? { uri: imgUri } : null}
      style={s.countdownCard}
      imageStyle={{ borderRadius: 22 }}
      resizeMode="cover"
    >
      <View style={s.countdownOverlay}>
        <View>
          <Text style={s.countdownEyebrow}>Next Adventure In</Text>
          <View style={s.countdownTimerRow}>
            {[[timeLeft.days, 'Days'], [timeLeft.hours, 'Hrs'], [timeLeft.minutes, 'Min']].map(([num, lbl], i) => (
              <React.Fragment key={lbl}>
                <View style={s.countBox}>
                  <Text style={s.countBoxNum}>{num}</Text>
                  <Text style={s.countBoxLbl}>{lbl}</Text>
                </View>
                {i < 2 && <Text style={s.countColon}>:</Text>}
              </React.Fragment>
            ))}
          </View>
        </View>
        <View>
          <View style={s.countdownHr} />
          <Text style={s.countdownExpTitle} numberOfLines={1}>{booking.experience?.title}</Text>
          <View style={s.countdownExpMeta}>
            <MaterialCommunityIcons name="calendar-outline" size={13} color="rgba(255,255,255,0.72)" />
            <Text style={s.countdownExpSub}>{booking.startDate} – {booking.endDate} · {booking.experience?.location?.city}</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const STATUS_BADGE_CFG = {
  pending:   { bg: '#FFF3E0', text: '#7C4700' },
  confirmed: { bg: C.secondaryContainer, text: C.onSecondaryContainer },
  ongoing:   { bg: '#E3F2FD', text: '#0D47A1' },
  postponed: { bg: '#FFF8E1', text: '#7C5800' },
};

// ── Upcoming booking card ─────────────────────────────────────────────────────
function UpcomingCard({ booking, index, onPress, onViewDetails, onContactHost }) {
  const imgUri   = booking.experience?.images?.[0] || TRIP_IMAGES[index % TRIP_IMAGES.length];
  const badgeCfg = STATUS_BADGE_CFG[booking.status] || STATUS_BADGE_CFG.confirmed;

  return (
    <TouchableOpacity style={s.upCard} onPress={onPress} activeOpacity={0.92}>
      <View style={s.upCardImgWrap}>
        <Image source={{ uri: imgUri }} style={s.upCardImg} resizeMode="cover" />
        <View style={s.upCardImgOverlay} />
        <View style={[s.upCardBadge, { backgroundColor: badgeCfg.bg }]}>
          <Text style={[s.upCardBadgeText, { color: badgeCfg.text }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={s.upCardBody}>
        <Text style={s.upCardTitle} numberOfLines={2}>{booking.experience?.title}</Text>

        <View style={s.upCardMeta}>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={C.onSurfaceVariant} />
          <Text style={s.metaText}>
            {booking.startDate}{booking.endDate ? ` – ${booking.endDate}` : ''}
          </Text>
          {!!booking.experience?.location?.city && (
            <>
              <Text style={s.metaDot}>·</Text>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={C.onSurfaceVariant} />
              <Text style={s.metaText}>{booking.experience.location.city}</Text>
            </>
          )}
        </View>

        {booking.status === 'postponed' && booking.statusNote && (
          <View style={s.statusNoteRow}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#7C5800" />
            <Text style={s.statusNoteText}>{booking.statusNote}</Text>
          </View>
        )}

        {booking.status === 'ongoing' && (
          <View style={s.ongoingBanner}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color="#0D47A1" />
            <Text style={s.ongoingBannerText}>Trip is currently underway</Text>
          </View>
        )}

        {booking.status !== 'ongoing' && (
          <View style={s.upCardActions}>
            <TouchableOpacity style={s.dirBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons name="near-me" size={15} color={C.white} />
              <Text style={s.dirBtnText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.hostBtn} activeOpacity={0.85} onPress={onContactHost}>
              <MaterialCommunityIcons name="chat-outline" size={15} color={C.primary} />
              <Text style={s.hostBtnText}>Contact Host</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={s.detailsBtn} onPress={onViewDetails} activeOpacity={0.85}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={15} color={C.onSurfaceVariant} />
          <Text style={s.detailsBtnText}>View Booking Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Past booking card ─────────────────────────────────────────────────────────
function PastCard({ booking, index, onPress, onReview, hasReviewed, onViewDetails }) {
  const imgUri    = booking.experience?.images?.[0] || TRIP_IMAGES[index % TRIP_IMAGES.length];
  const completed = booking.status === 'completed';
  const cancelled = booking.status === 'cancelled';

  return (
    <TouchableOpacity style={s.pastCard} onPress={onPress} activeOpacity={0.88}>
      <View style={s.pastCardInner}>
        <View style={s.pastImgWrap}>
          <Image
            source={{ uri: imgUri }}
            style={[s.pastCardImg, cancelled && { opacity: 0.55 }]}
            resizeMode="cover"
          />
          <View style={[s.pastStatusDot, cancelled ? s.pastStatusDotCancelled : s.pastStatusDotCompleted]}>
            <MaterialCommunityIcons
              name={cancelled ? 'close' : 'check'}
              size={11}
              color={cancelled ? '#b91c1c' : '#15803d'}
            />
          </View>
        </View>

        <View style={s.pastCardBody}>
          <Text style={s.pastCardCat}>{booking.experience?.category || 'Experience'}</Text>
          <Text style={s.pastCardTitle} numberOfLines={2}>{booking.experience?.title}</Text>
          <View style={s.pastCardMetaRow}>
            <MaterialCommunityIcons name="calendar-outline" size={12} color={C.onSurfaceVariant} />
            <Text style={s.pastCardMetaText}>{booking.startDate} · {booking.experience?.location?.city || ''}</Text>
          </View>

          {completed && (
            hasReviewed ? (
              <View style={s.reviewedBadge}>
                <MaterialCommunityIcons name="check-circle" size={13} color="#15803d" />
                <Text style={s.reviewedText}>Reviewed</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.reviewBtn} onPress={onReview} activeOpacity={0.8}>
                <MaterialCommunityIcons name="star-outline" size={14} color={C.primary} />
                <Text style={s.reviewBtnText}>Rate trip</Text>
              </TouchableOpacity>
            )
          )}

          <TouchableOpacity style={s.pastDetailsBtn} onPress={onViewDetails} activeOpacity={0.82}>
            <Text style={s.pastDetailsBtnText}>View Details</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={C.primary} />
          </TouchableOpacity>
        </View>
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
  const [loading,        setLoading]        = useState(!!user);
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
    if (!user) { setLoading(false); setRefreshing(false); return; }
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
  }, [activeTab, user]);

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
  const nextCountdownBooking = upcomingBookings.find(b => b.status === 'confirmed' || b.status === 'pending');
  const goToExp     = (b) => navigation.navigate('ExperienceDetail', { experienceId: b.experience?._id, bookingId: b._id });
  const goToDashboard = (b) => navigation.navigate('TripDashboard', { bookingId: b._id });

  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.appBar}>
          <Text style={s.appBarLogo}>Wildvora</Text>
        </View>
        <View style={s.guestWrap}>

          {/* Fanned stack of trip card previews */}
          <View style={s.guestCardStack}>
            <View style={[s.guestStackCard, s.guestStackCardBack]}>
              <View style={s.guestStackInner}>
                <Image source={{ uri: TRIP_IMAGES[2] }} style={s.guestStackImg} resizeMode="cover" />
                <View style={[StyleSheet.absoluteFill, s.guestStackDim]} />
              </View>
            </View>
            <View style={[s.guestStackCard, s.guestStackCardMid]}>
              <View style={s.guestStackInner}>
                <Image source={{ uri: TRIP_IMAGES[1] }} style={s.guestStackImg} resizeMode="cover" />
                <View style={[StyleSheet.absoluteFill, s.guestStackDim]} />
              </View>
            </View>
            <View style={[s.guestStackCard, s.guestStackCardFront]}>
              <View style={s.guestStackInner}>
                <Image source={{ uri: TRIP_IMAGES[0] }} style={s.guestStackImg} resizeMode="cover" />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.30)' }]} />
                <View style={s.guestLockCenter}>
                  <View style={s.guestLockCircle}>
                    <MaterialCommunityIcons name="lock-outline" size={24} color={C.white} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Headline copy */}
          <View style={s.guestCopy}>
            <Text style={s.guestHeadline}>Where to next?</Text>
            <Text style={s.guestTagline}>
              Sign in to book adventures, track upcoming trips, and revisit every journey you've taken.
            </Text>
          </View>

          {/* CTAs */}
          <View style={s.guestCtaBlock}>
            <TouchableOpacity style={s.guestPrimaryBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.87}>
              <Text style={s.guestPrimaryBtnText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.guestSecondaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.87}>
              <Text style={s.guestSecondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* App bar */}
      <View style={s.appBar}>
        <Text style={s.appBarLogo}>Wildvora</Text>
        <View style={s.appBarAvatar}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%', borderRadius: 19 }} />
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
        {/* Page header */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>My Trips</Text>
          {!loading && (
            <Text style={s.pageSub}>{upcomingBookings.length} upcoming · {pastBookings.length} past</Text>
          )}
        </View>

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
                <MaterialCommunityIcons name="map-search-outline" size={56} color={C.outlineVariant} style={{ marginBottom: 16 }} />
                <Text style={s.emptyTitle}>No upcoming trips</Text>
                <Text style={s.emptyText}>Your confirmed adventures will appear here.</Text>
                <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate('Home')}>
                  <Text style={s.exploreBtnText}>Explore Experiences</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={s.sectionLabel}>
                  <Text style={s.sectionLabelText}>{upcomingBookings.length} upcoming {upcomingBookings.length === 1 ? 'trip' : 'trips'}</Text>
                </View>
                {upcomingBookings.map((b, i) => (
                  <UpcomingCard
                    key={b._id}
                    booking={b}
                    index={i}
                    onPress={() => goToExp(b)}
                    onViewDetails={() => goToDashboard(b)}
                    onContactHost={() => navigation.navigate('Chat', {
                      bookingId: b._id,
                      hostName: b.experience?.hostName,
                      title: b.experience?.title,
                    })}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {pastBookings.length === 0 ? (
              <View style={s.empty}>
                <MaterialCommunityIcons name="image-filter-hdr" size={56} color={C.outlineVariant} style={{ marginBottom: 16 }} />
                <Text style={s.emptyTitle}>No past trips yet</Text>
                <Text style={s.emptyText}>Completed adventures will show up here once you've taken your first trip.</Text>
                <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate('Home')}>
                  <Text style={s.exploreBtnText}>Explore Experiences</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={s.sectionLabel}>
                  <Text style={s.sectionLabelText}>{pastBookings.length} past {pastBookings.length === 1 ? 'trip' : 'trips'}</Text>
                </View>
                {pastBookings.map((b, i) => (
                  <PastCard
                    key={b._id}
                    booking={b}
                    index={i}
                    onPress={() => goToExp(b)}
                    hasReviewed={reviewedExpIds.has(b.experience?._id)}
                    onReview={() => openReviewModal(b)}
                    onViewDetails={() => goToDashboard(b)}
                  />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 32 }} />
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
  safe:   { flex: 1, backgroundColor: C.background },
  center: { paddingTop: 60, alignItems: 'center' },

  /* App bar */
  appBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant },
  appBarLogo:       { fontSize: 22, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  appBarAvatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surfaceContainerLow, borderWidth: 2, borderColor: C.primary + '40', justifyContent: 'center', alignItems: 'center' },
  appBarAvatarText: { fontSize: 14, fontWeight: '700', color: C.primary },

  /* Page header */
  pageHeader: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 4 },
  pageTitle:  { fontSize: 34, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  pageSub:    { fontSize: 14, color: C.onSurfaceVariant, marginTop: 5, fontWeight: '500' },

  /* Segmented control */
  segWrap:       { flexDirection: 'row', backgroundColor: C.surfaceContainerLow, borderRadius: 50, padding: 4, marginHorizontal: 22, marginTop: 20, marginBottom: 24 },
  segBtn:        { flex: 1, paddingVertical: 12, borderRadius: 50, alignItems: 'center' },
  segBtnActive:  { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 3 },
  segText:       { fontSize: 15, fontWeight: '600', color: C.onSurfaceVariant },
  segTextActive: { color: C.white, fontWeight: '700' },

  /* Countdown banner — trip image as background */
  countdownCard:     { marginHorizontal: 22, marginBottom: 22, borderRadius: 22, overflow: 'hidden', height: 216, backgroundColor: C.primaryContainer },
  countdownOverlay:  { flex: 1, justifyContent: 'space-between', padding: 22, backgroundColor: 'rgba(0,0,0,0.50)' },
  countdownEyebrow:  { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.62)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  countdownTimerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBox:          { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, minWidth: 64, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  countBoxNum:       { fontSize: 34, fontWeight: '900', color: '#FFFFFF', lineHeight: 38, letterSpacing: -1 },
  countBoxLbl:       { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.62)', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 },
  countColon:        { fontSize: 28, fontWeight: '300', color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  countdownHr:       { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.22)', marginBottom: 14 },
  countdownExpTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.3 },
  countdownExpMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdownExpSub:   { fontSize: 13, color: 'rgba(255,255,255,0.70)' },

  /* Upcoming card */
  upCard:           { marginHorizontal: 22, backgroundColor: C.white, borderRadius: 22, overflow: 'hidden', marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  upCardImgWrap:    { position: 'relative' },
  upCardImg:        { width: '100%', height: 210 },
  upCardImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  upCardBadge:      { position: 'absolute', top: 14, right: 14, paddingHorizontal: 13, paddingVertical: 6, borderRadius: 50 },
  upCardBadgeText:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  upCardBody:       { padding: 18, paddingTop: 15 },
  upCardTitle:      { fontSize: 19, fontWeight: '800', color: C.onSurface, lineHeight: 26, letterSpacing: -0.4, marginBottom: 9 },
  upCardMeta:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  metaText:         { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '500' },
  metaDot:          { fontSize: 13, color: C.outlineVariant },
  upCardActions:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dirBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 50, paddingVertical: 13, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 6, elevation: 3 },
  dirBtnText:       { color: C.white, fontWeight: '700', fontSize: 13 },
  hostBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary + '70', borderRadius: 50, paddingVertical: 13 },
  hostBtnText:      { color: C.primary, fontWeight: '700', fontSize: 13 },
  detailsBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderColor: C.primary + '40', borderRadius: 50, paddingVertical: 12, marginTop: 2, backgroundColor: C.primary + '08' },
  detailsBtnText:   { color: C.primary, fontWeight: '700', fontSize: 13 },
  statusNoteRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#FFF8E1', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  statusNoteText:   { fontSize: 13, color: '#7C5800', flex: 1, lineHeight: 19 },
  ongoingBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E3F2FD', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12 },
  ongoingBannerText:{ fontSize: 14, fontWeight: '600', color: '#0D47A1' },

  /* Section label above card list */
  sectionLabel:     { paddingHorizontal: 22, marginBottom: 14 },
  sectionLabelText: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.2, textTransform: 'uppercase' },

  /* Past card — horizontal layout */
  pastCard:               { marginHorizontal: 22, backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  pastCardInner:          { flexDirection: 'row' },
  pastImgWrap:            { width: 112, height: 152, flexShrink: 0 },
  pastCardImg:            { width: 112, height: 152 },
  pastStatusDot:          { position: 'absolute', top: 10, left: 10, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  pastStatusDotCompleted: { backgroundColor: '#dcfce7', borderWidth: 1.5, borderColor: '#86efac' },
  pastStatusDotCancelled: { backgroundColor: '#fee2e2', borderWidth: 1.5, borderColor: '#fca5a5' },
  pastCardBody:           { flex: 1, padding: 14, paddingTop: 13 },
  pastCardCat:            { fontSize: 10, fontWeight: '800', color: C.onSurfaceVariant, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 5 },
  pastCardTitle:          { fontSize: 15, fontWeight: '700', color: C.onSurface, lineHeight: 21, letterSpacing: -0.2, marginBottom: 5 },
  pastCardMetaRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  pastCardMetaText:       { fontSize: 12, color: C.onSurfaceVariant },
  reviewBtn:              { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1.5, borderColor: C.primary + '45', backgroundColor: C.primary + '0A', alignSelf: 'flex-start', marginBottom: 10 },
  reviewBtnText:          { fontSize: 12, fontWeight: '700', color: C.primary },
  reviewedBadge:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', alignSelf: 'flex-start', marginBottom: 10 },
  reviewedText:           { fontSize: 12, fontWeight: '600', color: '#15803d' },
  pastDetailsBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pastDetailsBtnText:     { fontSize: 13, fontWeight: '700', color: C.primary, letterSpacing: 0.1 },

  /* Empty state */
  empty:         { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:    { fontSize: 22, fontWeight: '800', color: C.onSurface, marginBottom: 8, letterSpacing: -0.3 },
  emptyText:     { fontSize: 15, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  exploreBtn:    { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  exploreBtnText:{ color: C.white, fontWeight: '700', fontSize: 15 },

  /* Review modal */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.48)' },
  modalSheet:   {
    backgroundColor: C.white,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16,
    elevation: 20,
  },
  modalHandle:   { width: 42, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: 24 },
  modalTitle:    { fontSize: 24, fontWeight: '800', color: C.onSurface, marginBottom: 4, letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 14, color: C.onSurfaceVariant, marginBottom: 24, lineHeight: 20 },
  starRow:       { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  ratingLabel:   { fontSize: 16, fontWeight: '700', color: '#f59e0b', textAlign: 'center', marginBottom: 20, height: 22 },
  reviewInput: {
    borderWidth: 1.5, borderColor: C.outlineVariant,
    borderRadius: 16, padding: 16,
    fontSize: 15, color: C.onSurface, lineHeight: 22,
    minHeight: 120, marginBottom: 6,
    backgroundColor: C.surfaceContainerLow,
  },
  charCount:         { fontSize: 12, color: C.outline, textAlign: 'right', marginBottom: 22 },
  submitBtn:         { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginBottom: 12, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.55 },
  submitBtnText:     { color: C.white, fontWeight: '700', fontSize: 16 },
  cancelModalBtn:    { alignItems: 'center', paddingVertical: 10 },
  cancelModalText:   { fontSize: 14, color: C.outline, fontWeight: '600' },

  /* Guest / unauthenticated — trips screen */
  guestWrap:             { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 32 },
  guestCardStack:        { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  guestStackCard:        { position: 'absolute', width: 242, height: 180, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 14, elevation: 8 },
  guestStackInner:       { width: '100%', height: '100%', borderRadius: 22, overflow: 'hidden' },
  guestStackImg:         { width: '100%', height: '100%' },
  guestStackDim:         { backgroundColor: 'rgba(0,0,0,0.50)' },
  guestStackCardBack:    { transform: [{ rotate: '-9deg' }], zIndex: 1, opacity: 0.72 },
  guestStackCardMid:     { transform: [{ rotate: '-3deg' }, { translateX: 8 }], zIndex: 2, opacity: 0.88 },
  guestStackCardFront:   { transform: [{ rotate: '4deg' }], zIndex: 3 },
  guestLockCenter:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  guestLockCircle:       { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.50)', justifyContent: 'center', alignItems: 'center' },
  guestCopy:             { alignItems: 'center', gap: 10 },
  guestHeadline:         { fontSize: 28, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5, textAlign: 'center' },
  guestTagline:          { fontSize: 15, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 22 },
  guestCtaBlock:         { alignSelf: 'stretch', gap: 12 },
  guestPrimaryBtn:       { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  guestPrimaryBtnText:   { fontSize: 15, fontWeight: '800', color: C.white },
  guestSecondaryBtn:     { borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  guestSecondaryBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },
});
