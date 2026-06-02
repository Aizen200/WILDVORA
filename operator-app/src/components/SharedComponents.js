import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export const StatusBadge = ({ status }) => {
  const map = {
    confirmed:  { bg: theme.primary + '18', text: theme.primary,   label: 'CONFIRMED' },
    live:       { bg: theme.primary + '18', text: theme.primary,   label: 'LIVE' },
    draft:      { bg: theme.surfaceContainerHigh, text: theme.textLight, label: 'DRAFT' },
    paused:     { bg: '#6F7A7322', text: theme.textLight, label: 'PAUSED' },
    pending:    { bg: theme.tertiaryFixed,  text: theme.tertiary,  label: 'PENDING' },
    declined:   { bg: theme.dangerBg,      text: theme.danger,    label: 'DECLINED' },
    settled:    { bg: theme.primary + '18', text: theme.primary,  label: 'SETTLED' },
    processing: { bg: '#C2E8FF',            text: theme.secondary, label: 'PROCESSING' },
  };
  const s = map[status] || map.draft;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

export const StarRating = ({ rating }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Ionicons
        key={i}
        name={i <= rating ? 'star' : 'star-outline'}
        size={14}
        color={i <= rating ? '#F59E0B' : theme.outlineVariant}
      />
    ))}
  </View>
);

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export const PrimaryButton = ({ label, onPress, style }) => (
  <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress}>
    <Text style={styles.primaryBtnText}>{label}</Text>
  </TouchableOpacity>
);

export const GhostButton = ({ label, onPress, style }) => (
  <TouchableOpacity style={[styles.ghostBtn, style]} onPress={onPress}>
    <Text style={styles.ghostBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  badge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    color: theme.textLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  ghostBtnText: { color: theme.textLight, fontWeight: '600', fontSize: 15 },
});