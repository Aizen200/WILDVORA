import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI } from '../services/api';

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

export default function ReviewsRatings() {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [filterRating, setFilterRating] = useState('All'); // 'All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [replyModal, setReplyModal] = useState(null);
  const [replyText,  setReplyText]  = useState('');
  const [editMode,   setEditMode]   = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await operatorAPI.getReviews();
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      } else {
        setError('Failed to fetch reviews');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews(true);
  };

  const handlePostReply = async () => {
    if (!replyText.trim() || !replyModal) return;
    setSubmittingReply(true);
    try {
      const reviewId = replyModal._id;
      const res = await operatorAPI.respondToReview(reviewId, { hostReply: replyText });
      if (res.data.success) {
        setReviews(prev => prev.map(r =>
          r._id === reviewId ? { ...r, hostReply: replyText } : r
        ));
        setReplyModal(null);
        setReplyText('');
        Alert.alert('Success', 'Response posted successfully!');
      } else {
        Alert.alert('Error', 'Failed to submit response.');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Compute stats
  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '0.0';

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const rounded = Math.round(r.rating);
    if (counts[rounded] !== undefined) counts[rounded]++;
  });

  const getPct = (star) => {
    if (totalReviewsCount === 0) return 0;
    return Math.round((counts[star] / totalReviewsCount) * 100);
  };

  // Filter logic
  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'All') return true;
    const starMap = {
      '5 Stars': 5,
      '4 Stars': 4,
      '3 Stars': 3,
      '2 Stars': 2,
      '1 Star': 1
    };
    return r.rating === starMap[filterRating];
  });

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    >
      {/* Average Rating Card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>AVERAGE RATING</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={styles.avgNumber}>{avgRating}</Text>
          <Text style={styles.avgDenom}>/ 5</Text>
        </View>
        <Stars rating={Math.round(parseFloat(avgRating))} size={20} />
        <Text style={styles.reviewCount}>Based on {totalReviewsCount} verified reviews</Text>
      </View>

      {/* Rating Distribution */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>RATING DISTRIBUTION</Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          <RatingBar star={5} pct={getPct(5)} color={theme.primary} />
          <RatingBar star={4} pct={getPct(4)} color={theme.primary} />
          <RatingBar star={3} pct={getPct(3)} color={theme.primaryFixedDim} />
          <RatingBar star={2} pct={getPct(2)} color={theme.tertiary} />
          <RatingBar star={1} pct={getPct(1)} color={theme.danger} />
        </View>
      </View>

      {/* Performance Banner */}
      {totalReviewsCount > 0 && parseFloat(avgRating) >= 4.5 && (
        <View style={styles.performanceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.performanceTitle}>Top Host Status</Text>
            <Text style={styles.performanceText}>
              Your average rating is exceptional. Keep providing amazing experiences to your guests!
            </Text>
          </View>
          <Feather name="trending-up" size={36} color="rgba(255,255,255,0.3)" />
        </View>
      )}

      {/* Recent Reviews header */}
      <View style={[styles.rowBetween, { marginBottom: 12, marginTop: 4 }]}>
        <Text style={styles.recentTitle}>Recent Reviews</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterBtnText}>Filter: {filterRating}</Text>
          <Ionicons name="filter" size={13} color={theme.text} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Error state */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Loading state */}
      {loading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Fetching reviews...</Text>
        </View>
      ) : (
        <>
          {/* Review cards */}
          {filteredReviews.map(r => {
            const hasReply = !!r.hostReply;
            const reviewerName = r.user?.name || 'Anonymous Guest';
            const reviewDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, {
              year: 'numeric', month: 'long', day: 'numeric'
            }) : 'Recent';

            return (
              <View key={r._id} style={styles.reviewCard}>
                {/* Top: avatar + name + stars */}
                <View style={styles.reviewTop}>
                  <View style={styles.reviewAvatarCol}>
                    <View style={styles.reviewAvatar}>
                      <Ionicons name="person" size={22} color={theme.textLight} />
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>{reviewerName}</Text>
                      <Text style={styles.reviewDate}>{reviewDate}</Text>
                    </View>
                  </View>
                  <Stars rating={r.rating} size={16} />
                </View>

                {/* Comment */}
                <Text style={styles.reviewComment}>{r.comment}</Text>

                {/* Existing reply */}
                {hasReply && (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyBoxLabel}>Your Reply</Text>
                    <Text style={styles.replyBoxText}>"{r.hostReply}"</Text>
                  </View>
                )}

                {/* Footer: trip tag + action */}
                <View style={styles.reviewFooter}>
                  <View style={styles.tripTag}>
                    <Text style={styles.tripTagText} numberOfLines={1}>
                      Trip: {r.experience?.title || 'Unknown Experience'}
                    </Text>
                  </View>
                  {hasReply ? (
                    <TouchableOpacity onPress={() => { setReplyModal(r); setReplyText(r.hostReply); setEditMode(true); }}>
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
            );
          })}

          {filteredReviews.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={36} color={theme.outlineVariant} />
              <Text style={styles.emptyTitle}>No Reviews Found</Text>
              <Text style={styles.emptySubtitle}>There are no reviews matching the selected filter.</Text>
            </View>
          )}
        </>
      )}

      {/* Filter Selection Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter by Rating</Text>
            {['All', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'].map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.filterOption,
                  filterRating === opt && { backgroundColor: theme.primaryContainer + '28' }
                ]}
                onPress={() => {
                  setFilterRating(opt);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterRating === opt && { color: theme.primary, fontWeight: '700' }
                ]}>
                  {opt}
                </Text>
                {filterRating === opt && <Ionicons name="checkmark" size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reply modal */}
      <Modal visible={!!replyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Reply' : `Reply to ${replyModal?.user?.name || 'Guest'}`}
            </Text>
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: 'top', marginBottom: 12 }]}
              placeholder="Type your reply..."
              placeholderTextColor={theme.outlineVariant}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, submittingReply && { opacity: 0.7 }]}
              onPress={handlePostReply}
              disabled={submittingReply}
            >
              {submittingReply ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendBtnText}>{editMode ? 'Update Reply' : 'Post Reply'}</Text>
              )}
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
  tripTag: { backgroundColor: theme.surfaceContainer, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, flexShrink: 1, marginRight: 8 },
  tripTagText: { color: theme.secondary, fontSize: 12, fontWeight: '600' },
  replyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.primary, borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  replyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  editReplyText: { color: theme.primary, fontSize: 13, fontWeight: '600' },

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

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: theme.card, borderRadius: 24, padding: 24, margin: 16 },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { backgroundColor: theme.surfaceContainerLow, borderRadius: 14, padding: 14, color: theme.text, fontSize: 14 },
  sendBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  cancelLink: { marginTop: 12, alignItems: 'center' },
  cancelLinkText: { color: theme.textLight, fontWeight: '600', fontSize: 14 },

  filterOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4,
  },
  filterOptionText: { color: theme.text, fontSize: 15, fontWeight: '500' },
});