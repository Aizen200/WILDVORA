import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color="#1A5F45" />
            </TouchableOpacity>
            
            <View style={styles.logoMark}>
              <View style={[styles.triangle, styles.peakTriangle]} />
              <View style={[styles.triangle, styles.mainTriangle]}>
                <View style={[styles.triangle, styles.innerTriangle]} />
              </View>
            </View>
            
            <View style={{ width: 24 }} />
          </View>

          {/* Hero Image Card */}
          <View style={styles.imageCard}>
            <Image 
              source={require('../../assets/register-hero.png')} 
              style={styles.heroImage} 
              resizeMode="cover" 
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Premium Explorer</Text>
            </View>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join thousands of adventurers worldwide</Text>

          {/* Form Fields */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput style={styles.input} placeholder="first name" placeholderTextColor="#888" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} placeholder="last name" placeholderTextColor="#888" value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholder="username@example.com" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="+91 (555) 000-0000" placeholderTextColor="#888" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.inputFull} placeholder="••••••••" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} textContentType="oneTimeCode" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#888" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} textContentType="oneTimeCode" />
          </View>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Create Account</Text>}
          </TouchableOpacity>


          <View style={styles.footer}>
            <Text style={styles.mutedText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAF7' },
  container: { flexGrow: 1, padding: 24 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoMark: { alignItems: 'center' },
  triangle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  peakTriangle: { borderLeftWidth: 3, borderRightWidth: 3, borderBottomWidth: 6, borderBottomColor: '#C4A482', marginBottom: 0, zIndex: 2 },
  mainTriangle: { borderLeftWidth: 15, borderRightWidth: 15, borderBottomWidth: 26, borderBottomColor: '#397858', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 },
  innerTriangle: { borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 13, borderBottomColor: '#67A8B6', position: 'absolute', bottom: -26 },

  imageCard: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 24, elevation: 4 },
  heroImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#A2CBE1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#1A3F55', fontSize: 12, fontWeight: '700' },

  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32 },

  row: { flexDirection: 'row', width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#333', fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D9CD', borderRadius: 10, backgroundColor: '#F3F6F2', height: 50, paddingHorizontal: 14, fontSize: 15, color: '#111' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D9CD', borderRadius: 10, backgroundColor: '#F3F6F2', height: 50, overflow: 'hidden' },
  inputFull: { flex: 1, height: '100%', paddingHorizontal: 14, fontSize: 15, color: '#111' },
  eyeIcon: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 24 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#D1D9CD', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#1A5F45', borderColor: '#1A5F45' },
  checkboxLabel: { fontSize: 14, color: '#333' },
  termsLink: { color: '#1A5F45', fontWeight: '700' },

  btnPrimary: { backgroundColor: '#1A5F45', borderRadius: 10, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 2 },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  orDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#D1D9CD' },
  orText: { marginHorizontal: 12, color: '#888', fontSize: 12, fontWeight: '600' },

  googleBtn: { flexDirection: 'row', height: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 32, elevation: 1 },
  googleG: { color: '#4285F4', fontSize: 20, fontWeight: '800', marginRight: 12 },
  googleText: { fontSize: 15, color: '#333', fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 24 },
  mutedText: { color: '#666', fontSize: 15 },
  link: { color: '#1A5F45', fontSize: 15, fontWeight: '700' },
});