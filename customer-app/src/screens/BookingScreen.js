import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingAPI } from '../services/api';

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

  // Parse "7 days", "2-3 days", "1 week+" etc. into a day count
  const parseDuration = (dur = '') => {
    if (/week/i.test(dur)) return 7;
    const match = dur.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  // Simple date picker — tap to set today / today+duration
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : prevStep()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Booking</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, (i < step || i === step) && styles.stepDotTextActive]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineDone]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Trip summary always visible */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>{experience.title}</Text>
          <Text style={styles.summarySub}>{experience.location?.city} · {experience.duration} · ${experience.price}/person</Text>
        </View>

        {/* Step 0: Dates */}
        {step === 0 && (
          <View>
            <Text style={styles.stepHeading}>Select Dates</Text>
            <TouchableOpacity style={styles.datePicker} onPress={setDates}>
              <View>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
              </View>
              <Text style={styles.dateSep}>→</Text>
              <View>
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
          <View>
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
          <View>
            <Text style={styles.stepHeading}>Payment Method</Text>
            {['card', 'apple_pay', 'google_pay'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.payMethod, paymentMethod === method && styles.payMethodActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={styles.payMethodIcon}>{method === 'card' ? '💳' : method === 'apple_pay' ? '🍎' : 'G'}</Text>
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
              <Text style={styles.protectText}>🛡 Full refund if weather conditions are unsafe for the expedition.</Text>
            </View>
          </View>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <View style={styles.doneBox}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>Booking Confirmed!</Text>
            <Text style={styles.doneSub}>Your adventure is booked. Get ready for {experience.title}!</Text>
            <View style={styles.doneDetail}>
              <Text style={styles.doneDetailText}>📅 {formatDate(startDate)} → {formatDate(endDate)}</Text>
              <Text style={styles.doneDetailText}>👥 {totalGuests} guest{totalGuests !== 1 ? 's' : ''}</Text>
              <Text style={styles.doneDetailText}>💰 Total paid: ${grandTotal}</Text>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Trips')}>
              <Text style={styles.doneBtnText}>View My Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Main')}>
              <Text style={styles.doneLink}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
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
          {step === 2 && <Text style={styles.footerNote}>You won't be charged until the guide confirms.</Text>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EEE' },
  backText: { fontSize: 22, color: '#111' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#EEE' },
  stepItem: { alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  stepDotDone: { backgroundColor: '#111', borderColor: '#111' },
  stepDotActive: { borderColor: '#111' },
  stepDotText: { fontSize: 10, color: '#AAA', fontWeight: '700' },
  stepDotTextActive: { color: '#111' },
  stepLabel: { fontSize: 9, color: '#AAA' },
  stepLabelActive: { color: '#111', fontWeight: '700' },
  stepLine: { flex: 1, height: 1, backgroundColor: '#DDD', marginBottom: 12 },
  stepLineDone: { backgroundColor: '#111' },
  content: { padding: 16, paddingBottom: 32 },
  summaryBox: { backgroundColor: '#F8F8F8', borderRadius: 10, padding: 12, marginBottom: 20 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  summarySub: { fontSize: 12, color: '#888' },
  stepHeading: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  datePicker: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 16, backgroundColor: '#FAFAFA', marginBottom: 10 },
  dateLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  dateValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  dateSep: { fontSize: 18, color: '#888' },
  dateHint: { fontSize: 12, color: '#888', textAlign: 'center', fontStyle: 'italic' },
  guestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  guestType: { fontSize: 15, fontWeight: '600', color: '#111' },
  guestSub: { fontSize: 12, color: '#888', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 18, color: '#111', fontWeight: '300' },
  stepperValue: { fontSize: 16, fontWeight: '700', color: '#111', minWidth: 24, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 4 },
  guestNote: { fontSize: 13, color: '#888', marginTop: 8 },
  payMethod: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 14, marginBottom: 10 },
  payMethodActive: { borderColor: '#111', backgroundColor: '#F8F8F8' },
  payMethodIcon: { fontSize: 20 },
  payMethodLabel: { flex: 1, fontSize: 14, color: '#333' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#CCC' },
  radioActive: { borderColor: '#111', backgroundColor: '#111' },
  cardInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, marginTop: 4 },
  priceBreakdownTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 13, color: '#666' },
  priceValue: { fontSize: 13, color: '#333' },
  priceTotal: { borderTopWidth: 1, borderColor: '#EEE', paddingTop: 10, marginTop: 4 },
  priceTotalLabel: { fontSize: 15, fontWeight: '700', color: '#111' },
  priceTotalValue: { fontSize: 15, fontWeight: '700', color: '#111' },
  protectBox: { backgroundColor: '#F8F8F8', borderRadius: 8, padding: 12, marginTop: 12 },
  protectText: { fontSize: 13, color: '#555', lineHeight: 18 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#fff' },
  confirmBtn: { backgroundColor: '#111', borderRadius: 10, padding: 16, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footerNote: { fontSize: 11, color: '#AAA', textAlign: 'center', marginTop: 8 },
  doneBox: { alignItems: 'center', paddingTop: 20 },
  doneEmoji: { fontSize: 56, marginBottom: 16 },
  doneTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8 },
  doneSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  doneDetail: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 16, width: '100%', gap: 8, marginBottom: 24 },
  doneDetailText: { fontSize: 14, color: '#444' },
  doneBtn: { backgroundColor: '#111', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  doneLink: { color: '#888', textDecorationLine: 'underline', fontSize: 13 },
});