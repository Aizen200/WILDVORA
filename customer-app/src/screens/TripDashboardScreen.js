import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { bookingAPI } from '../services/api';
import Alert from '../utils/alert';

const C = {
  primary:             '#1A5F45',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
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

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_CFG = {
  pending:   { bg: C.surfaceContainerLow, text: C.onSurfaceVariant, stripe: C.outline,  icon: 'clock-outline',        label: 'Pending',   tripLabel: 'Awaiting Confirmation' },
  confirmed: { bg: C.primary + '18',     text: C.primary,           stripe: C.primary,  icon: 'check-circle-outline', label: 'Confirmed', tripLabel: 'Upcoming'              },
  ongoing:   { bg: C.primary + '18',     text: C.primary,           stripe: C.primary,  icon: 'map-marker-path',      label: 'Ongoing',   tripLabel: 'In Progress'           },
  postponed: { bg: C.surfaceContainerLow, text: C.onSurfaceVariant, stripe: C.outline,  icon: 'calendar-clock',       label: 'Postponed', tripLabel: 'Rescheduled'           },
  completed: { bg: C.primary + '18',     text: C.primary,           stripe: C.primary,  icon: 'check-circle',         label: 'Completed', tripLabel: 'Completed'             },
  cancelled: { bg: C.error + '14',       text: C.error,             stripe: C.error,    icon: 'close-circle-outline', label: 'Cancelled', tripLabel: 'Cancelled'             },
};

const PAYMENT_LABELS = { card: 'Credit Card', apple_pay: 'Apple Pay', google_pay: 'Google Pay' };

const SUITABILITY_COLOR = { Good: C.primary, Moderate: C.onSurfaceVariant, 'Not Recommended': C.error };
const SUITABILITY_BG    = { Good: C.primary + '14', Moderate: C.surfaceContainerLow, 'Not Recommended': C.error + '12' };

const getWeatherIcon = (iconCode, size = 22) => {
  const code = iconCode?.slice(0, 2) || '01';
  const isNight = iconCode?.endsWith('n');
  const p = { size, color: C.onSurfaceVariant };
  switch (code) {
    case '01': return isNight
      ? <MaterialCommunityIcons name="weather-night"             {...p} />
      : <MaterialCommunityIcons name="weather-sunny"             {...p} />;
    case '02': return <MaterialCommunityIcons name="weather-partly-cloudy"   {...p} />;
    case '03':
    case '04': return <MaterialCommunityIcons name="weather-cloudy"          {...p} />;
    case '09': return <MaterialCommunityIcons name="weather-pouring"         {...p} />;
    case '10': return <MaterialCommunityIcons name="weather-rainy"           {...p} />;
    case '11': return <MaterialCommunityIcons name="weather-lightning-rainy" {...p} />;
    case '13': return <MaterialCommunityIcons name="weather-snowy"           {...p} />;
    case '50': return <MaterialCommunityIcons name="weather-fog"             {...p} />;
    default:   return <MaterialCommunityIcons name="weather-partly-cloudy"   {...p} />;
  }
};

// Trip start/end → "Adventure starts in X days" style countdown, derived from real booking dates.
const getCountdownInfo = (booking) => {
  if (!booking?.startDate || booking.status === 'cancelled') return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(booking.startDate); start.setHours(0, 0, 0, 0);
  const end   = booking.endDate ? new Date(booking.endDate) : new Date(start); end.setHours(0, 0, 0, 0);
  if (isNaN(start.getTime())) return null;

  if (booking.status === 'completed' || today > end) {
    return { text: 'Trip completed', icon: 'check-circle-outline' };
  }
  if (today >= start && today <= end) {
    return { text: 'Your adventure is happening now', icon: 'map-marker-path' };
  }
  const diffDays = Math.round((start - today) / 86400000);
  if (diffDays === 0) return { text: 'Adventure starts today!', icon: 'rocket-launch-outline' };
  if (diffDays === 1) return { text: 'Adventure starts tomorrow', icon: 'rocket-launch-outline' };
  return { text: `Adventure starts in ${diffDays} days`, icon: 'timer-sand' };
};

// Contextual packing/prep tip from real trip data — weather first, then difficulty, then checklist coverage.
const getSmartTip = ({ weather, difficulty, essentialsCount }) => {
  if (weather?.suitability === 'Not Recommended') {
    return { icon: 'alert-circle-outline', text: 'Conditions look tough right now — confirm with your host before heading out.' };
  }
  if (weather?.suitability === 'Moderate') {
    return { icon: 'umbrella-outline', text: 'Pack a light rain layer — conditions may shift during your trip.' };
  }
  if (['Hard', 'Difficult', 'Expert'].includes(difficulty)) {
    return { icon: 'arm-flex-outline', text: 'This is a challenging trip — rest well and stay hydrated before you start.' };
  }
  if (essentialsCount === 0) {
    return { icon: 'bag-personal-outline', text: 'Pack versatile layers and comfortable footwear — your host will share the full gear list soon.' };
  }
  return { icon: 'white-balance-sunny', text: 'Conditions look great — pack light and arrive a little early to settle in.' };
};

const formatShortDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
};

const formatLongDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `${WEEK[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, iconColor = C.primary, right, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.cardIconWrap, { backgroundColor: iconColor + '18' }]}>
          <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
        </View>
        <Text style={s.cardTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

// ── Group label (lightweight section grouping, e.g. "SUPPORT") ────────────────
function GroupLabel({ children }) {
  return <Text style={s.groupLabel}>{children}</Text>;
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, onPress, last }) {
  const content = (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoIconWrap}>
        <MaterialCommunityIcons name={icon} size={15} color={C.outline} />
      </View>
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value || '—'}</Text>
      </View>
      {onPress && (
        <View style={s.infoCallChip}>
          <MaterialCommunityIcons name="phone" size={13} color={C.primary} />
          <Text style={s.infoCallText}>Call</Text>
        </View>
      )}
    </View>
  );
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
    : content;
}

// ── Checklist item ────────────────────────────────────────────────────────────
function EssentialItem({ text, index }) {
  return (
    <View style={s.essentialItem}>
      <View style={s.essentialNum}>
        <Text style={s.essentialNumText}>{index + 1}</Text>
      </View>
      <Text style={s.essentialText}>{text}</Text>
    </View>
  );
}

// ── Chip list items (inclusions / exclusions) ─────────────────────────────────
function ChipItem({ text, positive }) {
  return (
    <View style={s.chipItem}>
      <MaterialCommunityIcons
        name={positive ? 'check' : 'close'}
        size={13}
        color={positive ? C.primary : C.error}
      />
      <Text style={[s.chipItemText, { color: positive ? C.primary : C.error }]}>{text}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function TripDashboardScreen({ route, navigation }) {
  const { bookingId } = route.params;

  const [booking,        setBooking]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [weather,        setWeather]        = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [cancelling,     setCancelling]     = useState(false);

  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
  const [showAllEssentials,  setShowAllEssentials]  = useState(false);
  const [showIncExc,         setShowIncExc]         = useState(false);

  useEffect(() => { fetchBooking(); }, []);

  const fetchBooking = async () => {
    try {
      const res = await bookingAPI.getOne(bookingId);
      const b   = res.data.booking;
      setBooking(b);
      if (b.experience?.location) fetchWeather(b.experience.location);
    } catch {
      Alert.alert('Error', 'Could not load booking details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (location) => {
    const WEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    if (!WEATHER_KEY) return;
    const city    = location.city    || '';
    const state   = location.state   || '';
    const country = location.country || 'India';
    const CODES   = { 'India':'IN','Nepal':'NP','Bhutan':'BT','Sri Lanka':'LK','Maldives':'MV','Bangladesh':'BD' };
    const cc      = CODES[country] ?? (country.length <= 3 ? country.toUpperCase() : 'IN');
    try {
      setWeatherLoading(true);
      let lat = null, lon = null;
      try {
        const geoQ   = encodeURIComponent([city, state, country].filter(Boolean).join(', '));
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${geoQ}&format=json&limit=1`, { headers: { 'User-Agent': 'WildvoraApp/1.0' } });
        const geoData = await geoRes.json();
        if (geoData?.length > 0) { lat = parseFloat(geoData[0].lat); lon = parseFloat(geoData[0].lon); }
      } catch { /* city fallback */ }

      const base  = 'https://api.openweathermap.org/data/2.5';
      const coord = lat !== null ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(city ? `${city},${cc}` : cc)}`;
      const [wRes, fRes] = await Promise.all([
        fetch(`${base}/weather?${coord}&appid=${WEATHER_KEY}&units=metric`),
        fetch(`${base}/forecast?${coord}&appid=${WEATHER_KEY}&units=metric&cnt=4`),
      ]);
      const [w, f] = await Promise.all([wRes.json(), fRes.json()]);
      if (w.cod !== 200) throw new Error('Weather unavailable');

      const windKmh  = Math.round((w.wind?.speed || 0) * 3.6);
      const visKm    = ((w.visibility || 10000) / 1000).toFixed(1);
      const tempC    = Math.round(w.main?.temp       || 20);
      const feelsC   = Math.round(w.main?.feels_like || tempC);
      const humidity = w.main?.humidity || 0;
      const iconCode = w.weather?.[0]?.icon        || '01d';
      const condMain = w.weather?.[0]?.main        || 'Clear';
      const condDesc = w.weather?.[0]?.description || 'clear sky';
      const rainPct  = Math.round((f.list?.[0]?.pop ?? 0) * 100);
      const isRainy  = ['Rain','Drizzle','Thunderstorm','Snow'].includes(condMain);

      let suitability = 'Good';
      if (condMain === 'Thunderstorm' || windKmh > 50 || (isRainy && rainPct > 70)) suitability = 'Not Recommended';
      else if (['Rain','Drizzle'].includes(condMain) || windKmh > 30 || rainPct > 70 || parseFloat(visKm) < 3) suitability = 'Moderate';

      setWeather({ temp:`${tempC}°C`, feelsLike:`${feelsC}°C`, humidity:`${humidity}%`,
        condition: condDesc.charAt(0).toUpperCase() + condDesc.slice(1),
        iconCode, rainProb:`${rainPct}%`, windSpeed:`${windKmh} km/h`, visibility:`${visKm} km`, suitability });
    } catch { /* skip */ }
    finally { setWeatherLoading(false); }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await bookingAPI.cancel(bookingId);
              Alert.alert('Cancelled', 'Your booking has been successfully cancelled.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not cancel booking. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const toggleWeatherDetails = () => { Haptics.selectionAsync(); setShowWeatherDetails(v => !v); };
  const toggleEssentials     = () => { Haptics.selectionAsync(); setShowAllEssentials(v => !v); };
  const toggleIncExc         = () => { Haptics.selectionAsync(); setShowIncExc(v => !v); };
  const handleQuickAction    = (fn) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fn(); };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.loadingText}>Loading trip details…</Text>
      </SafeAreaView>
    );
  }

  const exp          = booking?.experience || {};
  const statusCfg    = STATUS_CFG[booking?.status] || STATUS_CFG.confirmed;
  const shortId      = booking?._id?.toString().slice(-8).toUpperCase() ?? '—';
  const heroImg      = exp.coverImage || exp.adventureImages?.[0] || exp.images?.[0];
  const essentials   = (exp.safetyChecklist?.length ? exp.safetyChecklist : exp.requirements) || [];
  const guideContact = exp.safetyInfo?.emergencyContact;
  const emergContact = exp.emergencyInfo?.contact;
  const mapsLink      = exp.location?.googleMapsLink;
  const meetingPoint  = exp.location?.meetingPoint;
  const canCancel     = ['pending', 'confirmed', 'postponed'].includes(booking?.status);
  const hasOperator   = exp.operatorInfo && Object.values(exp.operatorInfo).some(Boolean);
  const dateStr       = booking.endDate && booking.endDate !== booking.startDate
    ? `${booking.startDate}  →  ${booking.endDate}`
    : booking.startDate;
  const heroDateStr   = booking.endDate && booking.endDate !== booking.startDate
    ? `${formatShortDate(booking.startDate)} – ${formatShortDate(booking.endDate)}`
    : formatShortDate(booking.startDate);
  const locationStr   = [exp.location?.city, exp.location?.state, exp.location?.country].filter(Boolean).join(', ');

  const countdown      = getCountdownInfo(booking);
  const smartTip        = getSmartTip({ weather, difficulty: exp.difficulty, essentialsCount: essentials.length });
  const visibleEssentials = showAllEssentials ? essentials : essentials.slice(0, 3);
  const hiddenEssentialsCount = Math.max(essentials.length - 3, 0);
  const paymentLabel    = PAYMENT_LABELS[booking.paymentMethod] || booking.paymentMethod || '—';
  const paymentStatus   = booking.paymentStatus
    ? booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)
    : null;
  const hasIncExc       = exp.includes?.length > 0 || exp.exclusions?.length > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          {heroImg
            ? <Image source={{ uri: heroImg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primaryContainer }]} />
          }
          <View style={s.heroGradientTop} />

          {/* Top bar */}
          <View style={s.heroTopBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={C.white} />
            </TouchableOpacity>
            <View style={[s.statusPill, { backgroundColor: 'rgba(0,0,0,0.38)' }]}>
              <MaterialCommunityIcons name={statusCfg.icon} size={12} color={C.white} />
              <Text style={[s.statusPillText, { color: C.white }]}>{statusCfg.label}</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={s.heroBottom}>
            {countdown && (
              <View style={s.countdownPill}>
                <MaterialCommunityIcons name={countdown.icon} size={13} color={C.white} />
                <Text style={s.countdownText}>{countdown.text}</Text>
              </View>
            )}
            <Text style={s.heroTitle} numberOfLines={2}>{exp.title || 'Adventure'}</Text>
            <View style={s.heroMetaRow}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={s.heroSub}>{heroDateStr}</Text>
              {!!locationStr && (
                <>
                  <View style={s.heroMetaDot} />
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={s.heroSub} numberOfLines={1}>{locationStr}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={s.content}>

          {/* ── Quick Actions ─────────────────────────────────────────────── */}
          <View style={s.quickActionsCard}>
            <TouchableOpacity
              style={s.quickBtn}
              onPress={() => handleQuickAction(() => navigation.navigate('Chat', {
                bookingId: booking._id,
                hostName: exp.hostName,
                title: exp.title,
              }))}
              activeOpacity={0.8}
            >
              <View style={[s.quickBtnIcon, { backgroundColor: C.primary + '18' }]}>
                <MaterialCommunityIcons name="chat-processing-outline" size={20} color={C.primary} />
              </View>
              <Text style={s.quickBtnText}>Message Host</Text>
            </TouchableOpacity>
            {mapsLink && (
              <TouchableOpacity style={s.quickBtn} onPress={() => handleQuickAction(() => Linking.openURL(mapsLink))} activeOpacity={0.8}>
                <View style={[s.quickBtnIcon, { backgroundColor: C.primary + '18' }]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color={C.primary} />
                </View>
                <Text style={s.quickBtnText}>Directions</Text>
              </TouchableOpacity>
            )}
            {guideContact && (
              <TouchableOpacity style={s.quickBtn} onPress={() => handleQuickAction(() => Linking.openURL(`tel:${guideContact}`))} activeOpacity={0.8}>
                <View style={[s.quickBtnIcon, { backgroundColor: C.primary + '18' }]}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={C.primary} />
                </View>
                <Text style={s.quickBtnText}>Call Guide</Text>
              </TouchableOpacity>
            )}
            {emergContact && (
              <TouchableOpacity style={s.quickBtn} onPress={() => handleQuickAction(() => Linking.openURL(`tel:${emergContact}`))} activeOpacity={0.8}>
                <View style={[s.quickBtnIcon, { backgroundColor: C.error + '14' }]}>
                  <MaterialCommunityIcons name="phone-alert-outline" size={20} color="#b91c1c" />
                </View>
                <Text style={s.quickBtnText}>Emergency</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Trip Essentials ──────────────────────────────────────────────── */}
          <SectionCard title="Trip Essentials" icon="compass-outline" iconColor={C.primary}>
            {/* Weather summary row (tap to expand) */}
            {(weatherLoading || weather) && (
              <TouchableOpacity
                style={[s.infoRow, s.infoRowBorder]}
                onPress={weather ? toggleWeatherDetails : undefined}
                activeOpacity={weather ? 0.7 : 1}
              >
                <View style={s.infoIconWrap}>
                  {weatherLoading
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : getWeatherIcon(weather.iconCode, 16)}
                </View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Weather</Text>
                  <Text style={s.infoValue}>
                    {weatherLoading ? 'Checking conditions…' : `${weather.temp} · ${weather.condition}`}
                  </Text>
                </View>
                {weather && (
                  <View style={s.weatherRowRight}>
                    <View style={[s.suitBadgeSmall, { backgroundColor: SUITABILITY_BG[weather.suitability] }]}>
                      <Text style={[s.suitBadgeSmallText, { color: SUITABILITY_COLOR[weather.suitability] }]}>
                        {weather.suitability}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={showWeatherDetails ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={C.outline}
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}

            {showWeatherDetails && weather && (
              <Animated.View
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(150)}
                layout={LinearTransition.springify().damping(18)}
                style={s.weatherExpanded}
              >
                <View style={s.weatherStats}>
                  {[
                    { icon: 'water-percent',    val: weather.humidity,   lbl: 'Humidity'   },
                    { icon: 'weather-windy',    val: weather.windSpeed,  lbl: 'Wind'       },
                    { icon: 'umbrella-outline', val: weather.rainProb,   lbl: 'Rain'       },
                    { icon: 'eye-outline',      val: weather.visibility, lbl: 'Visibility' },
                  ].map(({ icon, val, lbl }) => (
                    <View key={lbl} style={s.weatherStat}>
                      <MaterialCommunityIcons name={icon} size={18} color={C.onSurfaceVariant} />
                      <Text style={s.weatherStatVal}>{val}</Text>
                      <Text style={s.weatherStatLbl}>{lbl}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {meetingPoint && (
              <InfoRow icon="map-marker-radius-outline" label="Meeting Point" value={meetingPoint} />
            )}

            <InfoRow icon="calendar-arrow-right" label="Departure" value={formatLongDate(booking.startDate)} />

            {mapsLink && (
              <TouchableOpacity style={s.mapsBtn} onPress={() => Linking.openURL(mapsLink)} activeOpacity={0.82}>
                <MaterialCommunityIcons name="google-maps" size={20} color={C.white} />
                <Text style={s.mapsBtnText}>Open in Google Maps</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}

            <View style={s.tipBox}>
              <View style={s.tipIconWrap}>
                <MaterialCommunityIcons name={smartTip.icon} size={16} color={C.secondary} />
              </View>
              <Text style={s.tipText}>{smartTip.text}</Text>
            </View>
          </SectionCard>

          {/* ── Packing Checklist ────────────────────────────────────────────── */}
          <SectionCard title="Packing Checklist" icon="bag-personal-outline" iconColor={C.primary}>
            {essentials.length > 0 ? (
              <Animated.View layout={LinearTransition.springify().damping(18)}>
                {visibleEssentials.map((item, i) => (
                  <EssentialItem key={i} text={item} index={i} />
                ))}
                {hiddenEssentialsCount > 0 && (
                  <TouchableOpacity style={s.viewMoreBtn} onPress={toggleEssentials} activeOpacity={0.7}>
                    <Text style={s.viewMoreText}>
                      {showAllEssentials ? 'Show Less' : `View Full Checklist (${hiddenEssentialsCount} more)`}
                    </Text>
                    <MaterialCommunityIcons
                      name={showAllEssentials ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={C.primary}
                    />
                  </TouchableOpacity>
                )}
              </Animated.View>
            ) : (
              <View style={s.emptySection}>
                <MaterialCommunityIcons name="bag-personal-outline" size={28} color={C.outlineVariant} />
                <Text style={s.emptySectionText}>No checklist provided by the operator yet.</Text>
                <Text style={s.emptySectionSub}>Check back closer to your trip date.</Text>
              </View>
            )}
          </SectionCard>

          {/* ── Booking Details ──────────────────────────────────────────────── */}
          <SectionCard title="Booking Details" icon="ticket-confirmation-outline" iconColor={C.primary}>
            <InfoRow icon="pound" label="Booking ID" value={`#${shortId}`} />
            <InfoRow
              icon="account-group-outline"
              label="Guests"
              value={`${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${booking.children > 0 ? ` + ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}`}
            />
            <InfoRow icon="timer-outline" label="Duration" value={exp.duration || '—'} />
            <InfoRow
              icon="credit-card-outline"
              label="Payment"
              value={paymentStatus ? `${paymentLabel} · ${paymentStatus}` : paymentLabel}
              last
            />
            <View style={s.summaryPaidRow}>
              <MaterialCommunityIcons name="currency-inr" size={16} color={C.primary} />
              <Text style={s.summaryPaidLabel}>Total Paid</Text>
              <Text style={s.summaryPaidValue}>
                ₹{booking.totalPrice?.toLocaleString('en-IN') ?? '—'}
              </Text>
            </View>
          </SectionCard>

          {/* ── Special Instructions ─────────────────────────────────────────── */}
          {booking.specialRequests?.trim() && (
            <SectionCard title="Special Instructions" icon="note-text-outline" iconColor={C.primary}>
              <View style={s.noteBox}>
                <MaterialCommunityIcons name="format-quote-open" size={22} color={C.outlineVariant} style={{ marginBottom: 4 }} />
                <Text style={s.noteText}>{booking.specialRequests}</Text>
              </View>
            </SectionCard>
          )}

          {/* ── Included / Not Included ──────────────────────────────────────── */}
          {hasIncExc && (
            <SectionCard
              title="What's Included"
              icon="format-list-checks"
              iconColor={C.primary}
              right={
                <TouchableOpacity style={s.detailsToggle} onPress={toggleIncExc} activeOpacity={0.7}>
                  <Text style={s.detailsToggleText}>{showIncExc ? 'Hide' : 'View Details'}</Text>
                  <MaterialCommunityIcons
                    name={showIncExc ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={C.primary}
                  />
                </TouchableOpacity>
              }
            >
              <View style={s.incExcSummaryRow}>
                {exp.includes?.length > 0 && (
                  <View style={s.incExcSummaryChip}>
                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={C.primary} />
                    <Text style={[s.incExcSummaryText, { color: C.primary }]}>{exp.includes.length} included</Text>
                  </View>
                )}
                {exp.exclusions?.length > 0 && (
                  <View style={s.incExcSummaryChip}>
                    <MaterialCommunityIcons name="close-circle-outline" size={14} color={C.error} />
                    <Text style={[s.incExcSummaryText, { color: C.error }]}>{exp.exclusions.length} not included</Text>
                  </View>
                )}
              </View>

              {showIncExc && (
                <Animated.View
                  entering={FadeIn.duration(220)}
                  exiting={FadeOut.duration(150)}
                  layout={LinearTransition.springify().damping(18)}
                  style={s.incExcExpanded}
                >
                  {exp.includes?.length > 0 && (
                    <View style={s.incExcCol}>
                      <Text style={[s.incExcColTitle, { color: C.primary }]}>Included</Text>
                      {exp.includes.map((item, i) => <ChipItem key={i} text={item} positive />)}
                    </View>
                  )}
                  {exp.exclusions?.length > 0 && (
                    <View style={s.incExcCol}>
                      <Text style={[s.incExcColTitle, { color: C.error }]}>Not Included</Text>
                      {exp.exclusions.map((item, i) => <ChipItem key={i} text={item} positive={false} />)}
                    </View>
                  )}
                </Animated.View>
              )}
            </SectionCard>
          )}

          {/* ── Support ───────────────────────────────────────────────────────── */}
          <GroupLabel>Support</GroupLabel>

          <SectionCard title="Operator & Contacts" icon="account-tie-outline" iconColor={C.primary}>
            <InfoRow icon="office-building-outline" label="Operator / Host" value={exp.hostName || '—'} last={!hasOperator && !guideContact && !emergContact} />
            {hasOperator && <>
              {exp.operatorInfo.yearsOfOperation
                ? <InfoRow icon="history" label="Years in Operation" value={`${exp.operatorInfo.yearsOfOperation} yrs`} />
                : null}
              {exp.operatorInfo.guideCertifications
                ? <InfoRow icon="certificate-outline" label="Guide Certifications" value={exp.operatorInfo.guideCertifications} />
                : null}
              {exp.operatorInfo.tourismRegistration
                ? <InfoRow icon="file-document-outline" label="Tourism Registration" value={exp.operatorInfo.tourismRegistration} />
                : null}
            </>}
            {guideContact && (
              <InfoRow
                icon="phone-outline" label="Guide Contact" value={guideContact}
                onPress={() => Linking.openURL(`tel:${guideContact}`)}
              />
            )}
            {emergContact && (
              <InfoRow
                icon="phone-alert-outline" label="Emergency Contact" value={emergContact}
                onPress={() => Linking.openURL(`tel:${emergContact}`)}
                last
              />
            )}
          </SectionCard>

          {exp.cancellationPolicy && (
            <SectionCard title="Cancellation Policy" icon="shield-alert-outline" iconColor={C.error}>
              <View style={s.policyBox}>
                <Text style={s.policyText}>{exp.cancellationPolicy}</Text>
              </View>
            </SectionCard>
          )}

          {/* ── Cancel Booking ───────────────────────────────────────────────── */}
          {canCancel && (
            <View style={s.cancelZone}>
              <View style={s.cancelZoneHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={C.error} />
                <Text style={s.cancelZoneTitle}>Need to cancel?</Text>
              </View>
              <Text style={s.cancelZoneDesc}>
                Cancellations are processed according to the policy above. A refund will be issued if eligible.
              </Text>
              <TouchableOpacity
                style={[s.cancelBtn, cancelling && { opacity: 0.6 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCancel(); }}
                disabled={cancelling}
                activeOpacity={0.82}
              >
                {cancelling
                  ? <ActivityIndicator size="small" color={C.error} />
                  : <>
                      <MaterialCommunityIcons name="calendar-remove-outline" size={17} color={C.error} />
                      <Text style={s.cancelBtnText}>Cancel This Booking</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.background },
  loadingText: { marginTop: 12, color: C.onSurfaceVariant, fontSize: 14 },
  content:     { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  /* Hero */
  hero:             { height: 290, position: 'relative', overflow: 'hidden' },
  heroGradientTop:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.0)' },
  heroTopBar:       { position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  heroBottom:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 22,
                      backgroundColor: 'rgba(0,0,0,0.42)' },
  countdownPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)',
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, alignSelf: 'flex-start', marginBottom: 10 },
  countdownText:    { fontSize: 12, fontWeight: '800', color: C.white, letterSpacing: 0.2 },
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  statusPillText:   { fontSize: 11, fontWeight: '800' },
  heroTitle:        { fontSize: 25, fontWeight: '800', color: C.white, lineHeight: 31, marginBottom: 8, letterSpacing: -0.5,
                      textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  heroSub:          { fontSize: 12.5, color: 'rgba(255,255,255,0.88)', fontWeight: '600' },
  heroMetaDot:      { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 2 },

  /* Quick actions */
  quickActionsCard: { flexDirection: 'row', backgroundColor: C.white, borderRadius: 18, borderWidth: 1,
                      borderColor: C.outlineVariant + '40', paddingVertical: 16, paddingHorizontal: 10, gap: 4,
                      justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  quickBtn:     { flex: 1, alignItems: 'center', gap: 6 },
  quickBtnIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickBtnText: { fontSize: 10.5, fontWeight: '700', color: C.onSurfaceVariant, textAlign: 'center' },

  /* Group label */
  groupLabel: { fontSize: 11, fontWeight: '800', color: C.outline, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2, marginBottom: -4, marginLeft: 4 },

  /* Card */
  card:        { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  cardIconWrap:{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: C.onSurface, flex: 1, letterSpacing: -0.2 },

  /* Booking details / paid row */
  summaryPaidRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 16, marginTop: 4, backgroundColor: C.primary + '0C', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  summaryPaidLabel: { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '600', flex: 1 },
  summaryPaidValue: { fontSize: 18, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },

  /* Info rows */
  infoRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '35' },
  infoIconWrap:  { width: 28, height: 28, borderRadius: 8, backgroundColor: C.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  infoContent:   { flex: 1 },
  infoLabel:     { fontSize: 10, color: C.outline, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  infoValue:     { fontSize: 14, color: C.onSurface, lineHeight: 19 },
  infoCallChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary + '14', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  infoCallText:  { fontSize: 12, fontWeight: '700', color: C.primary },

  /* Maps button */
  mapsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primary, marginHorizontal: 16, marginBottom: 14, marginTop: 14, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16 },
  mapsBtnText: { fontSize: 14, fontWeight: '700', color: C.white, flex: 1 },

  /* Weather (compact row + expandable) */
  weatherRowRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suitBadgeSmall:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  suitBadgeSmallText:{ fontSize: 10.5, fontWeight: '800' },
  weatherExpanded:   { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '35' },
  weatherStats:      { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.surfaceContainerLow, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  weatherStat:       { alignItems: 'center', gap: 4 },
  weatherStatVal:    { fontSize: 13, fontWeight: '700', color: C.onSurface },
  weatherStatLbl:    { fontSize: 10, color: C.outline, fontWeight: '600' },

  /* Smart tip */
  tipBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.secondary + '0C',
                marginHorizontal: 16, marginBottom: 16, marginTop: 4, borderRadius: 12, padding: 12 },
  tipIconWrap:{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.secondary + '16', justifyContent: 'center', alignItems: 'center' },
  tipText:    { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19, flex: 1, paddingTop: 4 },

  /* Essentials */
  emptySection:    { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4, gap: 6 },
  emptySectionText:{ fontSize: 14, color: C.onSurfaceVariant, fontWeight: '500', textAlign: 'center' },
  emptySectionSub: { fontSize: 12, color: C.outline, textAlign: 'center' },
  essentialItem:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30' },
  essentialNum:    { width: 26, height: 26, borderRadius: 8, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center' },
  essentialNumText:{ fontSize: 12, fontWeight: '800', color: C.primary },
  essentialText:   { fontSize: 14, color: C.onSurface, flex: 1, lineHeight: 20 },
  viewMoreBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },
  viewMoreText:    { fontSize: 13, fontWeight: '700', color: C.primary },

  /* Inclusions / Exclusions */
  detailsToggle:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsToggleText: { fontSize: 12, fontWeight: '700', color: C.primary },
  incExcSummaryRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  incExcSummaryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceContainerLow, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 7 },
  incExcSummaryText: { fontSize: 12, fontWeight: '700' },
  incExcExpanded:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: C.outlineVariant + '30', paddingTop: 14 },
  incExcCol:         { flex: 1, gap: 2 },
  incExcColTitle:    { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  chipItem:          { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingVertical: 5 },
  chipItemText:      { fontSize: 12.5, flex: 1, lineHeight: 17 },

  /* Note / policy */
  noteBox:   { paddingHorizontal: 16, paddingBottom: 16 },
  noteText:  { fontSize: 14, color: C.onSurface, lineHeight: 22 },
  policyBox: { paddingHorizontal: 16, paddingBottom: 16 },
  policyText:{ fontSize: 14, color: C.onSurfaceVariant, lineHeight: 22 },

  /* Cancel zone */
  cancelZone:       { backgroundColor: C.error + '0A', borderRadius: 16, borderWidth: 1.5, borderColor: C.error + '30', padding: 16 },
  cancelZoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cancelZoneTitle:  { fontSize: 15, fontWeight: '700', color: C.error },
  cancelZoneDesc:   { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20, marginBottom: 16 },
  cancelBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.error, borderRadius: 12, paddingVertical: 13 },
  cancelBtnText:    { fontSize: 14, fontWeight: '700', color: C.error },
});
