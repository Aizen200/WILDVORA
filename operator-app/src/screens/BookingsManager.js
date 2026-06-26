import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI, messageAPI } from '../services/api';

const STATUS_MAP = {
  pending:   { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  confirmed: { bg: '#D1FAE5', text: '#065F46', label: 'Confirmed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Completed' },
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
  const [updating, setUpdating]         = useState(null);
  const [modalMessages, setModalMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMsg, setSendingMsg]           = useState(false);

  const openMessageModal = async (booking) => {
    setMessageModal(booking);
    setMsgText('');
    setModalMessages([]);
    setMessagesLoading(true);
    try {
      const res = await messageAPI.getByBooking(booking._id);
      if (res.data.success) setModalMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error fetching modal messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!messageModal) return;
    const interval = setInterval(async () => {
      try {
        const res = await messageAPI.getByBooking(messageModal._id);
        if (res.data.success) setModalMessages(res.data.messages || []);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [messageModal]);

  const handleSendMessage = async () => {
    if (!msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    const textToSend = msgText.trim();
    setMsgText('');
    try {
      const res = await messageAPI.sendMessage({ bookingId: messageModal._id, text: textToSend });
      if (res.data.success) setModalMessages(prev => [...prev, res.data.message]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send message.');
      setMsgText(textToSend);
    } finally {
      setSendingMsg(false);
    }
  };

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

  const totalCount     = bookings.length;
  const pendingCount   = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Bookings</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
      </View>

      {/* Summary numbers */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{totalCount}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#D97706' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: theme.primary }]}>{confirmedCount}</Text>
          <Text style={styles.summaryLabel}>Confirmed</Text>
        </View>
        <View style={styles.summarySep} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#6B7280' }]}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Done</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={15} color={theme.outlineVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer or experience..."
          placeholderTextColor={theme.outlineVariant}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color={theme.outlineVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
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
          <Feather name="inbox" size={36} color={theme.outlineVariant} />
          <Text style={styles.emptyTitle}>No bookings found</Text>
          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? 'No results match your search.'
              : `No ${filter !== 'All' ? filter.toLowerCase() : ''} bookings yet.`}
          </Text>
        </View>
      ) : (
        filtered.map(b => {
          const isBusy   = updating === b._id;
          const initial  = b.user?.name?.charAt(0)?.toUpperCase() || '?';
          const dateStr  = b.startDate
            ? new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Date TBD';

          return (
            <View key={b._id} style={styles.bookingCard}>
              {/* Customer row */}
              <View style={styles.cardTopRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.customerBlock}>
                  <Text style={styles.customerName}>{b.user?.name || 'Customer'}</Text>
                  <Text style={styles.bookingRef}>
                    #{b._id.slice(-6).toUpperCase()} · {b.groupSize || 1} guest{(b.groupSize || 1) > 1 ? 's' : ''}
                  </Text>
                </View>
                <StatusPill status={b.status} />
              </View>

              {/* Experience */}
              <Text style={styles.expTitle} numberOfLines={2}>{b.experience?.title || 'Unknown Experience'}</Text>

              {/* Meta row */}
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color={theme.textLight} />
                <Text style={styles.metaText}>{dateStr}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="cash-outline" size={13} color={theme.textLight} />
                <Text style={styles.metaText}>₹{b.totalPrice?.toFixed(0) || '0'}</Text>
              </View>

              {/* Actions */}
              {isBusy ? (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
              ) : b.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(b._id)} activeOpacity={0.85}>
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(b._id)} activeOpacity={0.85}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : b.status === 'confirmed' ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.messageBtn} onPress={() => openMessageModal(b)} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="message-outline" size={15} color={theme.primary} />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleComplete(b._id)} activeOpacity={0.85}>
                    <Text style={styles.completeBtnText}>Mark done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {/* Message modal */}
      <Modal visible={!!messageModal} transparent animationType="slide" onRequestClose={() => setMessageModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message {messageModal?.user?.name}</Text>
              <TouchableOpacity onPress={() => setMessageModal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            {messagesLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.modalLoadingText}>Loading messages...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.chatScroll}
                contentContainerStyle={{ gap: 8, padding: 12 }}
                ref={ref => { if (ref) ref.scrollToEnd({ animated: false }); }}
              >
                {modalMessages.length === 0 ? (
                  <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
                ) : (
                  modalMessages.map(m => {
                    const isOperator = m.sender?.role === 'operator';
                    return (
                      <View
                        key={m._id}
                        style={[styles.bubble, isOperator ? styles.bubbleOut : styles.bubbleIn]}
                      >
                        <Text style={[styles.bubbleText, isOperator && { color: '#fff' }]}>{m.text}</Text>
                        <Text style={[styles.bubbleTime, isOperator && { color: 'rgba(255,255,255,0.6)' }]}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            <TextInput
              style={styles.msgInput}
              placeholder="Type your message..."
              placeholderTextColor={theme.outlineVariant}
              value={msgText}
              onChangeText={setMsgText}
              multiline
              editable={!sendingMsg}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!msgText.trim() || sendingMsg) && styles.sendBtnOff]}
              onPress={handleSendMessage}
              disabled={!msgText.trim() || sendingMsg}
              activeOpacity={0.85}
            >
              {sendingMsg ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },

  // Header
  pageHeader: { marginBottom: 14, marginTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400E' },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },
  summaryLabel: { fontSize: 11, color: theme.textLight, marginTop: 2, fontWeight: '500' },
  summarySep: { width: 1, height: 32, backgroundColor: theme.cardBorder },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  searchInput: { flex: 1, color: theme.text, fontSize: 14 },

  // Filter tabs
  filterScroll: { marginBottom: 16 },
  filterContent: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterTab: {
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: theme.surfaceContainer,
  },
  filterTabActive: { backgroundColor: theme.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  filterTabTextActive: { color: '#fff' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },

  // Loading / empty
  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: theme.textLight, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 52, gap: 8 },
  emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
  emptySubtitle: { color: theme.outlineVariant, fontSize: 14, textAlign: 'center' },

  // Booking cards
  bookingCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    gap: 10,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primaryFixed + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: theme.primary },
  customerBlock: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: '700', color: theme.text },
  bookingRef: { fontSize: 12, color: theme.textMuted, marginTop: 1 },

  statusPill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  expTitle: { fontSize: 15, fontWeight: '600', color: theme.primary, lineHeight: 21 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: theme.textMuted },
  metaDot: { fontSize: 13, color: theme.outlineVariant, marginHorizontal: 2 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  confirmBtn: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  declineBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.outlineVariant,
  },
  declineBtnText: { color: theme.textMuted, fontWeight: '700', fontSize: 14 },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.primaryFixed + '33',
    borderRadius: 10,
    paddingVertical: 11,
  },
  messageBtnText: { color: theme.primary, fontWeight: '700', fontSize: 14 },
  completeBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Message modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
  modalLoadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  modalLoadingText: { color: theme.textLight, fontSize: 13 },
  chatScroll: {
    flex: 1,
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 12,
    marginBottom: 12,
  },
  emptyChatText: {
    textAlign: 'center',
    color: theme.textLight,
    marginTop: 40,
    fontSize: 13,
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '82%',
  },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: theme.primary },
  bubbleIn:  { alignSelf: 'flex-start', backgroundColor: '#E2E8F0' },
  bubbleText: { color: '#1E293B', fontSize: 13 },
  bubbleTime: { color: '#64748B', fontSize: 9, alignSelf: 'flex-end', marginTop: 3 },
  msgInput: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    color: theme.text,
    fontSize: 14,
    height: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  sendBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnOff: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
