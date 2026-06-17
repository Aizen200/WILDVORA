import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function getWeatherAndSafetyData(experience) {
  const idStr = experience._id || experience.title || '';
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const category = experience.category || 'Trekking';
  const difficulty = experience.difficulty || 'Moderate';
  const city = experience.location?.city || 'the location';

  let tempVal = 22 + (absHash % 10);
  let cond = 'Sunny';
  let rainP = absHash % 40;
  let windSp = 5 + (absHash % 15);
  let suitability = 'Good';
  let alerts = [];

  if (category === 'Trekking' || category === 'Climbing') {
    tempVal = 10 + (absHash % 12);
    windSp = 12 + (absHash % 20);
    if (difficulty === 'Hard' || difficulty === 'Expert') {
      cond = absHash % 3 === 0 ? 'Heavy Winds' : (absHash % 3 === 1 ? 'Partly Cloudy' : 'Mist');
      if (cond === 'Heavy Winds') {
        suitability = 'Moderate';
        alerts.push('High wind speeds expected at high altitude peaks.');
      }
    } else {
      cond = absHash % 2 === 0 ? 'Sunny' : 'Clear';
    }
  } else if (category === 'Water Sports') {
    tempVal = 26 + (absHash % 6);
    rainP = absHash % 60;
    if (rainP > 40) {
      cond = 'Scattered Showers';
      suitability = 'Moderate';
      alerts.push('Rain probability is slightly elevated. Check water activity guides.');
    } else {
      cond = 'Warm & Sunny';
    }
  } else if (category === 'Skiing') {
    tempVal = -5 + (absHash % 8);
    cond = 'Snowy';
    windSp = 10 + (absHash % 15);
    suitability = 'Good';
  } else {
    cond = absHash % 3 === 0 ? 'Sunny' : (absHash % 3 === 1 ? 'Passing Clouds' : 'Clear');
  }

  if (rainP > 55 || windSp > 28) {
    suitability = 'Not Recommended';
    alerts.push('Severe weather warning: Avoid outdoor activities today.');
  }

  const sunriseHour = 5 + (absHash % 2);
  const sunriseMin = 10 + (absHash % 40);
  const sunsetHour = 6 + (absHash % 2);
  const sunsetMin = 10 + (absHash % 40);
  const vis = 8 + (absHash % 10);

  let fitnessReq = 'Average physical fitness. Comfortable walking/moving for 2 hours.';
  let medicalAdv = 'Consult a doctor if you have knee/joint issues or balance conditions.';
  let gearChecklist = ['Comfortable outdoor shoes', 'Drinking water (1L+)', 'Sunscreen / Cap'];

  if (category === 'Trekking' || category === 'Climbing') {
    if (difficulty === 'Hard' || difficulty === 'Expert') {
      fitnessReq = 'Excellent physical endurance. Able to hike 6+ hours with elevation changes.';
      medicalAdv = 'Not recommended for cardiovascular issues, severe asthma, or pregnant women.';
      gearChecklist = ['Trekking boots with grip', 'Warm layers / windproof jacket', 'Headlamp / Flashlight', 'Hydration pack (2L+)', 'Energy snacks'];
    } else {
      fitnessReq = 'Moderate cardiovascular fitness. Able to walk on uneven terrain for 3-4 hours.';
      medicalAdv = 'Be mindful of knee strain. Stay hydrated to avoid heat exhaustion.';
      gearChecklist = ['Sturdy walking shoes', 'Backpack (15-20L)', 'Rain coat', 'Water bottle (1.5L)'];
    }
  } else if (category === 'Water Sports') {
    fitnessReq = 'Basic swimming ability and comfort in deep water. Moderate upper body movement.';
    medicalAdv = 'Avoid if you have history of seizures, severe asthma, or recent shoulder/back injuries.';
    gearChecklist = ['Swimwear / quick-dry clothes', 'Waterproof pouch for phone', 'Change of dry clothes', 'Towel'];
  } else if (category === 'Skiing') {
    fitnessReq = 'Good leg strength and balance. Comfortable in sub-zero environments.';
    medicalAdv = 'Not recommended for osteoporosis or severe joint instability.';
    gearChecklist = ['Thermal innerwear', 'Ski gloves and goggles', 'Waterproof snow suit'];
  } else if (category === 'Camping') {
    fitnessReq = 'Basic fitness. Minimal physical strain, but comfortable sleeping in outdoor tents.';
    medicalAdv = 'Carry insect repellent. Keep warm layers handy for temperature drop at night.';
    gearChecklist = ['Personal toiletries', 'Warm socks & jacket', 'Power bank', 'Personal medication'];
  }

  const certifiedGuide = (absHash % 10) < 9;
  const emergencyNum = `+91 9${(absHash % 90000) + 10000} ${(absHash % 9000) + 1000}`;
  const hospitalDist = 5 + (absHash % 25);
  const hospitalName = `${city.split(',')[0]} Emergency Clinic (${hospitalDist} km)`;

  return {
    weather: {
      temp: `${tempVal}°C`,
      condition: cond,
      rainProb: `${rainP}%`,
      windSpeed: `${windSp} km/h`,
      sunrise: `0${sunriseHour}:${sunriseMin} AM`,
      sunset: `0${sunsetHour}:${sunsetMin} PM`,
      visibility: `${vis} km`,
      suitability,
      alerts
    },
    safety: {
      difficulty,
      fitnessReq,
      certifiedGuide,
      emergencyContact: emergencyNum,
      medicalAdv,
      tags: ['Solo-Friendly', 'Women-Friendly'],
      nearestHospital: hospitalName,
      checklist: gearChecklist
    }
  };
}

const getWeatherIcon = (cond) => {
  const iconProps = { size: 36 };
  switch (cond) {
    case 'Sunny':
    case 'Warm & Sunny':
    case 'Clear':
      return <MaterialCommunityIcons name="weather-sunny" {...iconProps} color="#d97706" />;
    case 'Snowy':
      return <MaterialCommunityIcons name="weather-snowy" {...iconProps} color="#0284c7" />;
    case 'Heavy Winds':
    case 'Windy':
      return <MaterialCommunityIcons name="weather-windy" {...iconProps} color="#4b5563" />;
    case 'Mist':
      return <MaterialCommunityIcons name="weather-fog" {...iconProps} color="#6b7280" />;
    case 'Scattered Showers':
    case 'Light Rain':
    case 'Rainy':
      return <MaterialCommunityIcons name="weather-pouring" {...iconProps} color="#2563eb" />;
    default:
      return <MaterialCommunityIcons name="weather-partly-cloudy" {...iconProps} color="#4b5563" />;
  }
};

const getSuitabilityStyle = (suitability) => {
  switch (suitability) {
    case 'Good':
      return { bg: '#eefcf3', border: '#b2f0c7', text: '#15803d', label: 'Highly Suitable' };
    case 'Moderate':
      return { bg: '#fffbeb', border: '#fde68a', text: '#b45309', label: 'Moderate / Use Caution' };
    default:
      return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', label: 'Not Recommended Today' };
  }
};

const getDeterministicAvatar = (name) => {
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80'
  ];
  if (!name) return avatars[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatars.length;
  return avatars[index];
};

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

  const data = React.useMemo(() => {
    if (!experience) return null;
    return getWeatherAndSafetyData(experience);
  }, [experience]);

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
  const hostAvatar = experience.host?.avatar || (experience.hostName ? getDeterministicAvatar(experience.hostName) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80');

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

  const suitabilityInfo = data ? getSuitabilityStyle(data.weather.suitability) : null;

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

          {/* Weather & Conditions Widget */}
          <View style={[styles.section, styles.borderTop]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color="#1A5F45" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Weather & Conditions</Text>
            </View>

            {data.weather.alerts.length > 0 && (
              <View style={styles.alertBanner}>
                <Ionicons name="warning" size={18} color="#ba1a1a" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Weather Alert</Text>
                  <Text style={styles.alertText}>{data.weather.alerts[0]}</Text>
                </View>
              </View>
            )}

            <LinearGradient
              colors={['#f3f8f5', '#e9f3ed']}
              style={styles.weatherCard}
            >
              <View style={styles.weatherMain}>
                <View>
                  <Text style={styles.weatherTemp}>{data.weather.temp}</Text>
                  <Text style={styles.weatherCondition}>{data.weather.condition}</Text>
                </View>
                {getWeatherIcon(data.weather.condition)}
              </View>

              <View style={styles.weatherGrid}>
                <View style={styles.weatherItem}>
                  <Ionicons name="umbrella-outline" size={18} color="#0a6687" />
                  <View style={{ marginLeft: 4 }}>
                    <Text style={styles.weatherLabel}>Rain Prob.</Text>
                    <Text style={styles.weatherValue}>{data.weather.rainProb}</Text>
                  </View>
                </View>

                <View style={styles.weatherItem}>
                  <Ionicons name="speedometer-outline" size={18} color="#8f4645" />
                  <View style={{ marginLeft: 4 }}>
                    <Text style={styles.weatherLabel}>Wind Speed</Text>
                    <Text style={styles.weatherValue}>{data.weather.windSpeed}</Text>
                  </View>
                </View>

                <View style={styles.weatherItem}>
                  <Ionicons name="eye-outline" size={18} color="#1A5F45" />
                  <View style={{ marginLeft: 4 }}>
                    <Text style={styles.weatherLabel}>Visibility</Text>
                    <Text style={styles.weatherValue}>{data.weather.visibility}</Text>
                  </View>
                </View>

                <View style={styles.weatherItem}>
                  <Ionicons name="sunny-outline" size={18} color="#d97706" />
                  <View style={{ marginLeft: 4 }}>
                    <Text style={styles.weatherLabel}>Sun Cycle</Text>
                    <Text style={styles.weatherValue} numberOfLines={1}>{data.weather.sunrise} - {data.weather.sunset}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.suitabilityBanner, { backgroundColor: suitabilityInfo.bg, borderColor: suitabilityInfo.border }]}>
                <View style={styles.suitabilityLeft}>
                  <Ionicons 
                    name={data.weather.suitability === 'Good' ? 'checkmark-circle' : (data.weather.suitability === 'Moderate' ? 'alert-circle' : 'close-circle')} 
                    size={18} 
                    color={suitabilityInfo.text} 
                  />
                  <Text style={[styles.suitabilityText, { color: suitabilityInfo.text }]}>
                    Adventure Suitability: <Text style={{ fontWeight: '800' }}>{suitabilityInfo.label}</Text>
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Safety & Preparedness Widget */}
          <View style={[styles.section, styles.borderTop]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <MaterialIcons name="security" size={20} color="#1A5F45" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Safety & Preparedness</Text>
            </View>

            <View style={styles.safetyCard}>
              {/* Top Row: Tags */}
              <View style={styles.safetyTagsRow}>
                <View style={[styles.safetyTag, styles.safetyTagDiff]}>
                  <Ionicons name="bar-chart-outline" size={12} color="#1E3A8A" />
                  <Text style={styles.safetyTagTextDiff}>{data.safety.difficulty} Difficulty</Text>
                </View>
                {data.safety.tags.map((t) => (
                  <View key={t} style={[styles.safetyTag, styles.safetyTagFriendly]}>
                    <Ionicons name="heart-outline" size={12} color="#9D174D" />
                    <Text style={styles.safetyTagTextFriendly}>{t}</Text>
                  </View>
                ))}
              </View>

              {/* Fitness & Medical */}
              <View style={styles.infoBlock}>
                <View style={styles.infoTitleRow}>
                  <MaterialCommunityIcons name="heart-pulse" size={16} color="#ba1a1a" />
                  <Text style={styles.infoBlockTitle}>Fitness Requirement</Text>
                </View>
                <Text style={styles.infoBlockText}>{data.safety.fitnessReq}</Text>
              </View>

              <View style={[styles.infoBlock, { marginTop: 12 }]}>
                <View style={styles.infoTitleRow}>
                  <MaterialIcons name="medical-services" size={16} color="#ba1a1a" />
                  <Text style={styles.infoBlockTitle}>Medical Advisory</Text>
                </View>
                <Text style={styles.infoBlockText}>{data.safety.medicalAdv}</Text>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.guideRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#1A5F45" style={{ marginRight: 4 }} />
                <Text style={styles.guideText}>
                  {data.safety.certifiedGuide ? 'Certified Local Guide Available (Included)' : 'Self-guided (Operator Support Available)'}
                </Text>
              </View>

              <View style={styles.emergencyCard}>
                <View style={styles.emergencyItem}>
                  <Ionicons name="call" size={14} color="#181d1a" />
                  <Text style={styles.emergencyLabel}>Emergency Support: </Text>
                  <Text style={styles.emergencyValue}>{data.safety.emergencyContact}</Text>
                </View>
                <View style={[styles.emergencyItem, { marginTop: 6 }]}>
                  <Ionicons name="business" size={14} color="#181d1a" />
                  <Text style={styles.emergencyLabel}>Nearest Facility: </Text>
                  <Text style={styles.emergencyValue} numberOfLines={1}>{data.safety.nearestHospital}</Text>
                </View>
              </View>



            </View>
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

  /* Weather Widget Styles */
  weatherCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.3)',
    marginTop: 8,
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: '800',
    color: '#181d1a',
  },
  weatherCondition: {
    fontSize: 16,
    color: '#3f4943',
    fontWeight: '600',
    marginTop: 2,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.2)',
  },
  weatherLabel: {
    fontSize: 11,
    color: '#6f7a73',
  },
  weatherValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#181d1a',
  },
  suitabilityBanner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  suitabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suitabilityText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 12,
    color: '#b91c1c',
  },

  /* Safety Widget Styles */
  safetyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.3)',
    marginTop: 8,
  },
  safetyTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  safetyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  safetyTagDiff: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  safetyTagFriendly: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
  },
  safetyTagTextDiff: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '700',
  },
  safetyTagTextFriendly: {
    fontSize: 11,
    color: '#9D174D',
    fontWeight: '700',
  },
  infoBlock: {
    backgroundColor: '#fafbfc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.15)',
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181d1a',
  },
  infoBlockText: {
    fontSize: 12,
    color: '#3f4943',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(190,201,193,0.3)',
    marginVertical: 16,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guideText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#181d1a',
  },
  emergencyCard: {
    backgroundColor: '#f1f4f0',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.2)',
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3f4943',
    marginLeft: 6,
  },
  emergencyValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5F45',
    flex: 1,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181d1a',
    marginBottom: 2,
  },
  checklistSubtitle: {
    fontSize: 12,
    color: '#6f7a73',
    marginBottom: 12,
  },
  checklistGrid: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checklistItemActive: {
    backgroundColor: 'rgba(26,95,69,0.03)',
    borderColor: '#1A5F45',
  },
  checklistText: {
    fontSize: 13,
    color: '#3f4943',
  },
  checklistTextActive: {
    color: '#1A5F45',
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  checklistProgressContainer: {
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A5F45',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressLabelText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
  },
  successCelebration: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  safetyVerdictMessage: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
    marginTop: 10,
    fontStyle: 'italic',
  },
});