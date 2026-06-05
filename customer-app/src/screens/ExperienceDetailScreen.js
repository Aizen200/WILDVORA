import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ExperienceDetailScreen({ route, navigation }) {
  const { experienceId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();   // ← read the real safe-area top

  const [experience, setExperience] = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [readMore, setReadMore]     = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, revRes] = await Promise.all([
          experienceAPI.getOne(experienceId),
          reviewAPI.getForExperience(experienceId),
        ]);
        setExperience(expRes.data.experience);
        setReviews(revRes.data.reviews);
        if (user?.wishlist) {
          setInWishlist(user.wishlist.some((w) => w._id === experienceId || w === experienceId));
        }
      } catch {
        Alert.alert('Error', 'Could not load experience');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [experienceId]);

  const handleWishlist = async () => {
    try {
      await userAPI.toggleWishlist(experienceId);
      setInWishlist((prev) => !prev);
    } catch {
      Alert.alert('Error', 'Could not update wishlist');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A5F45" />
      </View>
    );
  }
  if (!experience) return null;

  const heroImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWD971kShMZZtm1tqLB1M4tT3C06H-IIw4sAIM6q8Is0Z9f0vV3ghGpyKWw2nsI4RtbB5uFyLJ5KVbQBPqQZ6gfNwyC1lom8RMKstswmSXAi0R33J96h_T0nlJ7drHXfktm54c2af9pWrWq-mvNbCkov7u8y65OtgNfN26r9q0XApuM_gY2XgxZLsXXkdn9w-FJhi7TZIApYrX9KkoguY-CxCc-IZM5n1re5sZpl6C3J0RkedcQGyLBdqfw99XC6CuwtXrTw8BrHI';
  const hostAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxvAqhiKslj3TU3hkTN0aTpyErN45FaI1bC5dTIh145GMLa5MKJKC-y_PZLsWw2boHuKnNn852nWapfByDXJIYTSyYA4OzkCrrq4T-VIDhRdkQMMOYzQgl1iE_FybIikOHI2SgX6h0Xs0NqxpfGGwKfS1jLl-sAWDpfnTdsWhsljtlNN1CjlKjGbpVNIJUOl0UB3dZxDiXjE4hKH6Qp18eU17iLI5YCVvtp11ej88ZBVBYmVoRXHQwkvdSJV2HoH5FvbNleuMCDFg';

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : 'star-outline'}
        size={14}
        color="#1A5F45"
        style={{ marginRight: 2 }}
      />
    ));

  // Button row sits at top of screen respecting safe area
  const btnTop = insets.top + 12;

  const _expToday = new Date();
  const _expMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const _expDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const _formatAvailDate = (ds) => {
    const d = new Date(ds + 'T00:00:00');
    return `${_expDays[d.getDay()]}, ${_expMonths[d.getMonth()]} ${d.getDate()}`;
  };
  const _availDates = (() => {
    const future = (experience.availableDates || [])
      .filter(ds => new Date(ds + 'T00:00:00') >= _expToday)
      .slice(0, 6);
    if (future.length > 0) return future;
    const dates = [];
    const d = new Date(_expToday);
    d.setDate(d.getDate() + 3);
    for (let i = 0; i < 4; i++) {
      dates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 7);
    }
    return dates;
  })();

  return (
    // No edges — we handle insets manually for the hero overlap
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Floating header buttons — fixed over hero ── */}
      <View style={[styles.headerControls, { top: btnTop }]}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#1A5F45" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={handleWishlist}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={inWishlist ? 'heart' : 'heart-outline'}
            size={20}
            color={inWishlist ? '#ba1a1a' : '#1A5F45'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* Hero image — full bleed */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          {/* Soft fade at bottom so content card reads well */}
          <View style={styles.heroFade} />
        </View>

        {/* ── Content card ── */}
        <View style={styles.body}>

          {/* Tags + title */}
          <View style={styles.metaSection}>
            <View style={styles.tagsRow}>
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={styles.tagBlueText}>High Altitude</Text>
              </View>
              <View style={[styles.tag, styles.tagTerracotta]}>
                <Text style={styles.tagTerracottaText}>{experience.duration || '2-Day Trek'}</Text>
              </View>
            </View>
            <Text style={styles.title}>{experience.title}</Text>
            <View style={styles.ratingLocationRow}>
              <View style={styles.ratingCol}>
                <Ionicons name="star" size={16} color="#1A5F45" />
                <Text style={styles.ratingNum}>{experience.rating || '4.9'}</Text>
                <Text style={styles.reviewCount}>({experience.reviewCount || '124'} reviews)</Text>
              </View>
              <View style={styles.locationCol}>
                <Ionicons name="location" size={16} color="#1A5F45" />
                <Text style={styles.locationText}>
                  {experience.location?.city}, {experience.location?.country}
                </Text>
              </View>
            </View>
          </View>

          {/* Host card */}
          <View style={styles.hostCard}>
            <View style={styles.hostInfo}>
              <Image source={{ uri: hostAvatar }} style={styles.avatar} />
              <View style={styles.hostMeta}>
                <Text style={styles.hostName}>{experience.hostName || 'Alex Explorer'}</Text>
                <View style={styles.verifiedRow}>
                  <MaterialIcons name="verified" size={14} color="#1A5F45" />
                  <Text style={styles.verifiedText}>Verified Host • 98% response</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8}>
              <Text style={styles.contactBtnText}>Contact</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Experience</Text>
            <Text style={styles.description} numberOfLines={readMore ? undefined : 3}>
              {experience.description}
            </Text>
            <TouchableOpacity onPress={() => setReadMore(!readMore)} style={styles.readMoreBtn} activeOpacity={0.7}>
              <Text style={styles.readMoreText}>{readMore ? 'Read less' : 'Read more'}</Text>
              <Ionicons
                name={readMore ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#1A5F45"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>

          {/* Bento highlights */}
          <View style={styles.bentoGrid}>
            {[
              { icon: <MaterialCommunityIcons name="flag-outline" size={24} color="#1A5F45" />, label: '12km Hike' },
              { icon: <MaterialCommunityIcons name="elevation-rise" size={24} color="#1A5F45" />, label: '2,400m Peak' },
              { icon: <Ionicons name="restaurant-outline" size={24} color="#1A5F45" />, label: 'All Meals' },
              { icon: <MaterialCommunityIcons name="tent" size={24} color="#1A5F45" />, label: 'Gear Included' },
            ].map(({ icon, label }) => (
              <View key={label} style={styles.bentoItem}>
                <View style={styles.bentoIcon}>{icon}</View>
                <Text style={styles.bentoText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Available Dates */}
          <View style={[styles.section, styles.borderTop]}>
            <Text style={styles.sectionTitle}>Available Dates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {_availDates.map((ds, i) => (
                <View key={i} style={styles.dateChip}>
                  <Ionicons name="calendar-outline" size={13} color="#11694b" style={{ marginRight: 4 }} />
                  <Text style={styles.dateChipText}>{_formatAvailDate(ds)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Reviews */}
          <View style={[styles.section, styles.borderTop]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Adventurer Reviews</Text>
              <TouchableOpacity><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
            </View>

            <View style={styles.reviewGrid}>
              {(reviews.length > 0 ? reviews.slice(0, 2) : [
                { _id: 'd1', rating: 5, comment: 'The sunrise was life-changing. Alex is an incredible guide who knows every rock on that mountain.', userName: 'Sarah M.', createdAt: '2 days ago' },
                { _id: 'd2', rating: 5, comment: 'Expertly organized. The food was surprisingly good for being at 2000 meters altitude.', userName: 'James L.', createdAt: '1 week ago' },
              ]).map((r) => (
                <View key={r._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={{ flexDirection: 'row' }}>{renderStars(r.rating)}</View>
                    <Text style={styles.reviewDate}>{r.createdAt?.split('T')[0] || r.createdAt}</Text>
                  </View>
                  <Text style={styles.reviewComment}>"{r.comment}"</Text>
                  <Text style={styles.reviewAuthor}>— {r.userName || r.user?.name || 'Anonymous'}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Sticky footer CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerLeft}>
          <View style={styles.priceRow}>
            <Text style={styles.footerPrice}>₹{experience.price}</Text>
            <Text style={styles.footerPriceSub}> / person</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Booking', { experience })} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.viewDatesText}>View dates</Text>
              <Ionicons name="calendar-outline" size={13} color="#1A5F45" />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', { experience })}
          activeOpacity={0.88}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer:   { flex: 1, backgroundColor: '#f7faf6' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7faf6' },

  /* Floating header buttons */
  headerControls:  {
    position: 'absolute',
    left: 16, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 100,        // above ScrollView and hero image
  },
  circleBtn:       {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.90)',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },

  /* Hero */
  heroContainer:   { height: 380, width: '100%' },
  heroImage:       { width: '100%', height: '100%' },
  heroFade:        {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 100,
    backgroundColor: '#f7faf6', opacity: 0.82,
  },

  /* Content */
  body:            { paddingHorizontal: 16, marginTop: -24 },
  metaSection:     { marginBottom: 20 },
  tagsRow:         { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag:             { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  tagBlue:         { backgroundColor: 'rgba(146,216,254,0.2)' },
  tagBlueText:     { color: '#005f7f', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tagTerracotta:   { backgroundColor: 'rgba(255,218,216,0.25)' },
  tagTerracottaText:{ color: '#753231', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:           { fontSize: 24, fontWeight: '700', color: '#181d1a', lineHeight: 32, marginBottom: 8 },
  ratingLocationRow:{ flexDirection: 'row', gap: 20, alignItems: 'center', flexWrap: 'wrap' },
  ratingCol:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum:       { fontSize: 14, fontWeight: '700', color: '#181d1a' },
  reviewCount:     { fontSize: 12, color: '#6f7a73' },
  locationCol:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:    { fontSize: 14, color: '#3f4943', fontWeight: '500' },

  /* Host */
  hostCard:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f4f0', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)', marginBottom: 24 },
  hostInfo:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:          { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(17,105,75,0.2)' },
  hostMeta:        { gap: 2 },
  hostName:        { fontSize: 16, fontWeight: '700', color: '#181d1a' },
  verifiedRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText:    { fontSize: 12, color: '#1A5F45', fontWeight: '600' },
  contactBtn:      { borderWidth: 1, borderColor: '#1A5F45', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  contactBtnText:  { fontSize: 13, color: '#1A5F45', fontWeight: '600' },

  /* Description */
  section:         { marginBottom: 24 },
  sectionTitle:    { fontSize: 18, fontWeight: '700', color: '#181d1a', marginBottom: 10 },
  description:     { fontSize: 14, color: '#3f4943', lineHeight: 22 },
  readMoreBtn:     { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  readMoreText:    { fontSize: 13, color: '#1A5F45', fontWeight: '700', textDecorationLine: 'underline' },

  /* Available dates */
  dateChip:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,105,75,0.08)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(17,105,75,0.2)' },
  dateChipText:  { fontSize: 13, color: '#11694b', fontWeight: '600' },

  /* Bento grid */
  bentoGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  bentoItem:       { flex: 1, minWidth: '45%', backgroundColor: 'rgba(224,227,223,0.3)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)' },
  bentoIcon:       { marginBottom: 6 },
  bentoText:       { fontSize: 13, fontWeight: '600', color: '#181d1a' },

  /* Reviews */
  borderTop:       { borderTopWidth: 1, borderTopColor: 'rgba(190,201,193,0.3)', paddingTop: 20 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText:     { fontSize: 14, color: '#1A5F45', fontWeight: '700' },
  reviewGrid:      { gap: 12 },
  reviewCard:      { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }) },
  reviewHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewDate:      { fontSize: 11, color: '#6f7a73' },
  reviewComment:   { fontSize: 13, color: '#3f4943', fontStyle: 'italic', lineHeight: 18, marginBottom: 8 },
  reviewAuthor:    { fontSize: 12, fontWeight: '600', color: '#181d1a' },

  /* Footer */
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(247,250,246,0.97)', borderTopWidth: 1, borderTopColor: 'rgba(190,201,193,0.3)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, zIndex: 100 },
  footerLeft:      { gap: 3 },
  priceRow:        { flexDirection: 'row', alignItems: 'baseline' },
  footerPrice:     { fontSize: 22, fontWeight: '700', color: '#181d1a' },
  footerPriceSub:  { fontSize: 12, color: '#3f4943' },
  viewDatesText:   { fontSize: 12, color: '#1A5F45', fontWeight: '700' },
  bookBtn:         { backgroundColor: '#1A5F45', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, ...Platform.select({ ios: { shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, android: { elevation: 4 } }) },
  bookBtnText:     { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  /* Available Dates */
  datesContainer:  { gap: 10, paddingVertical: 4 },
  dateCard:        { width: 64, height: 72, borderRadius: 12, borderWidth: 1, borderColor: '#bec9c1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  dateCardActive:  { backgroundColor: '#1A5F45', borderColor: '#1A5F45' },
  dateMonth:       { fontSize: 11, fontWeight: '700', color: '#6f7a73', textTransform: 'uppercase' },
  dateDay:         { fontSize: 18, fontWeight: '800', color: '#181d1a', marginTop: 2 },
  dateTextActive:  { color: '#ffffff' },

  /* Cancellation Card */
  cancellationCard:{ backgroundColor: 'rgba(26,95,69,0.04)', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#1A5F45', padding: 14 },
  cancellationHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  cancellationTitle:{ fontSize: 13, fontWeight: '700', color: '#1A5F45' },
  cancellationText:{ fontSize: 12, color: '#3f4943', lineHeight: 18 },
});