import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';

// ── Star row ─────────────────────────────────────────────
const Stars = ({ rating, size = 16 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Ionicons
        key={i}
        name={i <= rating ? 'star' : 'star-outline'}
        size={size}
        color={i <= rating ? '#F59E0B' : theme.outlineVariant}
      />
    ))}
  </View>
);

// ── Rating bar ───────────────────────────────────────────
const RatingBar = ({ star, pct, color }) => (
  <View style={styles.ratingBarRow}>
    <Text style={styles.ratingBarStar}>{star}</Text>
    <View style={styles.ratingBarTrack}>
      <View style={[styles.ratingBarFill, { width: `${pct}%`, backgroundColor: color || theme.primary }]} />
    </View>
    <Text style={styles.ratingBarPct}>{pct}%</Text>
  </View>
);

const MOCK_REVIEWS = [
  {
    id: 'R001', customerName: 'Alex Thompson', date: 'September 12, 2023',
    rating: 5, trip: 'Alpine Trek',
    comment: 'The multi-day hiking trip was absolutely spectacular. The guides were incredibly knowledgeable about the local flora and fauna. Everything from the logistics to the campsite food exceeded my expectations. Will definitely book again!',
    replied: false, reply: '',
  },
  {
    id: 'R002', customerName: 'Sarah Jenkins', date: 'September 10, 2023',
    rating: 4, trip: 'Kayak Expedition',
    comment: 'Great experience overall. The equipment provided was top-notch. Only reason for 4 stars is the slight delay at the meeting point, but the guide more than made up for it with their enthusiasm.',
    replied: true,
    reply: 'Hi Sarah, glad you enjoyed the equipment! We\'re addressing the timing issue with our transport team. Hope to see you again soon!',
  },
  {
    id: 'R003', customerName: 'Michael R.', date: 'September 8, 2023',
    rating: 5, trip: 'Mountain Biking',
    comment: 'Wildvora never disappoints. This is my third time booking an outing through them. The attention to detail in the route planning is unmatched.',
    replied: false, reply: '',
  },
];

export default function ReviewsRatings() {
  const [reviews, setReviews]     = useState(MOCK_REVIEWS);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText,  setReplyText] = useState('');
  const [editMode,   setEditMode]  = useState(false);

  const handlePostReply = () => {
    if (!replyText.trim()) return;
    setReviews(prev => prev.map(r =>
      r.id === replyModal.id ? { ...r, replied: true, reply: replyText } : r
    ));
    setReplyModal(null);
    setReplyText('');
  };

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Average Rating Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>AVERAGE RATING</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={styles.avgNumber}>4.8</Text>
          <Text style={styles.avgDenom}>/ 5</Text>
        </View>
        <Stars rating={5} size={20} />
        <Text style={styles.reviewCount}>Based on 1,248 verified reviews</Text>
      </View>

      {/* Rating Distribution */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>RATING DISTRIBUTION</Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          <RatingBar star={5} pct={85} color={theme.primary} />
          <RatingBar star={4} pct={10} color={theme.primary} />
          <RatingBar star={3} pct={3}  color={theme.primaryFixedDim} />
          <RatingBar star={2} pct={1}  color={theme.tertiary} />
          <RatingBar star={1} pct={1}  color={theme.danger} />
        </View>
      </View>

      {/* Performance Spike Banner */}
      <View style={styles.performanceCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.performanceTitle}>Performance Spike</Text>
          <Text style={styles.performanceText}>
            Reviews increased by 15% this week. Keep up the responsiveness to maintain your Top Host badge.
          </Text>
        </View>
        <Feather name="trending-up" size={36} color="rgba(255,255,255,0.3)" />
      </View>

      {/* Recent Reviews header */}
      <View style={[styles.rowBetween, { marginBottom: 12, marginTop: 4 }]}>
        <Text style={styles.recentTitle}>Recent Reviews</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>Filter: All</Text>
          <Ionicons name="filter" size={13} color={theme.text} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Review cards */}
      {reviews.map(r => (
        <View key={r.id} style={styles.reviewCard}>
          {/* Top: avatar + name + stars */}
          <View style={styles.reviewTop}>
            <View style={styles.reviewAvatarCol}>
              <View style={styles.reviewAvatar}>
                <Ionicons name="person" size={22} color={theme.textLight} />
              </View>
              <View>
                <Text style={styles.reviewerName}>{r.customerName}</Text>
                <Text style={styles.reviewDate}>{r.date}</Text>
              </View>
            </View>
            <Stars rating={r.rating} size={16} />
          </View>

          {/* Comment */}
          <Text style={styles.reviewComment}>{r.comment}</Text>

          {/* Existing reply */}
          {r.replied && (
            <View style={styles.replyBox}>
              <Text style={styles.replyBoxLabel}>Your Reply</Text>
              <Text style={styles.replyBoxText}>"{r.reply}"</Text>
            </View>
          )}

          {/* Footer: trip tag + action */}
          <View style={styles.reviewFooter}>
            <View style={styles.tripTag}>
              <Text style={styles.tripTagText}>Trip: {r.trip}</Text>
            </View>
            {r.replied ? (
              <TouchableOpacity onPress={() => { setReplyModal(r); setReplyText(r.reply); setEditMode(true); }}>
                <Text style={styles.editReplyText}>Edit Reply</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.replyBtn}
                onPress={() => { setReplyModal(r); setReplyText(''); setEditMode(false); }}
              >
                <Ionicons name="return-up-back-outline" size={14} color="#FFFFFF" />
                <Text style={styles.replyBtnText}> Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Load more */}
      <TouchableOpacity style={styles.loadMoreBtn}>
        <Text style={styles.loadMoreText}>Load More Reviews</Text>
      </TouchableOpacity>

      {/* Reply modal */}
      <Modal visible={!!replyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Reply' : `Reply to ${replyModal?.customerName}`}
            </Text>
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: 'top', marginBottom: 12 }]}
              placeholder="Type your reply..."
              placeholderTextColor={theme.outlineVariant}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handlePostReply}>
              <Text style={styles.sendBtnText}>{editMode ? 'Update Reply' : 'Post Reply'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => setReplyModal(null)}>
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  card: {
    backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  sectionLabel: { color: theme.textLight, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  avgNumber: { color: theme.primary, fontSize: 52, fontWeight: '800', lineHeight: 56 },
  avgDenom: { color: theme.textMuted, fontSize: 20, fontWeight: '600' },
  reviewCount: { color: theme.textLight, fontSize: 13, marginTop: 6 },

  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingBarStar: { color: theme.textMuted, fontSize: 13, width: 12, textAlign: 'center' },
  ratingBarTrack: { flex: 1, height: 8, backgroundColor: theme.surfaceContainer, borderRadius: 99, overflow: 'hidden' },
  ratingBarFill: { height: '100%', borderRadius: 99 },
  ratingBarPct: { color: theme.textLight, fontSize: 12, width: 32, textAlign: 'right' },

  performanceCard: {
    backgroundColor: theme.primaryContainer, borderRadius: 24, padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  performanceTitle: { color: theme.onPrimaryContainer, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  performanceText: { color: theme.onPrimaryContainer, fontSize: 13, lineHeight: 18, opacity: 0.9 },

  recentTitle: { color: theme.text, fontSize: 20, fontWeight: '700' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surfaceContainerHigh, borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filterBtnText: { color: theme.text, fontSize: 13, fontWeight: '600' },

  reviewCard: {
    backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    gap: 12,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewAvatarCol: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewerName: { color: theme.text, fontSize: 15, fontWeight: '700' },
  reviewDate: { color: theme.textLight, fontSize: 12, marginTop: 1 },
  reviewComment: { color: theme.textMuted, fontSize: 14, lineHeight: 22 },

  replyBox: {
    backgroundColor: theme.surfaceContainerLow, borderRadius: 14, padding: 14,
    borderLeftWidth: 3, borderLeftColor: theme.primary,
  },
  replyBoxLabel: { color: theme.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  replyBoxText: { color: theme.textMuted, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },

  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  tripTag: { backgroundColor: theme.surfaceContainer, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  tripTagText: { color: theme.secondary, fontSize: 12, fontWeight: '600' },
  replyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.primary, borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  replyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  editReplyText: { color: theme.primary, fontSize: 13, fontWeight: '600' },

  loadMoreBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: theme.outlineVariant,
    borderRadius: 24, paddingVertical: 18, alignItems: 'center', marginBottom: 8,
  },
  loadMoreText: { color: theme.textLight, fontSize: 14, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.card, borderRadius: 24, padding: 24, margin: 16 },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { backgroundColor: theme.surfaceContainerLow, borderRadius: 14, padding: 14, color: theme.text, fontSize: 14 },
  sendBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: 12, alignItems: 'center' },
  cancelLinkText: { color: theme.textLight, fontWeight: '600', fontSize: 14 },
});