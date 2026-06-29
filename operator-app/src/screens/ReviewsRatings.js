import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI } from '../services/api';

const Stars = ({ rating, size = 15 }) => (
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

const STAR_CHIPS = [
  { label: 'All', value: 'All' },
  { label: '5★', value: '5' },
  { label: '4★', value: '4' },
  { label: '3★', value: '3' },
  { label: '2★', value: '2' },
  { label: '1★', value: '1' },
];

export default function ReviewsRatings() {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [filterRating, setFilterRating] = useState('All');

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

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const onRefresh = () => { setRefreshing(true); fetchReviews(true); };

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

  const totalReviewsCount = reviews.length;
  const avgRating = totalReviewsCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '0.0';

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const rounded = Math.round(r.rating);
    if (counts[rounded] !== undefined) counts[rounded]++;
  });

  const getPct = (star) =>
    totalReviewsCount === 0 ? 0 : Math.round((counts[star] / totalReviewsCount) * 100);

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'All') return true;
    return r.rating === parseInt(filterRating);
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Reviews</Text>
          {totalReviewsCount > 0 && (
            <Text style={styles.pageSubtitle}>{totalReviewsCount} verified review{totalReviewsCount > 1 ? 's' : ''}</Text>
          )}
        </View>

        {/* Overview card: avg + distribution side by side */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewLeft}>
            <Text style={styles.avgNum}>{avgRating}</Text>
            <Stars rating={Math.round(parseFloat(avgRating))} size={17} />
            <Text style={styles.avgLabel}>out of 5</Text>
          </View>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewRight}>
            {[5, 4, 3, 2, 1].map(star => {
              const pct = getPct(star);
              return (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barStar}>{star}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top host banner */}
        {totalReviewsCount > 0 && parseFloat(avgRating) >= 4.5 && (
          <View style={styles.topHostBanner}>
            <Ionicons name="ribbon-outline" size={16} color={theme.primary} />
            <Text style={styles.topHostText}>
              Top rated host · Keep up the great work!
            </Text>
          </View>
        )}

        {/* Filter chips + reviews header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Reviews</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          {STAR_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.value}
              style={[styles.chip, filterRating === chip.value && styles.chipActive]}
              onPress={() => setFilterRating(chip.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filterRating === chip.value && styles.chipTextActive]}>
                {chip.label}
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

        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : (
          <>
            {filteredReviews.map(r => {
              const hasReply    = !!r.hostReply;
              const initial     = r.user?.name?.charAt(0)?.toUpperCase() || '?';
              const reviewerName = r.user?.name || 'Anonymous Guest';
              const reviewDate  = r.createdAt
                ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <View key={r._id} style={styles.reviewCard}>
                  {/* Top row */}
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewerRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                      </View>
                      <View>
                        <Text style={styles.reviewerName}>{reviewerName}</Text>
                        <Text style={styles.reviewDate}>{reviewDate}</Text>
                      </View>
                    </View>
                    <Stars rating={r.rating} size={14} />
                  </View>

                  {/* Comment */}
                  <Text style={styles.reviewComment}>{r.comment}</Text>

                  {/* Experience tag */}
                  <View style={styles.expTag}>
                    <Ionicons name="map-outline" size={11} color={theme.textLight} />
                    <Text style={styles.expTagText} numberOfLines={1}>
                      {r.experience?.title || 'Unknown Experience'}
                    </Text>
                  </View>

                  {/* Reply */}
                  {hasReply ? (
                    <View style={styles.replyBox}>
                      <View style={styles.replyBoxHeader}>
                        <Text style={styles.replyBoxLabel}>Your response</Text>
                        <TouchableOpacity
                          onPress={() => { setReplyModal(r); setReplyText(r.hostReply); setEditMode(true); }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.replyBoxText}>{r.hostReply}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => { setReplyModal(r); setReplyText(''); setEditMode(false); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="return-up-back-outline" size={14} color={theme.primary} />
                      <Text style={styles.replyBtnText}>Reply to {reviewerName.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {filteredReviews.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={36} color={theme.outlineVariant} />
                <Text style={styles.emptyTitle}>No reviews found</Text>
                <Text style={styles.emptySubtitle}>
                  {filterRating !== 'All'
                    ? `No ${filterRating}-star reviews yet.`
                    : 'Reviews from guests will appear here.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Reply modal */}
      <Modal visible={!!replyModal} transparent animationType="slide" onRequestClose={() => setReplyModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit reply' : `Reply to ${replyModal?.user?.name?.split(' ')[0] || 'guest'}`}
              </Text>
              <TouchableOpacity onPress={() => setReplyModal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a thoughtful reply..."
              placeholderTextColor={theme.outlineVariant}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.submitBtn, submittingReply && { opacity: 0.6 }]}
              onPress={handlePostReply}
              disabled={submittingReply}
              activeOpacity={0.85}
            >
              {submittingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{editMode ? 'Update reply' : 'Post reply'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },

  // Page header
  pageHeader: { marginBottom: 16, marginTop: 4 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: theme.textLight, marginTop: 2 },

  // Overview card
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
  },
  overviewLeft: { alignItems: 'center', paddingRight: 18, minWidth: 90 },
  avgNum: { fontSize: 44, fontWeight: '800', color: theme.text, letterSpacing: -1, lineHeight: 50 },
  avgLabel: { fontSize: 11, color: theme.textLight, marginTop: 4, fontWeight: '500' },
  overviewDivider: { width: 1, height: 80, backgroundColor: theme.cardBorder, marginRight: 18 },
  overviewRight: { flex: 1, gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barStar: { fontSize: 11, fontWeight: '600', color: theme.textMuted, width: 8, textAlign: 'center' },
  barTrack: {
    flex: 1, height: 6,
    backgroundColor: theme.surfaceContainer,
    borderRadius: 99, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 99 },

  // Top host banner
  topHostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primaryFixed + '55',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.primaryFixed,
  },
  topHostText: { fontSize: 13, fontWeight: '600', color: theme.primary, flex: 1 },

  // Section row
  sectionRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text },

  // Filter chips
  chipScroll: { marginBottom: 14 },
  chipContent: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.surfaceContainer,
  },
  chipActive: { backgroundColor: theme.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  chipTextActive: { color: '#fff' },

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
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  emptySubtitle: { fontSize: 13, color: theme.textLight, textAlign: 'center' },

  // Review card
  reviewCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.primaryFixed + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: theme.primary },
  reviewerName: { fontSize: 14, fontWeight: '700', color: theme.text },
  reviewDate: { fontSize: 12, color: theme.textLight, marginTop: 1 },
  reviewComment: { fontSize: 14, color: theme.textMuted, lineHeight: 21 },

  // Experience tag
  expTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  expTagText: { fontSize: 12, color: theme.textLight, fontWeight: '500' },

  // Reply box (existing reply)
  replyBox: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  replyBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  replyBoxLabel: { fontSize: 11, fontWeight: '700', color: theme.textLight },
  editLink: { fontSize: 12, fontWeight: '600', color: theme.primary },
  replyBoxText: { fontSize: 13, color: theme.textMuted, lineHeight: 18 },

  // Reply button (no reply yet)
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  replyBtnText: { fontSize: 13, fontWeight: '700', color: theme.primary },

  // Reply modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
  replyInput: {
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    color: theme.text,
    fontSize: 14,
    height: 110,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
