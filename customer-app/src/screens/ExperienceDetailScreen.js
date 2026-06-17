import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, StatusBar, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../utils/alert';

// ── OWM icon code → native icon ─────────────────────────────────────────────
const getOWMWeatherIcon = (iconCode, size = 36) => {
  const code = iconCode?.slice(0, 2) || '01';
  const isNight = iconCode?.endsWith('n');
  const p = { size };
  switch (code) {
    case '01': return isNight
      ? <MaterialCommunityIcons name="weather-night"          {...p} color="#4B5563" />
      : <MaterialCommunityIcons name="weather-sunny"          {...p} color="#F59E0B" />;
    case '02': return <MaterialCommunityIcons name="weather-partly-cloudy"  {...p} color="#64748B" />;
    case '03':
    case '04': return <MaterialCommunityIcons name="weather-cloudy"         {...p} color="#78909C" />;
    case '09': return <MaterialCommunityIcons name="weather-pouring"        {...p} color="#3B82F6" />;
    case '10': return <MaterialCommunityIcons name="weather-rainy"          {...p} color="#2563EB" />;
    case '11': return <MaterialCommunityIcons name="weather-lightning-rainy"{...p} color="#7C3AED" />;
    case '13': return <MaterialCommunityIcons name="weather-snowy"          {...p} color="#60A5FA" />;
    case '50': return <MaterialCommunityIcons name="weather-fog"            {...p} color="#9CA3AF" />;
    default:   return <MaterialCommunityIcons name="weather-partly-cloudy"  {...p} color="#64748B" />;
  }
};

// ── Subtle gradient per weather condition ────────────────────────────────────
const getWeatherGradient = (iconCode) => {
  const code = iconCode?.slice(0, 2) || '01';
  switch (code) {
    case '01': return ['#f0f9f4', '#dff2e9'];
    case '02':
    case '03':
    case '04': return ['#eef2f6', '#dce6f0'];
    case '09':
    case '10': return ['#eef2fa', '#dce5f7'];
    case '11': return ['#f3eefa', '#e6d9f5'];
    case '13': return ['#edf7fd', '#d9eef9'];
    case '50': return ['#f3f4f5', '#e5e7eb'];
    default:   return ['#f3f8f5', '#e9f3ed'];
  }
};

// ── Suitability styling ──────────────────────────────────────────────────────
const getSuitabilityStyle = (s) => {
  switch (s) {
    case 'Good':
      return { bg: '#eefcf3', border: '#b2f0c7', text: '#15803d', label: 'Great Conditions', desc: 'Weather looks perfect for your adventure today!' };
    case 'Moderate':
      return { bg: '#fffbeb', border: '#fde68a', text: '#b45309', label: 'Proceed with Caution', desc: 'Check conditions before departure. Carry extra gear.' };
    default:
      return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', label: 'Not Recommended Today', desc: 'Unsafe weather conditions. Consider rescheduling.' };
  }
};

const DIFFICULTY_CFG = {
  Easy:     { color: '#15803d', bg: '#DCFCE7', border: '#86EFAC' },
  Moderate: { color: '#b45309', bg: '#FEF3C7', border: '#FCD34D' },
  Difficult:{ color: '#b91c1c', bg: '#FEE2E2', border: '#FCA5A5' },
  Hard:     { color: '#b91c1c', bg: '#FEE2E2', border: '#FCA5A5' },
  Expert:   { color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ExperienceDetailScreen({ route, navigation }) {
  const { experienceId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [experience,    setExperience]    = useState(null);
  const [reviews,       setReviews]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [inWishlist,    setInWishlist]    = useState(false);
  const [readMore,      setReadMore]      = useState(false);

  const [weatherData,    setWeatherData]    = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError,   setWeatherError]   = useState(false);

  // ── Live weather + hospital fetch ──────────────────────────────────────────
  const fetchWeatherAndSafety = async (exp) => {
    const city    = exp.location?.city    || '';
    const state   = exp.location?.state   || '';
    const rawCountry = exp.location?.country || 'IN';
    const WEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

    const COUNTRY_CODES = {
      'India': 'IN', 'Nepal': 'NP', 'Bhutan': 'BT',
      'Sri Lanka': 'LK', 'Maldives': 'MV', 'Bangladesh': 'BD',
    };
    const countryCode = COUNTRY_CODES[rawCountry] ?? (rawCountry.length <= 3 ? rawCountry.toUpperCase() : 'IN');

    try {
      setWeatherLoading(true);
      setWeatherError(false);

      // Step 1: Geocode with Nominatim for a precise lat/lon.
      // This avoids OWM's city-name matching picking the wrong station.
      let geoLat = null, geoLon = null;
      try {
        const geoQ   = encodeURIComponent([city, state, rawCountry].filter(Boolean).join(', '));
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${geoQ}&format=json&limit=1`,
          { headers: { 'User-Agent': 'WildvoraApp/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData?.length > 0) {
          geoLat = parseFloat(geoData[0].lat);
          geoLon = parseFloat(geoData[0].lon);
        }
      } catch { /* fall through to city-name fallback */ }

      // Step 2: Build OWM URLs — prefer precise coords, fall back to city name
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

      // f.list[0].pop is the forecast probability (0–1) for the NEXT 3-hour window,
      // not the current moment. Use it as an upcoming-rain advisory only.
      const forecastPop = f.list?.[0]?.pop ?? 0;
      const rainPct     = Math.round(forecastPop * 100);
      const isCurrentlyRainy = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(condMain);

      const fmtTime = (ts) => new Date(ts * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const sunrise = w.sys?.sunrise ? fmtTime(w.sys.sunrise) : '--';
      const sunset  = w.sys?.sunset  ? fmtTime(w.sys.sunset)  : '--';

      // Suitability is driven by CURRENT conditions first.
      // Forecast pop is only escalated to "Not Recommended" when it's already raining.
      let suitability = 'Good';
      const alerts = [];
      if (condMain === 'Thunderstorm') {
        suitability = 'Not Recommended';
        alerts.push('Thunderstorm warning: Outdoor activities strongly advised against.');
      } else if (windKmh > 50 || (isCurrentlyRainy && rainPct > 70)) {
        suitability = 'Not Recommended';
        if (windKmh > 50) alerts.push(`High wind alert: ${windKmh} km/h winds. Extreme caution required.`);
        if (isCurrentlyRainy && rainPct > 70) alerts.push(`Heavy rain continuing (${rainPct}%). Trail conditions may be hazardous.`);
      } else if (['Rain', 'Drizzle'].includes(condMain) || windKmh > 30 || rainPct > 70 || parseFloat(visKm) < 3) {
        suitability = 'Moderate';
        if (['Rain', 'Drizzle'].includes(condMain)) alerts.push('Rain expected. Carry waterproof gear and extra layers.');
        else if (windKmh > 30) alerts.push(`Elevated winds at ${windKmh} km/h. Use caution in exposed areas.`);
        else if (rainPct > 70) alerts.push(`Heavy rain forecast soon (${rainPct}%). Carry waterproof gear.`);
        else if (parseFloat(visKm) < 3) alerts.push(`Reduced visibility (${visKm} km). Stay close to your guide.`);
      } else if (!isCurrentlyRainy && rainPct > 40) {
        suitability = 'Moderate';
        alerts.push(`Rain likely later (${rainPct}% forecast). Carry a rain jacket.`);
      }

      // Nearest hospital via Overpass — reuse coords from geocoding step above
      let hospital = null;
      try {
        const hLat = geoLat, hLon = geoLon;
        if (hLat !== null && hLon !== null) {
          const overpassQ = encodeURIComponent(
            `[out:json][timeout:10];node["amenity"="hospital"](around:20000,${hLat},${hLon});out body 3;`
          );
          const hRes  = await fetch(`https://overpass-api.de/api/interpreter?data=${overpassQ}`);
          const hData = await hRes.json();
          if (hData.elements?.length > 0) {
            const h = hData.elements[0];
            const name     = h.tags?.name || h.tags?.['name:en'] || 'Nearby Hospital';
            const vicinity = [h.tags?.['addr:street'], h.tags?.['addr:city'] || city].filter(Boolean).join(', ');
            hospital = { name, vicinity };
          }
        }
      } catch { /* silent fallback */ }

      setWeatherData({
        temp: `${tempC}°C`, feelsLike: `${feelsC}°C`, humidity: `${humidity}%`,
        condition: condDesc.charAt(0).toUpperCase() + condDesc.slice(1),
        conditionMain: condMain, iconCode,
        rainProb: `${rainPct}%`, windSpeed: `${windKmh} km/h`, visibility: `${visKm} km`,
        sunrise, sunset, suitability, alerts, hospital,
      });
    } catch (err) {
      console.warn('Weather fetch failed:', err.message);
      setWeatherError(true);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, revRes] = await Promise.all([
          experienceAPI.getOne(experienceId),
          reviewAPI.getForExperience(experienceId),
        ]);
        const exp = expRes.data.experience;
        setExperience(exp);
        setReviews(revRes.data.reviews);
        if (user?.wishlist) {
          setInWishlist(user.wishlist.some((w) => w._id === experienceId || w === experienceId));
        }
        fetchWeatherAndSafety(exp);
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#1A5F45" /></View>;
  }
  if (!experience) return null;

  const heroImage     = experience.coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWD971kShMZZtm1tqLB1M4tT3C06H-IIw4sAIM6q8Is0Z9f0vV3ghGpyKWw2nsI4RtbB5uFyLJ5KVbQBPqQZ6gfNwyC1lom8RMKstswmSXAi0R33J96h_T0nlJ7drHXfktm54c2af9pWrWq-mvNbCkov7u8y65OtgNfN26r9q0XApuM_gY2XgxZLsXXkdn9w-FJhi7TZIApYrX9KkoguY-CxCc-IZM5n1re5sZpl6C3J0RkedcQGyLBdqfw99XC6CuwtXrTw8BrHI';
  const hostAvatarUrl = experience.host?.avatar || null;

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Ionicons key={i} name={i < Math.floor(rating) ? 'star' : 'star-outline'} size={14} color="#1A5F45" style={{ marginRight: 2 }} />
    ));

  const btnTop   = insets.top + 12;
  const today    = new Date();
  const months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmtDate  = (ds) => { const d = new Date(ds + 'T00:00:00'); return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`; };
  const availDates = (() => {
    const fut = (experience.availableDates || []).filter(ds => new Date(ds + 'T00:00:00') >= today).slice(0, 6);
    if (fut.length) return fut;
    const arr = []; const d = new Date(today); d.setDate(d.getDate() + 3);
    for (let i = 0; i < 4; i++) { arr.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 7); }
    return arr;
  })();

  const diffCfg  = DIFFICULTY_CFG[experience.difficulty] || DIFFICULTY_CFG.Moderate;
  const suitInfo = weatherData ? getSuitabilityStyle(weatherData.suitability) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating header buttons */}
      <View style={[styles.headerControls, { top: btnTop }]}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()} activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color="#1A5F45" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} onPress={handleWishlist} activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={inWishlist ? 'heart' : 'heart-outline'} size={20} color={inWishlist ? '#ba1a1a' : '#1A5F45'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroFade} />
        </View>

        <View style={styles.body}>

          {/* Tags + title */}
          <View style={styles.metaSection}>
            <View style={styles.tagsRow}>
              <View style={[styles.tag, styles.tagBlue]}><Text style={styles.tagBlueText}>High Altitude</Text></View>
              <View style={[styles.tag, styles.tagTerracotta]}><Text style={styles.tagTerracottaText}>{experience.duration || '2-Day Trek'}</Text></View>
            </View>
            <Text style={styles.title}>{experience.title}</Text>
            <View style={styles.ratingRow}>
              <View style={styles.ratingCol}>
                <Ionicons name="star" size={16} color="#1A5F45" />
                <Text style={styles.ratingNum}>{experience.rating || '4.9'}</Text>
                <Text style={styles.reviewCount}>({experience.reviewCount || '0'} reviews)</Text>
              </View>
              <View style={styles.locationCol}>
                <Ionicons name="location" size={16} color="#1A5F45" />
                <Text style={styles.locationText}>{experience.location?.city}, {experience.location?.country}</Text>
              </View>
            </View>
          </View>

          {/* Host card */}
          <View style={styles.hostCard}>
            <View style={styles.hostInfo}>
              {hostAvatarUrl
                ? <Image source={{ uri: hostAvatarUrl }} style={styles.avatar} />
                : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarInitials}>{getInitials(experience.hostName)}</Text></View>
              }
              <View style={styles.hostMeta}>
                <Text style={styles.hostName}>{experience.hostName || 'Wildvora Host'}</Text>
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

          {/* Gallery */}
          {(experience.adventureImages?.length > 0 || experience.images?.length > 1) && (
            <View style={[styles.section, { marginBottom: 20 }]}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {(experience.adventureImages?.length > 0 ? experience.adventureImages : experience.images.slice(1)).map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={{ width: 200, height: 130, borderRadius: 12 }} resizeMode="cover" />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Experience</Text>
            <Text style={styles.description} numberOfLines={readMore ? undefined : 3}>{experience.description}</Text>
            <TouchableOpacity onPress={() => setReadMore(!readMore)} style={styles.readMoreBtn} activeOpacity={0.7}>
              <Text style={styles.readMoreText}>{readMore ? 'Read less' : 'Read more'}</Text>
              <Ionicons name={readMore ? 'chevron-up' : 'chevron-down'} size={14} color="#1A5F45" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* Bento highlights */}
          <View style={styles.bentoGrid}>
            {[
              { icon: <MaterialCommunityIcons name="flag-outline"   size={24} color="#1A5F45" />, label: '12km Hike' },
              { icon: <MaterialCommunityIcons name="elevation-rise" size={24} color="#1A5F45" />, label: '2,400m Peak' },
              { icon: <Ionicons name="restaurant-outline"           size={24} color="#1A5F45" />, label: 'All Meals' },
              { icon: <MaterialCommunityIcons name="tent"           size={24} color="#1A5F45" />, label: 'Gear Included' },
            ].map(({ icon, label }) => (
              <View key={label} style={styles.bentoItem}>
                <View style={{ marginBottom: 6 }}>{icon}</View>
                <Text style={styles.bentoText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* ══════════════════════════════════════════════ */}
          {/* WEATHER & ADVENTURE SAFETY                    */}
          {/* ══════════════════════════════════════════════ */}
          <View style={[styles.section, styles.borderTop]}>

            {/* Section header */}
            <View style={styles.widgetHeader}>
              <View style={styles.widgetHeaderLeft}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color="#1A5F45" />
                <Text style={styles.sectionTitle}>Weather & Safety</Text>
              </View>
              <Text style={styles.widgetMeta}>{experience.location?.city}</Text>
            </View>

            {weatherLoading ? (
              <View style={styles.weatherLoadingCard}>
                <ActivityIndicator size="small" color="#1A5F45" />
                <Text style={styles.weatherLoadingText}>Fetching live weather…</Text>
              </View>
            ) : weatherError ? (
              <View style={styles.weatherErrorCard}>
                <MaterialCommunityIcons name="weather-cloudy" size={34} color="#9ca3af" />
                <Text style={styles.weatherErrorTitle}>Weather Unavailable</Text>
                <Text style={styles.weatherErrorText}>Could not load live data. Check your connection.</Text>
              </View>
            ) : (
              <>
                {/* Alert banner */}
                {weatherData?.alerts?.length > 0 && (
                  <View style={styles.alertBanner}>
                    <View style={styles.alertIconBg}>
                      <Ionicons name="warning" size={15} color="#fff" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.alertTitle}>Weather Alert</Text>
                      <Text style={styles.alertText}>{weatherData.alerts[0]}</Text>
                    </View>
                  </View>
                )}

                {/* Main weather card */}
                <LinearGradient
                  colors={getWeatherGradient(weatherData?.iconCode)}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.weatherCard}
                >
                  {/* Hero: temp + icon */}
                  <View style={styles.weatherHeroRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.weatherTemp}>{weatherData?.temp}</Text>
                      <Text style={styles.weatherFeelsLike}>Feels like {weatherData?.feelsLike}</Text>
                      <Text style={styles.weatherCondition}>{weatherData?.condition}</Text>
                    </View>
                    <View style={styles.weatherIconBubble}>
                      {getOWMWeatherIcon(weatherData?.iconCode, 46)}
                    </View>
                  </View>

                  <View style={styles.weatherDivider} />

                  {/* 2 × 2 metrics grid */}
                  <View style={styles.weatherGrid}>
                    {[
                      { icon: 'umbrella-outline',   lib: 'Ionicons',                    color: '#3B82F6', label: 'Rain Chance', value: weatherData?.rainProb },
                      { icon: 'weather-windy',      lib: 'MaterialCommunityIcons',      color: '#6B7280', label: 'Wind',        value: weatherData?.windSpeed },
                      { icon: 'eye-outline',        lib: 'Ionicons',                    color: '#1A5F45', label: 'Visibility',  value: weatherData?.visibility },
                      { icon: 'water-percent',      lib: 'MaterialCommunityIcons',      color: '#0EA5E9', label: 'Humidity',    value: weatherData?.humidity },
                    ].map(({ icon, lib, color, label, value }) => (
                      <View key={label} style={styles.weatherMetricTile}>
                        {lib === 'Ionicons'
                          ? <Ionicons name={icon} size={15} color={color} />
                          : <MaterialCommunityIcons name={icon} size={15} color={color} />}
                        <Text style={styles.weatherMetricLabel}>{label}</Text>
                        <Text style={styles.weatherMetricValue}>{value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Sun cycle */}
                  <View style={styles.sunRow}>
                    <View style={styles.sunItem}>
                      <MaterialCommunityIcons name="weather-sunset-up"   size={15} color="#F59E0B" />
                      <Text style={styles.sunLabel}>Sunrise</Text>
                      <Text style={styles.sunValue}>{weatherData?.sunrise}</Text>
                    </View>
                    <View style={styles.sunDivider} />
                    <View style={styles.sunItem}>
                      <MaterialCommunityIcons name="weather-sunset-down" size={15} color="#F97316" />
                      <Text style={styles.sunLabel}>Sunset</Text>
                      <Text style={styles.sunValue}>{weatherData?.sunset}</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Suitability banner */}
                {suitInfo && (
                  <View style={[styles.suitBanner, { backgroundColor: suitInfo.bg, borderColor: suitInfo.border }]}>
                    <View style={[styles.suitIconBg, { backgroundColor: suitInfo.text }]}>
                      <Ionicons
                        name={weatherData?.suitability === 'Good' ? 'checkmark' : weatherData?.suitability === 'Moderate' ? 'alert' : 'close'}
                        size={14} color="#fff"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.suitLabel, { color: suitInfo.text }]}>{suitInfo.label}</Text>
                      <Text style={[styles.suitDesc,  { color: suitInfo.text }]}>{suitInfo.desc}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ══════════════════════════════════════════════ */}
          {/* SAFETY & PREPAREDNESS                         */}
          {/* ══════════════════════════════════════════════ */}
          <View style={[styles.section, styles.borderTop]}>

            <View style={styles.widgetHeader}>
              <View style={styles.widgetHeaderLeft}>
                <MaterialIcons name="security" size={20} color="#1A5F45" />
                <Text style={styles.sectionTitle}>Safety & Preparedness</Text>
              </View>
            </View>

            {/* Difficulty badge */}
            <View style={[styles.diffBadge, { backgroundColor: diffCfg.bg, borderColor: diffCfg.border }]}>
              <View style={[styles.diffDot, { backgroundColor: diffCfg.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.diffLabel, { color: diffCfg.color }]}>
                  {experience.difficulty || 'Moderate'} Difficulty
                </Text>
                {experience.ageRestriction ? (
                  <Text style={styles.diffAge}>Age: {experience.ageRestriction}</Text>
                ) : null}
              </View>
              <Ionicons name="bar-chart-outline" size={16} color={diffCfg.color} />
            </View>

            {/* Feature pills */}
            <View style={styles.pillsRow}>
              {experience.safetyInfo?.firstAidAvailable && (
                <View style={styles.pill}>
                  <MaterialIcons name="medical-services" size={12} color="#15803d" />
                  <Text style={styles.pillText}>First Aid</Text>
                </View>
              )}
              {experience.safetyInfo?.safetyBriefingIncluded && (
                <View style={styles.pill}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#15803d" />
                  <Text style={styles.pillText}>Safety Briefing</Text>
                </View>
              )}
              {experience.operatorInfo?.guideCertifications ? (
                <View style={styles.pill}>
                  <Ionicons name="ribbon-outline" size={12} color="#15803d" />
                  <Text style={styles.pillText}>Certified Guide</Text>
                </View>
              ) : null}
            </View>

            {/* Medical advisory */}
            {experience.medicalRestrictions ? (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoCardIcon, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialIcons name="medical-services" size={14} color="#b91c1c" />
                  </View>
                  <Text style={styles.infoCardTitle}>Medical Advisory</Text>
                </View>
                <Text style={styles.infoCardText}>{experience.medicalRestrictions}</Text>
              </View>
            ) : null}

            {/* Emergency contacts + hospital */}
            <View style={styles.emergencyBox}>
              <Text style={styles.emergencyBoxTitle}>Emergency Contacts</Text>

              {experience.safetyInfo?.emergencyContact ? (
                <TouchableOpacity
                  style={styles.emergencyRow}
                  onPress={() => Linking.openURL(`tel:${experience.safetyInfo.emergencyContact}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.emergencyLeft}>
                    <View style={[styles.emergencyIcon, { backgroundColor: '#1A5F45' }]}>
                      <Ionicons name="call" size={14} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.emergencyLabel}>Operator Emergency</Text>
                      <Text style={styles.emergencyNum}>{experience.safetyInfo.emergencyContact}</Text>
                    </View>
                  </View>
                  <View style={styles.callBtn}>
                    <Ionicons name="call" size={11} color="#fff" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noContactRow}>
                  <Ionicons name="call-outline" size={15} color="#9ca3af" />
                  <Text style={styles.noContactText}>No emergency contact provided</Text>
                </View>
              )}

              {!weatherLoading && (
                weatherData?.hospital ? (
                  <View style={styles.hospitalRow}>
                    <View style={[styles.emergencyIcon, { backgroundColor: '#2563EB' }]}>
                      <Ionicons name="business" size={14} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.hospitalName}>{weatherData.hospital.name}</Text>
                      <Text style={styles.hospitalAddr} numberOfLines={1}>{weatherData.hospital.vicinity}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#9ca3af" />
                  </View>
                ) : (
                  <View style={styles.hospitalRow}>
                    <View style={[styles.emergencyIcon, { backgroundColor: '#9ca3af' }]}>
                      <Ionicons name="business" size={14} color="#fff" />
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.hospitalName}>Nearest Hospital</Text>
                      <Text style={styles.hospitalAddr}>Hospital data unavailable</Text>
                    </View>
                  </View>
                )
              )}
            </View>
          </View>

          {/* What to Bring */}
          {experience.requirements?.length > 0 && (
            <View style={[styles.section, styles.borderTop]}>
              <View style={styles.widgetHeaderLeft}>
                <MaterialCommunityIcons name="bag-personal-outline" size={20} color="#1A5F45" />
                <Text style={[styles.sectionTitle, { marginLeft: 7, marginBottom: 0 }]}>What to Bring</Text>
              </View>
              <View style={[styles.requirementsList, { marginTop: 12 }]}>
                {experience.requirements.map((item, idx) => (
                  <View key={idx} style={styles.requirementItem}>
                    <View style={styles.requirementBullet}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                    <Text style={styles.requirementText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Available Dates */}
          <View style={[styles.section, styles.borderTop]}>
            <Text style={styles.sectionTitle}>Available Dates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {availDates.map((ds, i) => (
                <View key={i} style={styles.dateChip}>
                  <Ionicons name="calendar-outline" size={13} color="#11694b" style={{ marginRight: 4 }} />
                  <Text style={styles.dateChipText}>{fmtDate(ds)}</Text>
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
                { _id: 'd1', rating: 5, comment: 'The sunrise was life-changing. The guide knows every rock on that mountain.', userName: 'Sarah M.', createdAt: '2 days ago' },
                { _id: 'd2', rating: 5, comment: 'Expertly organized. The food was surprisingly good for being at 2000 meters.', userName: 'James L.', createdAt: '1 week ago' },
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

      {/* Sticky footer */}
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

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f7faf6' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7faf6' },

  /* Header */
  headerControls:  { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 100 },
  circleBtn:       { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.90)', justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }, android: { elevation: 4 } }) },

  /* Hero */
  heroContainer:   { height: 380, width: '100%' },
  heroImage:       { width: '100%', height: '100%' },
  heroFade:        { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100, backgroundColor: '#f7faf6', opacity: 0.82 },

  /* Body */
  body:            { paddingHorizontal: 16, marginTop: -24 },
  section:         { marginBottom: 24 },
  borderTop:       { borderTopWidth: 1, borderTopColor: 'rgba(190,201,193,0.3)', paddingTop: 20 },

  /* Meta */
  metaSection:     { marginBottom: 20 },
  tagsRow:         { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag:             { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  tagBlue:         { backgroundColor: 'rgba(146,216,254,0.2)' },
  tagBlueText:     { color: '#005f7f', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tagTerracotta:   { backgroundColor: 'rgba(255,218,216,0.25)' },
  tagTerracottaText:{ color: '#753231', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:           { fontSize: 24, fontWeight: '700', color: '#181d1a', lineHeight: 32, marginBottom: 8 },
  ratingRow:       { flexDirection: 'row', gap: 20, alignItems: 'center', flexWrap: 'wrap' },
  ratingCol:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum:       { fontSize: 14, fontWeight: '700', color: '#181d1a' },
  reviewCount:     { fontSize: 12, color: '#6f7a73' },
  locationCol:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:    { fontSize: 14, color: '#3f4943', fontWeight: '500' },

  /* Host */
  hostCard:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f4f0', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)', marginBottom: 24 },
  hostInfo:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:          { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(17,105,75,0.2)' },
  avatarFallback:  { backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  avatarInitials:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  hostMeta:        { gap: 2 },
  hostName:        { fontSize: 16, fontWeight: '700', color: '#181d1a' },
  verifiedRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText:    { fontSize: 12, color: '#1A5F45', fontWeight: '600' },
  contactBtn:      { borderWidth: 1, borderColor: '#1A5F45', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  contactBtnText:  { fontSize: 13, color: '#1A5F45', fontWeight: '600' },

  /* Description */
  sectionTitle:    { fontSize: 18, fontWeight: '700', color: '#181d1a', marginBottom: 10 },
  description:     { fontSize: 14, color: '#3f4943', lineHeight: 22 },
  readMoreBtn:     { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  readMoreText:    { fontSize: 13, color: '#1A5F45', fontWeight: '700', textDecorationLine: 'underline' },

  /* Bento */
  bentoGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  bentoItem:       { flex: 1, minWidth: '45%', backgroundColor: 'rgba(224,227,223,0.3)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)' },
  bentoText:       { fontSize: 13, fontWeight: '600', color: '#181d1a' },

  /* Widget header */
  widgetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  widgetHeaderLeft:{ flexDirection: 'row', alignItems: 'center', gap: 7 },
  widgetMeta:      { fontSize: 11, color: '#6f7a73', fontWeight: '500' },

  /* Weather loading / error */
  weatherLoadingCard:{ backgroundColor: '#f3f8f5', borderRadius: 16, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)' },
  weatherLoadingText:{ fontSize: 13, color: '#6f7a73' },
  weatherErrorCard:  { backgroundColor: '#f9fafb', borderRadius: 16, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  weatherErrorTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  weatherErrorText:  { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  /* Alert */
  alertBanner:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 14, padding: 14, marginBottom: 12 },
  alertIconBg:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ba1a1a', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  alertTitle:      { fontSize: 13, fontWeight: '700', color: '#991b1b', marginBottom: 2 },
  alertText:       { fontSize: 12, color: '#b91c1c', lineHeight: 17 },

  /* Weather card */
  weatherCard:     { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(190,201,193,0.25)', marginBottom: 12 },
  weatherHeroRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  weatherTemp:     { fontSize: 48, fontWeight: '800', color: '#181d1a', lineHeight: 52 },
  weatherFeelsLike:{ fontSize: 12, color: '#6f7a73', marginTop: 2, marginBottom: 3 },
  weatherCondition:{ fontSize: 15, fontWeight: '600', color: '#3f4943' },
  weatherIconBubble:{ width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  weatherDivider:  { height: 1, backgroundColor: 'rgba(190,201,193,0.5)', marginBottom: 14 },

  /* Metrics */
  weatherGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  weatherMetricTile:{ flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)', gap: 3 },
  weatherMetricLabel:{ fontSize: 10, color: '#6f7a73', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  weatherMetricValue:{ fontSize: 16, fontWeight: '800', color: '#181d1a' },

  /* Sun cycle */
  sunRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 12, padding: 12 },
  sunItem:         { flex: 1, alignItems: 'center', gap: 3 },
  sunLabel:        { fontSize: 10, color: '#6f7a73', fontWeight: '600', textTransform: 'uppercase' },
  sunValue:        { fontSize: 13, fontWeight: '700', color: '#181d1a' },
  sunDivider:      { width: 1, height: 32, backgroundColor: 'rgba(190,201,193,0.5)', marginHorizontal: 12 },

  /* Suitability banner */
  suitBanner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1 },
  suitIconBg:      { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  suitLabel:       { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  suitDesc:        { fontSize: 12, opacity: 0.85, lineHeight: 17 },

  /* Difficulty */
  diffBadge:       { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 14, gap: 10 },
  diffDot:         { width: 10, height: 10, borderRadius: 5 },
  diffLabel:       { fontSize: 14, fontWeight: '700' },
  diffAge:         { fontSize: 11, color: '#6f7a73', marginTop: 2 },

  /* Feature pills */
  pillsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill:            { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#eefcf3', borderRadius: 20, borderWidth: 1, borderColor: '#b2f0c7' },
  pillText:        { fontSize: 11, color: '#15803d', fontWeight: '700' },

  /* Info card */
  infoCard:        { backgroundColor: '#fafbfc', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)', marginBottom: 14 },
  infoCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoCardIcon:    { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  infoCardTitle:   { fontSize: 13, fontWeight: '700', color: '#181d1a' },
  infoCardText:    { fontSize: 12, color: '#3f4943', lineHeight: 18 },

  /* Emergency box */
  emergencyBox:    { backgroundColor: '#f9fafb', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(190,201,193,0.25)', gap: 10 },
  emergencyBoxTitle:{ fontSize: 11, fontWeight: '800', color: '#6f7a73', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },

  emergencyRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)' },
  emergencyLeft:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emergencyIcon:   { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  emergencyLabel:  { fontSize: 11, color: '#6f7a73', fontWeight: '600' },
  emergencyNum:    { fontSize: 14, fontWeight: '700', color: '#181d1a', marginTop: 1 },

  callBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A5F45', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  callBtnText:     { color: '#fff', fontSize: 12, fontWeight: '700' },

  noContactRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)' },
  noContactText:   { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },

  hospitalRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)' },
  hospitalName:    { fontSize: 13, fontWeight: '700', color: '#181d1a' },
  hospitalAddr:    { fontSize: 11, color: '#6f7a73', marginTop: 2 },

  /* Requirements */
  requirementsList:{ gap: 10 },
  requirementItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#f3f8f5', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(26,95,69,0.12)' },
  requirementBullet:{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  requirementText: { fontSize: 14, color: '#2d3d36', fontWeight: '500', flex: 1 },

  /* Dates */
  dateChip:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,105,75,0.08)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(17,105,75,0.2)' },
  dateChipText:    { fontSize: 13, color: '#11694b', fontWeight: '600' },

  /* Reviews */
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText:     { fontSize: 14, color: '#1A5F45', fontWeight: '700' },
  reviewGrid:      { gap: 12 },
  reviewCard:      { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }, android: { elevation: 1 } }) },
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
  bookBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});
