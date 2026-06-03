import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  primary:             '#11694b',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
  background:          '#f7faf6',
  surface:             '#f7faf6',
  surfaceContainer:    '#ebefea',
  surfaceContainerLow: '#f1f4f0',
  white:               '#ffffff',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
};

const FILTERS = ['All', 'Experiences', 'Properties', 'Hosts'];

const REVIEWS = [
  {
    id: '1',
    title: 'Alpine Ridge Trail',
    category: 'Experiences',
    location: 'Aspen, CO',
    rating: 5,
    date: 'Oct 24, 2023',
    text: 'The ascent was challenging but the sunrise views from the ridge were absolutely world-class. Our guide Julian knew every hidden lookout point.',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop',
    helpful: 12,
  },
  {
    id: '2',
    title: 'Mistwood Sanctuary',
    category: 'Properties',
    location: 'Tahoe, CA',
    rating: 4,
    text: 'Perfect for a weekend escape. Very quiet and the trails are well-marked. The cabin had everything we needed. Would definitely return in summer.',
    date: 'Sep 15, 2023',
    img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop',
    helpful: 7,
  },
  {
    id: '3',
    title: 'Red Rock Canyon Tour',
    category: 'Experiences',
    location: 'Moab, UT',
    rating: 5,
    text: 'Marcus was an exceptional guide. The sunset hike through the canyon was nothing short of magical. Highly recommend booking the extended package.',
    date: 'Aug 3, 2023',
    img: 'https://images.unsplash.com/photo-1488415032361-b7e238421f1b?w=200&h=200&fit=crop',
    helpful: 21,
  },
  {
    id: '4',
    title: 'Coastal Kayaking',
    category: 'Experiences',
    location: 'Big Sur, CA',
    rating: 3,
    text: 'Great experience overall but the equipment could use an upgrade. The route itself was stunning and worth the early wake-up.',
    date: 'Jul 19, 2023',
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&h=200&fit=crop',
    helpful: 4,
  },
];

function Stars({ count, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={size}
          color={i < count ? '#f59e0b' : C.outlineVariant}
        />
      ))}
    </View>
  );
}

function ReviewCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Image source={{ uri: item.img }} style={s.cardImg} resizeMode="cover" />
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={s.cardMeta}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={C.outline} />
            <Text style={s.cardLocation}>{item.location}</Text>
          </View>
          <View style={s.cardRatingRow}>
            <Stars count={item.rating} />
            <Text style={s.cardDate}>{item.date}</Text>
          </View>
        </View>
      </View>

      <Text
        style={s.cardText}
        numberOfLines={expanded ? undefined : 2}
      >
        {item.text}
      </Text>
      {item.text.length > 100 && (
        <TouchableOpacity onPress={() => setExpanded(p => !p)}>
          <Text style={s.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        </TouchableOpacity>
      )}

      <View style={s.cardFooter}>
        <View style={s.helpfulRow}>
          <MaterialCommunityIcons name="thumb-up-outline" size={14} color={C.outline} />
          <Text style={s.helpfulText}>{item.helpful} found helpful</Text>
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.actionBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={15} color={C.primary} />
            <Text style={s.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]}>
            <MaterialCommunityIcons name="delete-outline" size={15} color="#ba1a1a" />
            <Text style={[s.actionText, { color: '#ba1a1a' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ReviewHistoryScreen({ navigation }) {
  const [active, setActive] = useState('All');

  const filtered = active === 'All' ? REVIEWS : REVIEWS.filter(r => r.category === active);

  const avgRating = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App bar */}
      <View style={s.appBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>Review History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary banner */}
        <View style={s.banner}>
          <View style={s.bannerStat}>
            <Text style={s.bannerNum}>{REVIEWS.length}</Text>
            <Text style={s.bannerLabel}>TOTAL REVIEWS</Text>
          </View>
          <View style={s.bannerDivider} />
          <View style={s.bannerStat}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={s.bannerNum}>{avgRating}</Text>
              <MaterialCommunityIcons name="star" size={20} color={C.onPrimaryContainer + 'CC'} />
            </View>
            <Text style={s.bannerLabel}>AVG RATING</Text>
          </View>
          <View style={s.bannerDivider} />
          <View style={s.bannerStat}>
            <Text style={s.bannerNum}>{REVIEWS.reduce((a, r) => a + r.helpful, 0)}</Text>
            <Text style={s.bannerLabel}>HELPFUL VOTES</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.chip, active === f && s.chipActive]}
              onPress={() => setActive(f)}
              activeOpacity={0.75}
            >
              <Text style={[s.chipText, active === f && s.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cards */}
        <View style={s.list}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="star-off-outline" size={48} color={C.outlineVariant} />
              <Text style={s.emptyText}>No reviews in this category yet</Text>
            </View>
          ) : (
            filtered.map(item => <ReviewCard key={item.id} item={item} />)
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#f7faf6' },
  appBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f7faf6', borderBottomWidth: 1, borderColor: C.outlineVariant + '40' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },

  banner:      { margin: 20, backgroundColor: C.primaryContainer, borderRadius: 18, flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'space-around' },
  bannerStat:  { alignItems: 'center', flex: 1 },
  bannerNum:   { fontSize: 28, fontWeight: '800', color: C.onPrimaryContainer, letterSpacing: -0.5 },
  bannerLabel: { fontSize: 10, fontWeight: '700', color: C.onPrimaryContainer + '99', letterSpacing: 0.8, marginTop: 2 },
  bannerDivider: { width: 1, height: 40, backgroundColor: C.onPrimaryContainer + '25' },

  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  chip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, backgroundColor: C.white, borderWidth: 1, borderColor: C.outlineVariant + '60' },
  chipActive:{ backgroundColor: C.primary, borderColor: C.primary },
  chipText:  { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  chipTextActive: { color: C.white },

  list: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },

  card:       { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardTop:    { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardImg:    { width: 60, height: 60, borderRadius: 12 },
  cardInfo:   { flex: 1, justifyContent: 'center', gap: 3 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.onSurface },
  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLocation:{ fontSize: 12, color: C.outline },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate:   { fontSize: 11, color: C.outline },
  cardText:   { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20 },
  readMore:   { fontSize: 12, fontWeight: '700', color: C.primary, marginTop: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: C.outlineVariant + '30' },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  helpfulText:{ fontSize: 12, color: C.outline },
  cardActions:{ flexDirection: 'row', gap: 8 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: C.primary + '12', borderWidth: 1, borderColor: C.primary + '25' },
  actionBtnDanger: { backgroundColor: '#ba1a1a12', borderColor: '#ba1a1a25' },
  actionText: { fontSize: 12, fontWeight: '600', color: C.primary },

  empty:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: C.outline, fontWeight: '500' },
});