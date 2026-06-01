import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Email Sent', 'If an account exists for this email, you will receive a reset link shortly.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }, 1000);
  };

  return (
    <LinearGradient colors={['#E5F3FE', '#D3F5DF', '#F3F6EB']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.container}>

            {/* Back Button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="#1A5F45" />
            </TouchableOpacity>

            <View style={styles.content}>
              {/* Logo area */}
              <View style={styles.logoContainer}>
                <View style={styles.logoMark}>
                  <View style={[styles.triangle, styles.peakTriangle]} />
                  <View style={[styles.triangle, styles.mainTriangle]}>
                    <View style={[styles.triangle, styles.innerTriangle]} />
                  </View>
                </View>
                <Text style={styles.logoText}>WILDVORA</Text>
              </View>

              {/* Image Card Placeholder */}
              <View style={styles.imageCard}>
                <View style={styles.imagePlaceholder}>
                  <Feather name="shield" size={60} color="#1A5F45" />
                  <Feather name="key" size={24} color="#C4A482" style={{ position: 'absolute', top: 35 }} />
                </View>
              </View>

              {/* Text */}
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

              {/* Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="hello@explorer.com"
                    placeholderTextColor="#A0B3A6"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <Feather name="mail" size={20} color="#A0B3A6" style={styles.inputIcon} />
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                <Text style={styles.btnPrimaryText}>{loading ? "Sending..." : "Send Reset Link"}</Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backToLoginRow}>
                <Feather name="log-in" size={16} color="#1A5F45" style={{ transform: [{ rotateY: '180deg' }] }} />
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.mutedText}>New to Wildvora? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  backBtn: { padding: 24, paddingBottom: 0 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  
  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoMark: { alignItems: 'center', marginBottom: 6 },
  triangle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  peakTriangle: { borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 8, borderBottomColor: '#C4A482', marginBottom: 0, zIndex: 2 },
  mainTriangle: { borderLeftWidth: 20, borderRightWidth: 20, borderBottomWidth: 35, borderBottomColor: '#397858', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 },
  innerTriangle: { borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 17, borderBottomColor: '#67A8B6', position: 'absolute', bottom: -35 },
  logoText: { fontSize: 10, fontWeight: '800', color: '#448E6E', letterSpacing: 1.5, marginTop: 4 },

  // Image Card
  imageCard: { width: 220, height: 220, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 32, shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  imagePlaceholder: { width: 160, height: 160, backgroundColor: '#F0F6F2', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Typography
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#4A5B52', textAlign: 'center', marginBottom: 32, lineHeight: 22 },

  // Input
  inputGroup: { width: '100%', marginBottom: 24 },
  label: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1E0D7', borderRadius: 12, backgroundColor: '#F3F8F5', height: 56, overflow: 'hidden' },
  input: { flex: 1, fontSize: 16, color: '#111', height: '100%', paddingLeft: 16 },
  inputIcon: { paddingRight: 16, paddingLeft: 12 },

  // Buttons
  btnPrimary: { width: '100%', backgroundColor: '#165B43', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#165B43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  // Back to login
  backToLoginRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backToLoginText: { color: '#165B43', fontSize: 15, fontWeight: '600' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
  mutedText: { color: '#4A5B52', fontSize: 14 },
  link: { color: '#165B43', fontSize: 14, fontWeight: '700' },
});