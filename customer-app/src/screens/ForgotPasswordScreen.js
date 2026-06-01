import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Alert from '../utils/alert';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    // In production: call password reset API endpoint
    Alert.alert('Email Sent', 'If an account exists for this email, you will receive a reset link shortly.', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input} placeholder="email@example.com"
        value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>SEND RESET LINK</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  back: {
    position: 'absolute', top: 52, left: 24,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  backText: { fontSize: 15, color: '#555' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 20 },
  label: { fontSize: 12, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 },
  btn: {
    backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  link: {
    color: '#555', textAlign: 'center', textDecorationLine: 'underline', fontSize: 13,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
});