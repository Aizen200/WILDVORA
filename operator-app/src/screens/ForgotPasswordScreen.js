import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  ImageBackground, useWindowDimensions, SafeAreaView, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Alert from '../utils/alert';

// Forest/key illustration from Unsplash
const ILLUS_URI = 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80';

export default function ForgotPasswordScreen({ onToggleScreen }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email address'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Email Sent',
        'If an account exists for this email, you will receive a reset link shortly.',
        [{ text: 'OK', onPress: () => onToggleScreen('login') }]
      );
    }, 1200);
  };

  // ── Wildvora Logo ──────────────────────────────────────────────────────────
  const Logo = ({ light, small }) => {
    const scale = small ? 0.65 : 1;
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

  const renderForm = () => (
    <View style={styles.screen}>

      {/* Back + Logo */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => onToggleScreen('login')} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <Logo light={false} small />
        <View style={{ width: 38 }} />
      </View>

      {/* Illustration card */}
      <View style={styles.illustCard}>
        <Image source={{ uri: ILLUS_URI }} style={styles.illustImg} resizeMode="cover" />
      </View>

      {/* Heading */}
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

      {/* Email field */}
      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="hello@explorer.com"
          placeholderTextColor={HOLD}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <Feather name="mail" size={18} color={HOLD} style={styles.inputIconRight} />
      </View>

      {/* Send Reset Link */}
      <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading} activeOpacity={0.88}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity style={styles.backToLogin} onPress={() => onToggleScreen('login')}>
        <Feather name="log-in" size={16} color={PRIMARY} />
        <Text style={styles.backToLoginText}>  Back to Login</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerBase}>New to Wildvora?  </Text>
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
          source={require('../../assets/forgot-password-hero.png')}
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
        <ScrollView contentContainerStyle={styles.scrollContainerFP} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {renderForm()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY = '#156b4e';
const BG_TOP  = '#B8DDD0'; // top gradient (light teal)
const BG_BOT  = '#D4EEE6'; // bottom gradient (lighter teal)
const SURF    = '#FFFFFF';
const BORDER  = '#BDD8CC';
const TEXT    = '#181d1a';
const MUTED   = '#6f7a73';
const HOLD    = '#9ca8a2';
const WHITE   = '#ffffff';

const styles = StyleSheet.create({
  desktopContainer: { flex: 1, flexDirection: 'row', backgroundColor: BG_BOT, minHeight: Platform.OS === 'web' ? '100vh' : '100%' },
  leftBanner: { width: '50%', height: '100%' },
  gradientOverlay: { flex: 1, padding: 48, justifyContent: 'space-between' },
  bannerContent: { flex: 1, justifyContent: 'space-between' },
  bannerTextSection: { marginBottom: 48 },
  headline: { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 52, marginBottom: 20 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  rightFormArea: { width: '50%', backgroundColor: BG_BOT, justifyContent: 'center', alignItems: 'center' },
  mobileContainer: { flex: 1, backgroundColor: BG_TOP },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContainerFP: { flexGrow: 1, padding: 0, paddingBottom: 40, backgroundColor: BG_TOP },

  screen: { width: '100%', maxWidth: 480 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { padding: 8 },

  logoWrap: { alignItems: 'center', gap: 5 },
  mountainWrap: { position: 'relative', alignItems: 'center' },
  triBase: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  triAbs:  { position: 'absolute', width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  logoWord: { fontWeight: '800' },

  illustCard: {
    marginHorizontal: 20, backgroundColor: WHITE, borderRadius: 24, overflow: 'hidden',
    height: 260, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  illustImg: { width: '100%', height: '100%' },

  title:    { fontSize: 28, fontWeight: '800', color: TEXT, textAlign: 'center', marginBottom: 10, paddingHorizontal: 20 },
  subtitle: { fontSize: 15, color: MUTED, textAlign: 'center', marginBottom: 30, lineHeight: 22, paddingHorizontal: 20 },

  label: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 8, paddingHorizontal: 20 },
  inputRow: {
    marginHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, height: 54, marginBottom: 20,
  },
  input:          { flex: 1, fontSize: 15, color: TEXT },
  inputIconRight: { marginLeft: 8 },

  btnPrimary: {
    marginHorizontal: 20, backgroundColor: PRIMARY, borderRadius: 16, height: 56,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5, marginBottom: 28,
  },
  btnText: { color: WHITE, fontSize: 17, fontWeight: '700' },

  backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  backToLoginText: { color: PRIMARY, fontSize: 15, fontWeight: '700' },

  footerRow:  { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20 },
  footerBase: { fontSize: 15, color: MUTED },
  footerLink: { fontSize: 15, fontWeight: '800', color: PRIMARY },
});