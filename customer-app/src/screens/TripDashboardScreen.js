import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const STATUS_CFG = {
  pending:   { bg: C.surfaceContainerLow, text: C.onSurfaceVariant, stripe: C.outline,  icon: 'clock-outline',        label: 'Pending',   tripLabel: 'Awaiting Confirmation' },
  confirmed: { bg: C.primary + '18',     text: C.primary,           stripe: C.primary,  icon: 'check-circle-outline', label: 'Confirmed', tripLabel: 'Upcoming'              },
  ongoing:   { bg: C.primary + '18',     text: C.primary,           stripe: C.primary,  icon: 'map-marker-path',      label: 'Ongoing',   tripLabel: 'In Progress'           },
  postponed: { bg: C.surfaceContainerLow, text: C.onSurfaceVariant, stripe: C.outline,  icon: 'calendar-clock',       label: 'Postponed', tripLabel: 'Rescheduled'           },
  completed: { bg: C.primary + '18',     text: C.primary,           stripe: C.primary,  icon: 'check-circle',         label: 'Completed', tripLabel: 'Completed'             },
  cancelled: { bg: C.error + '14',       text: C.error,             stripe: C.error,    icon: 'close-circle-outline', label: 'Cancelled', tripLabel: 'Cancelled'             },
};

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

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, icon, iconColor = C.primary, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.cardIconWrap, { backgroundColor: iconColor + '18' }]}>
          <MaterialCommunityIcons name={icon} size={19} color={iconColor} />
        </View>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
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

// ── Stat chip ─────────────────────────────────────────────────────────────────
function StatChip({ icon, value, label, color = C.primary }) {
  return (
    <View style={s.statChip}>
      <View style={[s.statChipIcon, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statChipVal}>{value}</Text>
      <Text style={s.statChipLbl}>{label}</Text>
    </View>
  );
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
    <View style={[s.chipItem, positive ? s.chipItemGreen : s.chipItemRed]}>
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
  const mapsLink     = exp.location?.googleMapsLink;
  const meetingPoint = exp.location?.meetingPoint;
  const canCancel    = ['pending', 'confirmed', 'postponed'].includes(booking?.status);
  const hasOperator  = exp.operatorInfo && Object.values(exp.operatorInfo).some(Boolean);
  const dateStr      = booking.endDate && booking.endDate !== booking.startDate
    ? `${booking.startDate}  →  ${booking.endDate}`
    : booking.startDate;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          {heroImg
            ? <Image source={{ uri: heroImg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primaryContainer }]} />
          }
          {/* Multi-stop gradient overlay */}
          <View style={s.heroGradientTop} />
          <View style={s.heroGradientBottom} />

          {/* Top bar */}
          <View style={s.heroTopBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={C.white} />
            </TouchableOpacity>
            <View style={s.heroBadge}>
              <MaterialCommunityIcons name="map-legend" size={12} color={C.white} />
              <Text style={s.heroBadgeText}>TRIP DASHBOARD</Text>
            </View>
          </View>

          {/* Bottom content */}
          <View style={s.heroBottom}>
            <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
              <MaterialCommunityIcons name={statusCfg.icon} size={12} color={statusCfg.text} />
              <Text style={[s.statusPillText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
            </View>
            <Text style={s.heroTitle} numberOfLines={2}>{exp.title || 'Adventure'}</Text>
            <View style={s.heroMetaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.75)" />
              <Text style={s.heroSub}>
                {[exp.location?.city, exp.location?.state, exp.location?.country].filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions Strip ──────────────────────────────────────────── */}
        <View style={s.quickActions}>
          <TouchableOpacity 
            style={s.quickBtn} 
            onPress={() => navigation.navigate('Chat', {
              bookingId: booking._id,
              hostName: exp.hostName,
              title: exp.title,
            })} 
            activeOpacity={0.8}
          >
            <View style={[s.quickBtnIcon, { backgroundColor: C.primary + '18' }]}>
              <MaterialCommunityIcons name="chat-processing-outline" size={20} color={C.primary} />
            </View>
            <Text style={s.quickBtnText}>Message Host</Text>
          </TouchableOpacity>
          {mapsLink && (
            <TouchableOpacity style={s.quickBtn} onPress={() => Linking.openURL(mapsLink)} activeOpacity={0.8}>
              <View style={[s.quickBtnIcon, { backgroundColor: C.primary + '18' }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={C.primary} />
              </View>
              <Text style={s.quickBtnText}>Directions</Text>
            </TouchableOpacity>
          )}
          {guideContact && (
            <TouchableOpacity style={s.quickBtn} onPress={() => Linking.openURL(`tel:${guideContact}`)} activeOpacity={0.8}>
              <View style={[s.quickBtnIcon, { backgroundColor: C.primary + '18' }]}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={C.primary} />
              </View>
              <Text style={s.quickBtnText}>Call Guide</Text>
            </TouchableOpacity>
          )}
          {emergContact && (
            <TouchableOpacity style={s.quickBtn} onPress={() => Linking.openURL(`tel:${emergContact}`)} activeOpacity={0.8}>
              <View style={[s.quickBtnIcon, { backgroundColor: C.error + '14' }]}>
                <MaterialCommunityIcons name="phone-alert-outline" size={20} color="#b91c1c" />
              </View>
              <Text style={s.quickBtnText}>Emergency</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.content}>

          {/* ── Booking Summary ──────────────────────────────────────────────── */}
          <View style={[s.card, s.summaryCard]}>
            {/* Status stripe */}
            <View style={[s.summaryStripe, { backgroundColor: statusCfg.stripe }]}>
              <MaterialCommunityIcons name={statusCfg.icon} size={14} color={C.white} />
              <Text style={s.summaryStripeText}>{statusCfg.label.toUpperCase()}</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.summaryStripeId}>#{shortId}</Text>
            </View>

            {/* 2×2 grid */}
            <View style={s.summaryGrid}>
              <View style={s.summaryCell}>
                <Text style={s.summaryCellLabel}>Trip Status</Text>
                <Text style={[s.summaryCellValue, { color: statusCfg.text }]}>{statusCfg.tripLabel}</Text>
              </View>
              <View style={[s.summaryCell, s.summaryCellRight]}>
                <Text style={s.summaryCellLabel}>Guests</Text>
                <Text style={s.summaryCellValue}>
                  {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                  {booking.children > 0 ? ` + ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}
                </Text>
              </View>
              <View style={[s.summaryCell, s.summaryCellTop]}>
                <Text style={s.summaryCellLabel}>Trip Date</Text>
                <Text style={s.summaryCellValue}>{dateStr}</Text>
              </View>
              <View style={[s.summaryCell, s.summaryCellRight, s.summaryCellTop]}>
                <Text style={s.summaryCellLabel}>Duration</Text>
                <Text style={s.summaryCellValue}>{exp.duration || '—'}</Text>
              </View>
            </View>

            {/* Paid row */}
            <View style={s.summaryPaidRow}>
              <MaterialCommunityIcons name="currency-inr" size={16} color={C.primary} />
              <Text style={s.summaryPaidLabel}>Total Paid</Text>
              <Text style={s.summaryPaidValue}>
                ₹{booking.totalPrice?.toLocaleString('en-IN') ?? '—'}
              </Text>
            </View>
          </View>

          {/* ── Meeting & Location ──────────────────────────────────────────── */}
          {(meetingPoint || mapsLink) && (
            <SectionCard title="Meeting & Location" icon="map-marker-radius-outline" iconColor={C.primary}>
              {meetingPoint && (
                <InfoRow icon="map-marker-outline" label="Meeting Point" value={meetingPoint} last={!mapsLink} />
              )}
              {mapsLink && (
                <TouchableOpacity style={s.mapsBtn} onPress={() => Linking.openURL(mapsLink)} activeOpacity={0.82}>
                  <MaterialCommunityIcons name="google-maps" size={20} color={C.white} />
                  <Text style={s.mapsBtnText}>Open in Google Maps</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              )}
            </SectionCard>
          )}

          {/* ── Operator & Contacts ─────────────────────────────────────────── */}
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

          {/* ── Weather ─────────────────────────────────────────────────────── */}
          {(weatherLoading || weather) && (
            <View style={[s.card, s.weatherCard]}>
              <View style={s.cardHeader}>
                <View style={[s.cardIconWrap, { backgroundColor: C.primary + '18' }]}>
                  <MaterialCommunityIcons name="weather-partly-cloudy" size={19} color={C.primary} />
                </View>
                <Text style={s.cardTitle}>Weather at Destination</Text>
                {weather && (
                  <View style={[s.suitBadge, { backgroundColor: SUITABILITY_BG[weather.suitability] }]}>
                    <Text style={[s.suitBadgeText, { color: SUITABILITY_COLOR[weather.suitability] }]}>
                      {weather.suitability}
                    </Text>
                  </View>
                )}
              </View>

              {weatherLoading ? (
                <View style={s.weatherLoading}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={s.weatherLoadingText}>Fetching live weather…</Text>
                </View>
              ) : weather && (
                <>
                  <View style={s.weatherMain}>
                    <View style={s.weatherLeft}>
                      {getWeatherIcon(weather.iconCode, 56)}
                      <View>
                        <Text style={s.weatherTemp}>{weather.temp}</Text>
                        <Text style={s.weatherFeels}>Feels {weather.feelsLike}</Text>
                      </View>
                    </View>
                    <View style={s.weatherRight}>
                      <Text style={s.weatherCond}>{weather.condition}</Text>
                    </View>
                  </View>

                  <View style={s.weatherStats}>
                    {[
                      { icon: 'water-percent',    val: weather.humidity,   lbl: 'Humidity'   },
                      { icon: 'weather-windy',    val: weather.windSpeed,  lbl: 'Wind'       },
                      { icon: 'umbrella-outline', val: weather.rainProb,   lbl: 'Rain'       },
                      { icon: 'eye-outline',      val: weather.visibility, lbl: 'Visibility' },
                    ].map(({ icon, val, lbl }) => (
                      <View key={lbl} style={s.weatherStat}>
                        <MaterialCommunityIcons name={icon} size={20} color={C.onSurfaceVariant} />
                        <Text style={s.weatherStatVal}>{val}</Text>
                        <Text style={s.weatherStatLbl}>{lbl}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* ── Must-Carry Essentials ────────────────────────────────────────── */}
          <SectionCard title="Must-Carry Essentials" icon="bag-personal-outline" iconColor={C.primary}>
            {essentials.length > 0 ? (
              <>
                <Text style={s.sectionNote}>Pack these before leaving for your adventure.</Text>
                {essentials.map((item, i) => (
                  <EssentialItem key={i} text={item} index={i} />
                ))}
              </>
            ) : (
              <View style={s.emptySection}>
                <MaterialCommunityIcons name="bag-personal-outline" size={28} color={C.outlineVariant} />
                <Text style={s.emptySectionText}>No checklist provided by the operator yet.</Text>
                <Text style={s.emptySectionSub}>Check back closer to your trip date.</Text>
              </View>
            )}
          </SectionCard>

          {/* ── Inclusions & Exclusions side-by-side ────────────────────────── */}
          {(exp.includes?.length > 0 || exp.exclusions?.length > 0) && (
            <View style={s.incExcRow}>
              {exp.includes?.length > 0 && (
                <View style={[s.incExcCard, { flex: exp.exclusions?.length > 0 ? 1 : 2 }]}>
                  <View style={s.incExcHeader}>
                    <MaterialCommunityIcons name="check-circle-outline" size={15} color={C.primary} />
                    <Text style={[s.incExcTitle, { color: C.primary }]}>Included</Text>
                  </View>
                  {exp.includes.map((item, i) => <ChipItem key={i} text={item} positive />)}
                </View>
              )}
              {exp.exclusions?.length > 0 && (
                <View style={[s.incExcCard, { flex: exp.includes?.length > 0 ? 1 : 2 }]}>
                  <View style={s.incExcHeader}>
                    <MaterialCommunityIcons name="close-circle-outline" size={15} color="#b91c1c" />
                    <Text style={[s.incExcTitle, { color: C.error }]}>Not Included</Text>
                  </View>
                  {exp.exclusions.map((item, i) => <ChipItem key={i} text={item} positive={false} />)}
                </View>
              )}
            </View>
          )}

          {/* ── Special Instructions ─────────────────────────────────────────── */}
          {booking.specialRequests?.trim() && (
            <SectionCard title="Special Instructions" icon="note-text-outline" iconColor={C.primary}>
              <View style={s.noteBox}>
                <MaterialCommunityIcons name="format-quote-open" size={22} color={C.outlineVariant} style={{ marginBottom: 4 }} />
                <Text style={s.noteText}>{booking.specialRequests}</Text>
              </View>
            </SectionCard>
          )}

          {/* ── Cancellation Policy ──────────────────────────────────────────── */}
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
                onPress={handleCancel}
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
  content:     { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  /* Hero */
  hero:             { height: 330, position: 'relative', overflow: 'hidden' },
  heroGradientTop:  { position: 'absolute', top: 0, left: 0, right: 0, height: 100, backgroundColor: 'transparent',
                      backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' },
  heroGradientBottom:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
                       backgroundColor: 'rgba(0,0,0,0.0)',
                       /* fallback for RN */ },
  heroTopBar:       { position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'center', alignItems: 'center' },
  heroBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.38)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  heroBadgeText:    { fontSize: 10, fontWeight: '800', color: C.white, letterSpacing: 1.2 },
  heroBottom:       { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20,
                      paddingBottom: 24, backgroundColor: 'rgba(0,0,0,0.0)',
                      backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' },
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, alignSelf: 'flex-start', marginBottom: 10 },
  statusPillText:   { fontSize: 11, fontWeight: '800' },
  heroTitle:        { fontSize: 26, fontWeight: '800', color: C.white, lineHeight: 32, marginBottom: 6, letterSpacing: -0.5,
                      textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroSub:          { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  /* Quick actions */
  quickActions: { flexDirection: 'row', backgroundColor: C.white, paddingVertical: 18, paddingHorizontal: 20, gap: 8, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30' },
  quickBtn:     { flex: 1, alignItems: 'center', gap: 6 },
  quickBtnIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickBtnText: { fontSize: 11, fontWeight: '700', color: C.onSurfaceVariant, textAlign: 'center' },

  /* Card */
  card:        { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  cardIconWrap:{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: C.onSurface, flex: 1, letterSpacing: -0.2 },

  /* Summary card */
  summaryCard:      { },
  summaryStripe:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  summaryStripeText:{ fontSize: 12, fontWeight: '800', color: C.white, letterSpacing: 1, flex: 1 },
  summaryStripeId:  { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.82)', letterSpacing: 0.5 },
  summaryGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 14 },
  summaryCell:      { width: '50%', paddingBottom: 14, paddingRight: 14 },
  summaryCellRight: { paddingRight: 0, paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: C.outlineVariant + '40' },
  summaryCellTop:   { borderTopWidth: 1, borderTopColor: C.outlineVariant + '40', paddingTop: 14 },
  summaryCellLabel: { fontSize: 10, color: C.outline, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  summaryCellValue: { fontSize: 13, fontWeight: '700', color: C.onSurface, lineHeight: 18 },
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
  mapsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primary, marginHorizontal: 16, marginBottom: 14, marginTop: 4, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16 },
  mapsBtnText: { fontSize: 14, fontWeight: '700', color: C.white, flex: 1 },

  /* Suitability badge in card header */
  suitBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, marginLeft: 'auto' },
  suitBadgeText: { fontSize: 11, fontWeight: '800' },

  /* Weather */
  weatherCard:      { },
  weatherLoading:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  weatherLoadingText:{ color: C.onSurfaceVariant, fontSize: 13 },
  weatherMain:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  weatherLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTemp:      { fontSize: 48, fontWeight: '700', color: C.onSurface, letterSpacing: -2 },
  weatherFeels:     { fontSize: 12, color: C.outline, marginTop: 2 },
  weatherRight:     { flex: 1, paddingLeft: 4 },
  weatherCond:      { fontSize: 15, fontWeight: '600', color: C.onSurface },
  weatherStats:     { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 16, backgroundColor: C.surfaceContainerLow, borderRadius: 14, paddingVertical: 14 },
  weatherStat:      { alignItems: 'center', gap: 4 },
  weatherStatVal:   { fontSize: 13, fontWeight: '700', color: C.onSurface },
  weatherStatLbl:   { fontSize: 10, color: C.outline, fontWeight: '600' },

  /* Essentials */
  sectionNote:     { fontSize: 12, color: C.outline, paddingHorizontal: 16, marginBottom: 10, fontStyle: 'italic' },
  emptySection:    { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4, gap: 6 },
  emptySectionText:{ fontSize: 14, color: C.onSurfaceVariant, fontWeight: '500', textAlign: 'center' },
  emptySectionSub: { fontSize: 12, color: C.outline, textAlign: 'center' },
  essentialItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30' },
  essentialNum:  { width: 26, height: 26, borderRadius: 8, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center' },
  essentialNumText:{ fontSize: 12, fontWeight: '800', color: C.primary },
  essentialText: { fontSize: 14, color: C.onSurface, flex: 1, lineHeight: 20 },

  /* Inclusions / Exclusions */
  incExcRow:    { flexDirection: 'row', gap: 10 },
  incExcCard:   { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', paddingBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  incExcHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30' },
  incExcTitle:  { fontSize: 13, fontWeight: '700' },
  chipItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingHorizontal: 14, paddingVertical: 7 },
  chipItemGreen:{ },
  chipItemRed:  { },
  chipItemText: { fontSize: 13, flex: 1, lineHeight: 18 },

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

  /* Stat chip (unused but kept for parity) */
  statChip:    { alignItems: 'center', gap: 4 },
  statChipIcon:{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statChipVal: { fontSize: 13, fontWeight: '700', color: C.onSurface },
  statChipLbl: { fontSize: 10, color: C.outline },
});
