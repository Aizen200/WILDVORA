import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Modal,
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { userAPI, reviewAPI } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

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
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogoutModal(false);
    await logout();
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>;

  const displayUser = profile || user;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayUser?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.name}>{displayUser?.name}</Text>
          <Text style={styles.email}>{displayUser?.email}</Text>
          {displayUser?.bio ? <Text style={styles.bio}>{displayUser.bio}</Text> : null}
          {displayUser?.isPro && (
            <View style={styles.proBadge}><Text style={styles.proBadgeText}>⭐ Wildvora Pro</Text></View>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditModal(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile?.wishlist?.length || 0}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{displayUser?.referralCode || '—'}</Text>
            <Text style={styles.statLabel}>Referral</Text>
          </View>
        </View>

        {/* Pro banner */}
        {!displayUser?.isPro && (
          <View style={styles.proBanner}>
            <View>
              <Text style={styles.proBannerTitle}>Wildvora Pro</Text>
              <Text style={styles.proBannerSub}>Unlock exclusive trails & local guides</Text>
            </View>
            <TouchableOpacity style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* My reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Reviews</Text>
            {reviews.slice(0, 2).map((r) => (
              <View key={r._id} style={styles.reviewCard}>
                <Text style={styles.reviewExp} numberOfLines={1}>{r.experience?.title}</Text>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  <Text style={styles.reviewDate}>{r.createdAt?.split('T')[0]}</Text>
                </View>
                <Text style={styles.reviewComment} numberOfLines={2}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Wishlist link */}
        {profile?.wishlist?.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Wishlist')}>
              <Text style={styles.menuItemText}>❤️  My Wishlist ({profile.wishlist.length})</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditModal(true)}>
            <Text style={styles.menuItemText}>⚙️  Account Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>🎁  Referral Program — Earn $50</Text>
            <Text style={styles.menuArrow}>›</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>❓  Help Center</Text>
            <Text style={styles.menuArrow}>›</Text>
          </View>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setLogoutModal(true)}>
            <Text style={[styles.menuItemText, { color: '#E24B4A' }]}>🚪  Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#111" /> : <Text style={styles.modalSave}>Save</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={editBio} onChangeText={setEditBio} multiline numberOfLines={3} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutBox}>
            <Text style={styles.logoutTitle}>Log Out?</Text>
            <Text style={styles.logoutSub}>Are you sure you want to log out of your Wildvora account?</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>LOG OUT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutCancelBtn} onPress={() => setLogoutModal(false)}>
              <Text style={styles.logoutCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#EEE' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 2 },
  email: { fontSize: 14, color: '#888', marginBottom: 6 },
  bio: { fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  proBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  proBadgeText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  editBtn: { borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  editBtnText: { fontSize: 13, color: '#333', fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#EEE' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888' },
  statDivider: { width: 1, backgroundColor: '#EEE', marginVertical: 4 },
  proBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 16, padding: 14, backgroundColor: '#F8F8F8', borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  proBannerTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  proBannerSub: { fontSize: 12, color: '#888' },
  joinBtn: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  menuItemText: { fontSize: 14, color: '#333' },
  menuArrow: { fontSize: 18, color: '#CCC' },
  reviewCard: { borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 12, marginBottom: 8 },
  reviewExp: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 4 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewStars: { color: '#F0992C', fontSize: 13 },
  reviewDate: { fontSize: 11, color: '#AAA' },
  reviewComment: { fontSize: 13, color: '#555' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#EEE' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  modalCancel: { fontSize: 15, color: '#888' },
  modalSave: { fontSize: 15, color: '#111', fontWeight: '700' },
  inputLabel: { fontSize: 12, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14, backgroundColor: '#FAFAFA' },
  logoutOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoutBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  logoutTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  logoutSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  logoutBtn: { backgroundColor: '#E24B4A', borderRadius: 10, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  logoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  logoutCancelBtn: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingVertical: 14, width: '100%', alignItems: 'center' },
  logoutCancelText: { color: '#333', fontWeight: '700', fontSize: 14 },
});