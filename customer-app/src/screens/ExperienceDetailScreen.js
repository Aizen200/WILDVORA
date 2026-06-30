import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, StatusBar, Linking,
  Dimensions, Share, Modal, Animated, TouchableWithoutFeedback, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import Alert from '../utils/alert';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import AuthPromptSheet from '../components/AuthPromptSheet';

const HERO_FALLBACK = require('../../assets/heroimage.png');

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const GALLERY_THUMB_SIZE = 64;
const GALLERY_THUMB_GAP = 12;
const HERO_HEIGHT = SCREEN_H * 0.45;
const RADIUS = 28;

// ── Premium palette (scoped to this screen) ─────────────────────────────────
const BG       = '#eef0ef';
const GREEN    = '#2F6F55';
const GREEN_TINT = '#eef1ef';
const INK      = '#1C1B17';
const MUTED    = '#202c27';
const HAIRLINE = 'rgba(28,27,23,0.07)';

// ── OWM icon → native icon ───────────────────────────────────────────────────
const getOWMWeatherIcon = (iconCode, size = 22) => {
  const code = iconCode?.slice(0, 2) || '01';
  const isNight = iconCode?.endsWith('n');
  const p = { size };
  switch (code) {
    case '01': return isNight
      ? <MaterialCommunityIcons name="weather-night"            {...p} color="#4B5563" />
      : <MaterialCommunityIcons name="weather-sunny"            {...p} color="#F59E0B" />;
    case '02': return <MaterialCommunityIcons name="weather-partly-cloudy"   {...p} color="#64748B" />;
    case '03':
    case '04': return <MaterialCommunityIcons name="weather-cloudy"          {...p} color="#78909C" />;
    case '09': return <MaterialCommunityIcons name="weather-pouring"         {...p} color="#3B82F6" />;
    case '10': return <MaterialCommunityIcons name="weather-rainy"           {...p} color="#2563EB" />;
    case '11': return <MaterialCommunityIcons name="weather-lightning-rainy" {...p} color="#7C3AED" />;
    case '13': return <MaterialCommunityIcons name="weather-snowy"           {...p} color="#60A5FA" />;
    case '50': return <MaterialCommunityIcons name="weather-fog"             {...p} color="#9CA3AF" />;
    default:   return <MaterialCommunityIcons name="weather-partly-cloudy"   {...p} color="#64748B" />;
  }
};

const SUITABILITY_COLOR = { Good: '#15803d', Moderate: '#b45309', 'Not Recommended': '#b91c1c' };
const SUITABILITY_COPY  = {
  Good: 'Great conditions for this trip right now.',
  Moderate: 'Conditions may affect parts of this trip.',
  'Not Recommended': 'Current conditions are not ideal for this trip.',
};

const PERFECT_FOR_BY_DIFFICULTY = {
  Easy: 'Beginner Friendly',
  Moderate: 'Moderate Fitness',
  Hard: 'Adventure Seekers',
  Difficult: 'Adventure Seekers',
  Expert: 'Expert Level',
};

const PERFECT_FOR_ICONS = {
  'Beginner Friendly': 'leaf-outline',
  'Moderate Fitness': 'fitness-outline',
  'Adventure Seekers': 'flash-outline',
  'Expert Level': 'trophy-outline',
  'Weekend Escape': 'calendar-outline',
  'Multi-Day Adventure': 'calendar-number-outline',
  'Solo Travellers': 'person-outline',
  'Friends & Groups': 'people-outline',
  'Photography': 'camera-outline',
  'Wildlife Lovers': 'paw-outline',
  'Family Friendly': 'home-outline',
};

const INCLUDED_ICON_RULES = [
  [/guide/i, 'walk-outline'],
  [/meal|food|breakfast|lunch|dinner/i, 'restaurant-outline'],
  [/snack/i, 'fast-food-outline'],
  [/transport|pickup|drop|vehicle|car|bus/i, 'car-outline'],
  [/accommodation|stay|hotel|camp|tent/i, 'bed-outline'],
  [/equipment|gear/i, 'construct-outline'],
  [/water|drink/i, 'water-outline'],
  [/insurance/i, 'shield-checkmark-outline'],
  [/permit|fee|entry|ticket/i, 'ticket-outline'],
  [/photo/i, 'camera-outline'],
  [/first aid|medical|safety/i, 'medkit-outline'],
  [/wifi|internet/i, 'wifi-outline'],
];
const getIncludedIcon = (item) => {
  const match = INCLUDED_ICON_RULES.find(([re]) => re.test(item));
  return match ? match[1] : 'checkmark-circle-outline';
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// "Perfect For" chips are derived entirely from real experience fields
// (difficulty, duration, group size, category/description text) — never hardcoded per-listing.
const buildPerfectForTags = (exp) => {
  const tags = [];
  if (exp.difficulty && PERFECT_FOR_BY_DIFFICULTY[exp.difficulty]) tags.push(PERFECT_FOR_BY_DIFFICULTY[exp.difficulty]);

  const durationText = (exp.duration || '').toLowerCase();
  const dayMatch = durationText.match(/(\d+)\s*day/);
  const dayCount = dayMatch ? parseInt(dayMatch[1], 10) : null;
  if (/weekend/.test(durationText) || (dayCount && dayCount <= 2)) tags.push('Weekend Escape');
  else if (dayCount && dayCount >= 5) tags.push('Multi-Day Adventure');

  if (exp.minGroupSize === 1) tags.push('Solo Travellers');
  if (exp.maxGroupSize >= 6) tags.push('Friends & Groups');

  const text = `${exp.category || ''} ${exp.description || ''}`.toLowerCase();
  if (/photo/.test(text)) tags.push('Photography');
  if (/wildlife|safari/.test(text)) tags.push('Wildlife Lovers');
  if (/family/.test(text)) tags.push('Family Friendly');

  return [...new Set(tags)].slice(0, 6);
};

// ── Reusable slide-up sheet (Trip Details / All Reviews) ────────────────────
function SlideSheet({ visible, onClose, title, children }) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 240 }).start();
    } else {
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.slideSheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHandleBar} />
        <View style={styles.slideSheetHeader}>
          <Text style={styles.slideSheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ExperienceDetailScreen({ route, navigation }) {
  const { experienceId, bookingId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { requireAuth, promptVisible, hidePrompt } = useAuthGuard();

  const [experience,     setExperience]    = useState(null);
  const [reviews,        setReviews]       = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [inWishlist,     setInWishlist]    = useState(false);
  const [readMore,       setReadMore]      = useState(false);
  const [weatherData,    setWeatherData]   = useState(null);
  const [weatherLoading, setWeatherLoading]= useState(true);
  const [weatherError,   setWeatherError]  = useState(false);
  const [heroImgError,   setHeroImgError]  = useState(false);
  const [showTripDetails,  setShowTripDetails]  = useState(false);
  const [showAllReviews,   setShowAllReviews]   = useState(false);
  const [galleryIndex,      setGalleryIndex]      = useState(0);
  const [showGalleryViewer, setShowGalleryViewer] = useState(false);

  const galleryListRef       = useRef(null);
  const galleryThumbListRef  = useRef(null);
  const galleryViewerListRef = useRef(null);
  const thumbScaleAnims      = useRef({}).current;

  useEffect(() => {
    Object.keys(thumbScaleAnims).forEach((key) => {
      Animated.spring(thumbScaleAnims[key], {
        toValue: Number(key) === galleryIndex ? 1.1 : 1,
        useNativeDriver: true,
        friction: 6,
        tension: 80,
      }).start();
    });
  }, [galleryIndex]);

  const fetchWeatherAndSafety = async (exp) => {
    const city       = exp.location?.city    || '';
    const state      = exp.location?.state   || '';
    const rawCountry = exp.location?.country || 'IN';
    const WEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    const COUNTRY_CODES = {
      'India':'IN','Nepal':'NP','Bhutan':'BT','Sri Lanka':'LK','Maldives':'MV','Bangladesh':'BD',
    };
    const countryCode = COUNTRY_CODES[rawCountry] ?? (rawCountry.length <= 3 ? rawCountry.toUpperCase() : 'IN');
    try {
      setWeatherLoading(true); setWeatherError(false);
      let geoLat = null, geoLon = null;
      try {
        const geoQ   = encodeURIComponent([city, state, rawCountry].filter(Boolean).join(', '));
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${geoQ}&format=json&limit=1`, { headers: { 'User-Agent': 'WildvoraApp/1.0' } });
        const geoData = await geoRes.json();
        if (geoData?.length > 0) { geoLat = parseFloat(geoData[0].lat); geoLon = parseFloat(geoData[0].lon); }
      } catch { /* fallback */ }

      const owmBase = `https://api.openweathermap.org/data/2.5`;
      let weatherUrl, forecastUrl;
      if (geoLat !== null && geoLon !== null) {
        const coords = `lat=${geoLat}&lon=${geoLon}`;
        weatherUrl  = `${owmBase}/weather?${coords}&appid=${WEATHER_KEY}&units=metric`;
        forecastUrl = `${owmBase}/forecast?${coords}&appid=${WEATHER_KEY}&units=metric&cnt=4`;
      } else {
        const q = encodeURIComponent(city ? `${city},${countryCode}` : countryCode);
        weatherUrl  = `${owmBase}/weather?q=${q}&appid=${WEATHER_KEY}&units=metric`;
        forecastUrl = `${owmBase}/forecast?q=${q}&appid=${WEATHER_KEY}&units=metric&cnt=4`;
      }

      const [wRes, fRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
      const [w, f]       = await Promise.all([wRes.json(), fRes.json()]);
      if (w.cod !== 200) throw new Error('Weather API error');

      const windKmh  = Math.round((w.wind?.speed || 0) * 3.6);
      const visKm    = ((w.visibility || 10000) / 1000).toFixed(1);
      const tempC    = Math.round(w.main?.temp       || 20);
      const feelsC   = Math.round(w.main?.feels_like || tempC);
      const humidity = w.main?.humidity || 0;
      const iconCode = w.weather?.[0]?.icon        || '01d';
      const condMain = w.weather?.[0]?.main        || 'Clear';
      const condDesc = w.weather?.[0]?.description || 'clear sky';
      const forecastPop    = f.list?.[0]?.pop ?? 0;
      const rainPct        = Math.round(forecastPop * 100);
      const isCurrentlyRainy = ['Rain','Drizzle','Thunderstorm','Snow'].includes(condMain);
      const fmtTime = (ts) => new Date(ts * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const sunrise = w.sys?.sunrise ? fmtTime(w.sys.sunrise) : '--';
      const sunset  = w.sys?.sunset  ? fmtTime(w.sys.sunset)  : '--';

      let suitability = 'Good'; const alerts = [];
      if (condMain === 'Thunderstorm') {
        suitability = 'Not Recommended'; alerts.push('Thunderstorm warning. Outdoor activities strongly advised against.');
      } else if (windKmh > 50 || (isCurrentlyRainy && rainPct > 70)) {
        suitability = 'Not Recommended';
        if (windKmh > 50) alerts.push(`High wind alert: ${windKmh} km/h.`);
        if (isCurrentlyRainy && rainPct > 70) alerts.push(`Heavy rain continuing (${rainPct}%).`);
      } else if (['Rain','Drizzle'].includes(condMain) || windKmh > 30 || rainPct > 70 || parseFloat(visKm) < 3) {
        suitability = 'Moderate';
        if (['Rain','Drizzle'].includes(condMain)) alerts.push('Rain expected. Carry waterproof gear.');
        else if (windKmh > 30) alerts.push(`Elevated winds at ${windKmh} km/h.`);
        else if (rainPct > 70) alerts.push(`Heavy rain forecast (${rainPct}%).`);
        else if (parseFloat(visKm) < 3) alerts.push(`Reduced visibility (${visKm} km).`);
      } else if (!isCurrentlyRainy && rainPct > 40) {
        suitability = 'Moderate'; alerts.push(`Rain likely later (${rainPct}%). Carry a rain jacket.`);
      }

      let hospital = null;
      try {
        if (geoLat !== null && geoLon !== null) {
          const overpassQ = encodeURIComponent(`[out:json][timeout:10];node["amenity"="hospital"](around:20000,${geoLat},${geoLon});out body 3;`);
          const hRes  = await fetch(`https://overpass-api.de/api/interpreter?data=${overpassQ}`);
          const hData = await hRes.json();
          if (hData.elements?.length > 0) {
            const h = hData.elements[0];
            hospital = { name: h.tags?.name || h.tags?.['name:en'] || 'Nearby Hospital', vicinity: [h.tags?.['addr:street'], h.tags?.['addr:city'] || city].filter(Boolean).join(', ') };
          }
        }
      } catch { /* silent */ }

      setWeatherData({ temp:`${tempC}°C`, feelsLike:`${feelsC}°C`, humidity:`${humidity}%`, condition: condDesc.charAt(0).toUpperCase()+condDesc.slice(1), conditionMain:condMain, iconCode, rainProb:`${rainPct}%`, windSpeed:`${windKmh} km/h`, visibility:`${visKm} km`, sunrise, sunset, suitability, alerts, hospital });
    } catch (err) { console.warn('Weather fetch failed:', err.message); setWeatherError(true); }
    finally { setWeatherLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, revRes] = await Promise.all([
          experienceAPI.getOne(experienceId),
          reviewAPI.getForExperience(experienceId),
        ]);
        const exp = expRes.data.experience;
        setExperience(exp); setReviews(revRes.data.reviews);
        if (user?.wishlist) setInWishlist(user.wishlist.some(w => w._id === experienceId || w === experienceId));
        addToRecentlyViewed(exp);
        fetchWeatherAndSafety(exp);
      } catch {
        Alert.alert('Error', 'Could not load experience'); navigation.goBack();
      } finally { setLoading(false); }
    };
    fetchData();
  }, [experienceId]);

  const handleWishlist = requireAuth(async () => {
    try { await userAPI.toggleWishlist(experienceId); setInWishlist(p => !p); }
    catch { Alert.alert('Error', 'Could not update wishlist'); }
  });

  const handleShare = async () => {
    if (!experience) return;
    try {
      const place = [experience.location?.city, experience.location?.country].filter(Boolean).join(', ');
      await Share.share({
        title: experience.title,
        message: `${experience.title}${place ? ` — ${place}` : ''}\n\nDiscover it on Wildvora.`,
      });
    } catch { /* user dismissed share sheet */ }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>;
  if (!experience) return null;

  const actualImage   = experience.coverImage || experience.images?.[0];
  const hostAvatarUrl = experience.host?.avatar || null;
  const suitColor     = weatherData ? SUITABILITY_COLOR[weatherData.suitability] : GREEN;

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Ionicons key={i} name={i < Math.floor(rating) ? 'star' : 'star-outline'} size={13} color={GREEN} style={{ marginRight: 1 }} />
    ));

  const today     = new Date();
  const months    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmtDate   = (ds) => { const d = new Date(ds + 'T00:00:00'); return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`; };
  const availDates = (() => {
    const fut = (experience.availableDates || []).filter(ds => new Date(ds + 'T00:00:00') >= today).slice(0, 6);
    if (fut.length) return fut;
    const arr = []; const d = new Date(today); d.setDate(d.getDate() + 3);
    for (let i = 0; i < 4; i++) { arr.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 7); }
    return arr;
  })();

  // Quick info chips — only fields that actually exist on the data model.
  // There is no "distance" field on Experience, so that chip is simply omitted.
  const quickInfo = [
    experience.duration     && { icon: 'time-outline',      label: 'Duration',   value: experience.duration },
    experience.difficulty   && { icon: 'bar-chart-outline', label: 'Difficulty', value: experience.difficulty },
    experience.maxGroupSize && {
      icon: 'people-outline', label: 'Group size',
      value: experience.minGroupSize && experience.minGroupSize !== experience.maxGroupSize
        ? `${experience.minGroupSize}–${experience.maxGroupSize}`
        : `Up to ${experience.maxGroupSize}`,
    },
  ].filter(Boolean);

  const galleryImages = experience.adventureImages?.length > 0
    ? experience.adventureImages
    : (experience.images?.length > 1 ? experience.images.slice(1) : [HERO_FALLBACK, HERO_FALLBACK, HERO_FALLBACK]);

  const galleryFeaturedWidth = SCREEN_W - 48; // matches the 24px section padding on each side
  const galleryItemLayout  = (_, index) => ({ length: galleryFeaturedWidth, offset: galleryFeaturedWidth * index, index });
  const galleryThumbLayout = (_, index) => ({ length: GALLERY_THUMB_SIZE, offset: (GALLERY_THUMB_SIZE + GALLERY_THUMB_GAP) * index, index });
  const galleryViewerLayout = (_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index });

  const getThumbScaleAnim = (index) => {
    if (!thumbScaleAnims[index]) thumbScaleAnims[index] = new Animated.Value(index === galleryIndex ? 1.1 : 1);
    return thumbScaleAnims[index];
  };

  const goToGalleryIndex = (index) => {
    setGalleryIndex(index);
    galleryListRef.current?.scrollToIndex({ index, animated: true });
    galleryThumbListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const handleGalleryMomentumEnd = (e) => {
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / galleryFeaturedWidth);
    const index = Math.max(0, Math.min(rawIndex, galleryImages.length - 1));
    if (index !== galleryIndex) {
      setGalleryIndex(index);
      galleryThumbListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  const handleGalleryViewerMomentumEnd = (e) => {
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    const index = Math.max(0, Math.min(rawIndex, galleryImages.length - 1));
    if (index !== galleryIndex) setGalleryIndex(index);
  };

  const openGalleryViewer = () => setShowGalleryViewer(true);

  const closeGalleryViewer = () => {
    setShowGalleryViewer(false);
    requestAnimationFrame(() => {
      galleryListRef.current?.scrollToIndex({ index: galleryIndex, animated: false });
      galleryThumbListRef.current?.scrollToIndex({ index: galleryIndex, animated: false, viewPosition: 0.5 });
    });
  };

  const perfectForTags = buildPerfectForTags(experience);

  const includedAll      = experience.includes || [];
  const includedPreview  = includedAll.slice(0, 6);
  const includedExtra    = Math.max(includedAll.length - includedPreview.length, 0);

  const hasWeatherDetail = !weatherLoading && !weatherError && !!weatherData;
  const hasTripDetails = Boolean(
    includedAll.length || experience.exclusions?.length || experience.cancellationPolicy ||
    experience.minGroupSize || experience.maxGroupSize || experience.bookingDeadline ||
    experience.ageRestriction || experience.medicalRestrictions || experience.medicalAdvisories?.length ||
    experience.safetyChecklist?.length || experience.safetyInfo?.emergencyContact ||
    experience.operatorInfo?.guideCertifications || hasWeatherDetail
  );

  const reviewsToShow = reviews.slice(0, 2);

  const btnTop = insets.top + 12;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Fixed immersive hero — sits behind the sheet and is gradually covered as it scrolls up ── */}
      <View style={styles.heroFixed}>
        <Image source={HERO_FALLBACK} style={StyleSheet.absoluteFill} resizeMode="cover" />
        {!heroImgError && !!actualImage && (
          <Image source={{ uri: actualImage }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setHeroImgError(true)} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.50)', 'transparent']} style={styles.heroTopFade} pointerEvents="none" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.62)']} style={styles.heroBottomFade} pointerEvents="none" />

        <View style={styles.heroTextBlock} pointerEvents="none">
          {experience.category && (
            <View style={styles.heroTag}><Text style={styles.heroTagText}>{experience.category}</Text></View>
          )}
          <Text style={styles.heroTitle} numberOfLines={2}>{experience.title}</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="star" size={13} color="#fff" />
            <Text style={styles.heroMetaText}>{experience.rating || '4.9'}</Text>
            {experience.reviewCount > 0 && <Text style={styles.heroMetaTextDim}>({experience.reviewCount})</Text>}
            {(experience.location?.city || experience.location?.country) && (
              <>
                <View style={styles.heroMetaDot} />
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroMetaTextDim} numberOfLines={1}>
                  {[experience.location?.city, experience.location?.country].filter(Boolean).join(', ')}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ── Sliding white sheet ── */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO_HEIGHT - RADIUS, paddingBottom: 120 + insets.bottom }}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Quick info — single unified stat row, Apple-style */}
          {quickInfo.length > 0 && (
            <View style={styles.statsCard}>
              {quickInfo.map(({ icon, label, value }, idx) => (
                <View key={idx} style={[styles.statItem, idx < quickInfo.length - 1 && styles.statItemDivider]}>
                  <Ionicons name={icon} size={20} color={GREEN} style={{ marginBottom: 8 }} />
                  <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Overview */}
          {experience.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.bodyText} numberOfLines={readMore ? undefined : 4}>{experience.description}</Text>
              <TouchableOpacity onPress={() => setReadMore(r => !r)} style={styles.readMoreBtn} activeOpacity={0.7}>
                <Text style={styles.readMoreText}>{readMore ? 'Show less' : 'Show more'}</Text>
                <Ionicons name={readMore ? 'chevron-up' : 'chevron-down'} size={13} color={GREEN} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.divider} />
            {/* Gallery — falls back to hero imagery only when the experience has no gallery photos of its own */}
          <View style={[styles.section, { paddingBottom: 4 }]}>
            <View style={styles.galleryHeaderRow}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              {galleryImages.length > 1 && (
                <TouchableOpacity style={styles.galleryViewAllBtn} onPress={openGalleryViewer} activeOpacity={0.75}>
                  <Text style={styles.galleryViewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={14} color={GREEN} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            <FlatList
              ref={galleryListRef}
              data={galleryImages}
              keyExtractor={(_, idx) => `gallery-featured-${idx}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              getItemLayout={galleryItemLayout}
              onMomentumScrollEnd={handleGalleryMomentumEnd}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={openGalleryViewer}
                  style={{ width: galleryFeaturedWidth }}
                >
                  <Image
                    source={typeof item === 'string' ? { uri: item } : item}
                    style={styles.galleryFeaturedImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          </View>

          {galleryImages.length > 1 && (
            <FlatList
              ref={galleryThumbListRef}
              data={galleryImages}
              keyExtractor={(_, idx) => `gallery-thumb-${idx}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              getItemLayout={galleryThumbLayout}
              contentContainerStyle={{ gap: GALLERY_THUMB_GAP, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 4 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity activeOpacity={0.8} onPress={() => goToGalleryIndex(index)}>
                  <Animated.View
                    style={[
                      styles.galleryThumbWrap,
                      index === galleryIndex && styles.galleryThumbWrapActive,
                      { transform: [{ scale: getThumbScaleAnim(index) }] },
                    ]}
                  >
                    <Image
                      source={typeof item === 'string' ? { uri: item } : item}
                      style={styles.galleryThumbImage}
                      resizeMode="cover"
                    />
                  </Animated.View>
                </TouchableOpacity>
              )}
            />
          )}

          <View style={styles.divider} />
          {/* Available dates */}
          <View style={[styles.section, { paddingBottom: 4 }]}>
            <Text style={styles.sectionTitle}>Available Dates</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
            {availDates.map((ds, i) => (
              <TouchableOpacity
                key={i}
                style={styles.dateChip}
                onPress={requireAuth(() => navigation.navigate('Booking', { experience }))}
                activeOpacity={0.8}
              >
                <Text style={styles.dateChipText}>{fmtDate(ds)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.divider} />

          {/* Included preview */}
          {(includedPreview.length > 0 || hasTripDetails) && (
            <>
              <View style={styles.section}>
                {includedPreview.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Included</Text>
                    <View style={styles.includedGrid}>
                      {includedPreview.map((item, idx) => (
                        <View key={idx} style={styles.includedItem}>
                          <View style={styles.includedIconWrap}>
                            <Ionicons name={getIncludedIcon(item)} size={14} color={GREEN} />
                          </View>
                          <Text style={styles.includedItemText} numberOfLines={2}>{item}</Text>
                        </View>
                      ))}
                    </View>
                    {includedExtra > 0 && (
                      <Text style={styles.includedExtraText}>+{includedExtra} more included</Text>
                    )}
                  </>
                )}
                {hasTripDetails && (
                  <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowTripDetails(true)} activeOpacity={0.8}>
                    <Text style={styles.viewAllBtnText}>View All Inclusions</Text>
                    <Ionicons name="chevron-forward" size={15} color={GREEN} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Meeting point */}
          {(experience.location?.meetingPoint || experience.location?.googleMapsLink) && (
            <>
              <View style={styles.section}>
                <View style={styles.meetingPointHeaderRow}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Meeting Point</Text>
                  {experience.location?.googleMapsLink && (
                    <TouchableOpacity style={styles.mapsBtn} onPress={() => Linking.openURL(experience.location.googleMapsLink)} activeOpacity={0.85}>
                      <Ionicons name="map-outline" size={15} color={GREEN} />
                      <Text style={styles.mapsBtnText}>Open in Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={19} color={GREEN}/>
                <Text
                  style={styles.locationText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {[
                    experience.location.meetingPoint,
                    experience.location.city,
                    experience.location.state,
                    experience.location.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Best Time & Weather (compact) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Time & Weather</Text>
            {weatherLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color={GREEN} />
                <Text style={styles.bodyText}>Checking conditions…</Text>
              </View>
            ) : weatherError ? (
              <Text style={[styles.bodyText, { color: MUTED }]}>Weather data unavailable.</Text>
            ) : (
              <View style={styles.weatherCompactCard}>
                <View style={styles.weatherCompactTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {getOWMWeatherIcon(weatherData?.iconCode, 28)}
                    <View>
                      <Text style={styles.weatherCompactTemp}>{weatherData?.temp}</Text>
                      <Text style={styles.weatherCompactCond}>{weatherData?.condition}</Text>
                    </View>
                  </View>
                  <View style={[styles.suitBadge, { borderColor: suitColor }]}>
                    <Text style={[styles.suitBadgeText, { color: suitColor }]}>
                      {weatherData?.suitability === 'Good' ? 'Good to go'
                        : weatherData?.suitability === 'Moderate' ? 'Use caution'
                        : 'Not recommended'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.weatherCompactCopy}>{SUITABILITY_COPY[weatherData?.suitability] || SUITABILITY_COPY.Good}</Text>
                {weatherData?.alerts?.length > 0 && (
                  <Text style={styles.weatherCompactAlert}>⚠ {weatherData.alerts[0]}</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Perfect For */}
          {perfectForTags.length > 0 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Perfect For</Text>
                <View style={styles.perfectForGrid}>
                  {perfectForTags.map((tag, idx) => (
                    <View key={idx} style={styles.perfectForCard}>
                      <View style={styles.perfectForIconWrap}>
                        <Ionicons name={PERFECT_FOR_ICONS[tag] || 'sparkles-outline'} size={18} color={GREEN} />
                      </View>
                      <Text style={styles.perfectForCardText} numberOfLines={2}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Reviews — hidden entirely when there are none */}
          {reviews.length > 0 && (
            <>
              <View style={styles.section}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>Reviews</Text>
                  <View style={styles.reviewsRatingPill}>
                    <Ionicons name="star" size={13} color={GREEN} />
                    <Text style={styles.reviewsRatingText}>{experience.rating || '4.9'}</Text>
                    <Text style={styles.reviewsCountText}>({experience.reviewCount || reviews.length})</Text>
                  </View>
                </View>
                {reviewsToShow.map((r) => (
                  <View key={r._id} style={styles.reviewCard}>
                    <View style={styles.reviewHead}>
                      <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{getInitials(r.userName || r.user?.name)}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewAuthor}>{r.userName || r.user?.name || 'Anonymous'}</Text>
                        <Text style={styles.reviewDate}>{r.createdAt?.split('T')[0] || r.createdAt}</Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>{renderStars(r.rating)}</View>
                    </View>
                    <Text style={styles.reviewComment}>{r.comment}</Text>
                  </View>
                ))}
                {reviews.length > 2 && (
                  <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowAllReviews(true)} activeOpacity={0.8}>
                    <Text style={styles.viewAllBtnText}>View All Reviews ({reviews.length})</Text>
                    <Ionicons name="chevron-forward" size={15} color={GREEN} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Operator — compact card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted By</Text>
            <View style={styles.operatorCard}>
              <TouchableOpacity
                style={styles.operatorIdentity}
                onPress={() => experience.host?._id && navigation.navigate('OperatorProfile', { hostId: experience.host._id })}
                activeOpacity={0.8}
              >
                {hostAvatarUrl
                  ? <Image source={{ uri: hostAvatarUrl }} style={styles.operatorAvatar} />
                  : <View style={[styles.operatorAvatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{getInitials(experience.hostName)}</Text></View>
                }
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={styles.hostName} numberOfLines={1}>{experience.hostName || 'Wildvora Host'}</Text>
                    {experience.hostVerified && <MaterialIcons name="verified" size={15} color={GREEN} />}
                  </View>
                  <View style={styles.hostMetaRow}>
                    <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.hostMetaText}>{experience.rating || '4.9'}</Text>
                    {experience.operatorInfo?.yearsOfOperation > 0 && (
                      <>
                        <View style={styles.hostMetaDot} />
                        <Text style={styles.hostMetaText}>{experience.operatorInfo.yearsOfOperation} yrs active</Text>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.operatorActions}>
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => experience.host?._id && navigation.navigate('OperatorProfile', { hostId: experience.host._id })}
                  activeOpacity={0.85}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="account-circle-outline" size={18} color={GREEN}/>
                </TouchableOpacity>

                {bookingId ? (
                  <TouchableOpacity
                    style={styles.messageIconBtn}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => navigation.navigate('Chat', { bookingId, hostName: experience.hostName, title: experience.title })}
                  >
                    <MaterialCommunityIcons name="chat-processing-outline" size={18} color={GREEN} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.messageIconBtn}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={requireAuth(() => navigation.navigate('InquiryChat', {
                      experienceId: experience._id,
                      hostName: experience.hostName,
                      experienceTitle: experience.title,
                    }))}
                  >
                    <MaterialCommunityIcons name="chat-question-outline" size={18} color={GREEN} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Floating top nav ── */}
      <View style={[styles.topNav, { top: btnTop }]}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} activeOpacity={0.85} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="arrow-back" size={20} color={INK} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={styles.navBtn} onPress={handleShare} activeOpacity={0.85} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Ionicons name="share-outline" size={19} color={INK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleWishlist} activeOpacity={0.85} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={20} color={inWishlist ? '#ba1a1a' : INK} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sticky footer (only booking CTA on the page) ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
            <Text style={styles.footerPrice}>₹{experience.price}</Text>
            <Text style={styles.footerPriceSub}>/ person</Text>
          </View>
          <TouchableOpacity onPress={requireAuth(() => navigation.navigate('Booking', { experience }))} activeOpacity={0.8}>
            <Text style={styles.viewDatesText}>View all dates →</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.footerBookBtn}
          onPress={requireAuth(() => navigation.navigate('Booking', { experience }))}
          activeOpacity={0.88}
        >
          <Text style={styles.footerBookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* ── Trip Details sheet ── */}
      <SlideSheet visible={showTripDetails} onClose={() => setShowTripDetails(false)} title="Trip Details">
        {includedAll.length > 0 && (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionTitle}>What's Included</Text>
            {includedAll.map((item, idx) => (
              <View key={idx} style={styles.inclRow}>
                <View style={styles.inclCheck}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                <Text style={styles.inclText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {experience.exclusions?.length > 0 && (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionTitle}>Not Included</Text>
            {experience.exclusions.map((item, idx) => (
              <View key={idx} style={styles.inclRow}>
                <View style={styles.exclX}><Ionicons name="close" size={12} color="#fff" /></View>
                <Text style={[styles.inclText, { color: MUTED }]}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {(experience.cancellationPolicy || experience.minGroupSize || experience.maxGroupSize || experience.bookingDeadline || experience.ageRestriction) && (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionTitle}>Booking Policies</Text>
            {experience.cancellationPolicy && (
              <View style={styles.policyRow}>
                <Ionicons name="refresh-circle-outline" size={18} color={GREEN} />
                <Text style={styles.policyText}><Text style={styles.policyTextBold}>Cancellation — </Text>{experience.cancellationPolicy}</Text>
              </View>
            )}
            {(experience.minGroupSize || experience.maxGroupSize) && (
              <View style={styles.policyRow}>
                <Ionicons name="people-outline" size={18} color={GREEN} />
                <Text style={styles.policyText}>
                  <Text style={styles.policyTextBold}>Group size — </Text>
                  {experience.minGroupSize && experience.maxGroupSize
                    ? `${experience.minGroupSize}–${experience.maxGroupSize} people`
                    : experience.maxGroupSize
                    ? `Up to ${experience.maxGroupSize} people`
                    : `Minimum ${experience.minGroupSize} people`}
                </Text>
              </View>
            )}
            {experience.bookingDeadline && (
              <View style={styles.policyRow}>
                <Ionicons name="time-outline" size={18} color={GREEN} />
                <Text style={styles.policyText}>
                  <Text style={styles.policyTextBold}>Advance booking — </Text>
                  at least {experience.bookingDeadline} day{experience.bookingDeadline !== 1 ? 's' : ''} before departure
                </Text>
              </View>
            )}
            {experience.ageRestriction && (
              <View style={[styles.policyRow, { marginBottom: 0 }]}>
                <Ionicons name="person-outline" size={18} color={GREEN} />
                <Text style={styles.policyText}><Text style={styles.policyTextBold}>Age — </Text>{experience.ageRestriction}</Text>
              </View>
            )}
          </View>
        )}

        {(experience.medicalRestrictions || experience.medicalAdvisories?.length > 0 || experience.safetyChecklist?.length > 0 || experience.safetyInfo?.emergencyContact || weatherData?.hospital || experience.operatorInfo?.guideCertifications) && (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetSectionTitle}>Health & Safety</Text>
            {experience.operatorInfo?.guideCertifications && (
              <Text style={[styles.bodyText, { marginBottom: 10 }]}>Guide certifications: {experience.operatorInfo.guideCertifications}</Text>
            )}
            {experience.medicalRestrictions && <Text style={[styles.bodyText, { marginBottom: 8 }]}>⚠ {experience.medicalRestrictions}</Text>}
            {experience.medicalAdvisories?.map((adv, i) => <Text key={i} style={[styles.bodyText, { marginBottom: 8 }]}>⚠ {adv}</Text>)}
            {experience.safetyChecklist?.length > 0 && experience.safetyChecklist.map((item, idx) => (
              <View key={idx} style={styles.inclRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={GREEN} />
                <Text style={styles.inclText}>{item}</Text>
              </View>
            ))}
            {experience.safetyInfo?.emergencyContact && (
              <TouchableOpacity style={styles.emergencyCard} onPress={() => Linking.openURL(`tel:${experience.safetyInfo.emergencyContact}`)} activeOpacity={0.8}>
                <View style={styles.emergencyIconBg}><Ionicons name="call-outline" size={16} color={GREEN} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyLabel}>Operator emergency line</Text>
                  <Text style={styles.emergencyNum}>{experience.safetyInfo.emergencyContact}</Text>
                </View>
                <View style={styles.callBtn}><Text style={styles.callBtnText}>Call</Text></View>
              </TouchableOpacity>
            )}
            {weatherData?.hospital && (
              <View style={styles.emergencyCard}>
                <View style={styles.emergencyIconBg}><Ionicons name="business-outline" size={16} color={GREEN} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyLabel}>Nearest hospital</Text>
                  <Text style={styles.emergencyNum}>{weatherData.hospital.name}</Text>
                  {weatherData.hospital.vicinity ? <Text style={styles.emergencyAddr} numberOfLines={1}>{weatherData.hospital.vicinity}</Text> : null}
                </View>
              </View>
            )}
          </View>
        )}

        {hasWeatherDetail && (
          <View style={[styles.sheetSection, { marginBottom: 0 }]}>
            <Text style={styles.sheetSectionTitle}>Weather Details</Text>
            <View style={styles.weatherStats}>
              {[
                { label: 'Rain',     value: weatherData?.rainProb },
                { label: 'Wind',     value: weatherData?.windSpeed },
                { label: 'Humidity', value: weatherData?.humidity },
                { label: 'Sunrise',  value: weatherData?.sunrise },
                { label: 'Sunset',   value: weatherData?.sunset },
              ].map(({ label, value }) => (
                <View key={label} style={styles.weatherStatItem}>
                  <Text style={styles.weatherStatLabel}>{label}</Text>
                  <Text style={styles.weatherStatValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </SlideSheet>

      {/* ── All Reviews sheet ── */}
      <SlideSheet visible={showAllReviews} onClose={() => setShowAllReviews(false)} title={`Reviews (${reviews.length})`}>
        <View style={styles.sheetSection}>
          {reviews.map((r) => (
            <View key={r._id} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{getInitials(r.userName || r.user?.name)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewAuthor}>{r.userName || r.user?.name || 'Anonymous'}</Text>
                  <Text style={styles.reviewDate}>{r.createdAt?.split('T')[0] || r.createdAt}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>{renderStars(r.rating)}</View>
              </View>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </View>
          ))}
        </View>
      </SlideSheet>

      {/* ── Full-screen gallery viewer ── */}
      <Modal
        visible={showGalleryViewer}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeGalleryViewer}
        onShow={() => galleryViewerListRef.current?.scrollToIndex({ index: galleryIndex, animated: false })}
      >
        <View style={styles.galleryViewerRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <FlatList
            ref={galleryViewerListRef}
            data={galleryImages}
            keyExtractor={(_, idx) => `gallery-viewer-${idx}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            getItemLayout={galleryViewerLayout}
            onMomentumScrollEnd={handleGalleryViewerMomentumEnd}
            renderItem={({ item }) => (
              <View style={styles.galleryViewerPage}>
                <Image
                  source={typeof item === 'string' ? { uri: item } : item}
                  style={styles.galleryViewerImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
          <View style={[styles.galleryViewerTopBar, { top: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.galleryViewerCloseBtn}
              onPress={closeGalleryViewer}
              activeOpacity={0.85}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            {galleryImages.length > 1 && (
              <View style={styles.galleryViewerCounter}>
                <Text style={styles.galleryViewerCounterText}>{galleryIndex + 1} / {galleryImages.length}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <AuthPromptSheet
        visible={promptVisible}
        onDismiss={hidePrompt}
        onSignUp={() => { hidePrompt(); navigation.navigate('Register'); }}
        onSignIn={() => { hidePrompt(); navigation.navigate('Login'); }}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },

  /* Hero (fixed, behind the sheet) */
  heroFixed:     { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT, zIndex: 0, overflow: 'hidden' },
  heroTopFade:   { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  heroBottomFade:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 170 },
  heroTextBlock: { position: 'absolute', left: 24, right: 24, bottom: RADIUS + 26 },
  heroTag:       { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', marginBottom: 10 },
  heroTagText:   { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6 },
  heroTitle:     { fontSize: 30, fontWeight: '800', color: '#fff', lineHeight: 36, letterSpacing: -0.4, marginBottom: 10 },
  heroMetaRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  heroMetaText:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroMetaTextDim: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroMetaDot:   { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 5 },

  /* Floating top nav */
  topNav: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 50 },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ ios: { shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:8 }, android:{elevation:3} }),
  },

  /* Sheet */
  sheet:       { backgroundColor: BG, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS, paddingTop: 14, paddingBottom: 30, overflow: 'hidden' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: HAIRLINE, marginBottom: 5 },

  /* Available dates */
  dateChip:     { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#fff' },
  dateChipText: { fontSize: 13, color: GREEN, fontWeight: '700' },

  /* Quick info — single unified stat row, Apple-style */
  statsCard: {
    flexDirection: 'row', marginHorizontal: 24, marginTop: 20,
    backgroundColor: '#e3ece9', borderRadius: 22, paddingVertical: 20,
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.04,shadowRadius:10}, android:{elevation:1} }),
  },
  statItem:         { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statItemDivider:  { borderRightWidth: 1, borderRightColor: HAIRLINE },
  statValue:        { fontSize: 15, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  statLabel:        { fontSize: 11.5, color: MUTED, marginTop: 3, fontWeight: '500' },

  divider: { height: 1, backgroundColor: HAIRLINE, marginHorizontal: 24, marginVertical: 19 },

  /* Generic section */
  section:     { paddingHorizontal: 24 },
  sectionTitle:{ fontSize: 21, fontWeight: '800', color: INK, marginBottom: 14, letterSpacing: -0.3 },

  bodyText:   { fontSize: 15, color: '#4A453D', lineHeight: 24 },
  readMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 10 },
  readMoreText: { fontSize: 13, color: GREEN, fontWeight: '700' },

  /* Perfect For */
  perfectForGrid:      { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, columnGap: 12 },
  perfectForCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, width: '47%',
    backgroundColor: '#fff', borderRadius: 18, padding: 12,
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.05,shadowRadius:8}, android:{elevation:1} }),
  },
  perfectForIconWrap:  { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN_TINT, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  perfectForCardText:  { fontSize: 13, fontWeight: '700', color: INK, flex: 1, lineHeight: 17 },

  /* Included preview */
  includedGrid:      { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 14 },
  includedItem:      { flexDirection: 'row', alignItems: 'flex-start', gap: 9, width: '47%' },
  includedIconWrap:  { width: 22, height: 22, borderRadius: 11, backgroundColor: GREEN_TINT, justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0 },
  includedItemText:  { fontSize: 13.5, fontWeight: '600', color: '#3A3530', lineHeight: 19, flex: 1 },
  includedExtraText: { fontSize: 12.5, color: MUTED, fontWeight: '600', marginTop: 14 },
  viewAllBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, alignSelf: 'flex-start' },
  viewAllBtnText: { fontSize: 13.5, color: GREEN, fontWeight: '700' },

  /* Meeting point */
  meetingPointHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  mapsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', flexShrink: 0 },
  mapsBtnText: { fontSize: 12.5, color: GREEN, fontWeight: '700' },

  /* Best Time & Weather (compact) */
  weatherCompactCard:  { backgroundColor: '#fff', borderRadius: 20, padding: 16 },
  weatherCompactTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  weatherCompactTemp:  { fontSize: 18, fontWeight: '800', color: INK },
  weatherCompactCond:  { fontSize: 12, color: MUTED, marginTop: 1 },
  weatherCompactCopy:  { fontSize: 13, color: '#4A453D', lineHeight: 19 },
  weatherCompactAlert: { fontSize: 12, color: '#b45309', marginTop: 8, lineHeight: 17 },
  suitBadge:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  suitBadgeText:    { fontSize: 11, fontWeight: '700' },

  /* Gallery */
  galleryHeaderRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  galleryViewAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  galleryViewAllText:  { fontSize: 13.5, color: GREEN, fontWeight: '700' },
  galleryFeaturedImage: {
    width: '100%', height: 240, borderRadius: 24, backgroundColor: '#e3ece9',
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:6},shadowOpacity:0.12,shadowRadius:16}, android:{elevation:3} }),
  },
  galleryThumbWrap: {
    width: GALLERY_THUMB_SIZE, height: GALLERY_THUMB_SIZE, borderRadius: 16,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  galleryThumbWrapActive: { borderColor: GREEN },
  galleryThumbImage:      { width: '100%', height: '100%' },

  galleryViewerRoot:    { flex: 1, backgroundColor: '#000' },
  galleryViewerPage:    { width: SCREEN_W, height: '100%', justifyContent: 'center', alignItems: 'center' },
  galleryViewerImage:   { width: '100%', height: '100%' },
  galleryViewerTopBar:  { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  galleryViewerCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  galleryViewerCounter:  { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)' },
  galleryViewerCounterText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },

  /* Reviews */
  reviewsHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  reviewsRatingPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  reviewsRatingText:  { fontSize: 13, fontWeight: '800', color: INK },
  reviewsCountText:   { fontSize: 12, color: MUTED },
  reviewCard:       { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12 },
  reviewHead:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reviewAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reviewAuthor:     { fontSize: 13, fontWeight: '700', color: INK },
  reviewDate:       { fontSize: 11, color: '#bbb', marginTop: 1 },
  reviewComment:    { fontSize: 13.5, color: '#4A453D', lineHeight: 20 },

  /* Operator (compact) */
  operatorCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  operatorIdentity:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  operatorAvatar:     { width: 50, height: 50, borderRadius: 25 },
  avatarFallback:     { backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  avatarInitials:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  hostName:           { fontSize: 15, fontWeight: '700', color: INK, flexShrink: 1 },
  hostMetaRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  hostMetaText:       { fontSize: 12, color: '#5C564B', fontWeight: '600' },
  hostMetaDot:        { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#c9c2b3', marginHorizontal: 2 },
  operatorActions:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  viewProfileBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN_TINT, justifyContent: 'center', alignItems: 'center' },
  viewProfileBtnText: { fontSize: 16, lineHeight: 18 },
  messageIconBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN_TINT, justifyContent: 'center', alignItems: 'center' },

  /* Footer */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 16, zIndex: 50,
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:-4},shadowOpacity:0.08,shadowRadius:16}, android:{elevation:8} }),
  },
  footerPrice:    { fontSize: 22, fontWeight: '800', color: INK, letterSpacing: -0.5 },
  footerPriceSub: { fontSize: 13, color: MUTED },
  viewDatesText:  { fontSize: 12, color: GREEN, fontWeight: '600', marginTop: 3 },
  footerBookBtn:        { backgroundColor: GREEN, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, ...Platform.select({ ios:{shadowColor:GREEN,shadowOffset:{width:0,height:3},shadowOpacity:0.2,shadowRadius:8}, android:{elevation:4} }) },
  footerBookBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Slide-up sheets (Trip Details / All Reviews) */
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  slideSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: SCREEN_H * 0.85,
    backgroundColor: BG, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS,
    paddingTop: 14, paddingHorizontal: 24,
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:-6},shadowOpacity:0.14,shadowRadius:20}, android:{elevation:24} }),
  },
  sheetHandleBar: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: HAIRLINE, marginBottom: 16 },
  slideSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  slideSheetTitle:  { fontSize: 19, fontWeight: '800', color: INK, letterSpacing: -0.3 },

  sheetSection:      { marginBottom: 26 },
  sheetSectionTitle: { fontSize: 14, fontWeight: '800', color: INK, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14 },

  inclRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  inclCheck:    { width: 20, height: 20, borderRadius: 10, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  exclX:        { width: 20, height: 20, borderRadius: 10, backgroundColor: '#d1ccc0', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  inclText:     { fontSize: 14.5, color: '#3A3530', flex: 1, lineHeight: 21 },

  policyRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  policyText:      { fontSize: 13.5, color: '#4A453D', flex: 1, lineHeight: 20 },
  policyTextBold:  { fontWeight: '700', color: INK },

  emergencyCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: '#fff', marginBottom: 10 },
  emergencyIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: GREEN_TINT, justifyContent: 'center', alignItems: 'center' },
  emergencyLabel:  { fontSize: 11, color: MUTED, fontWeight: '600', marginBottom: 2 },
  emergencyNum:    { fontSize: 14, fontWeight: '700', color: INK },
  emergencyAddr:   { fontSize: 11, color: '#aaa', marginTop: 2 },
  callBtn:         { backgroundColor: GREEN, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  callBtnText:     { color: '#fff', fontSize: 12, fontWeight: '700' },

  weatherStats:     { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  weatherStatItem:  { width: '33.33%', padding: 12 },
  weatherStatLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  weatherStatValue: { fontSize: 14, fontWeight: '700', color: INK },
  locationRow: {flexDirection: "row",alignItems: "flex-start",marginTop: 14}
});
