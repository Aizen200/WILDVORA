import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI } from '../services/api';

// ── Status pill ──────────────────────────────────────────
const STATUS_MAP = {
  pending:   { bg: '#FDDDBD', text: '#5C3D11',  label: 'Pending' },
  confirmed: { bg: '#A3F3CD', text: '#002115',  label: 'Confirmed' },
  cancelled: { bg: '#FFDAD6', text: '#93000A',  label: 'Cancelled' },
  completed: { bg: '#C2E8FF', text: '#001E2C',  label: 'Completed' },
};

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

const FILTER_TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

export default function BookingsManager() {
  const [filter, setFilter]             = useState('All');
  const [search, setSearch]             = useState('');
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState('');
  const [messageModal, setMessageModal] = useState(null);
  const [msgText, setMsgText]           = useState('');
  const [updating, setUpdating]         = useState(null); // id of booking being updated

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter !== 'All') params.status = filter.toLowerCase();
      const res = await operatorAPI.getBookings(params);
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(true); };

  // Client-side search on top of the tab-filtered results
  const filtered = bookings.filter(b => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.user?.name?.toLowerCase().includes(q) ||
      b.experience?.title?.toLowerCase().includes(q) ||
      b._id?.toLowerCase().includes(q)
    );
  });

  const handleConfirm = async (id) => {
    setUpdating(id);
    try {
      await operatorAPI.updateBooking(id, { status: 'confirmed' });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'confirmed' } : b));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to confirm booking.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDecline = (id) => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          setUpdating(id);
          try {
            await operatorAPI.updateBooking(id, { status: 'cancelled' });
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to decline booking.');
          } finally {
            setUpdating(null);
          }
        },
      },
    ]);
  };

  const handleComplete = async (id) => {
    setUpdating(id);
    try {
      await operatorAPI.updateBooking(id, { status: 'completed' });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'completed' } : b));
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update booking.');
    } finally {
      setUpdating(null);
    }
  };

  const totalCount    = bookings.length;
  const pendingCount  = bookings.filter(b => b.status === 'pending').length;

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Bookings Manager</Text>
        <Text style={styles.pageSubtitle}>Review and manage your upcoming adventure sessions.</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: theme.primary }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {bookings.filter(b => b.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#6B7280' }]}>
          <Text style={[styles.statValue, { color: '#6B7280' }]}>
            {bookings.filter(b => b.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchCard}>
        <Feather name="search" size={16} color={theme.outlineVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, experience..."
          placeholderTextColor={theme.outlineVariant}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.outlineVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
              onPress={() => { setFilter(tab); }}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={theme.outlineVariant} />
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptySubtitle}>
            {search.trim() ? 'No results match your search.' : `No ${filter !== 'All' ? filter.toLowerCase() : ''} bookings yet.`}
          </Text>
        </View>
      ) : (
        filtered.map(b => {
          const isBusy = updating === b._id;
          const dateStr = b.startDate
            ? new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'N/A';

          return (
            <View key={b._id} style={styles.bookingCard}>
              {/* Top row */}
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.avatarImg, { backgroundColor: theme.primaryFixed + '44' }]}>
                    <Ionicons name="person" size={22} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={styles.customerName}>{b.user?.name || 'Customer'}</Text>
                    <Text style={styles.guestsText}>{b.groupSize || 1} Guests • #{b._id.slice(-4).toUpperCase()}</Text>
                  </View>
                </View>
                <StatusPill status={b.status} />
              </View>

              {/* Experience title */}
              <Text style={styles.listingTitle} numberOfLines={2}>{b.experience?.title || 'Unknown Experience'}</Text>

              {/* Date & Amount */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={theme.textLight} />
                  <Text style={styles.metaText}>{dateStr}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={14} color={theme.textLight} />
                  <Text style={styles.metaText}>₹{b.totalPrice?.toFixed(0) || '0'}</Text>
                </View>
              </View>

              {/* Actions */}
              {isBusy ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
              ) : b.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(b._id)}>
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(b._id)}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : b.status === 'confirmed' ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={() => { setMessageModal(b); setMsgText(''); }}
                  >
                    <MaterialCommunityIcons name="message-outline" size={16} color={theme.secondary} />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(b._id)}>
                    <Text style={styles.completeBtnText}>Mark Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {/* Message modal */}
      <Modal visible={!!messageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Message {messageModal?.user?.name}</Text>
            <TextInput
              style={styles.msgInput}
              placeholder="Type your message..."
              placeholderTextColor={theme.outlineVariant}
              value={msgText}
              onChangeText={setMsgText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => {
                Alert.alert('Sent!', 'Message sent to ' + messageModal?.user?.name);
                setMessageModal(null);
              }}
            >
              <Text style={styles.sendBtnText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => setMessageModal(null)}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },
  pageHeader: { marginBottom: 16, marginTop: 4 },
  pageTitle: { color: theme.text, fontSize: 24, fontWeight: '700' },
  pageSubtitle: { color: theme.textMuted, fontSize: 14, marginTop: 4, lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 12,
    borderLeftWidth: 3, borderLeftColor: theme.primary,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.text },
  statLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2, fontWeight: '600' },

  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.card, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, color: theme.text, fontSize: 14 },

  filterScroll: { marginBottom: 16 },
  filterTab: {
    borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: theme.surfaceContainer,
  },
  filterTabActive: { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  filterTabText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  filterTabTextActive: { color: '#FFFFFF' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },

  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: theme.textLight, fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
  emptySubtitle: { color: theme.outlineVariant, fontSize: 14, textAlign: 'center' },

  bookingCard: {
    backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    gap: 10,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarImg: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  customerName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  guestsText: { color: theme.textMuted, fontSize: 12, marginTop: 1 },

  statusPill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  listingTitle: { color: theme.primary, fontSize: 16, fontWeight: '700', lineHeight: 22 },

  metaRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: theme.textMuted, fontSize: 13 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  confirmBtn: {
    flex: 1, backgroundColor: theme.primary, borderRadius: 14,
    paddingVertical: 12, alignItems: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  declineBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.outlineVariant,
  },
  declineBtnText: { color: theme.textMuted, fontWeight: '700', fontSize: 14 },

  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: theme.surfaceContainerHigh, borderRadius: 14, paddingVertical: 12,
  },
  messageBtnText: { color: theme.secondary, fontWeight: '700', fontSize: 14 },

  completeBtn: {
    flex: 1, backgroundColor: '#059669', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.card, borderRadius: 24, padding: 24, margin: 16,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  msgInput: {
    backgroundColor: theme.surfaceContainerLow, borderRadius: 14,
    padding: 14, color: theme.text, fontSize: 14,
    height: 100, textAlignVertical: 'top', marginBottom: 12,
  },
  sendBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: 12, alignItems: 'center' },
  cancelLinkText: { color: theme.textLight, fontWeight: '600', fontSize: 14 },
});