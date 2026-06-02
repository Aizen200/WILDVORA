import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';

// ── Real Unsplash images for each listing ────────────────
const LISTING_IMAGES = [
  'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80', // jungle camp
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', // himalayan trek
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80', // river rafting
  'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80', // desert safari
  'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80', // alpine
  'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=600&q=80', // canopy
];

// ── Status pill ──────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = {
    live:   { bg: theme.primary + 'EE', text: '#fff', label: 'Live',   icon: 'radio-button-on' },
    draft:  { bg: '#89705699',           text: '#fff', label: 'Draft',  icon: 'document-outline' },
    paused: { bg: '#6F7A7399',           text: '#fff', label: 'Paused', icon: 'pause-circle-outline' },
  };
  const s = map[status] || map.draft;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={10} color={s.text} />
      <Text style={[styles.pillText, { color: s.text, marginLeft: 4 }]}>{s.label}</Text>
    </View>
  );
};

// ── Star chip ────────────────────────────────────────────
const StarChip = ({ rating }) => (
  <View style={styles.starRow}>
    <Ionicons name="star" size={11} color={rating ? theme.secondary : theme.outlineVariant} />
    <Text style={[styles.starValue, { color: rating ? theme.text : theme.outlineVariant }]}>
      {rating != null ? String(rating) : 'N/A'}
    </Text>
  </View>
);

// ── Filter chip ──────────────────────────────────────────
const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const CATEGORIES = ['All', 'Camping', 'Trekking', 'Water Sports', 'Safari', 'Adventure', 'Resort'];
const STATUSES   = ['All', 'Live', 'Draft', 'Paused'];

export default function MyListings({ listings, setListings, setEditListing, setActiveTab }) {
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = listings.filter(l => {
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All' || l.category === catFilter;
    const matchStatus = statusFilter === 'All' || l.status === statusFilter.toLowerCase();
    return matchSearch && matchCat && matchStatus;
  });

  const handleDelete = id => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive',
        onPress: () => setListings(prev => prev.filter(l => l.id !== id)) },
    ]);
  };

  const handleStatusToggle = listing => {
    const next = listing.status === 'live' ? 'paused'
               : listing.status === 'paused' ? 'live' : 'live';
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: next } : l));
  };

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
          Manage your high-performance adventure listings and drafts.
        </Text>
      </View>

      {/* Search + filter card */}
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

      {/* Listing cards with real images */}
      {filtered.map((listing, idx) => (
        <View key={listing.id} style={styles.listingCard}>
          {/* Cover image */}
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: LISTING_IMAGES[idx % LISTING_IMAGES.length] }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            {/* dark gradient overlay */}
            <View style={styles.imageOverlay} />

            {/* Status pill — top left */}
            <View style={styles.pillOverlay}>
              <StatusPill status={listing.status} />
            </View>

            {/* Edit / Delete — top right */}
            <View style={styles.actionOverlay}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => { setEditListing(listing); setActiveTab('create'); }}
              >
                <Feather name="edit-2" size={13} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(listing.id)}>
                <Feather name="trash-2" size={13} color={theme.danger} />
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
              <Text style={styles.locationText}>{listing.category}</Text>
            </View>
            <View style={[styles.rowBetween, styles.cardFooter]}>
              <Text style={styles.priceText}>
                ₹{Number(listing.price).toLocaleString()}
                <Text style={styles.priceUnit}>/person</Text>
              </Text>
              <TouchableOpacity style={styles.toggleBtn} onPress={() => handleStatusToggle(listing)}>
                <Text style={styles.toggleBtnText}>
                  {listing.status === 'live' ? 'Pause' : 'Go Live'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={theme.outlineVariant} />
          <Text style={styles.emptyText}>No listings found</Text>
        </View>
      )}

      {/* Add new card */}
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
          Launch a new listing and expand your adventure portfolio.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 8 },
  pageHeader: { marginBottom: 16, marginTop: 4 },
  pageTitle: { color: theme.text, fontSize: 24, fontWeight: '700' },
  pageSubtitle: { color: theme.textMuted, fontSize: 14, marginTop: 4, lineHeight: 20 },

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
  searchInput: { flex: 1, color: theme.text, fontSize: 14 },
  filterChip: {
    borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: theme.surfaceContainerLow,
  },
  filterChipActive: { backgroundColor: theme.primary },
  filterChipText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  chipDivider: { width: 1, backgroundColor: theme.outlineVariant, marginHorizontal: 4 },

  listingCard: {
    backgroundColor: theme.card, borderRadius: 24, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  imageWrapper: { height: 200, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  pillOverlay: { position: 'absolute', top: 12, left: 12 },
  actionOverlay: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  pill: {
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center',
  },
  pillText: { fontSize: 11, fontWeight: '700' },

  cardBody: { padding: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listingTitle: { color: theme.text, fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginBottom: 14 },
  locationText: { color: theme.textLight, fontSize: 13 },
  cardFooter: { paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.cardBorder },
  priceText: { color: theme.primary, fontSize: 18, fontWeight: '800' },
  priceUnit: { color: theme.outlineVariant, fontSize: 13, fontWeight: '400' },
  toggleBtn: {
    backgroundColor: theme.primary + '18', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  toggleBtnText: { color: theme.primary, fontSize: 13, fontWeight: '700' },
  starRow: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  starValue: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: theme.outlineVariant, fontSize: 15 },
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
  addTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  addSubtitle: { color: theme.textLight, fontSize: 13, textAlign: 'center', lineHeight: 18 },
});