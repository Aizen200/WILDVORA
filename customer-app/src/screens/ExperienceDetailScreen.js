import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, StatusBar, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import Alert from '../utils/alert';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import AuthPromptSheet from '../components/AuthPromptSheet';

const HERO_FALLBACK = require('../../assets/heroimage.png');

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

const DIFFICULTY_CFG = {
  Easy:     { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  Moderate: { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  Difficult:{ color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  Hard:     { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  Expert:   { color: '#7C3AED', bg: '#f5f3ff', border: '#ddd6fe' },
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={styles.accordionHeaderLeft}>
          {icon}
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#aaa" />
      </TouchableOpacity>
      {open && <View style={styles.accordionBody}>{children}</View>}
    </View>
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1A5F45" /></View>;
  if (!experience) return null;

  const actualImage   = experience.coverImage || experience.images?.[0];
  const hostAvatarUrl = experience.host?.avatar || null;
  const diffCfg       = DIFFICULTY_CFG[experience.difficulty] || DIFFICULTY_CFG.Moderate;
  const suitColor     = weatherData ? SUITABILITY_COLOR[weatherData.suitability] : '#15803d';

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Ionicons key={i} name={i < Math.floor(rating) ? 'star' : 'star-outline'} size={13} color="#1A5F45" style={{ marginRight: 1 }} />
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

  // Highlights: always-visible key facts (max 3)
  const highlights = [
    experience.duration     && { icon: 'time-outline',         label: 'Duration',   value: experience.duration },
    experience.maxGroupSize && { icon: 'people-outline',       label: 'Group size', value: `Up to ${experience.maxGroupSize}` },
    experience.difficulty   && { icon: 'bar-chart-outline',    label: 'Level',      value: experience.difficulty },
  ].filter(Boolean).slice(0, 3);

  const hasMeals = experience.includes?.some(i => /meal|food|breakfast|lunch|dinner/i.test(i));
  const hasGear  = experience.includes?.some(i => /gear|equipment/i.test(i));

  const btnTop = insets.top + 12;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating nav buttons */}
      <View style={[styles.headerControls, { top: btnTop }]}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()} activeOpacity={0.85} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="arrow-back" size={20} color="#1A5F45" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} onPress={handleWishlist} activeOpacity={0.85} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={20} color={inWishlist ? '#ba1a1a' : '#1A5F45'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>

        {/* ── Hero ── */}
        <View style={styles.heroImage}>
          <Image source={HERO_FALLBACK} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {!heroImgError && !!actualImage && (
            <Image source={{ uri: actualImage }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setHeroImgError(true)} />
          )}
        </View>

        <View style={styles.body}>

          {/* Category tag */}
          {experience.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{experience.category}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{experience.title}</Text>

          {/* Rating + location */}
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#1A5F45" />
            <Text style={styles.metaRating}>{experience.rating || '4.9'}</Text>
            <Text style={styles.metaReviews}>({experience.reviewCount || '0'} reviews)</Text>
            <View style={styles.metaSep} />
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.metaLocation}>{experience.location?.city}, {experience.location?.country}</Text>
          </View>

          {/* ── Highlights strip (always visible) ── */}
          {highlights.length > 0 && (
            <View style={styles.highlightsRow}>
              {highlights.map(({ icon, label, value }, idx) => (
                <View key={idx} style={[styles.highlightCard, idx < highlights.length - 1 && { marginRight: 10 }]}>
                  <Ionicons name={icon} size={20} color="#1A5F45" />
                  <Text style={styles.highlightValue}>{value}</Text>
                  <Text style={styles.highlightLabel}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Host card ── */}
          <View style={styles.hostCard}>
            {/* Top row: avatar + info + action button */}
            <View style={styles.hostCardRow}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                onPress={() => experience.host?._id && navigation.navigate('OperatorProfile', { hostId: experience.host._id })}
                activeOpacity={0.75}
              >
              {hostAvatarUrl
                ? <Image source={{ uri: hostAvatarUrl }} style={styles.avatar} />
                : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{getInitials(experience.hostName)}</Text></View>
              }
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName}>{experience.hostName || 'Wildvora Host'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  {experience.hostVerified && (
                    <>
                      <MaterialIcons name="verified" size={12} color="#1A5F45" />
                      <Text style={styles.hostVerifiedText}>Verified Host</Text>
                      <Text style={styles.hostStatSep}>·</Text>
                    </>
                  )}
                  <MaterialCommunityIcons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.hostStatText}>{experience.rating || '4.9'}</Text>
                </View>
                {experience.hostExperiencesCount > 0 && (
                  <Text style={styles.hostExpCount}>
                    {experience.hostExperiencesCount} trip{experience.hostExperiencesCount !== 1 ? 's' : ''} hosted
                  </Text>
                )}
              </View>
              </TouchableOpacity>
              {bookingId ? (
                <TouchableOpacity
                  style={styles.askHostBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Chat', {
                    bookingId,
                    hostName: experience.hostName,
                    title: experience.title,
                  })}
                >
                  <MaterialCommunityIcons name="chat-processing-outline" size={13} color="#1A5F45" />
                  <Text style={styles.askHostBtnText}>Message</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.askHostBtn}
                  activeOpacity={0.8}
                  onPress={requireAuth(() => navigation.navigate('InquiryChat', {
                    experienceId: experience._id,
                    hostName: experience.hostName,
                    experienceTitle: experience.title,
                  }))}
                >
                  <MaterialCommunityIcons name="chat-question-outline" size={13} color="#1A5F45" />
                  <Text style={styles.askHostBtnText}>Ask Host</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Lock notice — only shown pre-booking */}
            {!bookingId && (
              <View style={styles.hostLockRow}>
                <MaterialCommunityIcons name="lock-outline" size={12} color="#b45309" />
                <Text style={styles.hostLockText}>
                  Direct contact details are shared after a confirmed booking.
                </Text>
              </View>
            )}
          </View>

          {/* ── Description ── */}
          <Text style={styles.description} numberOfLines={readMore ? undefined : 3}>
            {experience.description}
          </Text>
          <TouchableOpacity onPress={() => setReadMore(!readMore)} style={styles.readMoreBtn} activeOpacity={0.7}>
            <Text style={styles.readMoreText}>{readMore ? 'Show less' : 'Show more'}</Text>
            <Ionicons name={readMore ? 'chevron-up' : 'chevron-down'} size={13} color="#1A5F45" />
          </TouchableOpacity>

          {/* ── What's included (always visible) ── */}
          {(experience.includes?.length > 0 || experience.exclusions?.length > 0) && (
            <View style={styles.includedSection}>
              <Text style={styles.sectionHeading}>What's included</Text>
              {experience.includes?.map((item, idx) => (
                <View key={idx} style={styles.inclRow}>
                  <View style={styles.inclCheckCircle}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  </View>
                  <Text style={styles.inclText}>{item}</Text>
                </View>
              ))}
              {experience.exclusions?.length > 0 && (
                <>
                  <Text style={[styles.inclSubLabel, { marginTop: 14 }]}>Not included</Text>
                  {experience.exclusions.map((item, idx) => (
                    <View key={idx} style={styles.inclRow}>
                      <View style={styles.exclXCircle}>
                        <Ionicons name="close" size={11} color="#fff" />
                      </View>
                      <Text style={[styles.inclText, { color: '#666' }]}>{item}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* ── Must Carry Essentials (always visible, prominent) ── */}
          {experience.requirements?.length > 0 && (
            <View style={styles.essentialsCard}>
              <View style={styles.essentialsTitleRow}>
                <MaterialCommunityIcons name="bag-personal-outline" size={18} color="#1A5F45" />
                <Text style={styles.essentialsTitle}>Must Carry Essentials</Text>
                <View style={styles.essentialsBadge}>
                  <Text style={styles.essentialsBadgeText}>{experience.requirements.length} items</Text>
                </View>
              </View>
              <Text style={styles.essentialsSubtitle}>Pack these before heading out</Text>
              <View style={styles.essentialsGrid}>
                {experience.requirements.map((item, idx) => (
                  <View key={idx} style={styles.essentialItem}>
                    <View style={styles.essentialCheck}>
                      <Ionicons name="checkmark" size={11} color="#1A5F45" />
                    </View>
                    <Text style={styles.essentialItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Available dates (always visible) ── */}
          <View style={styles.datesSection}>
            <Text style={styles.sectionHeading}>Available dates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {availDates.map((ds, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.dateChip}
                  onPress={requireAuth(() => navigation.navigate('Booking', { experience }))}
                  activeOpacity={0.75}
                >
                  <Text style={styles.dateChipText}>{fmtDate(ds)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Accordion sections ── */}

          {/* Gallery */}
          {(experience.adventureImages?.length > 0 || experience.images?.length > 1) && (
            <Accordion title="Gallery" icon={<Ionicons name="images-outline" size={16} color="#1A5F45" />}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(experience.adventureImages?.length > 0
                  ? experience.adventureImages
                  : experience.images.slice(1)
                ).map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
                ))}
              </ScrollView>
            </Accordion>
          )}

          {/* Meeting Point */}
          {(experience.location?.meetingPoint || experience.location?.googleMapsLink) && (
            <Accordion title="Meeting point" icon={<Ionicons name="location-outline" size={16} color="#1A5F45" />}>
              {experience.location.meetingPoint && (
                <Text style={styles.bodyText}>{experience.location.meetingPoint}</Text>
              )}
              {experience.location?.state && (
                <Text style={[styles.bodyText, { color: '#999', marginTop: 4 }]}>
                  {[experience.location.city, experience.location.state, experience.location.country].filter(Boolean).join(', ')}
                </Text>
              )}
              {experience.location?.googleMapsLink && (
                <TouchableOpacity
                  style={styles.mapsBtn}
                  onPress={() => Linking.openURL(experience.location.googleMapsLink)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="map-outline" size={14} color="#1A5F45" />
                  <Text style={styles.mapsBtnText}>Open in Maps</Text>
                </TouchableOpacity>
              )}
            </Accordion>
          )}

          {/* Weather & Safety */}
          <Accordion title="Weather & safety" icon={<MaterialCommunityIcons name="weather-partly-cloudy" size={16} color="#1A5F45" />}>
            {weatherLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#1A5F45" />
                <Text style={styles.bodyText}>Fetching live weather…</Text>
              </View>
            ) : weatherError ? (
              <Text style={[styles.bodyText, { color: '#aaa' }]}>Weather data unavailable.</Text>
            ) : (
              <>
                {/* Weather summary row */}
                <View style={styles.weatherRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {getOWMWeatherIcon(weatherData?.iconCode, 30)}
                    <View>
                      <Text style={styles.weatherTemp}>{weatherData?.temp}</Text>
                      <Text style={styles.weatherCond}>{weatherData?.condition}</Text>
                    </View>
                  </View>
                  <View style={[styles.suitBadge, { borderColor: suitColor }]}>
                    <Text style={[styles.suitBadgeText, { color: suitColor }]}>
                      {weatherData?.suitability === 'Good' ? 'Good conditions'
                        : weatherData?.suitability === 'Moderate' ? 'Use caution'
                        : 'Not recommended'}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
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

                {/* Alert */}
                {weatherData?.alerts?.length > 0 && (
                  <View style={styles.weatherAlert}>
                    <Ionicons name="warning-outline" size={14} color="#b45309" />
                    <Text style={styles.weatherAlertText}>{weatherData.alerts[0]}</Text>
                  </View>
                )}

                <View style={styles.thinDivider} />

                {/* Safety features */}
                <Text style={styles.subSectionLabel}>Safety</Text>
                <View style={[styles.diffRow, { backgroundColor: diffCfg.bg, borderColor: diffCfg.border }]}>
                  <Text style={[styles.diffText, { color: diffCfg.color }]}>{experience.difficulty || 'Moderate'} difficulty</Text>
                  {experience.ageRestriction && <Text style={styles.diffAge}>· Age {experience.ageRestriction}</Text>}
                </View>

                {(experience.safetyInfo?.firstAidAvailable || experience.safetyInfo?.safetyBriefingIncluded || experience.operatorInfo?.guideCertifications) && (
                  <View style={styles.pillsRow}>
                    {experience.safetyInfo?.firstAidAvailable && <View style={styles.pill}><Text style={styles.pillText}>First Aid Kit</Text></View>}
                    {experience.safetyInfo?.safetyBriefingIncluded && <View style={styles.pill}><Text style={styles.pillText}>Safety Briefing</Text></View>}
                    {experience.operatorInfo?.guideCertifications && <View style={styles.pill}><Text style={styles.pillText}>Certified Guide</Text></View>}
                  </View>
                )}

                {experience.medicalRestrictions && <Text style={[styles.bodyText, { marginTop: 10 }]}>⚠ {experience.medicalRestrictions}</Text>}
                {experience.medicalAdvisories?.map((adv, i) => <Text key={i} style={[styles.bodyText, { marginTop: 4 }]}>⚠ {adv}</Text>)}
                {experience.safetyChecklist?.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subSectionLabel}>Safety checklist</Text>
                    {experience.safetyChecklist.map((item, idx) => (
                      <View key={idx} style={styles.inclRow}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#1A5F45" />
                        <Text style={styles.inclText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.thinDivider} />

                {/* Emergency contacts */}
                <Text style={styles.subSectionLabel}>Emergency</Text>
                {experience.safetyInfo?.emergencyContact ? (
                  <TouchableOpacity
                    style={styles.emergencyCard}
                    onPress={() => Linking.openURL(`tel:${experience.safetyInfo.emergencyContact}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.emergencyIconBg}>
                      <Ionicons name="call-outline" size={16} color="#1A5F45" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emergencyLabel}>Operator emergency line</Text>
                      <Text style={styles.emergencyNum}>{experience.safetyInfo.emergencyContact}</Text>
                    </View>
                    <View style={styles.callBtn}>
                      <Text style={styles.callBtnText}>Call</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.bodyText, { color: '#bbb', fontStyle: 'italic' }]}>No emergency contact provided</Text>
                )}

                {!weatherLoading && weatherData?.hospital && (
                  <View style={styles.emergencyCard}>
                    <View style={styles.emergencyIconBg}>
                      <Ionicons name="business-outline" size={16} color="#1A5F45" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emergencyLabel}>Nearest hospital</Text>
                      <Text style={styles.emergencyNum}>{weatherData.hospital.name}</Text>
                      {weatherData.hospital.vicinity ? <Text style={styles.emergencyAddr} numberOfLines={1}>{weatherData.hospital.vicinity}</Text> : null}
                    </View>
                  </View>
                )}
              </>
            )}
          </Accordion>

          {/* Reviews */}
          <Accordion title={`Reviews (${experience.reviewCount || reviews.length || 0})`} defaultOpen icon={<Ionicons name="star-outline" size={16} color="#1A5F45" />}>
            {reviews.length > 0 ? reviews.slice(0, 3).map((r, idx, arr) => (
              <View key={r._id} style={[styles.reviewCard, idx === arr.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{getInitials(r.userName || r.user?.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewAuthor}>{r.userName || r.user?.name || 'Anonymous'}</Text>
                    <Text style={styles.reviewDate}>{r.createdAt?.split('T')[0] || r.createdAt}</Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>{renderStars(r.rating)}</View>
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
            )) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="chatbubble-outline" size={32} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>No reviews yet</Text>
                <Text style={{ color: '#C4C9D4', fontSize: 12, marginTop: 4 }}>Be the first to share your experience</Text>
              </View>
            )}
          </Accordion>

          {/* ── Policies & Booking ── */}
          {(experience.cancellationPolicy || experience.bookingDeadline || experience.minGroupSize || experience.maxGroupSize) && (
            <Accordion title="Policies" icon={<Ionicons name="document-text-outline" size={16} color="#1A5F45" />}>

              {experience.cancellationPolicy && (
                <View style={styles.policyCard}>
                  <View style={styles.policyIconWrap}>
                    <Ionicons name="refresh-circle-outline" size={20} color="#1A5F45" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>Cancellation</Text>
                    <Text style={styles.policyDesc}>{experience.cancellationPolicy}</Text>
                  </View>
                </View>
              )}

              {(experience.minGroupSize || experience.maxGroupSize) && (
                <View style={styles.policyCard}>
                  <View style={styles.policyIconWrap}>
                    <Ionicons name="people-outline" size={20} color="#1A5F45" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>Group size</Text>
                    <Text style={styles.policyDesc}>
                      {experience.minGroupSize && experience.maxGroupSize
                        ? `${experience.minGroupSize}–${experience.maxGroupSize} people per booking`
                        : experience.maxGroupSize
                        ? `Up to ${experience.maxGroupSize} people`
                        : `Minimum ${experience.minGroupSize} people`}
                    </Text>
                  </View>
                </View>
              )}

              {experience.bookingDeadline && (
                <View style={[styles.policyCard, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                  <View style={styles.policyIconWrap}>
                    <Ionicons name="time-outline" size={20} color="#1A5F45" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.policyTitle}>Advance booking</Text>
                    <Text style={styles.policyDesc}>
                      Book at least {experience.bookingDeadline} day{experience.bookingDeadline !== 1 ? 's' : ''} before departure
                    </Text>
                  </View>
                </View>
              )}
            </Accordion>
          )}

          {/* Connect with Operator */}
          {(experience.socialLinks?.instagram || experience.socialLinks?.website) && (
            <Accordion title="Connect with operator" icon={<Ionicons name="share-social-outline" size={16} color="#1A5F45" />}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {experience.socialLinks?.instagram && (
                  <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(experience.socialLinks.instagram)} activeOpacity={0.8}>
                    <Ionicons name="logo-instagram" size={15} color="#1A5F45" />
                    <Text style={styles.socialBtnText}>Instagram</Text>
                  </TouchableOpacity>
                )}
                {experience.socialLinks?.website && (
                  <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(experience.socialLinks.website)} activeOpacity={0.8}>
                    <Ionicons name="globe-outline" size={15} color="#1A5F45" />
                    <Text style={styles.socialBtnText}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Accordion>
          )}

        </View>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
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
          style={styles.bookBtn}
          onPress={requireAuth(() => navigation.navigate('Booking', { experience }))}
          activeOpacity={0.88}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>

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
  root:   { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  headerControls: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 100 },
  circleBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ ios: { shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.12, shadowRadius:4 }, android:{elevation:3} }),
  },

  /* Hero */
  heroImage: { width: '100%', height: 290 },

  /* Body */
  body: { paddingHorizontal: 18, paddingTop: 18, backgroundColor: '#fff' },

  /* Category tag */
  categoryTag:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#edf5f0', marginBottom: 10 },
  categoryTagText: { fontSize: 11, fontWeight: '700', color: '#1A5F45', textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Title */
  title: { fontSize: 23, fontWeight: '800', color: '#111', lineHeight: 31, marginBottom: 10, letterSpacing: -0.3 },

  /* Meta row */
  metaRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 20 },
  metaRating:   { fontSize: 13, fontWeight: '700', color: '#111' },
  metaReviews:  { fontSize: 13, color: '#888' },
  metaSep:      { width: 1, height: 13, backgroundColor: '#ddd', marginHorizontal: 4 },
  metaLocation: { fontSize: 13, color: '#555' },

  /* Highlights strip */
  highlightsRow: { flexDirection: 'row', marginBottom: 20 },
  highlightCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#f7faf8', borderWidth: 1, borderColor: '#e5ede9',
  },
  highlightValue: { fontSize: 13, fontWeight: '700', color: '#111', marginTop: 6 },
  highlightLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  /* Host card */
  hostCard:         { borderWidth: 1, borderColor: '#e5ede9', borderRadius: 14, padding: 14, marginBottom: 18, backgroundColor: '#fafcfb' },
  hostCardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:           { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#dde8e2' },
  avatarFallback:   { backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  avatarInitials:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  hostName:         { fontSize: 14, fontWeight: '700', color: '#111' },
  hostVerifiedText: { fontSize: 11, color: '#1A5F45', fontWeight: '600' },
  hostStatSep:      { fontSize: 11, color: '#bbb' },
  hostStatText:     { fontSize: 11, color: '#444', fontWeight: '600' },
  hostExpCount:     { fontSize: 11, color: '#888', marginTop: 3 },
  askHostBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#cce0d8', backgroundColor: '#f0faf5' },
  askHostBtnText:   { fontSize: 12, color: '#1A5F45', fontWeight: '700' },
  hostLockRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  hostLockText:     { fontSize: 11, color: '#b45309', flex: 1, lineHeight: 16 },

  /* Description */
  description:  { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 8 },
  readMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 24 },
  readMoreText: { fontSize: 13, color: '#1A5F45', fontWeight: '700' },

  /* What's included */
  includedSection: { marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  sectionHeading:  { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 14, letterSpacing: -0.2 },
  inclRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  inclCheckCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  exclXCircle:     { width: 20, height: 20, borderRadius: 10, backgroundColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  inclText:        { fontSize: 14, color: '#333', flex: 1, lineHeight: 20 },
  inclSubLabel:    { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },

  /* Must Carry Essentials */
  essentialsCard:      { marginBottom: 24, borderWidth: 1.5, borderColor: '#c8e0d6', borderRadius: 16, backgroundColor: '#f0faf5', padding: 18 },
  essentialsTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  essentialsTitle:     { fontSize: 16, fontWeight: '700', color: '#0f3d28', flex: 1 },
  essentialsBadge:     { backgroundColor: '#1A5F45', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  essentialsBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  essentialsSubtitle:  { fontSize: 12, color: '#4a7c63', marginBottom: 14 },
  essentialsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  essentialItem:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#c8e0d6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  essentialCheck:      { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  essentialItemText:   { fontSize: 13, fontWeight: '600', color: '#1A5F45' },

  /* Available dates */
  datesSection: { marginBottom: 8, paddingBottom: 4 },
  dateChip:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f7faf8', borderWidth: 1, borderColor: '#dde8e2' },
  dateChipText: { fontSize: 13, color: '#1A5F45', fontWeight: '600' },

  /* Accordion */
  accordion:           { borderTopWidth: 1, borderTopColor: '#f2f2f2' },
  accordionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  accordionTitle:      { fontSize: 15, fontWeight: '700', color: '#111' },
  accordionBody:       { paddingBottom: 20 },

  /* Gallery */
  galleryImage: { width: 180, height: 120, borderRadius: 10 },

  bodyText:    { fontSize: 13, color: '#555', lineHeight: 20 },
  thinDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
  subSectionLabel: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  mapsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#cce0d8' },
  mapsBtnText: { fontSize: 13, color: '#1A5F45', fontWeight: '700' },

  /* Weather */
  weatherRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  weatherTemp:      { fontSize: 20, fontWeight: '800', color: '#111' },
  weatherCond:      { fontSize: 12, color: '#888', marginTop: 1 },
  suitBadge:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  suitBadgeText:    { fontSize: 11, fontWeight: '700' },
  weatherStats:     { flexDirection: 'row', flexWrap: 'wrap', gap: 0, backgroundColor: '#f7faf8', borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 12, overflow: 'hidden' },
  weatherStatItem:  { width: '33.33%', padding: 12, borderRightWidth: 1, borderRightColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#eee' },
  weatherStatLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  weatherStatValue: { fontSize: 14, fontWeight: '700', color: '#111' },
  weatherAlert:     { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 12, backgroundColor: '#fffbeb', borderRadius: 10, borderWidth: 1, borderColor: '#fde68a', marginBottom: 4 },
  weatherAlertText: { fontSize: 12, color: '#b45309', flex: 1, lineHeight: 17 },

  /* Difficulty + pills */
  diffRow:  { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  diffText: { fontSize: 13, fontWeight: '700' },
  diffAge:  { fontSize: 13, color: '#888', marginLeft: 4 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:     { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#f0f4f2', borderRadius: 20, borderWidth: 1, borderColor: '#dde8e2' },
  pillText: { fontSize: 12, color: '#1A5F45', fontWeight: '600' },

  /* Emergency */
  emergencyCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#f7faf8', borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
  emergencyIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#edf5f0', justifyContent: 'center', alignItems: 'center' },
  emergencyLabel:  { fontSize: 11, color: '#999', fontWeight: '600', marginBottom: 2 },
  emergencyNum:    { fontSize: 14, fontWeight: '700', color: '#111' },
  emergencyAddr:   { fontSize: 11, color: '#aaa', marginTop: 2 },
  callBtn:         { backgroundColor: '#1A5F45', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  callBtnText:     { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* Reviews */
  reviewCard:       { paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  reviewAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  reviewAuthor:     { fontSize: 13, fontWeight: '700', color: '#111' },
  reviewDate:       { fontSize: 11, color: '#bbb', marginTop: 1 },
  reviewComment:    { fontSize: 13, color: '#555', lineHeight: 20, marginTop: 4 },

  /* Policies */
  policyCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  policyIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#edf5f0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  policyTitle:    { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 4 },
  policyDesc:     { fontSize: 13, color: '#666', lineHeight: 19 },

  /* Social */
  socialBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 20, borderWidth: 1, borderColor: '#cce0d8' },
  socialBtnText: { fontSize: 13, color: '#1A5F45', fontWeight: '700' },

  /* Footer */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, zIndex: 100,
    ...Platform.select({ ios:{shadowColor:'#000',shadowOffset:{width:0,height:-2},shadowOpacity:0.06,shadowRadius:8}, android:{elevation:6} }),
  },
  footerPrice:    { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  footerPriceSub: { fontSize: 13, color: '#999' },
  viewDatesText:  { fontSize: 12, color: '#1A5F45', fontWeight: '600', marginTop: 3 },
  bookBtn:        { backgroundColor: '#1A5F45', borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, ...Platform.select({ ios:{shadowColor:'#1A5F45',shadowOffset:{width:0,height:3},shadowOpacity:0.2,shadowRadius:8}, android:{elevation:4} }) },
  bookBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
});
