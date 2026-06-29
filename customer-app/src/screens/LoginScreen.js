import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          
          <View style={styles.content}>
            {/* Custom SVG-like Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoMark}>
                {/* Tan Peak */}
                <View style={[styles.triangle, styles.peakTriangle]} />
                {/* Main Dark Green Triangle */}
                <View style={[styles.triangle, styles.mainTriangle]}>
                  {/* Inner Light Blue Triangle */}
                  <View style={[styles.triangle, styles.innerTriangle]} />
                </View>
              </View>
              <Text style={styles.logoText}>WILDVORA</Text>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your adventure</Text>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#111" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="explorer@wildvora.com"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#111" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="oneTimeCode"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#111" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Feather name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.btnPrimaryText}>Login</Text>
                  <Feather name="arrow-right" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.mutedText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF7' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoMark: { alignItems: 'center', marginBottom: 12 },
  triangle: {
    width: 0, height: 0, backgroundColor: 'transparent',
    borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  peakTriangle: {
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 12,
    borderBottomColor: '#C4A482', marginBottom: 0, zIndex: 2
  },
  mainTriangle: {
    borderLeftWidth: 40, borderRightWidth: 40, borderBottomWidth: 70,
    borderBottomColor: '#397858', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1
  },
  innerTriangle: {
    borderLeftWidth: 20, borderRightWidth: 20, borderBottomWidth: 35,
    borderBottomColor: '#67A8B6', position: 'absolute', bottom: -70
  },
  logoText: { fontSize: 24, fontWeight: '800', color: '#448E6E', letterSpacing: 1.5, marginTop: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#333', fontWeight: '500', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E6DF',
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    height: 56,
  },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, color: '#111', height: '100%' },
  eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1, 
    borderColor: '#D1D9CD', backgroundColor: '#fff', 
    justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  checkboxActive: { backgroundColor: '#1A5F45', borderColor: '#1A5F45' },
  checkboxLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  forgotLink: {
    color: '#1A5F45', fontSize: 14, fontWeight: '500',
    ...Platform.OS === 'web' ? { cursor: 'pointer' } : {}
  },
  btnPrimary: {
    backgroundColor: '#1A5F45', borderRadius: 12, height: 56,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    ...Platform.OS === 'web' ? { cursor: 'pointer' } : {}
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 16 },
  mutedText: { color: '#666', fontSize: 15 },
  link: {
    color: '#1A5F45', fontSize: 15, fontWeight: '700',
    ...Platform.OS === 'web' ? { cursor: 'pointer' } : {}
  },
});