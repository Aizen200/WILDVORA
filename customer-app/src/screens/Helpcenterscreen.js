import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
};

const CATEGORIES = [
  { icon: 'calendar-check-outline', label: 'Bookings',    color: '#0a6687' },
  { icon: 'credit-card-outline',    label: 'Payments',    color: '#1A5F45' },
  { icon: 'account-outline',        label: 'Account',     color: '#7c5c00' },
  { icon: 'map-marker-outline',     label: 'Experiences', color: '#8f4645' },
];

const FAQS = [
  {
    q: 'How do I cancel or modify a booking?',
    a: 'Go to My Bookings, select the booking you want to change, and tap "Manage Booking". Cancellation policies vary by host — full details are shown before you confirm.',
  },
  {
    q: 'When will I receive my refund?',
    a: 'Refunds are processed within 3–5 business days after cancellation is confirmed. The time to appear in your account depends on your bank or card issuer.',
  },
  {
    q: 'How do I contact a host before booking?',
    a: 'On any listing page, tap the "Message Host" button. You can send questions before or after booking. Hosts typically respond within a few hours.',
  },
  {
    q: 'What is the Wildvora Guarantee?',
    a: 'Every booking is protected by the Wildvora Guest Guarantee. If your experience is significantly different from the listing, we\'ll work to find a solution or provide a full refund.',
  },
  {
    q: 'How do I become a verified host?',
    a: 'Submit your ID and listing details through the Host portal. Our team reviews applications within 2–3 business days. Verified hosts receive a badge and better visibility.',
  },
  {
    q: 'Can I leave a review after my experience?',
    a: 'Yes! After your booking ends you\'ll receive a prompt to leave a review. Reviews can be submitted up to 14 days after checkout.',
  },
];

const CONTACT = [
  { icon: 'chat-outline',      label: 'Live Chat',      sub: 'Usually responds in < 2 min', color: C.primary },
  { icon: 'email-outline',     label: 'Email Support',  sub: 'support@wildvora.com',         color: C.secondary },
  { icon: 'phone-outline',     label: 'Call Us',        sub: '+1 (800) 945-3820',            color: '#7c5c00' },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(p => !p);
  };

  return (
    <TouchableOpacity style={s.faqItem} onPress={toggle} activeOpacity={0.75}>
      <View style={s.faqRow}>
        <Text style={s.faqQ}>{item.q}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={C.outline}
        />
      </View>
      {open && <Text style={s.faqA}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpCenterScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredFaqs = search.trim()
    ? FAQS.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : FAQS;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App bar */}
      <View style={s.appBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={s.hero}>
          <MaterialCommunityIcons name="lifebuoy" size={40} color={C.onPrimaryContainer} />
          <Text style={s.heroTitle}>How can we help?</Text>
          <Text style={s.heroSub}>Search our knowledge base or browse topics below</Text>
          {/* Search */}
          <View style={s.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={C.outline} />
            <TextInput
              style={s.searchInput}
              placeholder="Search help articles..."
              placeholderTextColor={C.outline}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={C.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={s.content}>

          {/* Categories */}
          {!search && (
            <>
              <Text style={s.sectionTitle}>Browse by Topic</Text>
              <View style={s.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.label} style={s.catCard} activeOpacity={0.75}>
                    <View style={[s.catIconBox, { backgroundColor: cat.color + '18' }]}>
                      <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
                    </View>
                    <Text style={s.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* FAQs */}
          <Text style={s.sectionTitle}>
            {search ? `Results for "${search}"` : 'Frequently Asked Questions'}
          </Text>

          {filteredFaqs.length === 0 ? (
            <View style={s.noResult}>
              <MaterialCommunityIcons name="emoticon-sad-outline" size={40} color={C.outlineVariant} />
              <Text style={s.noResultText}>No results found</Text>
              <Text style={s.noResultSub}>Try different keywords or contact support</Text>
            </View>
          ) : (
            <View style={s.faqCard}>
              {filteredFaqs.map((item, i) => (
                <View key={i} style={i < filteredFaqs.length - 1 && s.faqDivider}>
                  <FaqItem item={item} />
                </View>
              ))}
            </View>
          )}

          {/* Contact options */}
          <Text style={s.sectionTitle}>Still need help?</Text>
          <View style={s.contactList}>
            {CONTACT.map(c => (
              <TouchableOpacity key={c.label} style={s.contactRow} activeOpacity={0.75}>
                <View style={[s.contactIcon, { backgroundColor: c.color + '18' }]}>
                  <MaterialCommunityIcons name={c.icon} size={22} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.contactLabel}>{c.label}</Text>
                  <Text style={s.contactSub}>{c.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.outline} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer note */}
          <View style={s.footerNote}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={C.outline} />
            <Text style={s.footerText}>Support available Mon–Fri, 9 am–8 pm EST</Text>
          </View>

        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#f7faf6' },
  appBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f7faf6', borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '40' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },

  hero:      { backgroundColor: C.primaryContainer, paddingTop: 28, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center', gap: 6 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: C.onPrimaryContainer, marginTop: 8, letterSpacing: -0.3 },
  heroSub:   { fontSize: 13, color: C.onPrimaryContainer + 'BB', textAlign: 'center', marginBottom: 6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 12, gap: 10, width: '100%', marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: C.onSurface, padding: 0 },

  content:      { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.onSurface, marginBottom: 12, marginTop: 4, letterSpacing: -0.2 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  catCard:      { width: '47%', backgroundColor: C.white, borderRadius: 14, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.outlineVariant + '45', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  catIconBox:   { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  catLabel:     { fontSize: 13, fontWeight: '700', color: C.onSurface },

  faqCard:    { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '45', overflow: 'hidden', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '30' },
  faqItem:    { padding: 16 },
  faqRow:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  faqQ:       { flex: 1, fontSize: 14, fontWeight: '600', color: C.onSurface, lineHeight: 20 },
  faqA:       { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20, marginTop: 10 },

  noResult:    { alignItems: 'center', paddingVertical: 40, gap: 8, marginBottom: 24 },
  noResultText:{ fontSize: 16, fontWeight: '700', color: C.onSurfaceVariant },
  noResultSub: { fontSize: 13, color: C.outline },

  contactList: { gap: 10, marginBottom: 20 },
  contactRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.outlineVariant + '45', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  contactIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  contactLabel:{ fontSize: 14, fontWeight: '700', color: C.onSurface },
  contactSub:  { fontSize: 12, color: C.outline, marginTop: 1 },

  footerNote:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 4 },
  footerText:  { fontSize: 12, color: C.outline },
});