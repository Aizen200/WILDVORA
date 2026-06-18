import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function BookingScreen({ route, navigation }) {
  const { user } = useAuth();
  const experience = route.params?.experience;

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

  useEffect(() => {
    if (!experience) navigation.goBack();
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

  const handleConfirm = async () => {
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
      setViewDone(true);
    } catch {
      setViewDone(true);
    } finally {
      setLoading(false);
    }
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1A5F45" />
          </TouchableOpacity>
          <Text style={styles.logo}>Wildvora</Text>
        </View>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!viewDone ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperRow}>
              <View style={styles.stepCol}>
                <View style={styles.stepDotDone}><Text style={styles.stepDotTextDone}>1</Text></View>
                <Text style={styles.stepLabelActive}>Dates</Text>
              </View>
              <View style={styles.stepLineActive} />
              <View style={styles.stepCol}>
                <View style={styles.stepDotDone}><Text style={styles.stepDotTextDone}>2</Text></View>
                <Text style={styles.stepLabelActive}>Guests</Text>
              </View>
              <View style={styles.stepLineActive} />
              <View style={styles.stepCol}>
                <View style={styles.stepDotActive}><Text style={styles.stepDotTextActive}>3</Text></View>
                <Text style={styles.stepLabelActive}>Payment</Text>
              </View>
              <View style={styles.stepLineInactive} />
              <View style={styles.stepCol}>
                <View style={styles.stepDotInactive}><Text style={styles.stepDotTextInactive}>4</Text></View>
                <Text style={styles.stepLabelInactive}>Done</Text>
              </View>
            </View>
          </View>

          {/* Date Selection Card */}
          <View style={styles.card}>
            {/* Month navigation header */}
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

            {/* Trip duration badge */}
            <View style={styles.durationBadge}>
              <MaterialCommunityIcons name="calendar-range" size={13} color="#1A5F45" />
              <Text style={styles.durationBadgeText}>
                {tripDays}-day trip · Tap an available date to auto-select
              </Text>
            </View>

            {/* Calendar */}
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

            {/* Legend */}
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

            {/* Selected range summary */}
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
          </View>

          {/* Guests Card */}
          <View style={styles.card}>
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
                    onPress={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={adults <= 1 ? '#bec9c1' : '#1A5F45'} />
                  </TouchableOpacity>
                  <Text style={styles.stepperVal}>{adults}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setAdults(adults + 1)}
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
                    onPress={() => setChildren(Math.max(0, children - 1))}
                    disabled={children === 0}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={children === 0 ? '#bec9c1' : '#1A5F45'} />
                  </TouchableOpacity>
                  <Text style={styles.stepperVal}>{children}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setChildren(children + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color="#1A5F45" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Method</Text>
            <View style={styles.paymentMethodList}>
              <TouchableOpacity
                style={[styles.paymentRow, paymentMethod === 'card' && styles.paymentRowSelected]}
                onPress={() => setPaymentMethod('card')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentRowLeft}>
                  <Ionicons name="card-outline" size={22} color={paymentMethod === 'card' ? '#1A5F45' : '#6f7a73'} />
                  <Text style={[styles.paymentMethodLabel, paymentMethod === 'card' && styles.paymentMethodLabelSelected]}>
                    Credit Card
                  </Text>
                </View>
                {paymentMethod === 'card' && <Ionicons name="checkmark-circle" size={20} color="#1A5F45" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentRow, paymentMethod === 'apple_pay' && styles.paymentRowSelected]}
                onPress={() => setPaymentMethod('apple_pay')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentRowLeft}>
                  <Ionicons name="logo-apple" size={22} color={paymentMethod === 'apple_pay' ? '#1A5F45' : '#6f7a73'} />
                  <Text style={[styles.paymentMethodLabel, paymentMethod === 'apple_pay' && styles.paymentMethodLabelSelected]}>
                    Apple Pay
                  </Text>
                </View>
                {paymentMethod === 'apple_pay' && <Ionicons name="checkmark-circle" size={20} color="#1A5F45" />}
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
          </View>

          {/* Booking Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.heroImageContainer}>
              <Image
                source={{ uri: experience.coverImage || experience.images?.[0] || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAV_xkdn4s6l3_zO7n67c2arjobqCE3w4SemT8y6Rzkr5MLamhUsugWnQzI5pIxqQhKHFwc1fKbcFjOq0W3A4KlknUl6AX4uzAqhytBObipQp0OOTpn6ll6fMeyh4BCnFV-fitJAhFSikjTIROwcrWhL1rB13g3-J_GNSIefkXFImCxZg8ugsD52O0JRI4NpIbSsU-13BTLw4J3Mns7n9pDcsd9MWHYlQOCNplJoGDC1g-VoRnSKxrPtnOQNy2jJ136zzKfMN2Kzjg' }}
                style={styles.heroImage}
              />
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{experience.title}</Text>
                <View style={styles.heroLocationRow}>
                  <Ionicons name="location" size={14} color="#ffffff" />
                  <Text style={styles.heroLocation}>
                    {experience.location?.city
                      ? `${experience.location.city}, ${experience.location.country}`
                      : 'Wildvora Experience'}
                  </Text>
                </View>
              </View>
            </View>

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

              {/* Price Breakdown */}
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
                  <Text style={styles.totalPriceText}>₹{grandTotal.toFixed(0)}</Text>
                  <Text style={styles.totalSubText}>
                    for {adults + children} {adults + children === 1 ? 'guest' : 'guests'} · {tripDays} days
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.payBtn} onPress={handleConfirm} disabled={loading} activeOpacity={0.9}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.payBtnInner}>
                    <Ionicons name="lock-closed" size={16} color="#ffffff" style={styles.payIcon} />
                    <Text style={styles.payBtnText}>Confirm & Pay ₹{grandTotal.toFixed(0)}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.guideNoteText}>You won't be charged until the guide confirms.</Text>
            </View>
          </View>

          {/* Wildvora Protection */}
          <View style={styles.protectionCard}>
            <View style={styles.shieldIconContainer}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#0a6687" />
            </View>
            <View style={styles.protectionBody}>
              <Text style={styles.protectionTitle}>Wildvora Protection</Text>
              <Text style={styles.protectionText}>
                Full refund if weather conditions are unsafe for the expedition.
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
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
      )}

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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7faf6' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#f7faf6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190,201,193,0.15)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  closeBtn: { padding: 4, ...Platform.select({ web: { cursor: 'pointer' } }) },
  logo: { fontFamily: 'Quicksand', fontSize: 24, fontWeight: '700', color: '#1A5F45' },
  avatarContainer: {
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(17,105,75,0.15)',
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 },

  // ── Stepper ──────────────────────────────────────────────────────────────────
  stepperContainer: { marginBottom: 28 },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 8,
  },
  stepCol: { alignItems: 'center', gap: 6 },
  stepDotDone: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A5F45',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  stepDotTextDone: { color: '#ffffff', fontWeight: '700', fontSize: 14, fontFamily: 'Quicksand' },
  stepDotActive: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff',
    borderWidth: 2, borderColor: '#1A5F45', justifyContent: 'center', alignItems: 'center',
  },
  stepDotTextActive: { color: '#1A5F45', fontWeight: '700', fontSize: 14, fontFamily: 'Quicksand' },
  stepDotInactive: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e3df',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotTextInactive: { color: '#6f7a73', fontWeight: '700', fontSize: 14, fontFamily: 'Quicksand' },
  stepLabelActive: { fontFamily: 'Quicksand', fontSize: 12, fontWeight: '700', color: '#1A5F45' },
  stepLabelInactive: { fontFamily: 'Quicksand', fontSize: 12, fontWeight: '600', color: '#6f7a73' },
  stepLineActive: { flex: 1, height: 2, backgroundColor: '#1A5F45', marginBottom: 20 },
  stepLineInactive: { flex: 1, height: 2, backgroundColor: '#bec9c1', marginBottom: 20 },

  // ── Cards ─────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)',
    padding: 20, marginBottom: 20,
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

  // ── Payment ──────────────────────────────────────────────────────────────────
  paymentMethodList: { marginTop: 8, gap: 12 },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderWidth: 2, borderColor: 'rgba(190,201,193,0.3)',
    borderRadius: 12, backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  paymentRowSelected: { borderColor: '#1A5F45', backgroundColor: 'rgba(17,105,75,0.03)' },
  paymentRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentMethodLabel: {
    fontFamily: 'Quicksand', fontSize: 14, fontWeight: '700', color: '#6f7a73',
  },
  paymentMethodLabelSelected: { color: '#1A5F45' },
  cardInputsContainer: { marginTop: 16, gap: 12 },
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
    overflow: 'hidden', marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  heroImageContainer: { height: 180, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16,
  },
  heroTitle: {
    fontFamily: 'Quicksand', fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 4,
  },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroLocation: { fontFamily: 'Quicksand', fontSize: 12, color: '#ffffff', opacity: 0.9 },
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
    alignItems: 'center', marginBottom: 20,
  },
  totalLabel: { fontFamily: 'Quicksand', fontSize: 20, fontWeight: '700', color: '#181d1a' },
  totalPriceText: { fontFamily: 'Quicksand', fontSize: 22, fontWeight: '700', color: '#1A5F45', textAlign: 'right' },
  totalSubText: {
    fontFamily: 'Quicksand', fontSize: 11, color: '#6f7a73',
    fontWeight: '500', textAlign: 'right', marginTop: 2,
  },
  payBtn: {
    backgroundColor: '#1A5F45', borderRadius: 24, height: 52,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
      web: { cursor: 'pointer' },
    }),
  },
  payBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payIcon: { marginTop: -2 },
  payBtnText: { fontFamily: 'Quicksand', fontSize: 16, fontWeight: '700', color: '#ffffff' },
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
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 90,
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
