import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, useWindowDimensions, SafeAreaView, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Alert from '../utils/alert';
import { useAuth } from '../context/AuthContext';

// Camping scene hero
const HERO_URI = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80';

export default function RegisterScreen({ navigation, onToggleScreen }) {
  const { register } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed,    setAgreed]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'First name, last name, email and password are required'); return;
    }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (!agreed) { Alert.alert('Error', 'You must agree to the Terms & Conditions'); return; }
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await register(fullName, email.trim().toLowerCase(), password, phone.trim());
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── Wildvora Logo ──────────────────────────────────────────────────────────
  const Logo = ({ light, small }) => {
    const scale = small ? 0.6 : 1;
    return (
      <View style={[styles.logoWrap, small && { gap: 3 }]}>
        <View style={[styles.mountainWrap, { width: 68 * scale, height: 56 * scale }]}>
          <View style={[styles.triBase, {
            borderLeftWidth: 34 * scale, borderRightWidth: 34 * scale,
            borderBottomWidth: 54 * scale,
            borderBottomColor: light ? 'rgba(255,255,255,0.9)' : '#1C7A58',
          }]} />
          <View style={[styles.triAbs, {
            bottom: 0, left: 14 * scale,
            borderLeftWidth: 20 * scale, borderRightWidth: 20 * scale,
            borderBottomWidth: 32 * scale,
            borderBottomColor: light ? 'rgba(255,255,255,0.45)' : '#5BAEC8',
          }]} />
          <View style={[styles.triAbs, {
            top: 0, left: 27 * scale,
            borderLeftWidth: 7 * scale, borderRightWidth: 7 * scale,
            borderBottomWidth: 14 * scale,
            borderBottomColor: light ? 'rgba(255,255,255,0.7)' : '#C8A87A',
          }]} />
        </View>
        <Text style={[styles.logoWord, {
          color: light ? '#fff' : '#156b4e',
          fontSize: small ? 8 : 13,
          letterSpacing: small ? 2 : 3.5,
        }]}>
          WILDVORA
        </Text>
      </View>
    );
  };

  // ── Google G ───────────────────────────────────────────────────────────────
  const GoogleG = () => (
    <View style={styles.gOuter}>
      <View style={[styles.gSeg, { backgroundColor: '#EA4335', top: 0, left: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10 }]} />
      <View style={[styles.gSeg, { backgroundColor: '#4285F4', top: 0, right: 0, borderTopRightRadius: 10 }]} />
      <View style={[styles.gSeg, { backgroundColor: '#FBBC05', bottom: 0, left: 0, borderBottomLeftRadius: 10 }]} />
      <View style={[styles.gSeg, { backgroundColor: '#34A853', bottom: 0, right: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }]} />
      <View style={styles.gInner}><Text style={styles.gLetter}>G</Text></View>
    </View>
  );

  const renderForm = () => (
    <View style={styles.screen}>

      {/* Back + Logo top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => onToggleScreen('login')} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Logo light={false} small />
      </View>

      {/* Hero image */}
      <View style={styles.heroWrap}>
        <Image source={{ uri: HERO_URI }} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Premium Explorer</Text>
        </View>
      </View>

      {/* Heading */}
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join thousands of adventurers worldwide</Text>

      {/* Name row */}
      <View style={styles.twoCol}>
        <View style={[styles.fieldWrap, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>First Name</Text>
          <TextInput style={styles.input} placeholder="John" placeholderTextColor={HOLD}
            value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={[styles.fieldWrap, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput style={styles.input} placeholder="Doe" placeholderTextColor={HOLD}
            value={lastName} onChangeText={setLastName} />
        </View>
      </View>

      {/* Email */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="john.doe@example.com" placeholderTextColor={HOLD}
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      </View>

      {/* Phone */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="+1 (555) 000-0000" placeholderTextColor={HOLD}
          value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </View>

      {/* Password */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.pwdRow}>
          <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="••••••••" placeholderTextColor={HOLD}
            value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
          <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
            <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={HOLD} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm */}
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.pwdRow}>
          <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="••••••••" placeholderTextColor={HOLD}
            value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} />
          <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
            <Feather name={showConfirm ? 'eye-off' : 'eye'} size={16} color={HOLD} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms */}
      <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
        <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
          {agreed && <Feather name="check" size={11} color="#fff" />}
        </View>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text>
        </Text>
      </TouchableOpacity>

      {/* Create Account */}
      <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
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
        <Text style={styles.googleText}>Sign Up with Google</Text>
      </TouchableOpacity>

      {/* Login link */}
      <View style={styles.footerRow}>
        <Text style={styles.footerBase}>Already have an account?  </Text>
        <TouchableOpacity onPress={() => onToggleScreen('login')}>
          <Text style={styles.footerLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLargeScreen) {
    return (
      <View style={styles.desktopContainer}>
        <ImageBackground
          source={require('../../assets/register-hero.png')}
          style={styles.leftBanner} resizeMode="cover"
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
        <ScrollView contentContainerStyle={styles.scrollContainerReg} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
  scrollContainerReg: { flexGrow: 1, padding: 0, paddingBottom: 40 },

  screen: { width: '100%', maxWidth: 480 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8 },

  logoWrap: { alignItems: 'center', gap: 5 },
  mountainWrap: { position: 'relative', alignItems: 'center' },
  triBase: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  triAbs:  { position: 'absolute', width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  logoWord: { fontWeight: '800' },

  heroWrap: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', height: 210, marginBottom: 28, position: 'relative' },
  heroImg:  { width: '100%', height: '100%' },
  heroBadge: { position: 'absolute', bottom: 14, left: 14, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  heroBadgeText: { color: TEXT, fontSize: 13, fontWeight: '700' },

  title:    { fontSize: 28, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 6, paddingHorizontal: 20 },
  subtitle: { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 26, paddingHorizontal: 20 },

  twoCol:   { flexDirection: 'row', paddingHorizontal: 20 },
  fieldWrap:{ marginBottom: 16, paddingHorizontal: 20 },
  label:    { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 7 },
  input: {
    backgroundColor: SURF, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    height: 52, paddingHorizontal: 16, fontSize: 15, color: TEXT,
  },
  pwdRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SURF, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER, height: 52,
  },
  eyeBtn: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },

  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22, marginTop: 4, paddingHorizontal: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#b8c8bf', alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE },
  checkboxOn: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  termsText: { flex: 1, fontSize: 14, color: MUTED },
  termsLink: { color: PRIMARY, fontWeight: '700' },

  btnPrimary: {
    marginHorizontal: 20, backgroundColor: PRIMARY, borderRadius: 16, height: 56,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 5, marginBottom: 22,
  },
  btnText: { color: WHITE, fontSize: 17, fontWeight: '700' },

  divRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 22, paddingHorizontal: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: BORDER },
  divText: { marginHorizontal: 14, color: HOLD, fontSize: 12, fontWeight: '700' },

  btnGoogle: {
    marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: WHITE, borderRadius: 16, height: 54,
    borderWidth: 1, borderColor: BORDER, marginBottom: 32, gap: 12,
  },
  gOuter: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  gSeg:   { position: 'absolute', width: 12, height: 12 },
  gInner: { position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  gLetter:{ fontSize: 11, fontWeight: '900', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: TEXT },

  footerRow:  { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20 },
  footerBase: { fontSize: 15, color: MUTED },
  footerLink: { fontSize: 15, fontWeight: '800', color: PRIMARY },
});