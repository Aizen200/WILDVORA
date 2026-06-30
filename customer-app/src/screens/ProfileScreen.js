import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Modal, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userAPI, reviewAPI } from '../services/api';
import Alert from '../utils/alert';

const C = {
  primary:             '#1A5F45',
  primaryDark:         '#103B2A',
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
  tertiary:            '#2D7A5A',
  error:               '#1A5F45',
  danger:              '#DC2626',
  blue:                '#0a6687',
  purple:              '#6d28d9',
  amber:               '#b45309',
  rose:                '#dc2626',
  teal:                '#0f766e',
};

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const MENU_ITEMS = [
  { icon: 'map-marker-distance', label: 'Track Journey',             key: 'track_journey', screen: null,          color: C.blue   },
  { icon: 'hiking',              label: 'My Adventures',             key: 'my_adventures', screen: 'Trips',       color: C.primary },
  { icon: 'heart-outline',       label: 'Favourites',                key: 'favourites',    screen: 'Wishlist',    color: C.rose   },
  { icon: 'history',             label: 'Review History',            key: 'reviews',       screen: 'ReviewHistory', color: C.blue },
  { icon: 'ticket-percent-outline', label: 'My Coupons & Gift Cards', key: 'coupons',      screen: null,          color: C.amber  },
  { icon: 'trophy-outline',      label: 'My Rewards',                key: 'rewards',       screen: null,          color: C.purple },
  { icon: 'wallet-outline',      label: 'My Wallet',                 key: 'wallet',        screen: null,          color: C.teal   },
  { icon: 'gift-outline',        label: 'Referral Program',          key: 'referral',      screen: null, sub: 'Earn ₹4,000 per invite', color: C.amber },
  { icon: 'help-circle-outline', label: 'Help Center',               key: 'help',          screen: 'HelpCenter',  color: C.onSurfaceVariant },
];

const MENU_SECTIONS = [
  { title: 'My Activity',      keys: ['track_journey', 'my_adventures', 'favourites', 'reviews'] },
  { title: 'Wallet & Rewards', keys: ['coupons', 'rewards', 'wallet', 'referral'] },
  { title: 'Support',          keys: ['help'] },
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
        {label}{required && <Text style={{ color: C.danger }}> *</Text>}
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

function MenuRow({ item, isLast, onPress }) {
  return (
    <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={0.6}>
      <View style={[s.menuIconChip, { backgroundColor: item.color + '17' }]}>
        <MaterialCommunityIcons name={item.icon} size={19} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuLabel}>{item.label}</Text>
        {!!item.sub && <Text style={s.menuSub}>{item.sub}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#C4C9C5" />
      {!isLast && <View style={s.menuRowDivider} />}
    </TouchableOpacity>
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
  const [activeFeature, setActiveFeature] = useState(null);
  const [avatarModal, setAvatarModal]     = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

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

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  ];

  const handleSelectAvatar = async (url) => {
    setUpdatingAvatar(true);
    try {
      const currentName = profile?.name || user?.name || 'Explorer';
      const res = await userAPI.updateProfile({
        name: currentName,
        avatar: url,
      });
      const u = res.data.user;
      setProfile(u);
      updateUser(u);
      setAvatarModal(false);
      setCustomAvatarUrl('');
    } catch (err) {
      Alert.alert('Error', 'Could not update avatar picture.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      if (item.screen === 'Trips') {
        navigation.navigate('Main', { screen: 'Trips' });
      } else {
        navigation.navigate(item.screen);
      }
    } else {
      if (['track_journey', 'coupons', 'rewards', 'wallet'].includes(item.key)) {
        setActiveFeature(item.key);
      } else if (item.key === 'referral') {
        Alert.alert('Referral Program', 'Invite your friends to Wildvora! Share your referral code: ' + (user?.referralCode || 'WILDVORA_REF') + ' and earn ₹4,000 per invite.');
      }
    }
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
        <LinearGradient
          colors={[C.primaryDark, C.primary, C.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.guestHero}
        >
          <MaterialCommunityIcons name="compass-outline" size={210} color="rgba(255,255,255,0.07)" style={s.guestDecor} />
        </LinearGradient>
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
      <ScrollView showsVerticalScrollIndicator={false} bounces style={{ flex: 1 }}>

        {/* ── Hero ── */}
        <LinearGradient
          colors={[C.primaryDark, C.primary, C.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.heroBg}
        >
          <MaterialCommunityIcons name="compass-outline" size={170} color="rgba(255,255,255,0.07)" style={s.heroDecor} />
          <View style={s.heroTopRow}>
            <TouchableOpacity
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
              style={s.navBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={21} color="#fff" />
            </TouchableOpacity>
            <Text style={s.heroTopTitle}>My Profile</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={s.navBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={21} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Profile Summary ── */}
        <View style={s.profileCardWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setAvatarModal(true)}
            style={s.avatarRing}
          >
            {displayUser?.avatar ? (
              <Image source={{ uri: displayUser.avatar }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={s.avatarCameraOverlay}>
              <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={s.nameRow}>
            <Text style={s.profileName}>{displayUser?.name || 'Explorer'}</Text>
            {!!avgRating && (
              <View style={s.ratingPill}>
                <MaterialCommunityIcons name="star" size={12} color="#FFB400" />
                <Text style={s.ratingPillText}>{avgRating}</Text>
              </View>
            )}
          </View>

          <View style={s.locRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={C.onSurfaceVariant} />
            <Text style={s.profileLoc}>{displayUser?.city || 'Pune, Maharashtra'}</Text>
            {!!joinYear && (
              <>
                <View style={s.locDot} />
                <Text style={s.profileLoc}>Member since {joinYear}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={s.editPillBtn} onPress={() => setEditModal(true)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="square-edit-outline" size={15} color={C.primary} />
            <Text style={s.editPillText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={s.statsCard}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{completedTrips}</Text>
              <Text style={s.statLabel}>ADVENTURES</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>107</Text>
              <Text style={s.statLabel}>FOLLOWERS</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>288</Text>
              <Text style={s.statLabel}>FOLLOWING</Text>
            </View>
          </View>
        </View>

        {/* ── Menu Sections ── */}
        {MENU_SECTIONS.map((section) => {
          const items = MENU_ITEMS.filter(i => section.keys.includes(i.key));
          if (items.length === 0) return null;
          return (
            <View key={section.title} style={s.menuSectionBlock}>
              <Text style={s.sectionLabel}>{section.title}</Text>
              <View style={s.menuCard}>
                {items.map((item, idx) => (
                  <MenuRow
                    key={item.key}
                    item={item}
                    isLast={idx === items.length - 1}
                    onPress={() => handleMenuPress(item)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutRow} onPress={() => setLogoutModal(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={17} color={C.danger} />
          <Text style={s.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>Wildvora v1.0.0</Text>

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
              <MaterialCommunityIcons name="logout" size={26} color={C.danger} />
            </View>
            <Text style={s.dialogTitle}>Log out?</Text>
            <Text style={s.dialogBody}>
              Are you sure you want to log out of your Wildvora account?
            </Text>
            <TouchableOpacity style={s.dialogConfirm} onPress={() => { setLogoutModal(false); logout();  navigation.reset({index: 0,routes: [{ name: 'Onboarding' }],});}}>
              <Text style={s.dialogConfirmText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dialogCancel} onPress={() => setLogoutModal(false)}>
              <Text style={s.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Avatar Selector Modal ─── */}
      <Modal visible={avatarModal} transparent animationType="slide">
        <TouchableOpacity 
          style={s.sheetOverlay} 
          activeOpacity={1} 
          onPress={() => setAvatarModal(false)}
        >
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Choose Profile Picture</Text>
            
            {updatingAvatar ? (
              <View style={{ height: 260, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={{ marginTop: 12, color: C.onSurfaceVariant }}>Saving changes...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.avatarGridTitle}>ADVENTURE PRESETS</Text>
                
                <View style={s.avatarGrid}>
                  {PRESET_AVATARS.map((url, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        s.avatarGridItem,
                        displayUser?.avatar === url && s.avatarGridItemSelected
                      ]}
                      onPress={() => handleSelectAvatar(url)}
                    >
                      <Image source={{ uri: url }} style={s.avatarGridImg} />
                      {displayUser?.avatar === url && (
                        <View style={s.avatarCheckOverlay}>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.avatarGridTitle}>OR ENTER IMAGE URL</Text>
                <View style={s.customUrlInputRow}>
                  <TextInput
                    style={s.customUrlInput}
                    value={customAvatarUrl}
                    onChangeText={setCustomAvatarUrl}
                    placeholder="https://example.com/avatar.jpg"
                    placeholderTextColor={C.outline}
                  />
                  <TouchableOpacity 
                    style={s.customUrlApplyBtn}
                    onPress={() => {
                      if (!customAvatarUrl.trim()) return;
                      handleSelectAvatar(customAvatarUrl.trim());
                    }}
                  >
                    <Text style={s.customUrlApplyText}>Save</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={s.avatarRemoveBtn}
                  onPress={() => handleSelectAvatar('')}
                >
                  <Text style={s.avatarRemoveBtnText}>Remove Profile Picture</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Feature Detail Modal (Dashboards) ─── */}
      <Modal visible={activeFeature !== null} transparent animationType="slide">
        <TouchableOpacity 
          style={s.featureSheetOverlay} 
          activeOpacity={1} 
          onPress={() => setActiveFeature(null)}
        >
          <View style={s.featureSheet} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <View style={s.featureSheetHeader}>
              <Text style={s.featureSheetTitle}>
                {activeFeature === 'track_journey' && 'Track Active Journey'}
                {activeFeature === 'coupons' && 'My Coupons & Offers'}
                {activeFeature === 'rewards' && 'Explorer Rewards'}
                {activeFeature === 'wallet' && 'Wildvora Wallet'}
              </Text>
              <TouchableOpacity onPress={() => setActiveFeature(null)} style={s.featureSheetCloseBtn}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {activeFeature === 'track_journey' && (
                <View style={s.dashContent}>
                  <View style={s.activeTrekCard}>
                    <Text style={s.dashSubtitle}>ACTIVE TREK</Text>
                    <Text style={s.dashMainTitle}>Kedarkantha Peak Trek</Text>
                    <Text style={s.dashStatusText}>In Progress · Day 2 of 4</Text>
                  </View>
                  
                  <Text style={s.dashSectionTitle}>Route Progress</Text>
                  <View style={s.progressTimeline}>
                    <View style={s.timelineStep}>
                      <View style={[s.timelineDot, s.dotCompleted]} />
                      <View style={s.timelineDetails}>
                        <Text style={s.timelineLabelCompleted}>Sankri Base Camp (6,400 ft)</Text>
                        <Text style={s.timelineSubText}>Completed · Jun 28</Text>
                      </View>
                    </View>
                    <View style={[s.timelineLine, s.lineCompleted]} />
                    
                    <View style={s.timelineStep}>
                      <View style={[s.timelineDot, s.dotActive]} />
                      <View style={s.timelineDetails}>
                        <Text style={s.timelineLabelActive}>Juda Ka Talab (9,100 ft)</Text>
                        <Text style={s.timelineSubText}>Current Location · Active GPS</Text>
                      </View>
                    </View>
                    <View style={s.timelineLine} />
                    
                    <View style={s.timelineStep}>
                      <View style={s.timelineDot} />
                      <View style={s.timelineDetails}>
                        <Text style={s.timelineLabelPending}>Kedarkantha Base Camp (11,250 ft)</Text>
                        <Text style={s.timelineSubText}>Next Checkpoint · Expected Jun 30</Text>
                      </View>
                    </View>
                    <View style={s.timelineLine} />
                    
                    <View style={s.timelineStep}>
                      <View style={s.timelineDot} />
                      <View style={s.timelineDetails}>
                        <Text style={s.timelineLabelPending}>Kedarkantha Summit (12,500 ft)</Text>
                        <Text style={s.timelineSubText}>Destination Peak</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.gpsSyncBox}>
                    <MaterialCommunityIcons name="satellite-variant" size={20} color="#10B981" />
                    <Text style={s.gpsSyncText}>Satellite GPS Connected. Sharing coordinates with emergency contact.</Text>
                  </View>
                </View>
              )}

              {activeFeature === 'coupons' && (
                <View style={s.dashContent}>
                  <Text style={s.dashSubtitle}>AVAILABLE PROMOCODES</Text>
                  
                  <View style={s.couponCard}>
                    <View style={s.couponTop}>
                      <View style={s.couponLabelBadge}>
                        <Text style={s.couponLabelText}>15% OFF</Text>
                      </View>
                      <TouchableOpacity 
                        style={s.couponCopyBtn}
                        onPress={() => Alert.alert('Copied', 'Promo code WILDVORA2026 copied to clipboard!')}
                      >
                        <Text style={s.couponCopyText}>COPY</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.couponCodeText}>WILDVORA2026</Text>
                    <Text style={s.couponDescText}>Valid on all treks & camping booking above ₹3,000.</Text>
                    <Text style={s.couponExpiryText}>Expires: Dec 31, 2026</Text>
                  </View>

                  <View style={s.couponCard}>
                    <View style={s.couponTop}>
                      <View style={s.couponLabelBadge}>
                        <Text style={s.couponLabelText}>₹1,000 OFF</Text>
                      </View>
                      <TouchableOpacity 
                        style={s.couponCopyBtn}
                        onPress={() => Alert.alert('Copied', 'Promo code FIRSTTREK copied to clipboard!')}
                      >
                        <Text style={s.couponCopyText}>COPY</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.couponCodeText}>FIRSTTREK</Text>
                    <Text style={s.couponDescText}>Valid on first adventure booking above ₹5,000.</Text>
                    <Text style={s.couponExpiryText}>Expires: Dec 31, 2026</Text>
                  </View>

                  <Text style={s.dashSectionTitle}>Redeem Gift Card</Text>
                  <View style={s.redeemInputRow}>
                    <TextInput 
                      style={s.redeemInput} 
                      placeholder="Enter gift card voucher code" 
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity 
                      style={s.redeemApplyBtn}
                      onPress={() => Alert.alert('Invalid Voucher', 'The entered voucher code is invalid or expired.')}
                    >
                      <Text style={s.redeemApplyText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeFeature === 'rewards' && (
                <View style={s.dashContent}>
                  <View style={s.rewardsSummaryBox}>
                    <Text style={s.rewardsPointsVal}>2,450 XP</Text>
                    <Text style={s.rewardsLevelText}>Level 3: Trailblazer</Text>
                    
                    <View style={s.rewardsProgBarContainer}>
                      <View style={[s.rewardsProgBarFill, { width: '81%' }]} />
                    </View>
                    <Text style={s.rewardsProgText}>2,450 / 3,000 XP to next level</Text>
                  </View>

                  <Text style={s.dashSectionTitle}>Badges Unlocked</Text>
                  <View style={s.badgesGrid}>
                    <View style={s.badgeItem}>
                      <View style={s.badgeIconCircle}>
                        <Text style={{ fontSize: 24 }}>🏔️</Text>
                      </View>
                      <Text style={s.badgeTitle}>Summit Hero</Text>
                      <Text style={s.badgeDesc}>Completed first mountain trek</Text>
                    </View>

                    <View style={s.badgeItem}>
                      <View style={s.badgeIconCircle}>
                        <Text style={{ fontSize: 24 }}>🔥</Text>
                      </View>
                      <Text style={s.badgeTitle}>Camp Legend</Text>
                      <Text style={s.badgeDesc}>Booked 2+ camping excursions</Text>
                    </View>

                    <View style={s.badgeItem}>
                      <View style={s.badgeIconCircle}>
                        <Text style={{ fontSize: 24 }}>🎒</Text>
                      </View>
                      <Text style={s.badgeTitle}>Wanderer</Text>
                      <Text style={s.badgeDesc}>Account created & active</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeFeature === 'wallet' && (
                <View style={s.dashContent}>
                  <View style={s.walletBalanceBox}>
                    <Text style={s.walletBalanceLabel}>WALLET BALANCE</Text>
                    <Text style={s.walletBalanceVal}>₹3,500.00</Text>
                    <Text style={s.walletSubText}>Available for instant bookings & checkout</Text>
                  </View>

                  <View style={s.walletActionsRow}>
                    <TouchableOpacity 
                      style={s.walletActionBtnSecondary}
                      onPress={() => Alert.alert('Transfer Money', 'Transfer to original payment method initiated. Will reflect in 3-5 business days.')}
                    >
                      <Text style={s.walletActionBtnTextSecondary}>Withdraw to Bank</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={s.walletActionBtnPrimary}
                      onPress={() => Alert.alert('Add Money', 'Add money to wallet is currently disabled.')}
                    >
                      <Text style={s.walletActionBtnTextPrimary}>Add Cash</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={s.dashSectionTitle}>Recent Transactions</Text>
                  <View style={s.transactionsList}>
                    <View style={s.transactionRow}>
                      <View style={s.txIconGreen}>
                        <MaterialCommunityIcons name="arrow-bottom-left" size={16} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txTitle}>Refund: Triund Trek Cancellation</Text>
                        <Text style={s.txDate}>Jun 15, 2026 · Credited</Text>
                      </View>
                      <Text style={s.txAmtGreen}>+₹3,500.00</Text>
                    </View>

                    <View style={s.transactionRow}>
                      <View style={s.txIconRed}>
                        <MaterialCommunityIcons name="arrow-top-right" size={16} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.txTitle}>Used Promo Discount code: FIRSTTREK</Text>
                        <Text style={s.txDate}>May 10, 2026 · Applied</Text>
                      </View>
                      <Text style={s.txAmtRed}>-₹500.00</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
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

  /* Hero */
  heroBg: {
    paddingTop: 6,
    paddingBottom: 64,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecor: {
    position: 'absolute',
    top: -28,
    right: -36,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTopTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Profile Summary */
  profileCardWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -56,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFFFFF',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: C.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7E6',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92660B',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  profileLoc: {
    fontSize: 13,
    color: '#6B7280',
  },
  locDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 1,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.3,
    borderColor: C.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  editPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },

  /* Stats */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 20,
    paddingVertical: 16,
    width: '100%',
    ...SHADOW,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EEF0EE',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    marginTop: 4,
  },

  /* Menu Sections */
  menuSectionBlock: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    ...SHADOW,
    shadowOpacity: 0.04,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  menuIconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  menuLabel: {
    fontSize: 14.5,
    color: '#1F2937',
    fontWeight: '600',
  },
  menuSub: {
    fontSize: 11.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  menuRowDivider: {
    position: 'absolute',
    bottom: 0,
    left: 65,
    right: 0,
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  /* Logout */
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    marginTop: 28,
    marginHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: C.danger,
  },
  versionText: {
    fontSize: 11,
    color: '#C4C9C5',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },

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
  dialogIconWrap:   { width: 60, height: 60, borderRadius: 30, backgroundColor: C.danger + '14', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  dialogTitle:      { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  dialogBody:       { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  dialogConfirm:    { backgroundColor: C.danger, borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  dialogConfirmText:{ color: C.white, fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },
  dialogCancel:     { paddingVertical: 14, width: '100%', alignItems: 'center' },
  dialogCancelText: { color: C.onSurfaceVariant, fontWeight: '600', fontSize: 14 },

  /* Camera overlay on profile avatar */
  avatarCameraOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: C.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /* Feature Detail Sheet */
  featureSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  featureSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  featureSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16,
  },
  featureSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  featureSheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashContent: {
    paddingVertical: 4,
  },
  dashSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dashMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  dashStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  activeTrekCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  dashSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
    marginBottom: 12,
  },
  progressTimeline: {
    paddingLeft: 12,
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    marginTop: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  dotActive: {
    backgroundColor: '#1A5F45',
    borderColor: '#ECFDF5',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
  },
  timelineDetails: {
    flex: 1,
  },
  timelineLabelCompleted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    textDecorationLine: 'line-through',
  },
  timelineLabelActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  timelineLabelPending: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  timelineSubText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 6,
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: '#10B981',
  },
  gpsSyncBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
  },
  gpsSyncText: {
    flex: 1,
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },

  /* Coupons styles */
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  couponTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponLabelBadge: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A5F45',
  },
  couponCopyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  couponCopyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  couponCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  couponDescText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  couponExpiryText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  redeemInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redeemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  redeemApplyBtn: {
    backgroundColor: '#1A5F45',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  redeemApplyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Rewards styles */
  rewardsSummaryBox: {
    backgroundColor: '#1A5F45',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardsPointsVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rewardsLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8F5EE',
    marginBottom: 16,
  },
  rewardsProgBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  rewardsProgBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  rewardsProgText: {
    fontSize: 12,
    color: '#E8F5EE',
  },
  badgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  badgeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 11,
  },

  /* Wallet styles */
  walletBalanceBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  walletBalanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 6,
  },
  walletBalanceVal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  walletSubText: {
    fontSize: 12,
    color: '#6B7280',
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  walletActionBtnPrimary: {
    flex: 1,
    backgroundColor: '#1A5F45',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletActionBtnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  walletActionBtnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1A5F45',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletActionBtnTextSecondary: {
    color: '#1A5F45',
    fontWeight: '700',
    fontSize: 14,
  },
  transactionsList: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
  },
  txIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  txDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  txAmtGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  txAmtRed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* Avatar Grid */
  avatarGridTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  avatarGridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarGridItemSelected: {
    borderColor: '#1A5F45',
  },
  avatarGridImg: {
    width: '100%',
    height: '100%',
  },
  avatarCheckOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 95, 69, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customUrlInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  customUrlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  customUrlApplyBtn: {
    backgroundColor: '#1A5F45',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  customUrlApplyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  avatarRemoveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  avatarRemoveBtnText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },

  dialogCancelText: { color: C.onSurfaceVariant, fontWeight: '600', fontSize: 14 },

  guestHero:            { height: 200, overflow: 'hidden', position: 'relative' },
  guestDecor:           { position: 'absolute', top: -24, right: -34 },
  guestWrap:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: -52 },
  guestAvatarRing:      { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...SHADOW, shadowOpacity: 0.16, shadowRadius: 12, elevation: 7 },
  guestTitle:           { fontSize: 24, fontWeight: '800', color: C.onSurface, marginBottom: 10, textAlign: 'center', letterSpacing: -0.4 },
  guestSub:             { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 21, marginBottom: 36 },
  guestPrimaryBtn:      { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignSelf: 'stretch', alignItems: 'center', marginBottom: 12 },
  guestPrimaryBtnText:  { fontSize: 15, fontWeight: '800', color: C.white },
  guestSecondaryBtn:    { borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 15, alignSelf: 'stretch', alignItems: 'center' },
  guestSecondaryBtnText:{ fontSize: 15, fontWeight: '700', color: C.primary },
});
