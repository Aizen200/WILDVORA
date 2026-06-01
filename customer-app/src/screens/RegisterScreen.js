import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import Alert from '../utils/alert';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, phone.trim());
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Wildvora</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input} placeholder="email@example.com"
          value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address"
        />

        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput
          style={styles.input} placeholder="+1 000 000 0000"
          value={phone} onChangeText={setPhone} keyboardType="phone-pad"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry textContentType="oneTimeCode" />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput style={styles.input} placeholder="••••••••" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="oneTimeCode" />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>CREATE ACCOUNT</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.mutedText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 28, fontWeight: '700', color: '#111', textAlign: 'center', marginTop: 32, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 12, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    padding: 12, fontSize: 14, marginBottom: 14, backgroundColor: '#FAFAFA',
  },
  btnPrimary: {
    backgroundColor: '#111', borderRadius: 8, padding: 14,
    alignItems: 'center', marginBottom: 12, marginTop: 8,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  mutedText: { color: '#888', fontSize: 13 },
  link: {
    color: '#111', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
});