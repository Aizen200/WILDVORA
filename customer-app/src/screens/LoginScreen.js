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

const BG = require('../../assets/guest-bg.jpg');
const GREEN = '#1A5F45';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
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
            {/* Spacer pushes card to bottom */}
            <View style={{ flex: 1 }} />

            {/* ── Form Card ── */}
            <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>

              {/* Logo */}
              <View style={s.logoRow}>
                <MaterialCommunityIcons name="compass-rose" size={26} color={GREEN} />
                <Text style={s.logoText}>WILDVORA</Text>
              </View>

              <Text style={s.title}>Welcome Back</Text>
              <Text style={s.subtitle}>Continue your adventure.</Text>

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
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={17} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}
                style={s.forgotWrap}
              >
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Continue */}
              <TouchableOpacity
                style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Continue</Text>
                }
              </TouchableOpacity>

              {/* Footer */}
              <View style={s.footerRow}>
                <Text style={s.footerMuted}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                  <Text style={s.footerLink}>Sign Up</Text>
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
  scroll:  { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },

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
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 18,
  },

  /* Logo */
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 26 },
  logoText: { fontSize: 19, fontWeight: '900', color: GREEN, letterSpacing: 4 },

  /* Headline */
  title:    { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 28, lineHeight: 21 },

  /* Input fields */
  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.2, borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16, height: 54,
    marginBottom: 14,
  },
  fieldIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 15, color: '#111827' },

  /* Forgot */
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 26 },
  forgotText: { fontSize: 14, fontWeight: '600', color: GREEN },

  /* Primary button */
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
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
