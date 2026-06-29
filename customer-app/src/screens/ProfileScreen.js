import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userAPI, reviewAPI } from '../services/api';
import Alert from '../utils/alert';

const C = {
  primary:             '#1A5F45',
  primaryDark:         '#154d38',
  primaryLight:        '#e8f5ee',
  primaryContainer:    '#2D7A5A',
  onPrimaryContainer:  '#FFFFFF',
  secondary:           '#0a6687',
  onSecondary:         '#ffffff',
  background:          '#F5F5F5',
  surface:             '#FFFFFF',
  surfaceContainer:    '#F0F0F0',
  surfaceContainerLow: '#F7F7F7',
  white:               '#FFFFFF',
  onSurface:           '#222222',
  onSurfaceVariant:    '#717171',
  outline:             '#B0B0B0',
  outlineVariant:      '#E0E0E0',
  tertiary:            '#C05621',
  error:               '#C13515',
};

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const MENU_ITEMS = [
  { icon: 'heart-outline',       label: 'My Wishlist',      key: 'wishlist',  special: false, screen: 'Wishlist' },
  { icon: 'gift-outline',        label: 'Referral Program', key: 'referral',  special: true,  screen: null, sub: 'Earn ₹4,000 per invite' },
  { icon: 'history',             label: 'Review History',   key: 'reviews',   special: false, screen: 'ReviewHistory' },
  { icon: 'help-circle-outline', label: 'Help Center',      key: 'help',      special: false, screen: 'HelpCenter' },
  { icon: 'cog-outline',         label: 'Settings',         key: 'settings',  special: false, screen: 'Settings' },
];

function StarRow({ count, total = 5 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={13}
          color={i < count ? '#FFB400' : C.outlineVariant}
        />
      ))}
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={C.onSurfaceVariant} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, keyboardType, multiline, required }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.inputLabel}>
        {label}{required && <Text style={{ color: C.error }}> *</Text>}
      </Text>
      <TextInput
        style={[s.input, multiline && { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor={C.outline}
        keyboardType={keyboardType || 'default'}
        multiline={!!multiline}
      />
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile]           = useState(null);
  const [reviews, setReviews]           = useState([]);
  const [completedTrips, setCompleted]  = useState(0);
  const [loading, setLoading]           = useState(!!user);
  const [logoutModal, setLogoutModal]   = useState(false);
  const [editModal, setEditModal]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [genderPicker, setGenderPicker] = useState(false);

  const [editName,      setEditName]      = useState('');
  const [editPhone,     setEditPhone]     = useState('');
  const [editBio,       setEditBio]       = useState('');
  const [editCity,      setEditCity]      = useState('');
  const [editDob,       setEditDob]       = useState('');
  const [editGender,    setEditGender]    = useState('');
  const [editEmerName,  setEditEmerName]  = useState('');
  const [editEmerPhone, setEditEmerPhone] = useState('');

  const syncEditState = (u) => {
    setEditName(u.name || '');
    setEditPhone(u.phone || '');
    setEditBio(u.bio || '');
    setEditCity(u.city || '');
    setEditDob(u.dateOfBirth || '');
    setEditGender(u.gender || '');
    setEditEmerName(u.emergencyContactName || '');
    setEditEmerPhone(u.emergencyContactPhone || '');
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [profRes, revRes] = await Promise.all([
          userAPI.getProfile(),
          reviewAPI.getMy(),
        ]);
        const u = profRes.data.user;
        setProfile(u);
        setCompleted(profRes.data.completedTrips || 0);
        setReviews(revRes.data.reviews || []);
        syncEditState(u);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({
        name:                  editName.trim(),
        phone:                 editPhone.trim(),
        bio:                   editBio.trim(),
        city:                  editCity.trim(),
        dateOfBirth:           editDob.trim(),
        gender:                editGender,
        emergencyContactName:  editEmerName.trim(),
        emergencyContactPhone: editEmerPhone.trim(),
      });
      const u = res.data.user;
      setProfile(u);
      updateUser(u);
      syncEditState(u);
      setEditModal(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update profile');
    } finally { setSaving(false); }
  };

  const handleMenuPress = (item) => {
    if (item.screen) navigation.navigate(item.screen);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.guestWrap}>
          <View style={s.guestAvatarRing}>
            <MaterialCommunityIcons name="account-outline" size={44} color={C.primary} />
          </View>
          <Text style={s.guestTitle}>Join Wildvora</Text>
          <Text style={s.guestSub}>
            Create a free account to manage your bookings, save adventures, and connect with operators.
          </Text>
          <TouchableOpacity style={s.guestPrimaryBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.87}>
            <Text style={s.guestPrimaryBtnText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.guestSecondaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.87}>
            <Text style={s.guestSecondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayUser    = profile || user;
  const joinYear       = displayUser?.createdAt ? new Date(displayUser.createdAt).getFullYear() : null;
  const avgRating      = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const previewReviews = reviews.slice(0, 2);
  const initial        = displayUser?.name?.[0]?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── Cover + Avatar ── */}
        <View style={s.cover}>
          <View style={s.coverPattern}>
            {[...Array(6)].map((_, i) => (
              <View key={i} style={[s.coverDot, { top: 20 + i * 22, left: 30 + (i % 3) * 60, opacity: 0.12 }]} />
            ))}
          </View>
          <Text style={s.coverLogo}>Wildvora</Text>
        </View>

        <View style={s.avatarArea}>
          <View style={s.avatarRing}>
            <View style={s.avatarInner}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>
          </View>
          {displayUser?.isPro && (
            <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>
          )}
        </View>

        <View style={s.content}>

          {/* ── Identity ── */}
          <View style={s.identity}>
            <Text style={s.userName}>{displayUser?.name}</Text>
            <View style={s.metaRow}>
              {joinYear && (
                <View style={s.metaChip}>
                  <MaterialCommunityIcons name="calendar-check-outline" size={12} color={C.onSurfaceVariant} />
                  <Text style={s.metaChipText}>Since {joinYear}</Text>
                </View>
              )}
              {displayUser?.city && (
                <View style={s.metaChip}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={C.onSurfaceVariant} />
                  <Text style={s.metaChipText}>{displayUser.city}</Text>
                </View>
              )}
            </View>
            {displayUser?.bio
              ? <Text style={s.userBio}>{displayUser.bio}</Text>
              : <Text style={[s.userBio, { color: C.outline, fontStyle: 'italic' }]}>No bio yet</Text>
            }
            <TouchableOpacity style={s.editBtn} onPress={() => setEditModal(true)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="pencil" size={14} color={C.primary} />
              <Text style={s.editBtnText}>Edit profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── Stats strip ── */}
          <View style={s.statsStrip}>
            <View style={s.statCell}>
              <Text style={s.statNum}>{completedTrips}</Text>
              <Text style={s.statLabel}>Trips</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              {avgRating
                ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={s.statNum}>{avgRating}</Text>
                    <MaterialCommunityIcons name="star" size={16} color="#FFB400" />
                  </View>
                : <Text style={s.statNum}>—</Text>
              }
              <Text style={s.statLabel}>Rating</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCell}>
              <Text style={s.statNum}>{reviews.length}</Text>
              <Text style={s.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* ── Personal Info ── */}
          {(displayUser?.email || displayUser?.phone || displayUser?.gender || displayUser?.dateOfBirth || displayUser?.emergencyContactName) && (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Personal info</Text>
              <View style={s.card}>
                <InfoRow icon="email-outline"          label="Email"             value={displayUser.email} />
                <InfoRow icon="phone-outline"          label="Phone"             value={displayUser.phone} />
                <InfoRow icon="gender-male-female"     label="Gender"            value={displayUser.gender} />
                <InfoRow icon="cake-variant-outline"   label="Date of Birth"     value={displayUser.dateOfBirth} />
                <InfoRow icon="account-heart-outline"  label="Emergency Contact" value={
                  displayUser.emergencyContactName
                    ? `${displayUser.emergencyContactName}${displayUser.emergencyContactPhone ? ' · ' + displayUser.emergencyContactPhone : ''}`
                    : null
                } />
              </View>
            </View>
          )}

          {/* ── Account Settings menu ── */}
          <View style={s.section}>
            <Text style={s.sectionHeading}>Account settings</Text>
            <View style={s.card}>
              {MENU_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={item.key}
                  style={[s.menuRow, i < MENU_ITEMS.length - 1 && s.menuRowBorder]}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.6}
                >
                  <View style={[s.menuIconWrap, item.special && { backgroundColor: C.tertiary + '18' }]}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={item.special ? C.tertiary : C.primary}
                    />
                  </View>
                  <View style={s.menuLabelWrap}>
                    <Text style={[s.menuLabel, item.special && { color: C.tertiary }]}>{item.label}</Text>
                    {item.sub && <Text style={s.menuSub}>{item.sub}</Text>}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={C.outline} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Reviews preview ── */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionHeading}>Your reviews</Text>
              {reviews.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('ReviewHistory')}>
                  <Text style={s.viewAll}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
            {previewReviews.length === 0 ? (
              <View style={s.emptyBox}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="star-outline" size={28} color={C.primary} />
                </View>
                <Text style={s.emptyTitle}>No reviews yet</Text>
                <Text style={s.emptyBody}>Complete a trip and share your experience!</Text>
              </View>
            ) : (
              previewReviews.map((r, i) => (
                <View key={i} style={[s.reviewCard, i < previewReviews.length - 1 && { marginBottom: 10 }]}>
                  <View style={s.reviewTop}>
                    <View style={s.reviewIconWrap}>
                      <MaterialCommunityIcons name="map-marker-outline" size={18} color={C.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.reviewTitle} numberOfLines={1}>
                        {r.experience?.title || 'Experience'}
                      </Text>
                      <StarRow count={r.rating} />
                    </View>
                  </View>
                  {r.comment
                    ? <Text style={s.reviewText} numberOfLines={2}>{r.comment}</Text>
                    : null}
                </View>
              ))
            )}
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity style={s.logoutRow} onPress={() => setLogoutModal(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={18} color={C.error} />
            <Text style={s.logoutText}>Log out</Text>
          </TouchableOpacity>

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Edit Profile Modal ─── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setEditModal(false)} style={s.modalCloseBtn}>
              <Ionicons name="close" size={20} color={C.onSurface} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={s.modalSaveBtn}>
              {saving
                ? <ActivityIndicator size="small" color={C.white} />
                : <Text style={s.modalSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={s.formSection}>Basic info</Text>
            <FieldInput label="Full Name"    value={editName}  onChangeText={setEditName}  placeholder="Your full name" required />
            <FieldInput label="Phone Number" value={editPhone} onChangeText={setEditPhone} placeholder="+91 00000 00000" keyboardType="phone-pad" />
            <FieldInput label="City"         value={editCity}  onChangeText={setEditCity}  placeholder="e.g. Mumbai, Delhi…" />
            <FieldInput label="Bio"          value={editBio}   onChangeText={setEditBio}   placeholder="Tell adventurers about yourself…" multiline />

            <Text style={s.formSection}>Personal details</Text>
            <FieldInput label="Date of Birth" value={editDob} onChangeText={setEditDob} placeholder="DD/MM/YYYY" />

            <View style={s.fieldWrap}>
              <Text style={s.inputLabel}>Gender</Text>
              <TouchableOpacity style={s.pickerBtn} onPress={() => setGenderPicker(true)} activeOpacity={0.8}>
                <Text style={[s.pickerBtnText, !editGender && { color: C.outline }]}>
                  {editGender || 'Select gender'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={C.outline} />
              </TouchableOpacity>
            </View>

            <Text style={s.formSection}>Emergency contact</Text>
            <Text style={s.formSectionSub}>Shared with operators during your trip for safety.</Text>
            <FieldInput label="Contact Name"  value={editEmerName}  onChangeText={setEditEmerName}  placeholder="e.g. Parent / Spouse / Friend" />
            <FieldInput label="Contact Phone" value={editEmerPhone} onChangeText={setEditEmerPhone} placeholder="+91 00000 00000" keyboardType="phone-pad" />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ─── Gender picker ─── */}
      <Modal visible={genderPicker} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setGenderPicker(false)}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select Gender</Text>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={s.sheetOption}
                onPress={() => { setEditGender(g); setGenderPicker(false); }}
              >
                <Text style={[s.sheetOptionText, editGender === g && { color: C.primary, fontWeight: '700' }]}>{g}</Text>
                {editGender === g && <Ionicons name="checkmark-circle" size={20} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Logout confirm ─── */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={s.dialogOverlay}>
          <View style={s.dialog}>
            <View style={s.dialogIconWrap}>
              <MaterialCommunityIcons name="logout" size={26} color={C.error} />
            </View>
            <Text style={s.dialogTitle}>Log out?</Text>
            <Text style={s.dialogBody}>
              Are you sure you want to log out of your Wildvora account?
            </Text>
            <TouchableOpacity style={s.dialogConfirm} onPress={() => { setLogoutModal(false); logout(); }}>
              <Text style={s.dialogConfirmText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dialogCancel} onPress={() => setLogoutModal(false)}>
              <Text style={s.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const SHADOW = Platform.select({
  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  android: { elevation: 2 },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Cover banner */
  cover: {
    height: 150,
    backgroundColor: C.primary,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    overflow: 'hidden',
  },
  coverPattern: { ...StyleSheet.absoluteFillObject },
  coverDot:     { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: C.white },
  coverLogo:    { fontSize: 22, fontWeight: '800', color: C.white, letterSpacing: -0.5, opacity: 0.92 },

  /* Avatar */
  avatarArea: { alignItems: 'center', marginTop: -52 },
  avatarRing: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOW,
  },
  avatarInner: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 38, fontWeight: '700', color: C.onPrimaryContainer },
  proBadge:      { position: 'absolute', bottom: 2, right: 4, backgroundColor: C.tertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  proBadgeText:  { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 1 },

  /* Identity block */
  content:  { paddingHorizontal: 20, paddingTop: 4 },
  identity: { alignItems: 'center', paddingTop: 14, paddingBottom: 20 },
  userName: { fontSize: 26, fontWeight: '700', color: C.onSurface, letterSpacing: -0.5, marginBottom: 8 },
  metaRow:  { flexDirection: 'row', gap: 10, marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  metaChipText: { fontSize: 12, color: C.onSurfaceVariant, fontWeight: '500' },
  userBio:  { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 21, marginBottom: 14, maxWidth: '90%' },
  editBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary + '50', borderRadius: 50, paddingHorizontal: 20, paddingVertical: 9, backgroundColor: C.primaryLight },
  editBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },

  /* Stats */
  statsStrip: {
    flexDirection: 'row', backgroundColor: C.white, borderRadius: 16,
    marginBottom: 24, ...SHADOW,
    overflow: 'hidden',
  },
  statCell:    { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statDivider: { width: 1, backgroundColor: C.outlineVariant, marginVertical: 14 },
  statNum:     { fontSize: 24, fontWeight: '700', color: C.onSurface, lineHeight: 28 },
  statLabel:   { fontSize: 11, color: C.onSurfaceVariant, marginTop: 3, fontWeight: '500' },

  /* Generic section */
  section:      { marginBottom: 24 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2, marginBottom: 10 },
  viewAll:      { fontSize: 13, fontWeight: '700', color: C.primary },

  /* White card */
  card: { backgroundColor: C.white, borderRadius: 16, overflow: 'hidden', ...SHADOW },

  /* Info rows */
  infoRow:   { flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderColor: C.outlineVariant },
  infoLabel: { fontSize: 11, color: C.onSurfaceVariant, marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: 14, color: C.onSurface, fontWeight: '600' },

  /* Menu */
  menuRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderColor: C.outlineVariant },
  menuIconWrap:  { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabelWrap: { flex: 1 },
  menuLabel:     { fontSize: 15, color: C.onSurface, fontWeight: '500' },
  menuSub:       { fontSize: 12, color: C.tertiary, marginTop: 1, fontWeight: '600' },

  /* Logout */
  logoutRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, justifyContent: 'center', marginBottom: 4 },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.error },

  /* Review cards */
  reviewCard:    { backgroundColor: C.white, borderRadius: 14, padding: 14, ...SHADOW },
  reviewTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  reviewIconWrap:{ width: 42, height: 42, borderRadius: 10, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  reviewTitle:   { fontSize: 13, fontWeight: '700', color: C.onSurface },
  reviewText:    { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19 },

  /* Empty state */
  emptyBox:     { backgroundColor: C.white, borderRadius: 16, padding: 32, alignItems: 'center', ...SHADOW },
  emptyIconWrap:{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.onSurface, marginBottom: 4 },
  emptyBody:    { fontSize: 13, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 19 },

  /* Edit modal */
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: C.outlineVariant },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  modalTitle:    { fontSize: 16, fontWeight: '700', color: C.onSurface },
  modalSaveBtn:  { backgroundColor: C.primary, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 8 },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: C.white },

  formSection:    { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.5, marginTop: 24, marginBottom: 8, textTransform: 'uppercase' },
  formSectionSub: { fontSize: 12, color: C.outline, marginTop: -4, marginBottom: 12, lineHeight: 17 },

  fieldWrap:  { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: C.onSurface, backgroundColor: C.white,
  },

  /* Gender sheet */
  sheetOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 36 },
  sheetHandle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:       { fontSize: 16, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  sheetOption:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: C.outlineVariant },
  sheetOptionText:  { fontSize: 15, color: C.onSurface },

  /* Picker btn */
  pickerBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.white },
  pickerBtnText: { fontSize: 15, color: C.onSurface },

  /* Logout dialog */
  dialogOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  dialog:           { backgroundColor: C.white, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  dialogIconWrap:   { width: 60, height: 60, borderRadius: 30, backgroundColor: C.error + '14', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  dialogTitle:      { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  dialogBody:       { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  dialogConfirm:    { backgroundColor: C.error, borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  dialogConfirmText:{ color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },
  dialogCancel:     { paddingVertical: 14, width: '100%', alignItems: 'center' },
  dialogCancelText: { color: C.onSurfaceVariant, fontWeight: '600', fontSize: 14 },

  guestWrap:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestAvatarRing:      { width: 96, height: 96, borderRadius: 48, backgroundColor: C.primaryLight, borderWidth: 2, borderColor: '#A7F3D0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  guestTitle:           { fontSize: 24, fontWeight: '800', color: C.onSurface, marginBottom: 10, textAlign: 'center', letterSpacing: -0.4 },
  guestSub:             { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 21, marginBottom: 36 },
  guestPrimaryBtn:      { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignSelf: 'stretch', alignItems: 'center', marginBottom: 12 },
  guestPrimaryBtnText:  { fontSize: 15, fontWeight: '800', color: C.white },
  guestSecondaryBtn:    { borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 15, alignSelf: 'stretch', alignItems: 'center' },
  guestSecondaryBtnText:{ fontSize: 15, fontWeight: '700', color: C.primary },
});
