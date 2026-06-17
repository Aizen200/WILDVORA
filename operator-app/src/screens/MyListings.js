import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI } from '../services/api';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80',
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80',
];

// ── Status pill ──────────────────────────────────────────
const STATUS_MAP = {
  live:               { bg: '#1A5F45EE', text: '#fff',     label: 'Approved',       icon: 'radio-button-on' },
  pending:            { bg: '#F59E0BDD', text: '#fff',     label: 'Pending Review', icon: 'time-outline' },
  draft:              { bg: '#89705699', text: '#fff',     label: 'Draft',          icon: 'document-outline' },
  paused:             { bg: '#6F7A7399', text: '#fff',     label: 'Paused',         icon: 'pause-circle-outline' },
  rejected:           { bg: '#EF4444DD', text: '#fff',     label: 'Rejected',       icon: 'close-circle-outline' },
  changes_requested:  { bg: '#F97316DD', text: '#fff',     label: 'Changes Needed', icon: 'alert-circle-outline' },
};

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={10} color={s.text} />
      <Text style={[styles.pillText, { color: s.text, marginLeft: 4 }]}>{s.label}</Text>
    </View>
  );
};

const StarChip = ({ rating }) => (
  <View style={styles.starRow}>
    <Ionicons name="star" size={11} color={rating ? theme.secondary : theme.outlineVariant} />
    <Text style={[styles.starValue, { color: rating ? theme.text : theme.outlineVariant }]}>
      {rating != null ? String(rating) : 'N/A'}
    </Text>
  </View>
);

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const CATEGORIES = ['All', 'Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const STATUSES   = ['All', 'Approved', 'Pending', 'Rejected', 'Draft', 'Paused'];

const STATUS_FILTER_MAP = {
  'All':      null,
  'Approved': 'live',
  'Pending':  'pending',
  'Rejected': 'rejected',
  'Draft':    'draft',
  'Paused':    'paused',
};

export default function MyListings({ listings, listingsLoading, fetchListings, setEditListing, setActiveTab }) {
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState({});

  const statusValue = STATUS_FILTER_MAP[statusFilter];

  const filtered = listings.filter(l => {
    const matchSearch = l.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All' || l.category === catFilter;
    const matchStatus = !statusValue || l.status === statusValue;
    return matchSearch && matchCat && matchStatus;
  });

  const setLoading = (id, val) => setActionLoading(prev => ({ ...prev, [id]: val }));

  const handleDelete = (listing) => {
    if (listing.status === 'live') {
      Alert.alert('Cannot Delete', 'Pause this listing before deleting it.');
      return;
    }
    Alert.alert('Delete Listing', `Delete "${listing.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setLoading(listing._id, 'delete');
          try {
            await operatorAPI.deleteListing(listing._id);
            fetchListings();
          } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to delete listing.');
          } finally {
            setLoading(listing._id, null);
          }
        }
      },
    ]);
  };

  const handleStatusToggle = async (listing) => {
    if (!['live', 'paused'].includes(listing.status)) return;
    const next = listing.status === 'live' ? 'paused' : 'live';
    setLoading(listing._id, 'toggle');
    try {
      await operatorAPI.editListing(listing._id, { status: next });
      fetchListings();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update status.');
    } finally {
      setLoading(listing._id, null);
    }
  };

  const handleResubmit = (listing) => {
    Alert.alert(
      'Resubmit for Review',
      `Resubmit "${listing.title}" to the admin for review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resubmit',
          onPress: async () => {
            setLoading(listing._id, 'resubmit');
            try {
              await operatorAPI.resubmitListing(listing._id);
              Alert.alert('Submitted', 'Your listing has been resubmitted for admin review.');
              fetchListings();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to resubmit listing.');
            } finally {
              setLoading(listing._id, null);
            }
          },
        },
      ]
    );
  };

  if (listingsLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Page header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Experiences Inventory</Text>
        <Text style={styles.pageSubtitle}>
          Manage your adventure listings. New listings go to Pending Review until approved by admin.
        </Text>
      </View>

      {/* Search + filter */}
      <View style={styles.filterCard}>
        <View style={styles.searchRow}>
          <Feather name="search" size={15} color={theme.outlineVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by experience title..."
            placeholderTextColor={theme.outlineVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map(c => (
              <Chip key={c} label={c} active={catFilter === c} onPress={() => setCatFilter(c)} />
            ))}
            <View style={styles.chipDivider} />
            {STATUSES.map(s => (
              <Chip key={s} label={s} active={statusFilter === s} onPress={() => setStatusFilter(s)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Listing cards */}
      {filtered.map((listing, idx) => {
        const imgUri = listing.images?.[0] || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
        const isRejected   = listing.status === 'rejected' || listing.status === 'changes_requested';
        const isPending    = listing.status === 'pending';
        const isToggleable = listing.status === 'live' || listing.status === 'paused';
        const busy         = actionLoading[listing._id];

        return (
          <View key={listing._id} style={styles.listingCard}>
            {/* Cover image */}
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imgUri }} style={styles.coverImage} resizeMode="cover" />
              <View style={styles.imageOverlay} />

              <View style={styles.pillOverlay}>
                <StatusPill status={listing.status} />
              </View>

              <View style={styles.actionOverlay}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => { setEditListing(listing); setActiveTab('create'); }}
                  disabled={isPending}
                >
                  <Feather name="edit-2" size={13} color={isPending ? theme.outlineVariant : theme.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleDelete(listing)}
                  disabled={!!busy}
                >
                  {busy === 'delete'
                    ? <ActivityIndicator size="small" color={theme.danger} />
                    : <Feather name="trash-2" size={13} color={theme.danger} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Card body */}
            <View style={styles.cardBody}>
              <View style={styles.rowBetween}>
                <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                <StarChip rating={listing.rating ?? null} />
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={theme.textLight} />
                <Text style={styles.locationText}>
                  {listing.location?.city ? `${listing.location.city}, ${listing.location.country}` : listing.category}
                </Text>
              </View>

              {/* Rejection reason banner */}
              {isRejected && listing.rejectionReason ? (
                <View style={styles.rejectionBanner}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rejectionLabel}>Admin Feedback:</Text>
                    <Text style={styles.rejectionText}>{listing.rejectionReason}</Text>
                  </View>
                </View>
              ) : null}

              {isPending && (
                <View style={styles.pendingBanner}>
                  <Ionicons name="time-outline" size={14} color="#F59E0B" />
                  <Text style={styles.pendingText}>Awaiting admin approval — not visible to customers yet.</Text>
                </View>
              )}

              <View style={[styles.rowBetween, styles.cardFooter]}>
                <Text style={styles.priceText}>
                  ₹{Number(listing.price).toLocaleString()}
                  <Text style={styles.priceUnit}>/person</Text>
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {isRejected && (
                    <TouchableOpacity
                      style={styles.resubmitBtn}
                      onPress={() => handleResubmit(listing)}
                      disabled={!!busy}
                    >
                      {busy === 'resubmit'
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.resubmitBtnText}>Resubmit</Text>
                      }
                    </TouchableOpacity>
                  )}

                  {isToggleable && (
                    <TouchableOpacity
                      style={styles.toggleBtn}
                      onPress={() => handleStatusToggle(listing)}
                      disabled={!!busy}
                    >
                      {busy === 'toggle'
                        ? <ActivityIndicator size="small" color={theme.primary} />
                        : <Text style={styles.toggleBtnText}>
                            {listing.status === 'live' ? 'Pause' : 'Go Live'}
                          </Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        );
      })}

      {filtered.length === 0 && !listingsLoading && (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={theme.outlineVariant} />
          <Text style={styles.emptyText}>
            {listings.length === 0
              ? "You haven't created any listings yet."
              : 'No listings match your filters.'}
          </Text>
        </View>
      )}

      {/* Add new listing */}
      <TouchableOpacity
        style={styles.addCard}
        onPress={() => { setEditListing(null); setActiveTab('create'); }}
        activeOpacity={0.8}
      >
        <View style={styles.addIconCircle}>
          <Ionicons name="add-circle-outline" size={36} color={theme.primary} />
        </View>
        <Text style={styles.addTitle}>Create New Experience</Text>
        <Text style={styles.addSubtitle}>
          Submit a new listing for admin review. Once approved it will appear in the customer app.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: theme.textLight, fontSize: 14 },

  pageHeader:    { marginBottom: 16, marginTop: 4 },
  pageTitle:     { color: theme.text, fontSize: 24, fontWeight: '700' },
  pageSubtitle:  { color: theme.textMuted, fontSize: 13, marginTop: 4, lineHeight: 19 },

  filterCard: {
    backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 20,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 2,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.surfaceContainerLow,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput:       { flex: 1, color: theme.text, fontSize: 14 },
  filterChip:        { borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.surfaceContainerLow },
  filterChipActive:  { backgroundColor: theme.primary },
  filterChipText:    { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  chipDivider:       { width: 1, backgroundColor: theme.outlineVariant, marginHorizontal: 4 },

  listingCard: {
    backgroundColor: theme.card, borderRadius: 24, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  imageWrapper:  { height: 200, position: 'relative' },
  coverImage:    { width: '100%', height: '100%' },
  imageOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.10)' },
  pillOverlay:   { position: 'absolute', top: 12, left: 12 },
  actionOverlay: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  pill:     { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' },
  pillText: { fontSize: 11, fontWeight: '700' },

  cardBody:     { padding: 18 },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listingTitle: { color: theme.text, fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginBottom: 10 },
  locationText: { color: theme.textLight, fontSize: 13 },

  rejectionBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#FEF2F2', borderRadius: 10,
    padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  rejectionLabel: { fontSize: 11, fontWeight: '700', color: '#EF4444', marginBottom: 2 },
  rejectionText:  { fontSize: 12, color: '#7F1D1D', lineHeight: 16 },

  pendingBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 10,
    padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  pendingText: { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 16 },

  cardFooter:  { paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.cardBorder, marginTop: 4 },
  priceText:   { color: theme.primary, fontSize: 18, fontWeight: '800' },
  priceUnit:   { color: theme.outlineVariant, fontSize: 13, fontWeight: '400' },

  toggleBtn: {
    backgroundColor: theme.primary + '18', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7, minWidth: 72, alignItems: 'center',
  },
  toggleBtnText: { color: theme.primary, fontSize: 13, fontWeight: '700' },

  resubmitBtn: {
    backgroundColor: '#2563EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7, minWidth: 80, alignItems: 'center',
  },
  resubmitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  starRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  starValue: { fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText:  { color: theme.outlineVariant, fontSize: 15, textAlign: 'center' },

  addCard: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: theme.outlineVariant,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 36, paddingHorizontal: 24, marginBottom: 8,
    backgroundColor: theme.card + '88',
  },
  addIconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: theme.primaryFixed + '44',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  addTitle:    { color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  addSubtitle: { color: theme.textLight, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
