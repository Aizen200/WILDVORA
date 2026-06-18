import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userAPI, reviewAPI } from '../services/api';
import Alert from '../utils/alert';

const C = {
  primary:             '#1A5F45',
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
          color={i < count ? C.secondary : C.outlineVariant}
        />
      ))}
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>
        <MaterialCommunityIcons name={icon} size={16} color={C.primary} />
      </View>
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
        style={[s.input, multiline && { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor={C.outlineVariant}
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
  const [loading, setLoading]           = useState(true);
  const [logoutModal, setLogoutModal]   = useState(false);
  const [editModal, setEditModal]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [genderPicker, setGenderPicker] = useState(false);

  // Edit state
  const [editName,       setEditName]       = useState('');
  const [editPhone,      setEditPhone]      = useState('');
  const [editBio,        setEditBio]        = useState('');
  const [editCity,       setEditCity]       = useState('');
  const [editDob,        setEditDob]        = useState('');
  const [editGender,     setEditGender]     = useState('');
  const [editEmerName,   setEditEmerName]   = useState('');
  const [editEmerPhone,  setEditEmerPhone]  = useState('');

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
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({
        name:                 editName.trim(),
        phone:                editPhone.trim(),
        bio:                  editBio.trim(),
        city:                 editCity.trim(),
        dateOfBirth:          editDob.trim(),
        gender:               editGender,
        emergencyContactName: editEmerName.trim(),
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

  const displayUser  = profile || user;
  const joinYear     = displayUser?.createdAt
    ? new Date(displayUser.createdAt).getFullYear()
    : null;
  const avgRating    = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const previewReviews = reviews.slice(0, 2);

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

            {displayUser?.bio
              ? <Text style={s.heroBio}>{displayUser.bio}</Text>
              : <Text style={[s.heroBio, { color: C.outlineVariant }]}>No bio yet</Text>
            }

            <View style={s.heroMeta}>
              {joinYear && (
                <View style={s.heroMetaItem}>
                  <MaterialCommunityIcons name="calendar-outline" size={13} color={C.outline} />
                  <Text style={s.heroMetaText}>Member since {joinYear}</Text>
                </View>
              )}
              {displayUser?.city ? (
                <View style={s.heroMetaItem}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color={C.outline} />
                  <Text style={s.heroMetaText}>{displayUser.city}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={s.editBtn} onPress={() => setEditModal(true)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color={C.onSurface} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: C.primaryContainer }]}>
              <Text style={[s.statNum, { color: C.onPrimaryContainer }]}>{completedTrips}</Text>
              <Text style={[s.statLabel, { color: C.onPrimaryContainer + 'BB' }]}>TRIPS COMPLETED</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: C.secondary }]}>
              {avgRating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[s.statNum, { color: C.onSecondary }]}>{avgRating}</Text>
                  <MaterialCommunityIcons name="star" size={18} color={C.onSecondary} />
                </View>
              ) : (
                <Text style={[s.statNum, { color: C.onSecondary }]}>—</Text>
              )}
              <Text style={[s.statLabel, { color: C.onSecondary + 'BB' }]}>AVG REVIEW SCORE</Text>
            </View>
          </View>

          {/* Profile info card */}
          {(displayUser?.email || displayUser?.phone || displayUser?.gender || displayUser?.dateOfBirth || displayUser?.emergencyContactName) && (
            <View style={s.infoCard}>
              <Text style={s.infoCardTitle}>Personal Info</Text>
              <InfoRow icon="email-outline"       label="Email"               value={displayUser.email} />
              <InfoRow icon="phone-outline"       label="Phone"               value={displayUser.phone} />
              <InfoRow icon="gender-male-female"  label="Gender"              value={displayUser.gender} />
              <InfoRow icon="cake-variant-outline"label="Date of Birth"       value={displayUser.dateOfBirth} />
              <InfoRow icon="account-heart-outline" label="Emergency Contact" value={
                displayUser.emergencyContactName
                  ? `${displayUser.emergencyContactName}${displayUser.emergencyContactPhone ? ' · ' + displayUser.emergencyContactPhone : ''}`
                  : null
              } />
            </View>
          )}

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
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.75}
              >
                <View style={[s.menuIconBox, item.special && s.menuIconBoxSpecial]}>
                  <MaterialCommunityIcons name={item.icon} size={20} color={item.special ? C.white : C.primary} />
                </View>
                <View style={s.menuLabelWrap}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.sub && <Text style={s.menuSubLabel}>{item.sub}</Text>}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={item.special ? C.tertiary : C.outline} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={s.logoutRow} onPress={() => setLogoutModal(true)} activeOpacity={0.75}>
            <MaterialCommunityIcons name="logout" size={22} color={C.error} />
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Reviews preview */}
          <View style={s.reviewsCard}>
            <View style={s.reviewsHdr}>
              <Text style={s.reviewsTitle}>Your Reviews</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ReviewHistory')}>
                <Text style={s.reviewsViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            {previewReviews.length === 0 ? (
              <View style={s.reviewsEmpty}>
                <MaterialCommunityIcons name="star-off-outline" size={32} color={C.outlineVariant} />
                <Text style={s.reviewsEmptyText}>No reviews yet.</Text>
                <Text style={[s.reviewsEmptyText, { fontSize: 12, marginTop: 2 }]}>
                  Complete a trip to leave your first review!
                </Text>
              </View>
            ) : (
              previewReviews.map((r, i) => (
                <View key={i} style={s.reviewItem}>
                  <View style={s.reviewItemTop}>
                    <View style={s.reviewExpIcon}>
                      <MaterialCommunityIcons name="map-marker-outline" size={18} color={C.primary} />
                    </View>
                    <View style={s.reviewItemInfo}>
                      <Text style={s.reviewItemTitle} numberOfLines={1}>
                        {r.experience?.title || 'Experience'}
                      </Text>
                      <StarRow count={r.rating} />
                    </View>
                  </View>
                  {r.comment ? (
                    <Text style={s.reviewItemText} numberOfLines={2}>{r.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
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

          <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={s.sectionDivider}>BASIC INFO</Text>

            <FieldInput label="Full Name" value={editName} onChangeText={setEditName} placeholder="Your full name" required />
            <FieldInput label="Phone Number" value={editPhone} onChangeText={setEditPhone} placeholder="+91 00000 00000" keyboardType="phone-pad" />
            <FieldInput label="City" value={editCity} onChangeText={setEditCity} placeholder="e.g. Mumbai, Delhi..." />
            <FieldInput label="Bio" value={editBio} onChangeText={setEditBio} placeholder="Tell adventurers about yourself..." multiline />

            <Text style={s.sectionDivider}>PERSONAL DETAILS</Text>

            <FieldInput label="Date of Birth" value={editDob} onChangeText={setEditDob} placeholder="DD/MM/YYYY" />

            {/* Gender picker */}
            <View style={s.fieldWrap}>
              <Text style={s.inputLabel}>GENDER</Text>
              <TouchableOpacity style={s.pickerBtn} onPress={() => setGenderPicker(true)} activeOpacity={0.8}>
                <Text style={[s.pickerBtnText, !editGender && { color: C.outlineVariant }]}>
                  {editGender || 'Select gender'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={C.outline} />
              </TouchableOpacity>
            </View>

            <Text style={s.sectionDivider}>EMERGENCY CONTACT</Text>
            <Text style={s.sectionDividerSub}>Shared with operators during your trip for safety purposes.</Text>

            <FieldInput label="Contact Name" value={editEmerName} onChangeText={setEditEmerName} placeholder="e.g. Parent / Spouse / Friend" />
            <FieldInput label="Contact Phone" value={editEmerPhone} onChangeText={setEditEmerPhone} placeholder="+91 00000 00000" keyboardType="phone-pad" />

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Gender picker modal */}
      <Modal visible={genderPicker} transparent animationType="fade">
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setGenderPicker(false)}>
          <View style={s.pickerBox}>
            <Text style={s.pickerTitle}>Select Gender</Text>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[s.pickerOption, editGender === g && s.pickerOptionActive]}
                onPress={() => { setEditGender(g); setGenderPicker(false); }}
              >
                <Text style={[s.pickerOptionText, editGender === g && s.pickerOptionTextActive]}>{g}</Text>
                {editGender === g && <Ionicons name="checkmark" size={18} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirm Modal */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={s.logoutOverlay}>
          <View style={s.logoutBox}>
            <Text style={s.logoutTitle}>Log Out?</Text>
            <Text style={s.logoutSubText}>
              Are you sure you want to log out of your Wildvora account?
            </Text>
            <TouchableOpacity style={s.logoutConfirmBtn} onPress={() => { setLogoutModal(false); logout(); }}>
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

  heroCard:      { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '50', padding: 24, alignItems: 'center', marginTop: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  avatarWrap:    { position: 'relative', marginBottom: 12 },
  avatar:        { width: 100, height: 100, borderRadius: 50, backgroundColor: C.primaryContainer, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.primaryContainer + '60' },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: C.onPrimaryContainer },
  proBadge:      { position: 'absolute', bottom: -2, right: -4, backgroundColor: C.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  proBadgeText:  { fontSize: 10, fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  heroName:      { fontSize: 24, fontWeight: '700', color: C.onSurface, marginBottom: 6, letterSpacing: -0.3, textAlign: 'center' },
  heroBio:       { fontSize: 14, color: C.onSurfaceVariant, marginBottom: 10, textAlign: 'center', lineHeight: 20 },
  heroMeta:      { flexDirection: 'row', gap: 14, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  heroMetaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText:  { fontSize: 12, color: C.outline },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 50, paddingHorizontal: 20, paddingVertical: 9 },
  editBtnText:   { fontSize: 13, fontWeight: '600', color: C.onSurface },

  statsRow:  { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:  { flex: 1, borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  statNum:   { fontSize: 30, fontWeight: '700', lineHeight: 34 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase', textAlign: 'center' },

  infoCard:      { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', padding: 18, marginBottom: 20 },
  infoCardTitle: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  infoIcon:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary + '12', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoLabel:     { fontSize: 11, color: C.outline, marginBottom: 2, fontWeight: '500' },
  infoValue:     { fontSize: 14, color: C.onSurface, fontWeight: '600' },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 12, letterSpacing: -0.2 },

  menuCard:           { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', overflow: 'hidden', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  menuRow:            { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: C.outlineVariant + '30' },
  menuRowSpecial:     { backgroundColor: C.tertiary + '08' },
  menuIconBox:        { width: 40, height: 40, borderRadius: 10, backgroundColor: C.surfaceContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuIconBoxSpecial: { backgroundColor: C.tertiary },
  menuLabelWrap:      { flex: 1 },
  menuLabel:          { fontSize: 15, color: C.onSurface, fontWeight: '500' },
  menuSubLabel:       { fontSize: 12, color: C.tertiary, marginTop: 1, fontWeight: '600' },

  logoutRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 4, marginBottom: 20, marginTop: 8 },
  logoutText: { fontSize: 18, fontWeight: '700', color: C.error },

  reviewsCard:      { backgroundColor: C.surfaceContainerLow, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.outlineVariant + '30', marginBottom: 8 },
  reviewsHdr:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  reviewsTitle:     { fontSize: 18, fontWeight: '700', color: C.onSurface },
  reviewsViewAll:   { fontSize: 13, fontWeight: '700', color: C.primary },
  reviewsEmpty:     { alignItems: 'center', paddingVertical: 20, gap: 6 },
  reviewsEmptyText: { fontSize: 14, color: C.outline },
  reviewItem:       { backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  reviewItemTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  reviewExpIcon:    { width: 44, height: 44, borderRadius: 10, backgroundColor: C.primary + '12', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  reviewItemInfo:   { flex: 1, gap: 4 },
  reviewItemTitle:  { fontSize: 13, fontWeight: '700', color: C.onSurface },
  reviewItemText:   { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19 },

  // Modal
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.outlineVariant + '50' },
  modalTitle:   { fontSize: 16, fontWeight: '700', color: C.onSurface },
  modalCancel:  { fontSize: 15, color: C.onSurfaceVariant },
  modalSave:    { fontSize: 15, fontWeight: '700', color: C.primary },

  sectionDivider:    { fontSize: 11, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.8, marginTop: 24, marginBottom: 4 },
  sectionDividerSub: { fontSize: 12, color: C.outline, marginBottom: 12, lineHeight: 17 },

  fieldWrap:   { marginBottom: 14 },
  inputLabel:  { fontSize: 11, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 0.8, marginBottom: 6 },
  input:       { borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.onSurface, backgroundColor: C.surfaceContainerLow },

  pickerBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.surfaceContainerLow },
  pickerBtnText:     { fontSize: 14, color: C.onSurface },
  pickerOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerBox:         { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  pickerTitle:       { fontSize: 15, fontWeight: '700', color: C.onSurface, marginBottom: 16 },
  pickerOption:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderColor: C.outlineVariant + '30' },
  pickerOptionActive:{ backgroundColor: C.primary + '08', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  pickerOptionText:  { fontSize: 15, color: C.onSurface },
  pickerOptionTextActive: { color: C.primary, fontWeight: '600' },

  logoutOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoutBox:         { backgroundColor: C.white, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  logoutTitle:       { fontSize: 22, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  logoutSubText:     { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  logoutConfirmBtn:  { backgroundColor: C.error, borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  logoutConfirmText: { color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  logoutCancelBtn:   { borderWidth: 1.5, borderColor: C.outlineVariant, borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center' },
  logoutCancelText:  { color: C.onSurface, fontWeight: '700', fontSize: 14 },
});
