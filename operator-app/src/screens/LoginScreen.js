import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, useWindowDimensions, SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Alert from '../utils/alert';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation, onToggleScreen }) {
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ── Wildvora Logo ──────────────────────────────────────────────────────────
  // Three-layer mountain: tan peak tip, green outer body, teal inner valley
  const Logo = ({ light }) => (
    <View style={styles.logoWrap}>
      {/* Mountain mark */}
      <View style={styles.mountainWrap}>
        {/* Green outer triangle */}
        <View style={[styles.triBase, {
          borderLeftWidth: 34,
          borderRightWidth: 34,
          borderBottomWidth: 54,
          borderBottomColor: light ? 'rgba(255,255,255,0.9)' : '#1C7A58',
        }]} />
        {/* Teal inner valley triangle */}
        <View style={[styles.triAbs, {
          bottom: 0, left: 14,
          borderLeftWidth: 20,
          borderRightWidth: 20,
          borderBottomWidth: 32,
          borderBottomColor: light ? 'rgba(255,255,255,0.45)' : '#5BAEC8',
        }]} />
        {/* Tan peak tip */}
        <View style={[styles.triAbs, {
          top: 0, left: 27,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderBottomWidth: 14,
          borderBottomColor: light ? 'rgba(255,255,255,0.7)' : '#C8A87A',
        }]} />
      </View>
      {/* Wordmark */}
      <Text style={[styles.logoWord, { color: light ? '#fff' : '#156b4e' }]}>
        WILDVORA
      </Text>
    </View>
  );

  // ── Google G logo (multicolor segments via overlapping views) ──────────────
  const GoogleG = () => (
    <View style={styles.gOuter}>
      {/* Red top-left */}
      <View style={[styles.gSegment, { backgroundColor: '#EA4335', top: 0, left: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10 }]} />
      {/* Blue top-right */}
      <View style={[styles.gSegment, { backgroundColor: '#4285F4', top: 0, right: 0, borderTopRightRadius: 10 }]} />
      {/* Yellow bottom-left */}
      <View style={[styles.gSegment, { backgroundColor: '#FBBC05', bottom: 0, left: 0, borderBottomLeftRadius: 10 }]} />
      {/* Green bottom-right */}
      <View style={[styles.gSegment, { backgroundColor: '#34A853', bottom: 0, right: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }]} />
      {/* White centre cutout with G */}
      <View style={styles.gInner}>
        <Text style={styles.gLetter}>G</Text>
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={styles.screen}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <Logo light={false} />
      </View>

      {/* Heading */}
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue your adventure</Text>

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <View style={styles.inputRow}>
        <Feather name="mail" size={18} color="#9ca8a2" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="explorer@wildvora.com"
          placeholderTextColor="#9ca8a2"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />
      </View>

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.inputRow}>
        <Feather name="lock" size={18} color="#9ca8a2" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#9ca8a2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9ca8a2" />
        </TouchableOpacity>
      </View>

      {/* Remember me + Forgot */}
      <View style={styles.rememberRow}>
        <TouchableOpacity style={styles.rememberLeft} onPress={() => setRememberMe(v => !v)} activeOpacity={0.7}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
            {rememberMe && <Feather name="check" size={10} color="#fff" />}
          </View>
          <Text style={styles.rememberText}>Remember Me</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onToggleScreen('forgot')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login button */}
      <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.btnInner}>
            <Text style={styles.btnText}>Login</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* OR */}
      <View style={styles.divRow}>
        <View style={styles.divLine} />
        <Text style={styles.divText}>OR</Text>
        <View style={styles.divLine} />
      </View>

      {/* Google */}
      <TouchableOpacity style={styles.btnGoogle} activeOpacity={0.85}>
        <GoogleG />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Sign up */}
      <View style={styles.footerRow}>
        <Text style={styles.footerBase}>Don't have an account?  </Text>
        <TouchableOpacity onPress={() => onToggleScreen('register')}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLargeScreen) {
    return (
      <View style={styles.desktopContainer}>
        <ImageBackground
          source={require('../../assets/register-hero.png')}
          style={styles.leftBanner}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(21,107,78,0.4)', 'rgba(10,102,135,0.85)']}
            style={styles.gradientOverlay}
          >
            <View style={styles.bannerContent}>
              <Logo light={true} />
              <View style={styles.bannerTextSection}>
                <Text style={styles.headline}>List your experiences and reach adventurers worldwide.</Text>
                <Text style={styles.tagline}>Join the premier community for modern explorers.</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
        <View style={styles.rightFormArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {renderForm()}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mobileContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {renderForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = '#156b4e';
const BG      = '#EDEEE8';
const SURF    = '#E5E6E0';
const BORDER  = '#D6D7D1';
const TEXT    = '#181d1a';
const MUTED   = '#6f7a73';
const HOLD    = '#9ca8a2';
const WHITE   = '#ffffff';

const styles = StyleSheet.create({
  desktopContainer: { flex: 1, flexDirection: 'row', backgroundColor: BG, minHeight: Platform.OS === 'web' ? '100vh' : '100%' },
  leftBanner: { width: '50%', height: '100%' },
  gradientOverlay: { flex: 1, padding: 48, justifyContent: 'space-between' },
  bannerContent: { flex: 1, justifyContent: 'space-between' },
  bannerTextSection: { marginBottom: 48 },
  headline: { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 52, marginBottom: 20 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  rightFormArea: { width: '50%', backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  mobileContainer: { flex: 1, backgroundColor: BG },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingVertical: 48 },

  // Screen / form wrapper — no white card, just the bare BG
  screen: { width: '100%', maxWidth: 420 },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoWrap: { alignItems: 'center', gap: 6 },
  mountainWrap: { width: 68, height: 56, position: 'relative', alignItems: 'center' },
  triBase: {
    width: 0, height: 0,
    backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  triAbs: {
    position: 'absolute',
    width: 0, height: 0,
    backgroundColor: 'transparent', borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  logoWord: { fontSize: 13, fontWeight: '800', letterSpacing: 3.5 },

  // Heading
  title:    { fontSize: 30, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 16, color: MUTED, textAlign: 'center', marginBottom: 36 },

  // Fields
  label: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURF, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 14, height: 56, marginBottom: 20,
  },
  inputIcon:      { marginRight: 10 },
  inputIconRight: { marginLeft: 8 },
  input:          { flex: 1, fontSize: 15, color: TEXT },
  eyeBtn:         { paddingHorizontal: 10, height: '100%', justifyContent: 'center' },

  // Remember / forgot
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  rememberLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#b8c8bf',
    alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE,
  },
  checkboxOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  rememberText: { fontSize: 14, color: MUTED },
  forgotText:   { fontSize: 14, fontWeight: '700', color: PRIMARY },

  // Buttons
  btnPrimary: {
    backgroundColor: PRIMARY, borderRadius: 16, height: 58,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 5, marginBottom: 24,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText:  { color: WHITE, fontSize: 17, fontWeight: '700' },

  divRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divLine: { flex: 1, height: 1, backgroundColor: BORDER },
  divText: { marginHorizontal: 14, color: HOLD, fontSize: 12, fontWeight: '700' },

  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: WHITE, borderRadius: 16, height: 56,
    borderWidth: 1, borderColor: BORDER, marginBottom: 36, gap: 12,
  },
  // Multicolor Google G
  gOuter: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  gSegment: { position: 'absolute', width: 12, height: 12 },
  gInner: {
    position: 'absolute', top: 4, left: 4, width: 16, height: 16,
    borderRadius: 8, backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
  },
  gLetter: { fontSize: 11, fontWeight: '900', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: TEXT },

  footerRow:  { flexDirection: 'row', justifyContent: 'center' },
  footerBase: { fontSize: 15, color: MUTED },
  footerLink: { fontSize: 15, fontWeight: '800', color: PRIMARY },
});