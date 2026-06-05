import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  primary:             '#1A5F45',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
  background:          '#f7faf6',
  surface:             '#f7faf6',
  surfaceContainer:    '#ebefea',
  surfaceContainerLow: '#f1f4f0',
  white:               '#ffffff',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
  error:               '#ba1a1a',
};

const SECTIONS = [
  {
    title: 'Notifications',
    items: [
      { icon: 'bell-outline',         label: 'Push Notifications',   key: 'push',    toggle: true },
      { icon: 'email-outline',        label: 'Email Alerts',         key: 'email',   toggle: true },
      { icon: 'message-outline',      label: 'SMS Notifications',    key: 'sms',     toggle: false },
      { icon: 'tag-outline',          label: 'Promotional Offers',   key: 'promo',   toggle: false },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      { icon: 'lock-outline',         label: 'Change Password',      key: 'password',    toggle: false, arrow: true },
      { icon: 'shield-outline',       label: 'Two-Factor Auth',      key: '2fa',          toggle: true },
      { icon: 'eye-outline',          label: 'Profile Visibility',   key: 'visibility',  toggle: true },
      { icon: 'map-marker-outline',   label: 'Location Access',      key: 'location',    toggle: false },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'translate',            label: 'Language',             key: 'language',    arrow: true, value: 'English' },
      { icon: 'currency-inr',         label: 'Currency',             key: 'currency',    arrow: true, value: 'INR' },
      { icon: 'weather-night',        label: 'Dark Mode',            key: 'dark',        toggle: false },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: 'download-outline',     label: 'Download My Data',     key: 'download',    arrow: true },
      { icon: 'delete-outline',       label: 'Delete Account',       key: 'delete',      arrow: true, danger: true },
    ],
  },
];

export default function SettingsScreen({ navigation }) {
  const [toggles, setToggles] = useState({
    push: true, email: true, sms: false, promo: false,
    '2fa': false, visibility: true, location: false, dark: false,
  });

  const flip = (key) => setToggles(p => ({ ...p, [key]: !p[key] }));

  const handlePress = (key) => {
    if (key === 'delete') {
      Alert.alert('Delete Account', 'This action is irreversible. Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]);
    } else if (key === 'download') {
      Alert.alert('Data Export', 'Your data export will be emailed within 24 hours.');
    } else if (key === 'password') {
      Alert.alert('Change Password', 'A reset link has been sent to your email.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App bar */}
      <View style={s.appBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <View style={s.card}>
                {sec.items.map((item, i) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      s.row,
                      i === sec.items.length - 1 && { borderBottomWidth: 0 },
                      item.danger && s.rowDanger,
                    ]}
                    onPress={() => !item.toggle && handlePress(item.key)}
                    activeOpacity={item.toggle ? 1 : 0.7}
                  >
                    <View style={[s.iconBox, item.danger && s.iconBoxDanger]}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={item.danger ? C.error : C.primary}
                      />
                    </View>
                    <Text style={[s.rowLabel, item.danger && { color: C.error }]}>{item.label}</Text>
                    <View style={s.rowRight}>
                      {item.value && (
                        <Text style={s.rowValue}>{item.value}</Text>
                      )}
                      {item.toggle !== undefined && (
                        <Switch
                          value={toggles[item.key]}
                          onValueChange={() => flip(item.key)}
                          trackColor={{ false: C.outlineVariant, true: C.primary + '80' }}
                          thumbColor={toggles[item.key] ? C.primary : C.outline}
                          ios_backgroundColor={C.outlineVariant}
                        />
                      )}
                      {item.arrow && (
                        <MaterialCommunityIcons name="chevron-right" size={20} color={item.danger ? C.error : C.outline} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* App info */}
          <Text style={s.appVersion}>Wildvora v2.4.1 · Build 240</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.background },
  appBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.outlineVariant + '40' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  card:    { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '45', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: C.outlineVariant + '30' },
  rowDanger: { backgroundColor: C.error + '06' },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.surfaceContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconBoxDanger: { backgroundColor: C.error + '15' },
  rowLabel: { flex: 1, fontSize: 15, color: C.onSurface, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: C.onSurfaceVariant, fontWeight: '500' },
  appVersion: { textAlign: 'center', fontSize: 12, color: C.outline, marginTop: 8 },
});