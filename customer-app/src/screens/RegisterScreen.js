import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
  ImageBackground, Animated, StatusBar,
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const BG    = require('../../assets/guest-bg.jpg');
const GREEN = '#1A5F45';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed,       setAgreed]       = useState(false);
  const [loading,      setLoading]      = useState(false);

  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const cardOpacity   = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(52)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 450, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 480, useNativeDriver: true,
        }),
        Animated.spring(cardTranslate, {
          toValue: 0, tension: 60, friction: 11, useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!agreed) {
      Alert.alert('Error', 'You must agree to the Terms & Conditions');
      return;
    }
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await register(fullName, email.trim().toLowerCase(), password, phone.trim());
      navigation.goBack();
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <ImageBackground source={BG} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, s.overlay]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Back button */}
        <Animated.View style={[s.backWrap, { opacity: logoOpacity }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.kav}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Form Card ── */}
            <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>

              {/* Logo */}
              <View style={s.logoRow}>
                <MaterialCommunityIcons name="compass-rose" size={26} color={GREEN} />
                <Text style={s.logoText}>WILDVORA</Text>
              </View>

              <Text style={s.title}>Create Account</Text>
              <Text style={s.subtitle}>Start discovering India's best adventures.</Text>

              {/* Name row — two side-by-side fields */}
              <View style={s.nameRow}>
                <View style={[s.field, s.fieldHalf]}>
                  <TextInput
                    style={s.input}
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    returnKeyType="next"
                  />
                </View>
                <View style={[s.field, s.fieldHalf]}>
                  <TextInput
                    style={s.input}
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={s.field}>
                <Feather name="mail" size={17} color="#9CA3AF" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>

              {/* Phone */}
              <View style={s.field}>
                <Feather name="phone" size={17} color="#9CA3AF" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </View>

              {/* Password */}
              <View style={s.field}>
                <Feather name="lock" size={17} color="#9CA3AF" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="oneTimeCode"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={17} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={s.field}>
                <Feather name="lock" size={17} color="#9CA3AF" style={s.fieldIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#9CA3AF"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showPassword}
                  textContentType="oneTimeCode"
                  returnKeyType="done"
                />
              </View>

              {/* Terms checkbox */}
              <TouchableOpacity style={s.checkRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.8}>
                <View style={[s.checkbox, agreed && s.checkboxChecked]}>
                  {agreed && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={s.checkLabel}>
                  I agree to the{' '}
                  <Text style={s.checkLink}>Terms & Conditions</Text>
                </Text>
              </TouchableOpacity>

              {/* Create Account button */}
              <TouchableOpacity
                style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Create Account</Text>
                }
              </TouchableOpacity>

              {/* Footer */}
              <View style={s.footerRow}>
                <Text style={s.footerMuted}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={s.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0a1a12' },
  overlay: { backgroundColor: 'rgba(4,14,8,0.55)' },
  safe:    { flex: 1 },
  kav:     { flex: 1 },
  scroll:  { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },

  /* Back button */
  backWrap: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 4 },
  backBtn:  {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Card */
  card: {
    backgroundColor: '#e7f1ecf5',
    borderRadius: 28,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 18,
  },

  /* Logo */
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 22 },
  logoText: { fontSize: 19, fontWeight: '900', color: GREEN, letterSpacing: 4 },

  /* Headline */
  title:    { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 5, letterSpacing: -0.4 },
  subtitle: { fontSize: 14.5, color: '#6B7280', marginBottom: 24, lineHeight: 21 },

  /* Name row */
  nameRow:   { flexDirection: 'row', gap: 10, marginBottom: 0 },
  fieldHalf: { flex: 1, paddingHorizontal: 14 },

  /* Input fields */
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.2, borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16, height: 52,
    marginBottom: 12,
  },
  fieldIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: '#111827' },

  /* Terms checkbox */
  checkRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 22 },
  checkbox:      { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxChecked: { backgroundColor: GREEN, borderColor: GREEN },
  checkLabel:    { fontSize: 13.5, color: '#4B5563', flex: 1 },
  checkLink:     { color: GREEN, fontWeight: '700' },

  /* Primary button */
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  /* Footer */
  footerRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerMuted: { fontSize: 14.5, color: '#6B7280' },
  footerLink:  { fontSize: 14.5, fontWeight: '700', color: GREEN },
});
