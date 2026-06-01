import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, ActivityIndicator, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userAPI, reviewAPI } from '../services/api';

const C = {
  primary:             '#11694b',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
  onSecondary:         '#ffffff',
  background:          '#f7faf6',
  surface:             '#f7faf6',
  surfaceContainer:    '#ebefea',
  surfaceContainerLow: '#f1f4f0',
  surfaceContainerHigh:'#e6e9e5',
  white:               '#ffffff',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
  tertiary:            '#8f4645',
  error:               '#ba1a1a',
};

const REVIEW_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7HST3268dIsO3eQCdNLblb2DGpGtdvZaZ0tOb2xnmVQP3RY84ypxoDe_r3X6KMS-JDBITCDbOiUEkZ_PSdWc6WHKcypd-gfkbJKnzShWWtJkB9Aj8X0Z4na__2AThP8YrOhkEh4cvucVxGzC9HDdOyWNgC1aWUI4W3o8t8ktFoNnVILYV_Y36osCCCvVu4r0BJ9PaGZA06C4jGYe7wMb4QH6jqkv-muj3ah8VDalnv0LyxS39oaviTG_SzxX8xKrCPZrEJM8XC-I',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCHotBAYe4H08jpUx7aFsFJYUjSHms7B7_RV03q93adEtAoh5oT8CujF95WxtdNsaz7jTQoPxrlzLz0QD9zV17_wqqxF6f2EVcemP9r8mwXcLPJyqbjsjwyeknWAk-2R-EU6TcFt8HlOxI2jxLMEp_sana2hYHAh3W6K33z5b-g1bo3c4e0EinRdfMam6FKpbBFxKk0UOJEPfV29e6BNy2R-cHuyQckNgvZdatIPe-GYZNOAuIPSBGqEslZvB2hnFEvsnmp1e1VLqg',
];

// Menu items — icon names from MaterialCommunityIcons
const MENU_ITEMS = [
  { icon: 'heart-outline',   label: 'My Wishlist',      key: 'wishlist',  special: false },
  { icon: 'gift-outline',    label: 'Referral Program', key: 'referral',  special: true,  sub: 'Earn $50 per invite' },
  { icon: 'history',         label: 'Review History',   key: 'reviews',   special: false },
  { icon: 'help-circle-outline', label: 'Help Center',  key: 'help',      special: false },
  { icon: 'cog-outline',     label: 'Settings',         key: 'settings',  special: false },
];

function StarRow({ count, total = 5 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={13}
          color={i < count ? C.secondary : C.outlineVariant}
        />
      ))}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile]       = useState(null);
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editModal, setEditModal]   = useState(false);
  const [editName, setEditName]     = useState('');
  const [editPhone, setEditPhone]   = useState('');
  const [editBio, setEditBio]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  // ── Logic unchanged ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const [profRes, revRes] = await Promise.all([
          userAPI.getProfile(),
          reviewAPI.getMy(),
        ]);
        setProfile(profRes.data.user);
        setReviews(revRes.data.reviews);
        setEditName(profRes.data.user.name || '');
        setEditPhone(profRes.data.user.phone || '');
        setEditBio(profRes.data.user.bio || '');
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({ name: editName, phone: editPhone, bio: editBio });
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditModal(false);
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update profile');
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    setLogoutModal(false);
    await logout();
  };
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;

  const displayUser = profile || user;

  const demoReviews = [
    { title: 'Alpine Ridge Trail',   rating: 5, text: 'The ascent was challenging but the sunrise views from the ridge were absolutely world-class...', img: REVIEW_IMAGES[0] },
    { title: 'Mistwood Sanctuary',   rating: 4, text: 'Perfect for a weekend escape. Very quiet and the trails are well-marked...', img: REVIEW_IMAGES[1] },
  ];
  const displayReviews = reviews.length > 0
    ? reviews.slice(0, 2).map((r, i) => ({ title: r.experience?.title || 'Experience', rating: r.rating, text: r.comment, img: REVIEW_IMAGES[i % REVIEW_IMAGES.length] }))
    : demoReviews;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* App bar */}
      <View style={s.appBar}>
        <View style={s.appBarLeft}>
          <MaterialCommunityIcons name="menu" size={24} color={C.onSurfaceVariant} />
          <Text style={s.appBarLogo}>Wildvora</Text>
        </View>
        <View style={s.appBarAvatar}>
          <Text style={s.appBarAvatarText}>{displayUser?.name?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.content}>

          {/* Hero card */}
          <View style={s.heroCard}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarInitial}>{displayUser?.name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
              {displayUser?.isPro && (
                <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>
              )}
            </View>
            <Text style={s.heroName}>{displayUser?.name}</Text>
            <Text style={s.heroSub}>Adventurer &amp; Gear Enthusiast</Text>
            <View style={s.heroTags}>
              <View style={s.heroTag}><Text style={s.heroTagText}>Joined 2023</Text></View>
              <View style={[s.heroTag, s.heroTagSecondary]}><Text style={[s.heroTagText, s.heroTagTextSecondary]}>Peak Bagger</Text></View>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditModal(true)} activeOpacity={0.85}>
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: C.primaryContainer }]}>
              <Text style={[s.statNum, { color: C.onPrimaryContainer }]}>
                {profile?.wishlist?.length ?? 12}
              </Text>
              <Text style={[s.statLabel, { color: C.onPrimaryContainer + 'BB' }]}>TRIPS TAKEN</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: C.secondary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[s.statNum, { color: C.onSecondary }]}>4.8</Text>
                <MaterialCommunityIcons name="star" size={18} color={C.onSecondary} />
              </View>
              <Text style={[s.statLabel, { color: C.onSecondary + 'BB' }]}>REVIEWER SCORE</Text>
            </View>
          </View>

          {/* Account Settings */}
          <Text style={s.sectionTitle}>Account Settings</Text>

          <View style={s.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  s.menuRow,
                  item.special && s.menuRowSpecial,
                  i === MENU_ITEMS.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => item.key === 'wishlist' ? navigation.navigate('Wishlist') : null}
                activeOpacity={0.75}
              >
                <View style={[s.menuIconBox, item.special && s.menuIconBoxSpecial]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={item.special ? C.white : C.primary}
                  />
                </View>
                <View style={s.menuLabelWrap}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.sub && <Text style={s.menuSubLabel}>{item.sub}</Text>}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={item.special ? C.tertiary : C.outline}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={s.logoutRow} onPress={() => setLogoutModal(true)} activeOpacity={0.75}>
            <MaterialCommunityIcons name="logout" size={22} color={C.error} />
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Reviews */}
          <View style={s.reviewsCard}>
            <View style={s.reviewsHdr}>
              <Text style={s.reviewsTitle}>Your Reviews</Text>
              <TouchableOpacity><Text style={s.reviewsViewAll}>View All</Text></TouchableOpacity>
            </View>
            {displayReviews.map((r, i) => (
              <View key={i} style={s.reviewItem}>
                <View style={s.reviewItemTop}>
                  <Image source={{ uri: r.img }} style={s.reviewImg} resizeMode="cover" />
                  <View style={s.reviewItemInfo}>
                    <Text style={s.reviewItemTitle} numberOfLines={1}>{r.title}</Text>
                    <StarRow count={r.rating} />
                  </View>
                </View>
                <Text style={s.reviewItemText} numberOfLines={2}>{r.text}</Text>
              </View>
            ))}
          </View>

        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={C.primary} />
                : <Text style={s.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            {[
              { label: 'NAME',  value: editName,  set: setEditName,  props: {} },
              { label: 'PHONE', value: editPhone, set: setEditPhone, props: { keyboardType: 'phone-pad' } },
              { label: 'BIO',   value: editBio,   set: setEditBio,   props: { multiline: true, numberOfLines: 3, style: { height: 80 } } },
            ].map(({ label, value, set, props }) => (
              <View key={label}>
                <Text style={s.inputLabel}>{label}</Text>
                <TextInput
                  style={[s.input, props.style]}
                  value={value}
                  onChangeText={set}
                  {...props}
                />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Logout Modal */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={s.logoutOverlay}>
          <View style={s.logoutBox}>
            <Text style={s.logoutTitle}>Log Out?</Text>
            <Text style={s.logoutSubText}>Are you sure you want to log out of your Wildvora account?</Text>
            <TouchableOpacity style={s.logoutConfirmBtn} onPress={handleLogout}>
              <Text style={s.logoutConfirmText}>LOG OUT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutCancelBtn} onPress={() => setLogoutModal(false)}>
              <Text style={s.logoutCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  appBar:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surface + 'CC', borderBottomWidth: 1, borderColor: C.outlineVariant + '40' },
  appBarLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appBarLogo:       { fontSize: 20, fontWeight: '700', color: C.primary, letterSpacing: -0.3 },
  appBarAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceContainerLow, borderWidth: 2, borderColor: C.primary + '30', justifyContent: 'center', alignItems: 'center' },
  appBarAvatarText: { fontSize: 14, fontWeight: '700', color: C.primary },

  heroCard:     { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', padding: 24, alignItems: 'center', marginTop: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  avatarWrap:   { position: 'relative', marginBottom: 12 },
  avatar:       { width: 100, height: 100, borderRadius: 50, backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.primaryContainer + '60' },
  avatarInitial:{ fontSize: 36, fontWeight: '700', color: C.onPrimaryContainer },
  proBadge:     { position: 'absolute', bottom: -2, right: -4, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  proBadgeText: { fontSize: 10, fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  heroName:     { fontSize: 24, fontWeight: '700', color: C.onSurface, marginBottom: 3, letterSpacing: -0.3 },
  heroSub:      { fontSize: 14, color: C.onSurfaceVariant, marginBottom: 12 },
  heroTags:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  heroTag:      { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: C.primary + '18', borderRadius: 50 },
  heroTagSecondary: { backgroundColor: C.secondary + '18' },
  heroTagText:  { fontSize: 12, fontWeight: '600', color: C.primary },
  heroTagTextSecondary: { color: C.secondary },
  editBtn:      { borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 9 },
  editBtnText:  { fontSize: 13, fontWeight: '600', color: C.onSurface },

  statsRow:  { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard:  { flex: 1, borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  statNum:   { fontSize: 30, fontWeight: '700', lineHeight: 34 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase' },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 12, letterSpacing: -0.2 },

  menuCard:           { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', overflow: 'hidden', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  menuRow:            { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: C.outlineVariant + '30' },
  menuRowSpecial:     { backgroundColor: C.tertiary + '08' },
  menuIconBox:        { width: 40, height: 40, borderRadius: 10, backgroundColor: C.surfaceContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuIconBoxSpecial: { backgroundColor: C.tertiary },
  menuLabelWrap:      { flex: 1 },
  menuLabel:          { fontSize: 15, color: C.onSurface, fontWeight: '500' },
  menuSubLabel:       { fontSize: 12, color: C.tertiary, marginTop: 1, fontWeight: '600' },

  logoutRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 4, marginBottom: 24, marginTop: 8 },
  logoutText: { fontSize: 18, fontWeight: '700', color: C.error },

  reviewsCard:    { backgroundColor: C.surfaceContainerLow, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.outlineVariant + '30', marginBottom: 8 },
  reviewsHdr:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  reviewsTitle:   { fontSize: 18, fontWeight: '700', color: C.onSurface },
  reviewsViewAll: { fontSize: 13, fontWeight: '700', color: C.primary },
  reviewItem:     { backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  reviewItemTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  reviewImg:      { width: 48, height: 48, borderRadius: 10 },
  reviewItemInfo: { flex: 1 },
  reviewItemTitle:{ fontSize: 13, fontWeight: '700', color: C.onSurface, marginBottom: 4 },
  reviewItemText: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19 },

  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.outlineVariant + '50' },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: C.onSurface },
  modalCancel:  { fontSize: 15, color: C.onSurfaceVariant },
  modalSave:    { fontSize: 15, fontWeight: '700', color: C.primary },
  inputLabel:   { fontSize: 11, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.8, marginBottom: 5, marginTop: 4 },
  input:        { borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.onSurface, backgroundColor: C.surfaceContainerLow, marginBottom: 14 },

  logoutOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoutBox:         { backgroundColor: C.white, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  logoutTitle:       { fontSize: 22, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  logoutSubText:     { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  logoutConfirmBtn:  { backgroundColor: C.error, borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  logoutConfirmText: { color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  logoutCancelBtn:   { borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center' },
  logoutCancelText:  { color: C.onSurface, fontWeight: '700', fontSize: 14 },
});