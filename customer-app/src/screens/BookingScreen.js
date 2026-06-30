import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../utils/alert';

const HERO_FALLBACK = require('../../assets/heroimage.png');

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LONG_MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const parseDurationDays = (str) => {
  if (!str) return 1;
  const m = str.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
};

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ── OWM icon code → native icon (lightweight version of the one used on the detail screen) ──
const getOWMIcon = (iconCode, size = 26) => {
  const code = iconCode?.slice(0, 2) || '01';
  const isNight = iconCode?.endsWith('n');
  const p = { size };
  switch (code) {
    case '01': return isNight
      ? <MaterialCommunityIcons name="weather-night" {...p} color="#4B5563" />
      : <MaterialCommunityIcons name="weather-sunny" {...p} color="#F59E0B" />;
    case '02':
    case '03': return <MaterialCommunityIcons name="weather-partly-cloudy" {...p} color="#64748B" />;
    case '04': return <MaterialCommunityIcons name="weather-cloudy" {...p} color="#78909C" />;
    case '09': return <MaterialCommunityIcons name="weather-pouring" {...p} color="#3B82F6" />;
    case '10': return <MaterialCommunityIcons name="weather-rainy" {...p} color="#2563EB" />;
    case '11': return <MaterialCommunityIcons name="weather-lightning-rainy" {...p} color="#7C3AED" />;
    case '13': return <MaterialCommunityIcons name="weather-snowy" {...p} color="#60A5FA" />;
    case '50': return <MaterialCommunityIcons name="weather-fog" {...p} color="#9CA3AF" />;
    default:   return <MaterialCommunityIcons name="weather-partly-cloudy" {...p} color="#64748B" />;
  }
};

// ── Keyword → icon for "What's Included" chips ──
const getInclusionIcon = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('guide')) return 'compass-outline';
  if (t.includes('meal') || t.includes('food') || t.includes('breakfast') || t.includes('lunch') || t.includes('dinner')) return 'food-outline';
  if (t.includes('equip') || t.includes('gear')) return 'bag-personal-outline';
  if (t.includes('transport') || t.includes('transfer') || t.includes('pickup')) return 'car-outline';
  if (t.includes('stay') || t.includes('camp') || t.includes('accommodation') || t.includes('tent')) return 'tent';
  if (t.includes('insurance') || t.includes('safety')) return 'shield-check-outline';
  if (t.includes('first aid') || t.includes('medical')) return 'medical-bag';
  if (t.includes('water')) return 'cup-water';
  return 'check-circle-outline';
};

// ── Small reusable component for the price pulse animation ──
function AnimatedPrice({ value, style, prefix = '₹' }) {
  const scale = useSharedValue(1);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      scale.value = withSequence(
        withTiming(1.14, { duration: 140 }),
        withTiming(1, { duration: 200 }),
      );
      prevValue.current = value;
    }
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[style, animStyle]}>
      {prefix}{value.toFixed(0)}
    </Animated.Text>
  );
}

export default function BookingScreen({ route, navigation }) {
  const { user } = useAuth();
  const experience = route.params?.experience;
  const insets = useSafeAreaInsets();

  const tripDays = parseDurationDays(experience?.duration);
  const availableDateStrings = experience?.availableDates || [];

  const _today = new Date();
  _today.setHours(0, 0, 0, 0);

  const availableDateSet = new Set(
    availableDateStrings
      .map(s => { const d = new Date(s); return isNaN(d.getTime()) ? null : toDateKey(d); })
      .filter(Boolean)
  );

  const sortedFutureDates = availableDateStrings
    .map(s => { const d = new Date(s); d.setHours(0,0,0,0); return d; })
    .filter(d => !isNaN(d.getTime()) && d >= _today)
    .sort((a, b) => a - b);

  const _initStart = sortedFutureDates.length > 0 ? sortedFutureDates[0] : _today;
  const _initEnd = new Date(_initStart);
  _initEnd.setDate(_initEnd.getDate() + tripDays - 1);

  // All hooks declared before any conditional return
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewDone, setViewDone] = useState(false);
  const [checkInDate, setCheckInDate] = useState(_initStart);
  const [checkOutDate, setCheckOutDate] = useState(_initEnd);
  const [currentMonth, setCurrentMonth] = useState(_initStart.getMonth());
  const [currentYear, setCurrentYear] = useState(_initStart.getFullYear());

  // Progressive flow: 'dates' -> 'guests' -> 'checkout'
  const [step, setStep] = useState('dates');

  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    if (!experience) navigation.goBack();
  }, [experience]);

  useEffect(() => {
    if (!experience) return;
    const fetchWeatherPreview = async () => {
      const city = experience.location?.city || '';
      const country = experience.location?.country || 'IN';
      const WEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      if (!WEATHER_KEY || !city) { setWeatherLoading(false); setWeatherError(true); return; }
      try {
        setWeatherLoading(true);
        setWeatherError(false);
        const q = encodeURIComponent(`${city},${country}`);
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${WEATHER_KEY}&units=metric`);
        const w = await res.json();
        if (w.cod !== 200) throw new Error('Weather API error');
        const tempC    = Math.round(w.main?.temp || 20);
        const condMain = w.weather?.[0]?.main || 'Clear';
        const condDesc = w.weather?.[0]?.description || 'clear sky';
        const iconCode = w.weather?.[0]?.icon || '01d';
        const windKmh  = Math.round((w.wind?.speed || 0) * 3.6);

        let suitability = 'Good';
        let note = 'Pleasant conditions expected for your trip. Pack light layers.';
        if (condMain === 'Thunderstorm') {
          suitability = 'Caution';
          note = 'Thunderstorm activity reported in the area — pack accordingly.';
        } else if (['Rain', 'Drizzle'].includes(condMain)) {
          suitability = 'Caution';
          note = 'Rain is likely — carry waterproof gear.';
        } else if (windKmh > 30) {
          suitability = 'Caution';
          note = `Elevated winds (${windKmh} km/h) expected — dress warmly.`;
        }

        setWeatherData({
          temp: tempC,
          condition: condDesc.charAt(0).toUpperCase() + condDesc.slice(1),
          iconCode,
          suitability,
          note,
        });
      } catch {
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeatherPreview();
  }, [experience]);

  if (!experience) return null;

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleDayPress = (date) => {
    if (date < _today) return;
    const dateKey = toDateKey(date);
    const hasAvailableDates = availableDateSet.size > 0;
    if (hasAvailableDates && !availableDateSet.has(dateKey)) return;
    const end = new Date(date);
    end.setDate(end.getDate() + tripDays - 1);
    setCheckInDate(date);
    setCheckOutDate(end);
    Haptics.selectionAsync();
  };

  const formatDateRange = () => {
    if (!checkInDate) return 'Select dates';
    const inStr = `${SHORT_MONTHS[checkInDate.getMonth()]} ${checkInDate.getDate()}`;
    if (!checkOutDate) return inStr;
    const outStr = `${SHORT_MONTHS[checkOutDate.getMonth()]} ${checkOutDate.getDate()}`;
    return `${inStr} – ${outStr}, ${checkInDate.getFullYear()}`;
  };

  // Per-person pricing: adults at full price, children at 50%
  const adultTotal   = (experience.price || 0) * adults;
  const childTotal   = (experience.price || 0) * 0.5 * children;
  const basePrice    = adultTotal + childTotal;
  const serviceFee   = Math.round(basePrice * 0.05);
  const taxes        = Math.round(basePrice * 0.03);
  const grandTotal   = basePrice + serviceFee + taxes;

  const handleConfirmDates = () => {
    if (!checkInDate) {
      Alert.alert('Select a date', 'Please select a start date for your trip.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('guests');
  };

  const handleConfirmGuests = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('checkout');
  };

  const handleEditDates = () => { Haptics.selectionAsync(); setStep('dates'); };
  const handleEditGuests = () => { Haptics.selectionAsync(); setStep('guests'); };

  const handleConfirm = async () => {
    if (!checkInDate) {
      Alert.alert('Select a date', 'Please select a start date for your trip.');
      return;
    }
    setLoading(true);
    try {
      await bookingAPI.create({
        experienceId: experience._id,
        startDate: toDateKey(checkInDate),
        endDate: toDateKey(checkOutDate),
        adults,
        children,
        paymentMethod,
        totalPrice: grandTotal,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setViewDone(true);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = () => {
    if (loading) return;
    if (step === 'dates') return handleConfirmDates();
    if (step === 'guests') return handleConfirmGuests();
    return handleConfirm();
  };

  // Build calendar grid: nulls for empty leading cells, then dates for the month
  const getDaysGrid = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const grid = [];
    for (let i = 0; i < firstDayIndex; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(new Date(currentYear, currentMonth, day));
    }
    return grid;
  };

  const renderCalendarDay = (date, idx) => {
    if (!date) return <View key={`e-${idx}`} style={styles.calendarCell} />;

    const dateKey    = toDateKey(date);
    const isPast     = date < _today;
    const hasSlots   = availableDateSet.size > 0;
    const isSlot     = availableDateSet.has(dateKey);
    const isDisabled = isPast || (hasSlots && !isSlot);

    const isCheckIn  = checkInDate  && toDateKey(checkInDate)  === dateKey;
    const isCheckOut = checkOutDate && toDateKey(checkOutDate) === dateKey;
    const isInRange  = checkInDate && checkOutDate && date > checkInDate && date < checkOutDate;

    if (isCheckIn || isCheckOut) {
      return (
        <TouchableOpacity
          key={dateKey}
          style={[styles.calendarCell, styles.calendarDaySelected]}
          onPress={() => handleDayPress(date)}
          activeOpacity={0.85}
        >
          <Text style={styles.calendarTextSelected}>{date.getDate()}</Text>
        </TouchableOpacity>
      );
    }

    if (isInRange) {
      return (
        <View key={dateKey} style={[styles.calendarCell, styles.calendarDayRange]}>
          <Text style={styles.calendarTextRange}>{date.getDate()}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={dateKey}
        style={styles.calendarCell}
        onPress={() => handleDayPress(date)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <Text style={[
          styles.calendarTextNormal,
          isDisabled && styles.calendarTextDisabled,
          isSlot && !isPast && styles.calendarTextSlot,
        ]}>
          {date.getDate()}
        </Text>
        {isSlot && !isPast && <View style={styles.slotDot} />}
      </TouchableOpacity>
    );
  };

  const heroUri = experience.coverImage || experience.images?.[0] || experience.adventureImages?.[0];
  const ratingValue = experience.rating ? experience.rating.toFixed(1) : null;
  const locationText = experience.location?.city
    ? `${experience.location.city}, ${experience.location.country}`
    : (experience.location?.country || null);
  const availabilityText = sortedFutureDates.length > 0
    ? `Next: ${SHORT_MONTHS[sortedFutureDates[0].getMonth()]} ${sortedFutureDates[0].getDate()}`
    : 'Flexible dates';

  const inclusions = experience.includes || [];
  const stepIndex = step === 'dates' ? 0 : step === 'guests' ? 1 : 2;

  return (
    <View style={styles.root}>
      {!viewDone ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
          >
            {/* ── Immersive Hero ── */}
            <View style={styles.heroWrap}>
              <Image
                source={heroUri ? { uri: heroUri } : HERO_FALLBACK}
                style={styles.heroImage}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.75)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.heroIconBtn} activeOpacity={0.8}>
                  <Ionicons name="arrow-back" size={20} color="#181d1a" />
                </TouchableOpacity>
                <Text style={styles.heroLogo}>Wildvora</Text>
                <View style={styles.heroAvatarRing}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.heroAvatar} />
                  ) : (
                    <View style={[styles.heroAvatar, styles.heroAvatarFallback]}>
                      <Text style={styles.heroAvatarInitial}>
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.heroBadgeRow}>
                  {ratingValue && (
                    <View style={styles.heroRatingBadge}>
                      <Ionicons name="star" size={12} color="#F5C144" />
                      <Text style={styles.heroRatingText}>{ratingValue}</Text>
                      {experience.reviewCount > 0 && (
                        <Text style={styles.heroReviewText}>({experience.reviewCount})</Text>
                      )}
                    </View>
                  )}
                  {experience.hostVerified && (
                    <View style={styles.heroVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#88d6b2" />
                      <Text style={styles.heroVerifiedText}>Verified Host</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroTitleText} numberOfLines={2}>{experience.title}</Text>
                <View style={styles.heroMetaRow}>
                  {locationText && (
                    <View style={styles.heroMetaItem}>
                      <Ionicons name="location-sharp" size={13} color="#ffffff" />
                      <Text style={styles.heroMetaText}>{locationText}</Text>
                    </View>
                  )}
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="time-outline" size={13} color="#ffffff" />
                    <Text style={styles.heroMetaText}>{experience.duration}</Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#ffffff" />
                    <Text style={styles.heroMetaText}>{availabilityText}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.body}>
              {/* ── Stepper ── */}
              <View style={styles.stepperContainer}>
                <View style={styles.stepperRow}>
                  {['Dates', 'Guests', 'Checkout'].map((label, idx) => (
                    <React.Fragment key={label}>
                      <View style={styles.stepCol}>
                        <View style={
                          idx < stepIndex ? styles.stepDotDone
                          : idx === stepIndex ? styles.stepDotActive
                          : styles.stepDotInactive
                        }>
                          {idx < stepIndex ? (
                            <Ionicons name="checkmark" size={16} color="#ffffff" />
                          ) : (
                            <Text style={idx === stepIndex ? styles.stepDotTextActive : styles.stepDotTextInactive}>
                              {idx + 1}
                            </Text>
                          )}
                        </View>
                        <Text style={idx <= stepIndex ? styles.stepLabelActive : styles.stepLabelInactive}>
                          {label}
                        </Text>
                      </View>
                      {idx < 2 && (
                        <View style={idx < stepIndex ? styles.stepLineActive : styles.stepLineInactive} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>

              {/* ── Date Section ── */}
              {step === 'dates' ? (
                <Animated.View layout={LinearTransition.springify().damping(18)} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>Select Dates</Text>
                    <View style={styles.monthNavRow}>
                      <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={20} color="#1A5F45" />
                      </TouchableOpacity>
                      <Text style={styles.monthLabel}>
                        {LONG_MONTHS[currentMonth].slice(0, 3)} {currentYear}
                      </Text>
                      <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
                        <Ionicons name="chevron-forward" size={20} color="#1A5F45" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.durationBadge}>
                    <MaterialCommunityIcons name="calendar-range" size={13} color="#1A5F45" />
                    <Text style={styles.durationBadgeText}>
                      {tripDays}-day trip · Tap an available date to auto-select
                    </Text>
                  </View>

                  <View style={styles.calendarContainer}>
                    <View style={styles.weekdaysRow}>
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
                        <Text key={i} style={styles.weekdayText}>{d}</Text>
                      ))}
                    </View>
                    <View style={styles.daysGrid}>
                      {getDaysGrid().map((date, idx) => renderCalendarDay(date, idx))}
                    </View>
                  </View>

                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#1A5F45' }]} />
                      <Text style={styles.legendText}>Available start</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendSwatch, { backgroundColor: 'rgba(26,95,69,0.12)' }]} />
                      <Text style={styles.legendText}>Selected range</Text>
                    </View>
                  </View>

                  {checkInDate && checkOutDate && (
                    <View style={styles.selectedRangeRow}>
                      <View style={styles.selectedRangeItem}>
                        <Text style={styles.selectedRangeLabel}>CHECK-IN</Text>
                        <Text style={styles.selectedRangeVal}>
                          {SHORT_MONTHS[checkInDate.getMonth()]} {checkInDate.getDate()}, {checkInDate.getFullYear()}
                        </Text>
                      </View>
                      <View style={styles.selectedRangeDivider} />
                      <View style={styles.selectedRangeItem}>
                        <Text style={styles.selectedRangeLabel}>CHECK-OUT</Text>
                        <Text style={styles.selectedRangeVal}>
                          {SHORT_MONTHS[checkOutDate.getMonth()]} {checkOutDate.getDate()}, {checkOutDate.getFullYear()}
                        </Text>
                      </View>
                      <View style={styles.selectedRangeDaysBox}>
                        <Text style={styles.selectedRangeDaysNum}>{tripDays}</Text>
                        <Text style={styles.selectedRangeDaysLabel}>days</Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn.duration(250)} layout={LinearTransition.springify().damping(18)}>
                  <TouchableOpacity style={styles.compactCard} onPress={handleEditDates} activeOpacity={0.85}>
                    <View style={styles.compactIconWrap}>
                      <Ionicons name="calendar" size={18} color="#1A5F45" />
                    </View>
                    <View style={styles.compactBody}>
                      <Text style={styles.compactLabel}>DATES</Text>
                      <Text style={styles.compactValue}>{formatDateRange()} · {tripDays} {tripDays === 1 ? 'day' : 'days'}</Text>
                    </View>
                    <Text style={styles.compactEdit}>Edit</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* ── Guests Section ── */}
              {step !== 'dates' && (
                step === 'guests' ? (
                  <Animated.View
                    entering={FadeInDown.duration(400).springify().damping(18)}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition.springify().damping(18)}
                    style={styles.card}
                  >
                    <Text style={styles.cardTitle}>Who's coming?</Text>
                    <View style={styles.guestRowsContainer}>
                      <View style={styles.guestRow}>
                        <View>
                          <Text style={styles.guestType}>Adults</Text>
                          <Text style={styles.guestAgeSub}>Ages 13+ · ₹{(experience.price || 0).toFixed(0)}/person</Text>
                        </View>
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            style={[styles.stepperBtn, adults <= 1 && styles.stepperBtnDisabled]}
                            onPress={() => { setAdults(Math.max(1, adults - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            disabled={adults <= 1}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={18} color={adults <= 1 ? '#bec9c1' : '#1A5F45'} />
                          </TouchableOpacity>
                          <Text style={styles.stepperVal}>{adults}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => { setAdults(adults + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={18} color="#1A5F45" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.guestRow}>
                        <View>
                          <Text style={styles.guestType}>Children</Text>
                          <Text style={styles.guestAgeSub}>Ages 2–12 · ₹{((experience.price || 0) * 0.5).toFixed(0)}/child</Text>
                        </View>
                        <View style={styles.stepper}>
                          <TouchableOpacity
                            style={[styles.stepperBtn, children === 0 && styles.stepperBtnDisabled]}
                            onPress={() => { setChildren(Math.max(0, children - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            disabled={children === 0}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={18} color={children === 0 ? '#bec9c1' : '#1A5F45'} />
                          </TouchableOpacity>
                          <Text style={styles.stepperVal}>{children}</Text>
                          <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => { setChildren(children + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={18} color="#1A5F45" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ) : (
                  <Animated.View entering={FadeIn.duration(250)} layout={LinearTransition.springify().damping(18)}>
                    <TouchableOpacity style={styles.compactCard} onPress={handleEditGuests} activeOpacity={0.85}>
                      <View style={styles.compactIconWrap}>
                        <Ionicons name="people" size={18} color="#1A5F45" />
                      </View>
                      <View style={styles.compactBody}>
                        <Text style={styles.compactLabel}>GUESTS</Text>
                        <Text style={styles.compactValue}>
                          {adults} Adult{adults > 1 ? 's' : ''}
                          {children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.compactEdit}>Edit</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )
              )}

              {/* ── Weather, Inclusions, Summary (revealed together at checkout) ── */}
              {step === 'checkout' && (
                <>
                  <Animated.View
                    entering={FadeInDown.delay(80).duration(450).springify().damping(18)}
                    layout={LinearTransition.springify().damping(18)}
                    style={styles.weatherCard}
                  >
                    {weatherLoading ? (
                      <View style={styles.weatherLoadingRow}>
                        <ActivityIndicator color="#1A5F45" size="small" />
                        <Text style={styles.weatherLoadingText}>Checking conditions…</Text>
                      </View>
                    ) : weatherError || !weatherData ? (
                      <View style={styles.weatherLoadingRow}>
                        <MaterialCommunityIcons name="weather-partly-cloudy" size={22} color="#6f7a73" />
                        <Text style={styles.weatherLoadingText}>Weather preview unavailable right now.</Text>
                      </View>
                    ) : (
                      <View style={styles.weatherRow}>
                        <View style={styles.weatherIconWrap}>
                          {getOWMIcon(weatherData.iconCode, 26)}
                        </View>
                        <View style={styles.weatherTextCol}>
                          <View style={styles.weatherTopLine}>
                            <Text style={styles.weatherTemp}>{weatherData.temp}°C</Text>
                            <View style={[
                              styles.weatherSuitBadge,
                              weatherData.suitability !== 'Good' && styles.weatherSuitBadgeCaution,
                            ]}>
                              <Text style={[
                                styles.weatherSuitText,
                                weatherData.suitability !== 'Good' && styles.weatherSuitTextCaution,
                              ]}>
                                {weatherData.suitability === 'Good' ? 'Perfect Conditions' : 'Use Caution'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.weatherNote}>{weatherData.note}</Text>
                        </View>
                      </View>
                    )}
                  </Animated.View>

                  <Animated.View
                    entering={FadeInDown.delay(160).duration(450).springify().damping(18)}
                    layout={LinearTransition.springify().damping(18)}
                    style={styles.includedCard}
                  >
                    <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
                    {inclusions.length > 0 ? (
                      <View style={styles.includedGrid}>
                        {inclusions.map((item, i) => (
                          <View key={i} style={styles.includedChip}>
                            <MaterialCommunityIcons name={getInclusionIcon(item)} size={18} color="#1A5F45" />
                            <Text style={styles.includedChipText} numberOfLines={2}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.includedEmptyText}>
                        Inclusion details will be shared by your host before the trip.
                      </Text>
                    )}
                  </Animated.View>

                  {/* Booking Summary Card */}
                  <Animated.View
                    entering={FadeInDown.delay(240).duration(450).springify().damping(18)}
                    layout={LinearTransition.springify().damping(18)}
                    style={styles.summaryCard}
                  >
                    <View style={styles.summaryContent}>
                      <View style={styles.summaryMetaRow}>
                        <View style={styles.summaryMetaCol}>
                          <Text style={styles.summaryMetaLabel}>DATE</Text>
                          <Text style={styles.summaryMetaVal}>{formatDateRange()}</Text>
                        </View>
                        <View style={styles.summaryMetaColRight}>
                          <Text style={styles.summaryMetaLabel}>GUESTS</Text>
                          <Text style={styles.summaryMetaVal}>
                            {adults} Adult{adults > 1 ? 's' : ''}
                            {children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.summaryDivider} />

                      <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                      <View style={styles.paymentChipsRow}>
                        <TouchableOpacity
                          style={[styles.paymentChip, paymentMethod === 'card' && styles.paymentChipSelected]}
                          onPress={() => { setPaymentMethod('card'); Haptics.selectionAsync(); }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="card-outline" size={18} color={paymentMethod === 'card' ? '#1A5F45' : '#6f7a73'} />
                          <Text style={[styles.paymentChipText, paymentMethod === 'card' && styles.paymentChipTextSelected]}>
                            Credit Card
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.paymentChip, paymentMethod === 'apple_pay' && styles.paymentChipSelected]}
                          onPress={() => { setPaymentMethod('apple_pay'); Haptics.selectionAsync(); }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="logo-apple" size={18} color={paymentMethod === 'apple_pay' ? '#1A5F45' : '#6f7a73'} />
                          <Text style={[styles.paymentChipText, paymentMethod === 'apple_pay' && styles.paymentChipTextSelected]}>
                            Apple Pay
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {paymentMethod === 'card' && (
                        <View style={styles.cardInputsContainer}>
                          <TextInput
                            style={styles.cardInputFull}
                            placeholder="Card number"
                            placeholderTextColor="#6f7a73"
                            value={cardNumber}
                            onChangeText={setCardNumber}
                            keyboardType="numeric"
                          />
                          <View style={styles.cardInputsRow}>
                            <TextInput
                              style={styles.cardInputHalf}
                              placeholder="Exp date"
                              placeholderTextColor="#6f7a73"
                              value={expDate}
                              onChangeText={setExpDate}
                            />
                            <TextInput
                              style={styles.cardInputHalf}
                              placeholder="CVV"
                              placeholderTextColor="#6f7a73"
                              value={cvv}
                              onChangeText={setCvv}
                              keyboardType="numeric"
                              secureTextEntry
                            />
                          </View>
                        </View>
                      )}

                      <View style={styles.summaryDivider} />

                      <View style={styles.breakdownRows}>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>
                            ₹{(experience.price || 0).toFixed(0)}/person × {adults} adult{adults > 1 ? 's' : ''}
                          </Text>
                          <Text style={styles.breakdownVal}>₹{adultTotal.toFixed(0)}</Text>
                        </View>
                        {children > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>
                              ₹{((experience.price || 0) * 0.5).toFixed(0)}/child × {children} child{children > 1 ? 'ren' : ''}
                            </Text>
                            <Text style={styles.breakdownVal}>₹{childTotal.toFixed(0)}</Text>
                          </View>
                        )}
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Service Fee (5%)</Text>
                          <Text style={styles.breakdownVal}>₹{serviceFee.toFixed(0)}</Text>
                        </View>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Taxes (3%)</Text>
                          <Text style={styles.breakdownVal}>₹{taxes.toFixed(0)}</Text>
                        </View>
                      </View>

                      <View style={styles.summaryDivider} />

                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <View>
                          <AnimatedPrice value={grandTotal} style={styles.totalPriceText} />
                          <Text style={styles.totalSubText}>
                            for {adults + children} {adults + children === 1 ? 'guest' : 'guests'} · {tripDays} days
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.guideNoteText}>You won't be charged until the guide confirms.</Text>
                    </View>
                  </Animated.View>

                  {/* Wildvora Protection */}
                  <Animated.View
                    entering={FadeInDown.delay(320).duration(450).springify().damping(18)}
                    layout={LinearTransition.springify().damping(18)}
                    style={styles.protectionCard}
                  >
                    <View style={styles.shieldIconContainer}>
                      <MaterialCommunityIcons name="shield-check" size={24} color="#0a6687" />
                    </View>
                    <View style={styles.protectionBody}>
                      <Text style={styles.protectionTitle}>Wildvora Protection</Text>
                      <Text style={styles.protectionText}>
                        Full refund if weather conditions are unsafe for the expedition.
                      </Text>
                    </View>
                  </Animated.View>
                </>
              )}
            </View>
          </ScrollView>

          {/* ── Sticky Bottom CTA ── */}
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View>
              <Text style={styles.stickyLabel}>Total Price</Text>
              <AnimatedPrice value={grandTotal} style={styles.stickyPriceText} />
            </View>
            <TouchableOpacity
              style={styles.stickyBtn}
              onPress={handlePrimaryAction}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.stickyBtnInner}>
                  <Text style={styles.stickyBtnText}>
                    {step === 'checkout' ? `Confirm & Pay` : 'Continue'}
                  </Text>
                  <Ionicons
                    name={step === 'checkout' ? 'lock-closed' : 'arrow-forward'}
                    size={16}
                    color="#ffffff"
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <SafeAreaView style={styles.doneSafe} edges={['top', 'bottom']}>
          <View style={styles.doneContainer}>
            <View style={styles.doneEmojiBg}>
              <Ionicons name="checkmark-circle" size={56} color="#1A5F45" />
            </View>
            <Text style={styles.doneTitle}>Booking Confirmed!</Text>
            <Text style={styles.doneSub}>
              Your adventure is booked. Get ready for {experience.title}!
            </Text>

            <View style={styles.doneDetailCard}>
              <View style={styles.doneDetailRow}>
                <Ionicons name="calendar-outline" size={18} color="#11694b" />
                <Text style={styles.doneDetailText}>{formatDateRange()}</Text>
              </View>
              <View style={styles.doneDetailRow}>
                <Ionicons name="people-outline" size={18} color="#1A5F45" />
                <Text style={styles.doneDetailText}>
                  {adults} Adult{adults > 1 ? 's' : ''}
                  {children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}
                </Text>
              </View>
              <View style={styles.doneDetailRow}>
                <Ionicons name="cash-outline" size={18} color="#11694b" />
                <Text style={styles.doneDetailText}>Total Paid: ₹{grandTotal.toFixed(0)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewTripsBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Trips' })}
              activeOpacity={0.9}
            >
              <Text style={styles.viewTripsBtnText}>View My Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.backHomeBtn} activeOpacity={0.7}>
              <Text style={styles.backHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Main', { screen: 'Home' })} activeOpacity={0.7}>
              <Ionicons name="compass-outline" size={22} color="#6f7a73" />
              <Text style={styles.tabText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Main', { screen: 'Search' })} activeOpacity={0.7}>
              <Ionicons name="search-outline" size={22} color="#6f7a73" />
              <Text style={styles.tabText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItemActive} activeOpacity={1}>
              <MaterialCommunityIcons name="hiking" size={22} color="#1A5F45" />
              <Text style={styles.tabTextActive}>Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Main', { screen: 'Profile' })} activeOpacity={0.7}>
              <Ionicons name="person-outline" size={22} color="#6f7a73" />
              <Text style={styles.tabText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7faf6' },
  doneSafe: { flex: 1, backgroundColor: '#f7faf6' },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scrollContent: { paddingBottom: 24 },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  heroWrap: { height: 340, width: '100%', position: 'relative', backgroundColor: '#0e2a20' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  heroIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  heroLogo: { fontFamily: 'Quicksand', fontSize: 20, fontWeight: '700', color: '#ffffff' },
  heroAvatarRing: {
    width: 38, height: 38, borderRadius: 19, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  heroAvatar: { width: '100%', height: '100%' },
  heroAvatarFallback: { backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  heroAvatarInitial: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  heroRatingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroRatingText: { fontFamily: 'Quicksand', fontSize: 12, fontWeight: '700', color: '#ffffff' },
  heroReviewText: { fontFamily: 'Quicksand', fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  heroVerifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(17,105,75,0.55)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroVerifiedText: { fontFamily: 'Quicksand', fontSize: 11, fontWeight: '700', color: '#ffffff' },
  heroTitleText: {
    fontFamily: 'Quicksand', fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 10,
  },
  heroMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { fontFamily: 'Quicksand', fontSize: 12, fontWeight: '600', color: '#ffffff' },

  // ── Body / shared section spacing ───────────────────────────────────────────
  body: { paddingHorizontal: 20, paddingTop: 20 },

  // ── Stepper ──────────────────────────────────────────────────────────────────
  stepperContainer: { marginBottom: 22 },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 8,
  },
  stepCol: { alignItems: 'center', gap: 6 },
  stepDotDone: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1A5F45',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff',
    borderWidth: 2, borderColor: '#1A5F45', justifyContent: 'center', alignItems: 'center',
  },
  stepDotTextActive: { color: '#1A5F45', fontWeight: '700', fontSize: 13, fontFamily: 'Quicksand' },
  stepDotInactive: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e3df',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotTextInactive: { color: '#6f7a73', fontWeight: '700', fontSize: 13, fontFamily: 'Quicksand' },
  stepLabelActive: { fontFamily: 'Quicksand', fontSize: 11, fontWeight: '700', color: '#1A5F45' },
  stepLabelInactive: { fontFamily: 'Quicksand', fontSize: 11, fontWeight: '600', color: '#6f7a73' },
  stepLineActive: { flex: 1, height: 2, backgroundColor: '#1A5F45', marginBottom: 18, marginHorizontal: 4 },
  stepLineInactive: { flex: 1, height: 2, backgroundColor: '#bec9c1', marginBottom: 18, marginHorizontal: 4 },

  // ── Cards ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)',
    padding: 20, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  cardTitle: { fontFamily: 'Quicksand', fontSize: 20, fontWeight: '700', color: '#181d1a' },

  // ── Compact (collapsed) summary cards ───────────────────────────────────────
  compactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(17,105,75,0.06)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(17,105,75,0.12)',
    padding: 14, marginBottom: 16,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  compactIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center',
  },
  compactBody: { flex: 1 },
  compactLabel: {
    fontFamily: 'Quicksand', fontSize: 10, fontWeight: '700',
    color: '#6f7a73', letterSpacing: 0.5, marginBottom: 2,
  },
  compactValue: { fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700', color: '#181d1a' },
  compactEdit: { fontFamily: 'Quicksand', fontSize: 13, fontWeight: '700', color: '#1A5F45' },

  // ── Calendar ──────────────────────────────────────────────────────────────────
  monthNavRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthNavBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(26,95,69,0.08)',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  monthLabel: {
    fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700',
    color: '#1A5F45', minWidth: 80, textAlign: 'center',
  },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(26,95,69,0.07)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start',
    marginBottom: 16,
  },
  durationBadgeText: {
    fontFamily: 'Quicksand', fontSize: 12, fontWeight: '600', color: '#1A5F45',
  },
  calendarContainer: { width: '100%' },
  weekdaysRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12,
  },
  weekdayText: {
    fontFamily: 'Quicksand', fontSize: 11, fontWeight: '700',
    color: '#6f7a73', width: 36, textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 4,
  },

  // Calendar day cells
  calendarCell: {
    width: 36, height: 42, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  calendarDaySelected: {
    backgroundColor: '#1A5F45', borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  calendarDayRange: {
    backgroundColor: 'rgba(26,95,69,0.10)', borderRadius: 0,
  },
  calendarTextSelected: {
    fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700', color: '#ffffff',
  },
  calendarTextRange: {
    fontFamily: 'Quicksand', fontSize: 14, fontWeight: '600', color: '#1A5F45',
  },
  calendarTextNormal: {
    fontFamily: 'Quicksand', fontSize: 14, fontWeight: '600', color: '#181d1a',
  },
  calendarTextSlot: { color: '#1A5F45', fontWeight: '700' },
  calendarTextDisabled: { color: '#d0d5d2' },
  slotDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#1A5F45', position: 'absolute', bottom: 4,
  },

  // Legend
  legendRow: {
    flexDirection: 'row', gap: 16, marginTop: 14, marginBottom: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendSwatch: { width: 16, height: 10, borderRadius: 3 },
  legendText: { fontFamily: 'Quicksand', fontSize: 11, color: '#6f7a73', fontWeight: '600' },

  // Selected range row
  selectedRangeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f1f7f4', borderRadius: 14,
    padding: 14, marginTop: 16, gap: 0,
  },
  selectedRangeItem: { flex: 1 },
  selectedRangeLabel: {
    fontFamily: 'Quicksand', fontSize: 10, fontWeight: '700',
    color: '#6f7a73', letterSpacing: 0.5, marginBottom: 3,
  },
  selectedRangeVal: {
    fontFamily: 'Quicksand', fontSize: 13, fontWeight: '700', color: '#181d1a',
  },
  selectedRangeDivider: {
    width: 1, height: 32, backgroundColor: 'rgba(190,201,193,0.5)', marginHorizontal: 12,
  },
  selectedRangeDaysBox: { alignItems: 'center', paddingLeft: 12 },
  selectedRangeDaysNum: {
    fontFamily: 'Quicksand', fontSize: 22, fontWeight: '700', color: '#1A5F45',
  },
  selectedRangeDaysLabel: {
    fontFamily: 'Quicksand', fontSize: 10, fontWeight: '700',
    color: '#6f7a73', letterSpacing: 0.5,
  },

  // ── Guests ───────────────────────────────────────────────────────────────────
  guestRowsContainer: { marginTop: 8, gap: 20 },
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guestType: { fontFamily: 'Quicksand', fontSize: 16, fontWeight: '700', color: '#181d1a' },
  guestAgeSub: { fontFamily: 'Quicksand', fontSize: 12, color: '#3f4943', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    borderColor: '#6f7a73', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#ffffff', ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  stepperBtnDisabled: { borderColor: '#bec9c1' },
  stepperVal: {
    fontFamily: 'Quicksand', fontSize: 20, fontWeight: '700',
    color: '#181d1a', minWidth: 20, textAlign: 'center',
  },

  // ── Weather Preview ──────────────────────────────────────────────────────────
  weatherCard: {
    backgroundColor: 'rgba(10,102,135,0.06)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(10,102,135,0.15)',
    padding: 16, marginBottom: 16,
  },
  weatherLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherLoadingText: { fontFamily: 'Quicksand', fontSize: 13, color: '#3f4943', fontWeight: '600' },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  weatherIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  weatherTextCol: { flex: 1, gap: 4 },
  weatherTopLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTemp: { fontFamily: 'Quicksand', fontSize: 17, fontWeight: '700', color: '#181d1a' },
  weatherSuitBadge: {
    backgroundColor: 'rgba(17,105,75,0.12)', borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  weatherSuitBadgeCaution: { backgroundColor: 'rgba(186,26,26,0.1)' },
  weatherSuitText: { fontFamily: 'Quicksand', fontSize: 10, fontWeight: '700', color: '#1A5F45' },
  weatherSuitTextCaution: { color: '#ba1a1a' },
  weatherNote: { fontFamily: 'Quicksand', fontSize: 12, color: '#3f4943', fontWeight: '500', lineHeight: 16 },

  // ── What's Included ──────────────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'Quicksand', fontSize: 11, fontWeight: '700',
    color: '#6f7a73', letterSpacing: 0.8, marginBottom: 12,
  },
  includedCard: {
    backgroundColor: '#ffffff', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)',
    padding: 16, marginBottom: 16,
  },
  includedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  includedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f1f7f4', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    width: '47%',
  },
  includedChipText: { fontFamily: 'Quicksand', fontSize: 12, fontWeight: '600', color: '#181d1a', flexShrink: 1 },
  includedEmptyText: { fontFamily: 'Quicksand', fontSize: 13, color: '#6f7a73', fontWeight: '500' },

  // ── Payment ──────────────────────────────────────────────────────────────────
  paymentChipsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  paymentChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderWidth: 2, borderColor: 'rgba(190,201,193,0.3)',
    borderRadius: 12, backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  paymentChipSelected: { borderColor: '#1A5F45', backgroundColor: 'rgba(17,105,75,0.03)' },
  paymentChipText: { fontFamily: 'Quicksand', fontSize: 13, fontWeight: '700', color: '#6f7a73' },
  paymentChipTextSelected: { color: '#1A5F45' },
  cardInputsContainer: { marginTop: 14, gap: 12 },
  cardInputFull: {
    height: 52, backgroundColor: '#f1f4f0', borderRadius: 8,
    paddingHorizontal: 16, fontFamily: 'Quicksand', fontSize: 15, color: '#181d1a',
  },
  cardInputsRow: { flexDirection: 'row', gap: 12 },
  cardInputHalf: {
    flex: 1, height: 52, backgroundColor: '#f1f4f0', borderRadius: 8,
    paddingHorizontal: 16, fontFamily: 'Quicksand', fontSize: 15, color: '#181d1a',
  },

  // ── Summary Card ─────────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#ffffff', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)',
    overflow: 'hidden', marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  summaryContent: { padding: 20 },
  summaryMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryMetaCol: { gap: 4 },
  summaryMetaColRight: { gap: 4, alignItems: 'flex-end' },
  summaryMetaLabel: {
    fontFamily: 'Quicksand', fontSize: 10, fontWeight: '700',
    color: '#bec9c1', letterSpacing: 0.5,
  },
  summaryMetaVal: { fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700', color: '#181d1a' },
  summaryDivider: { height: 1, backgroundColor: 'rgba(190,201,193,0.2)', marginVertical: 16 },
  breakdownRows: { gap: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  breakdownLabel: {
    fontFamily: 'Quicksand', fontSize: 13, color: '#3f4943',
    fontWeight: '500', flex: 1, paddingRight: 8,
  },
  breakdownVal: { fontFamily: 'Quicksand', fontSize: 13, color: '#181d1a', fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  totalLabel: { fontFamily: 'Quicksand', fontSize: 20, fontWeight: '700', color: '#181d1a' },
  totalPriceText: { fontFamily: 'Quicksand', fontSize: 22, fontWeight: '700', color: '#1A5F45', textAlign: 'right' },
  totalSubText: {
    fontFamily: 'Quicksand', fontSize: 11, color: '#6f7a73',
    fontWeight: '500', textAlign: 'right', marginTop: 2,
  },
  guideNoteText: {
    fontFamily: 'Quicksand', fontSize: 11, color: '#6f7a73',
    textAlign: 'center', marginTop: 12, fontWeight: '500',
  },

  // ── Protection Card ───────────────────────────────────────────────────────────
  protectionCard: {
    backgroundColor: 'rgba(10,102,135,0.07)', borderColor: 'rgba(10,102,135,0.18)',
    borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12,
  },
  shieldIconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(10,102,135,0.12)', justifyContent: 'center', alignItems: 'center',
  },
  protectionBody: { flex: 1, gap: 2 },
  protectionTitle: { fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700', color: '#0a6687' },
  protectionText: { fontFamily: 'Quicksand', fontSize: 12, color: '#004d68', lineHeight: 16 },

  // ── Sticky Bottom CTA ───────────────────────────────────────────────────────
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(190,201,193,0.25)',
    paddingHorizontal: 20, paddingTop: 14, gap: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  stickyLabel: {
    fontFamily: 'Quicksand', fontSize: 10, fontWeight: '700',
    color: '#6f7a73', letterSpacing: 0.5, marginBottom: 2,
  },
  stickyPriceText: { fontFamily: 'Quicksand', fontSize: 22, fontWeight: '700', color: '#1A5F45' },
  stickyBtn: {
    flex: 1, maxWidth: 200, backgroundColor: '#1A5F45', borderRadius: 24, height: 52,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { cursor: 'pointer' },
    }),
  },
  stickyBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stickyBtnText: { fontFamily: 'Quicksand', fontSize: 15, fontWeight: '700', color: '#ffffff' },

  // ── Done Screen ───────────────────────────────────────────────────────────────
  doneContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 60,
  },
  doneEmojiBg: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(17,105,75,0.08)', justifyContent: 'center',
    alignItems: 'center', marginBottom: 24,
  },
  doneTitle: {
    fontFamily: 'Quicksand', fontSize: 26, fontWeight: '700',
    color: '#181d1a', marginBottom: 8,
  },
  doneSub: {
    fontFamily: 'Quicksand', fontSize: 14, color: '#6f7a73',
    textAlign: 'center', lineHeight: 20, marginBottom: 32, fontWeight: '500',
  },
  doneDetailCard: {
    width: '100%', backgroundColor: '#f1f4f0', borderRadius: 16,
    padding: 20, gap: 14, borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.3)', marginBottom: 36,
  },
  doneDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doneDetailText: {
    fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700', color: '#3f4943',
  },
  viewTripsBtn: {
    width: '100%', backgroundColor: '#1A5F45', borderRadius: 24,
    height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  viewTripsBtnText: { fontFamily: 'Quicksand', fontSize: 15, fontWeight: '700', color: '#ffffff' },
  backHomeBtn: { paddingVertical: 8, ...Platform.select({ web: { cursor: 'pointer' } }) },
  backHomeText: {
    fontFamily: 'Quicksand', fontSize: 13, fontWeight: '700',
    color: '#6f7a73', textDecorationLine: 'underline',
  },

  // ── Tab Bar ───────────────────────────────────────────────────────────────────
  tabBar: {
    height: 72, backgroundColor: '#ffffff',
    borderTopWidth: 1, borderTopColor: 'rgba(190,201,193,0.2)',
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 2, paddingHorizontal: 12,
  },
  tabItemActive: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ebefea', borderRadius: 24,
    paddingHorizontal: 16, height: 40, gap: 8,
  },
  tabText: { fontFamily: 'Quicksand', fontSize: 11, fontWeight: '600', color: '#6f7a73' },
  tabTextActive: { fontFamily: 'Quicksand', fontSize: 12, fontWeight: '700', color: '#1A5F45' },
});
