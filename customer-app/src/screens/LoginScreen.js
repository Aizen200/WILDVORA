import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import Alert from '../utils/alert';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Wildvora</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="oneTimeCode"
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>LOG IN</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.mutedText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  logo: { fontSize: 32, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 12, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 14, backgroundColor: '#FAFAFA',
  },
  forgotLink: {
    color: '#555', fontSize: 13, textAlign: 'right', marginBottom: 20, textDecorationLine: 'underline',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  btnPrimary: {
    backgroundColor: '#111', borderRadius: 8, padding: 14,
    alignItems: 'center', marginBottom: 12,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  mutedText: { color: '#888', fontSize: 13 },
  link: {
    color: '#111', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
});