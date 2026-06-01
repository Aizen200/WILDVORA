import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingAPI } from '../services/api';
import Alert from '../utils/alert';

const STEPS = ['Dates', 'Guests', 'Payment', 'Done'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d) {
  if (!d) return 'Select';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function BookingScreen({ route, navigation }) {
  const { experience } = route.params;
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  const totalGuests = adults + children;
  const totalPrice = experience.price * adults + (experience.price * 0.5 * children);
  const serviceFee = Math.round(totalPrice * 0.05);
  const tax = Math.round(totalPrice * 0.03);
  const grandTotal = totalPrice + serviceFee + tax;

  // Parse duration count
  const parseDuration = (dur = '') => {
    if (/week/i.test(dur)) return 7;
    const match = dur.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  // Simulating calendar date auto-select based on duration
  const setDates = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + parseDuration(experience.duration));
    setStartDate(start);
    setEndDate(end);
  };

  const nextStep = () => {
    if (step === 0 && (!startDate || !endDate)) {
      Alert.alert('Select dates', 'Please select your travel dates');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.create({
        experienceId: experience._id,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        adults,
        children,
        paymentMethod,
        totalPrice: totalPrice,
      });
      setBooking(res.data.booking);
      setStep(3);
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.message || 'Could not complete booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : prevStep()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Booking</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                i < step && styles.stepDotDone,
                i === step && styles.stepDotActive
              ]}>
                <Text style={[
                  styles.stepDotText,
                  (i <= step) && styles.stepDotTextActive
                ]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip summary always visible */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{experience.title}</Text>
          <Text style={styles.summarySub}>{experience.location?.city} · {experience.duration} · ${experience.price}/person</Text>
        </View>

        {/* Step 0: Dates */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>Select Dates</Text>
            <TouchableOpacity style={styles.datePicker} onPress={setDates} activeOpacity={0.8}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
              </View>
              <Text style={styles.dateSep}>➔</Text>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
              </View>
            </TouchableOpacity>
            {!startDate && (
              <Text style={styles.dateHint}>Tap above to set dates automatically based on duration</Text>
            )}
          </View>
        )}

        {/* Step 1: Guests */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>Who's Coming?</Text>
            
            <View style={styles.guestRow}>
              <View>
                <Text style={styles.guestType}>Adults</Text>
                <Text style={styles.guestSub}>Ages 13+</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setAdults(Math.max(1, adults - 1))}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{adults}</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setAdults(Math.min(experience.maxGroupSize, adults + 1))}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.guestRow}>
              <View>
                <Text style={styles.guestType}>Children</Text>
                <Text style={styles.guestSub}>Ages 2–12 (50% off)</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setChildren(Math.max(0, children - 1))}>
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{children}</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setChildren(Math.min(8, children + 1))}>
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.divider} />
            <Text style={styles.guestNote}>Total: {totalGuests} guest{totalGuests !== 1 ? 's' : ''} · Max group size: {experience.maxGroupSize}</Text>
          </View>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepHeading}>Payment Method</Text>
            {['card', 'apple_pay', 'google_pay'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.payMethod, paymentMethod === method && styles.payMethodActive]}
                onPress={() => setPaymentMethod(method)}
                activeOpacity={0.8}
              >
                <Text style={styles.payMethodIcon}>{method === 'card' ? '💳' : method === 'apple_pay' ? '🍎' : '🤖'}</Text>
                <Text style={styles.payMethodLabel}>
                  {method === 'card' ? 'Credit / Debit Card' : method === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
                </Text>
                <View style={[styles.radio, paymentMethod === method && styles.radioActive]} />
              </TouchableOpacity>
            ))}

            {paymentMethod === 'card' && (
              <TextInput
                style={styles.cardInput}
                placeholder="Card number (for demo purposes)"
                placeholderTextColor="#AAA"
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
              />
            )}

            <View style={styles.divider} />
            
            <Text style={styles.priceBreakdownTitle}>Price Breakdown</Text>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Base ({adults} adult{adults > 1 ? 's' : ''})</Text><Text style={styles.priceValue}>${experience.price * adults}</Text></View>
            {children > 0 && <View style={styles.priceRow}><Text style={styles.priceLabel}>{children} child{children > 1 ? 'ren' : ''} (50%)</Text><Text style={styles.priceValue}>${experience.price * 0.5 * children}</Text></View>}
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Service fee (5%)</Text><Text style={styles.priceValue}>${serviceFee}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Taxes (3%)</Text><Text style={styles.priceValue}>${tax}</Text></View>
            <View style={[styles.priceRow, styles.priceTotal]}><Text style={styles.priceTotalLabel}>Total</Text><Text style={styles.priceTotalValue}>${grandTotal}</Text></View>

            <View style={styles.protectBox}>
              <Text style={styles.protectText}>🛡️ Full refund if weather conditions are unsafe for the expedition.</Text>
            </View>
          </View>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <View style={styles.doneBox}>
            <View style={styles.doneEmojiBg}>
              <Text style={styles.doneEmoji}>🎉</Text>
            </View>
            <Text style={styles.doneTitle}>Booking Confirmed!</Text>
            <Text style={styles.doneSub}>Your adventure is booked. Get ready for {experience.title}!</Text>
            
            <View style={styles.doneDetail}>
              <Text style={styles.doneDetailText}>📅 {formatDate(startDate)} ➔ {formatDate(endDate)}</Text>
              <Text style={styles.doneDetailText}>👥 {totalGuests} guest{totalGuests !== 1 ? 's' : ''}</Text>
              <Text style={styles.doneDetailText}>💰 Total paid: ${grandTotal}</Text>
            </View>
            
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Trips')}>
              <Text style={styles.doneBtnText}>View My Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.doneLinkBtn}>
              <Text style={styles.doneLink}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Footer */}
      {step < 3 && (
        <View style={styles.footer}>
          {step === 2 ? (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm & Pay — ${grandTotal}</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.confirmBtn} onPress={nextStep}>
              <Text style={styles.confirmBtnText}>Continue</Text>
            </TouchableOpacity>
          )}
          {step === 2 && <Text style={styles.footerNote}>No payment due until the guide confirms.</Text>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7faf6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(190, 201, 193, 0.2)', backgroundColor: '#ffffff' },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', ...Platform.select({ web: { cursor: 'pointer' } }) },
  backText: { fontSize: 20, color: '#11694b', fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#181d1a', fontFamily: 'Quicksand' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(190, 201, 193, 0.2)', backgroundColor: '#ffffff' },
  stepItem: { alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(190, 201, 193, 0.6)', justifyContent: 'center', alignItems: 'center', marginBottom: 4, backgroundColor: '#ffffff' },
  stepDotDone: { backgroundColor: '#11694b', borderColor: '#11694b' },
  stepDotActive: { borderColor: '#11694b' },
  stepDotText: { fontSize: 10, color: '#6f7a73', fontWeight: '700' },
  stepDotTextActive: { color: '#11694b' },
  stepLabel: { fontSize: 10, color: '#6f7a73', fontWeight: '500' },
  stepLabelActive: { color: '#11694b', fontWeight: '700' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(190, 201, 193, 0.4)', marginBottom: 14 },
  stepLineDone: { backgroundColor: '#11694b' },
  content: { padding: 16, paddingBottom: 32 },
  summaryBox: { backgroundColor: '#f1f4f0', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(190, 201, 193, 0.3)' },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#181d1a', marginBottom: 4, fontFamily: 'Quicksand' },
  summarySub: { fontSize: 12, color: '#6f7a73', fontWeight: '500' },
  stepContainer: { gap: 16 },
  stepHeading: { fontSize: 18, fontWeight: '700', color: '#181d1a', marginBottom: 4, fontFamily: 'Quicksand' },
  datePicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.4)',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  dateCol: { alignItems: 'center' },
  dateLabel: { fontSize: 11, color: '#6f7a73', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 15, fontWeight: '700', color: '#181d1a' },
  dateSep: { fontSize: 18, color: '#11694b' },
  dateHint: { fontSize: 12, color: '#6f7a73', textAlign: 'center', fontStyle: 'italic' },
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  guestType: { fontSize: 15, fontWeight: '700', color: '#181d1a' },
  guestSub: { fontSize: 12, color: '#6f7a73', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(190, 201, 193, 0.6)',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  stepperBtnText: { fontSize: 18, color: '#11694b', fontWeight: 'bold' },
  stepperValue: { fontSize: 16, fontWeight: '700', color: '#181d1a', minWidth: 24, textAlign: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(190, 201, 193, 0.2)', marginVertical: 8 },
  guestNote: { fontSize: 13, color: '#6f7a73' },
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(190, 201, 193, 0.4)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  payMethodActive: { borderColor: '#11694b', backgroundColor: 'rgba(17, 105, 75, 0.03)' },
  payMethodIcon: { fontSize: 20 },
  payMethodLabel: { flex: 1, fontSize: 14, color: '#181d1a', fontWeight: '600' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(190, 201, 193, 0.6)' },
  radioActive: { borderColor: '#11694b', backgroundColor: '#11694b' },
  cardInput: { borderWidth: 1.5, borderColor: 'rgba(190, 201, 193, 0.4)', borderRadius: 8, padding: 12, fontSize: 14, marginTop: 4, backgroundColor: '#ffffff', color: '#181d1a' },
  priceBreakdownTitle: { fontSize: 15, fontWeight: '700', color: '#181d1a', marginBottom: 12, fontFamily: 'Quicksand' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { fontSize: 13, color: '#6f7a73', fontWeight: '500' },
  priceValue: { fontSize: 13, color: '#181d1a', fontWeight: '600' },
  priceTotal: { borderTopWidth: 1, borderColor: 'rgba(190, 201, 193, 0.2)', paddingTop: 12, marginTop: 4 },
  priceTotalLabel: { fontSize: 15, fontWeight: '700', color: '#181d1a' },
  priceTotalValue: { fontSize: 16, fontWeight: '700', color: '#11694b' },
  protectBox: { backgroundColor: '#ebefea', borderRadius: 8, padding: 12, marginTop: 12 },
  protectText: { fontSize: 12, color: '#3f4943', lineHeight: 18, fontWeight: '500' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(190, 201, 193, 0.2)', backgroundColor: '#ffffff' },
  confirmBtn: {
    backgroundColor: '#11694b',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#11694b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  confirmBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  footerNote: { fontSize: 11, color: '#6f7a73', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  doneBox: { alignItems: 'center', paddingTop: 20 },
  doneEmojiBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(17, 105, 75, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  doneEmoji: { fontSize: 40 },
  doneTitle: { fontSize: 24, fontWeight: '700', color: '#181d1a', marginBottom: 8, fontFamily: 'Quicksand' },
  doneSub: { fontSize: 14, color: '#6f7a73', textAlign: 'center', marginBottom: 24, lineHeight: 20, fontWeight: '500' },
  doneDetail: { backgroundColor: '#f1f4f0', borderRadius: 12, padding: 16, width: '100%', gap: 10, marginBottom: 28, borderWidth: 1, borderColor: 'rgba(190, 201, 193, 0.2)' },
  doneDetailText: { fontSize: 14, color: '#3f4943', fontWeight: '600' },
  doneBtn: {
    backgroundColor: '#11694b',
    borderRadius: 24,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  doneBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  doneLinkBtn: { paddingVertical: 8, ...Platform.select({ web: { cursor: 'pointer' } }) },
  doneLink: { color: '#6f7a73', textDecorationLine: 'underline', fontSize: 13, fontWeight: '700' },
});