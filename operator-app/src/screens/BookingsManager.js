import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

// ── Status pill ──────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = {
    pending:   { bg: '#FDDDBD', text: '#5C3D11',  label: 'Pending' },
    confirmed: { bg: '#A3F3CD', text: '#002115',  label: 'Confirmed' },
    declined:  { bg: '#FFDAD6', text: '#93000A',  label: 'Declined' },
    completed: { bg: '#C2E8FF', text: '#001E2C',  label: 'Completed' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

// ── Avatar circle (initials fallback) ───────────────────
const Avatar = ({ name, color }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: color || theme.surfaceContainerHigh }]}>
      <Ionicons name="person-outline" size={20} color={theme.textLight} />
    </View>
  );
};

const FILTER_TABS = ['All', 'Pending', 'Confirmed', 'Completed'];

// ── Mock bookings matching the design ───────────────────
const MOCK_BOOKINGS = [
  {
    id: 'B001', customerName: 'Sarah Jenkins', groupSize: 4,
    listingTitle: 'Summit Ridge Sunrise Hike', date: 'Oct 24, 2023', time: '05:30 AM',
    status: 'pending', avatarColor: '#FDDDBD',
  },
  {
    id: 'B002', customerName: 'Marcus Thorne', groupSize: 2,
    listingTitle: 'Hidden Falls Kayaking', date: 'Oct 26, 2023', time: '10:00 AM',
    status: 'confirmed', avatarColor: '#A3F3CD',
  },
  {
    id: 'B003', customerName: 'Elena Rodriguez', groupSize: 1,
    listingTitle: 'Solo Forest Bathing Session', date: 'Oct 20, 2023', time: '02:00 PM',
    status: 'completed', avatarColor: '#C2E8FF',
    review: 'Great experience, Sarah was an amazing guide!',
  },
  {
    id: 'B004', customerName: 'David Brooks', groupSize: 6,
    listingTitle: 'Advanced Rock Climbing Wall', date: 'Oct 29, 2023', time: '08:00 AM',
    status: 'pending', avatarColor: '#897056',
    initials: 'DB',
  },
];

export default function BookingsManager({ bookings: propBookings, setBookings: setPropBookings }) {
  const [filter, setFilter]           = useState('All');
  const [bookings, setBookings]       = useState(MOCK_BOOKINGS);
  const [messageModal, setMessageModal] = useState(null);
  const [msgText, setMsgText]         = useState('');

  const filtered = bookings.filter(b =>
    filter === 'All' || b.status === filter.toLowerCase()
  );

  const handleConfirm = id =>
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));

  const handleDecline = id => {
    Alert.alert('Decline Booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive',
        onPress: () => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'declined' } : b)) },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Bookings Manager</Text>
        <Text style={styles.pageSubtitle}>Review and manage your upcoming adventure sessions.</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, filter === tab && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Booking cards */}
      {filtered.map(b => (
        <View key={b.id} style={styles.bookingCard}>
          {/* Top row: avatar + name + status */}
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {b.initials ? (
                <View style={[styles.avatar, { backgroundColor: b.avatarColor }]}>
                  <Text style={styles.avatarInitials}>{b.initials}</Text>
                </View>
              ) : (
                <View style={[styles.avatarImg, { backgroundColor: b.avatarColor + '44' }]}>
                  <Ionicons name="person" size={22} color={b.avatarColor || theme.primary} />
                </View>
              )}
              <View>
                <Text style={styles.customerName}>{b.customerName}</Text>
                <Text style={styles.guestsText}>{b.groupSize} Guests</Text>
              </View>
            </View>
            <StatusPill status={b.status} />
          </View>

          {/* Listing title */}
          <Text style={styles.listingTitle}>{b.listingTitle}</Text>

          {/* Date/time */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color={theme.textLight} />
            <Text style={styles.dateText}>{b.date} • {b.time}</Text>
          </View>

          {/* Completed review */}
          {b.status === 'completed' && b.review && (
            <View style={styles.reviewRow}>
              <Ionicons name="star-outline" size={15} color={theme.textLight} />
              <Text style={styles.reviewText}>{b.review}</Text>
            </View>
          )}

          {/* Actions */}
          {b.status === 'pending' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(b.id)}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(b.id)}>
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
          {b.status === 'confirmed' && (
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => { setMessageModal(b); setMsgText(''); }}
            >
              <MaterialCommunityIcons name="message-outline" size={18} color={theme.secondary} />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={36} color={theme.outlineVariant} />
          <Text style={styles.emptyText}>No bookings found</Text>
        </View>
      )}

      {/* Message modal */}
      <Modal visible={!!messageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Message {messageModal?.customerName}</Text>
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
              onPress={() => { Alert.alert('Sent!', 'Message sent to ' + messageModal?.customerName); setMessageModal(null); }}
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
  pageHeader: { marginBottom: 12, marginTop: 4 },
  pageTitle: { color: theme.text, fontSize: 24, fontWeight: '700' },
  pageSubtitle: { color: theme.textMuted, fontSize: 14, marginTop: 4, lineHeight: 20 },

  filterScroll: { marginBottom: 16 },
  filterTab: {
    borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: theme.surfaceContainer,
  },
  filterTabActive: { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  filterTabText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  filterTabTextActive: { color: '#FFFFFF' },

  bookingCard: {
    backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    gap: 12,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  customerName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  guestsText: { color: theme.textMuted, fontSize: 13, marginTop: 1 },

  statusPill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  listingTitle: { color: theme.primary, fontSize: 18, fontWeight: '700', lineHeight: 24 },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: theme.textMuted, fontSize: 13 },

  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reviewText: { color: theme.textMuted, fontSize: 13, fontStyle: 'italic', flex: 1 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  confirmBtn: {
    flex: 1, backgroundColor: theme.primary, borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  declineBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.outlineVariant,
  },
  declineBtnText: { color: theme.textMuted, fontWeight: '700', fontSize: 14 },

  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.surfaceContainerHigh, borderRadius: 14, paddingVertical: 13,
    marginTop: 4,
  },
  messageBtnText: { color: theme.secondary, fontWeight: '700', fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyText: { color: theme.outlineVariant, fontSize: 15 },

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