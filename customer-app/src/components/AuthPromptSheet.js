import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const BENEFITS = [
  { icon: 'shield-lock-outline', color: '#1A5F45', label: 'Securely book adventures' },
  { icon: 'chat-outline',        color: '#0a6687', label: 'Chat with verified operators' },
  { icon: 'heart-outline',       color: '#b45309', label: 'Save adventures for later' },
  { icon: 'bell-outline',        color: '#6d28d9', label: 'Receive booking updates & reminders' },
];

export default function AuthPromptSheet({ visible, onDismiss, onSignUp, onSignIn }) {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[s.sheet, { transform: [{ translateY }] }]}>
        <View style={s.handle} />

        <View style={s.iconRing}>
          <MaterialCommunityIcons name="compass-rose" size={32} color="#1A5F45" />
        </View>

        <Text style={s.heading}>Create your Wildvora account</Text>
        <Text style={s.sub}>Unlock the full adventure experience</Text>

        <View style={s.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={s.benefitRow}>
              <View style={[s.benefitIcon, { backgroundColor: b.color + '18' }]}>
                <MaterialCommunityIcons name={b.icon} size={18} color={b.color} />
              </View>
              <Text style={s.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={onSignUp} activeOpacity={0.87}>
          <Text style={s.primaryBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={onSignIn} activeOpacity={0.87}>
          <Text style={s.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={s.laterBtnText}>Maybe Later</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FAF4',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefits: {
    gap: 14,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#1A5F45',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 11,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#1A5F45',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A5F45',
  },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  laterBtnText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
