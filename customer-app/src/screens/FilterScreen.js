import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView, Platform, Image, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { experienceAPI } from '../services/api';

const C = {
  primary:          '#1A5F45',
  primaryLight:     '#e8f4f0',
  secondary:        '#0a6687',
  background:       '#f7faf6',
  surface:          '#ffffff',
  surfaceContainer: '#ebefea',
  surfaceLow:       '#f1f4f0',
  onSurface:        '#181d1a',
  onSurfaceVariant: '#3f4943',
  outline:          '#6f7a73',
  outlineVariant:   '#bec9c1',
  tertiary:         '#8f4645',
  tertiaryLight:    '#fce8e8',
  white:            '#ffffff',
};

const CAT_IMAGES = {
  Trekking:       'https://images.unsplash.com/photo-1551632811-561730d1e4a6?auto=format&fit=crop&w=600&q=80',
  Camping:        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
  'Water Sports': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=600&q=80',
  Jungle:         'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
  Cycling:        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
  Climbing:       'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
  Safari:         'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80',
  Skiing:         'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?auto=format&fit=crop&w=600&q=80',
};
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80';

const ACTIVITY_TYPES = ['All', 'Trekking', 'Camping', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const DIFFICULTIES   = ['All', 'Easy', 'Moderate', 'Hard', 'Expert'];
const DURATIONS      = ['Any', '1 day', '2–3 days', '1 week+'];
const PRICE_MAX      = 20000;

const DIFF_COLORS = {
  Easy:     { bg: '#e6f4ee', text: '#1A5F45' },
  Moderate: { bg: '#dff0f8', text: '#0a6687' },
  Hard:     { bg: '#fff3e0', text: '#b45309' },
  Expert:   { bg: '#fce8e8', text: '#8f4645' },
};

// ── Price Slider ──────────────────────────────────────────────────────────────
function PriceSlider({ value, onChange }) {
  const [trackW, setTrackW] = useState(220);
  const pct = Math.max(0, Math.min(100, (value / PRICE_MAX) * 100));
  return (
    <View onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
      <TouchableOpacity
        activeOpacity={1}
        style={sl.hit}
        onPress={(e) => {
          const p = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackW));
          onChange(Math.round(p * PRICE_MAX));
        }}
      >
        <View style={sl.track}>
          <View style={[sl.fill, { width: `${pct}%` }]} />
          <View style={[sl.thumb, { left: `${pct}%`, marginLeft: -11 }]} />
        </View>
      </TouchableOpacity>
      <View style={sl.row}>
        <Text style={sl.lbl}>₹0</Text>
        <Text style={sl.lbl}>₹{PRICE_MAX.toLocaleString()}</Text>
      </View>
    </View>
  );
}
const sl = StyleSheet.create({
  hit:   { height: 32, justifyContent: 'center' },
  track: { height: 5, backgroundColor: C.outlineVariant + '80', borderRadius: 3, position: 'relative' },
  fill:  { position: 'absolute', left: 0, top: 0, height: 5, backgroundColor: C.primary, borderRadius: 3 },
  thumb: {
    position: 'absolute', top: -9, width: 23, height: 23, borderRadius: 12,
    backgroundColor: C.white, borderWidth: 2.5, borderColor: C.primary,
    ...Platform.select({
      ios:     { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  row:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lbl:  { fontSize: 11, color: C.outline, fontWeight: '600' },
});

// ── Result Card ───────────────────────────────────────────────────────────────
function ResultCard({ item, onPress }) {
  const imgUri = item.coverImage || item.images?.[0] || CAT_IMAGES[item.category] || FALLBACK_IMG;
  const dc = DIFF_COLORS[item.difficulty];
  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(item)} activeOpacity={0.88}>
      <View style={s.cardImgWrap}>
        <Image source={{ uri: imgUri }} style={s.cardImg} resizeMode="cover" />
        <View style={s.cardImgGrad} />
        <View style={s.catBadge}>
          <Text style={s.catBadgeText}>{item.category}</Text>
        </View>
        {item.difficulty && (
          <View style={[s.diffBadge, { backgroundColor: dc?.bg || C.surfaceLow }]}>
            <Text style={[s.diffBadgeText, { color: dc?.text || C.outline }]}>{item.difficulty}</Text>
          </View>
        )}
      </View>
      <View style={s.cardBody}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={s.ratingBadge}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={s.ratingText}>{item.rating || '4.9'}</Text>
          </View>
        </View>
        <View style={s.cardLocRow}>
          <Ionicons name="location-outline" size={13} color={C.outline} />
          <Text style={s.cardLocText} numberOfLines={1}>
            {[item.location?.city, item.location?.state].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View style={s.cardFooter}>
          <View>
            <Text style={s.cardPrice}>₹{item.price?.toLocaleString()}</Text>
            <Text style={s.cardPriceSub}>per person</Text>
          </View>
          {item.duration && (
            <View style={s.durationPill}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={C.primary} />
              <Text style={s.durationText}>{item.duration}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function FilterScreen({ navigation, route }) {
  const { user } = useAuth();

  const [search, setSearch]         = useState('');
  const [activity, setActivity]     = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [duration, setDuration]     = useState('Any');
  const [maxPrice, setMaxPrice]     = useState(PRICE_MAX);
  const [showFilters, setShowFilters] = useState(false);

  const [allExperiences, setAll] = useState([]);
  const [results, setResults]    = useState([]);
  const [loading, setLoading]    = useState(true);

  const searchRef = useRef(null);

  // ── fetch ───────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await experienceAPI.getAll({});
      setAll(res.data.experiences || []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── apply route params from HomeScreen Explore ──────────────────────────────
  useEffect(() => {
    if (route?.params?.initialSearch != null) setSearch(route.params.initialSearch);
    if (route?.params?.initialCategory && route.params.initialCategory !== 'All Destinations')
      setActivity(route.params.initialCategory);
  }, [route?.params?.initialSearch, route?.params?.initialCategory]);

  // ── live filter ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let list = [...allExperiences];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.location?.city?.toLowerCase().includes(q) ||
        i.location?.state?.toLowerCase().includes(q) ||
        i.location?.country?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
      );
    }
    if (activity !== 'All')    list = list.filter(i => i.category === activity);
    if (difficulty !== 'All')  list = list.filter(i => i.difficulty === difficulty);
    if (duration !== 'Any') {
      list = list.filter(i => {
        const d = (i.duration || '').toLowerCase();
        if (duration === '1 day')    return d.includes('1 day') || d === '1d';
        if (duration === '2–3 days') return d.includes('2 day') || d.includes('3 day') || d.includes('2-3');
        if (duration === '1 week+')  return d.includes('week') || parseInt(i.duration) >= 7;
        return true;
      });
    }
    list = list.filter(i => (i.price || 0) <= maxPrice);
    setResults(list);
  }, [allExperiences, search, activity, difficulty, duration, maxPrice]);

  const advancedFilterCount = [
    difficulty !== 'All',
    duration !== 'Any',
    maxPrice < PRICE_MAX,
  ].filter(Boolean).length;

  const resetAdvanced = () => { setDifficulty('All'); setDuration('Any'); setMaxPrice(PRICE_MAX); };

  const goToExperience = (item) =>
    navigation.navigate('ExperienceDetail', { experienceId: item._id });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Explore</Text>
          <Text style={s.headerSub}>Discover your next adventure</Text>
        </View>
        <TouchableOpacity style={s.avatarCircle} onPress={() => navigation.navigate('Profile')}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={s.avatarImg} />
            : <Text style={s.avatarInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={20} color={C.primary} />
          <TextInput
            ref={searchRef}
            style={s.searchInput}
            placeholder="City, destination or activity…"
            placeholderTextColor={C.outlineVariant}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={C.outlineVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters button — always clearly visible */}
        <TouchableOpacity
          style={[s.filterButton, showFilters && s.filterButtonActive]}
          onPress={() => setShowFilters(v => !v)}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={showFilters ? C.white : C.primary}
          />
          {advancedFilterCount > 0 && (
            <View style={[s.filterDot, showFilters && { backgroundColor: C.white }]}>
              <Text style={[s.filterDotText, showFilters && { color: C.primary }]}>
                {advancedFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Activity Quick Pills ─────────────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillsScroll}>
        <View style={s.pillsRow}>
          {ACTIVITY_TYPES.map((a) => {
            const active = activity === a;
            return (
              <TouchableOpacity
                key={a}
                style={[s.pill, active && s.pillActive]}
                onPress={() => setActivity(a)}
                activeOpacity={0.8}
              >
                <Text style={[s.pillText, active && s.pillTextActive]}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Advanced Filter Panel ───────────────────────────────────────────── */}
      {showFilters && (
        <View style={s.filterPanel}>
          {/* Difficulty */}
          <View style={s.filterSection}>
            <Text style={s.filterSectionTitle}>Difficulty Level</Text>
            <View style={s.filterChips}>
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d;
                const dc = DIFF_COLORS[d];
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      s.filterChip,
                      active && (dc
                        ? { backgroundColor: dc.bg, borderColor: dc.text }
                        : s.filterChipActive),
                    ]}
                    onPress={() => setDifficulty(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      s.filterChipText,
                      active && (dc ? { color: dc.text, fontWeight: '700' } : s.filterChipTextActive),
                    ]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration */}
          <View style={s.filterSection}>
            <Text style={s.filterSectionTitle}>Duration</Text>
            <View style={s.filterChips}>
              {DURATIONS.map((dur) => {
                const active = duration === dur;
                return (
                  <TouchableOpacity
                    key={dur}
                    style={[s.filterChip, active && s.filterChipActive]}
                    onPress={() => setDuration(dur)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{dur}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Price */}
          <View style={s.filterSection}>
            <View style={s.filterSectionHdr}>
              <Text style={s.filterSectionTitle}>Max Price</Text>
              <Text style={s.priceValueText}>
                {maxPrice >= PRICE_MAX ? 'No limit' : `₹${maxPrice.toLocaleString()}`}
              </Text>
            </View>
            <PriceSlider value={maxPrice} onChange={setMaxPrice} />
          </View>

          {/* Reset */}
          {advancedFilterCount > 0 && (
            <TouchableOpacity style={s.resetBtn} onPress={resetAdvanced} activeOpacity={0.8}>
              <MaterialCommunityIcons name="refresh" size={15} color={C.tertiary} />
              <Text style={s.resetText}>Reset filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Active filter tags ───────────────────────────────────────────────── */}
      {advancedFilterCount > 0 && !showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.activeTagsRow}>
          {difficulty !== 'All' && (
            <TouchableOpacity style={s.activeTag} onPress={() => setDifficulty('All')}>
              <Text style={s.activeTagText}>{difficulty}</Text>
              <Ionicons name="close" size={12} color={C.primary} />
            </TouchableOpacity>
          )}
          {duration !== 'Any' && (
            <TouchableOpacity style={s.activeTag} onPress={() => setDuration('Any')}>
              <Text style={s.activeTagText}>{duration}</Text>
              <Ionicons name="close" size={12} color={C.primary} />
            </TouchableOpacity>
          )}
          {maxPrice < PRICE_MAX && (
            <TouchableOpacity style={s.activeTag} onPress={() => setMaxPrice(PRICE_MAX)}>
              <Text style={s.activeTagText}>≤₹{maxPrice.toLocaleString()}</Text>
              <Ionicons name="close" size={12} color={C.primary} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── Results Header ──────────────────────────────────────────────────── */}
      <View style={s.resultsHdr}>
        <Text style={s.resultsTitle} numberOfLines={1}>
          {search.trim() ? `"${search.trim()}"` : activity !== 'All' ? activity : 'All Experiences'}
        </Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{loading ? '–' : results.length} results</Text>
        </View>
      </View>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadText}>Finding adventures…</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <ResultCard item={item} onPress={goToExperience} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconWrap}>
                <MaterialCommunityIcons name="compass-off-outline" size={40} color={C.primary} />
              </View>
              <Text style={s.emptyTitle}>No experiences found</Text>
              <Text style={s.emptySub}>
                {search.trim()
                  ? `No listings for "${search.trim()}" yet. Try a different city or clear filters.`
                  : 'Try different filters or broaden your search.'}
              </Text>
              <TouchableOpacity
                style={s.clearAllBtn}
                onPress={() => { setSearch(''); setActivity('All'); resetAdvanced(); }}
                activeOpacity={0.85}
              >
                <Text style={s.clearAllText}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.onSurface, letterSpacing: -0.5 },
  headerSub:   { fontSize: 13, color: C.outline, marginTop: 2 },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.surfaceContainer,
    borderWidth: 2, borderColor: C.primary + '30',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImg:     { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: C.primary },

  /* Search row */
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12, gap: 10,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.outlineVariant + '80',
    paddingHorizontal: 14, paddingVertical: 11,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  searchInput: { flex: 1, fontSize: 14, color: C.onSurface, padding: 0 },

  /* Filter button — clearly separate, always visible */
  filterButton: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.primaryLight,
    borderWidth: 1.5, borderColor: C.primary + '40',
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  filterButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.tertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  filterDotText: { fontSize: 9, fontWeight: '800', color: C.white },

  /* Activity quick pills */
  pillsScroll: { height: 54 },
  pillsRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingRight: 16 },
  pill: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50,
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.outlineVariant,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: C.primary, borderColor: C.primary,
    ...Platform.select({
      ios:     { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  pillText:       { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  pillTextActive: { color: '#ffffff', fontWeight: '700' },

  /* Filter panel */
  filterPanel: {
    backgroundColor: C.surface,
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: C.outlineVariant + '50',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  filterSection:    { marginBottom: 18 },
  filterSectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  filterSectionTitle: { fontSize: 13, fontWeight: '700', color: C.onSurface, letterSpacing: 0.3 },
  priceValueText:   { fontSize: 14, fontWeight: '700', color: C.primary },
  filterChips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50,
    backgroundColor: C.surfaceLow,
    borderWidth: 1.5, borderColor: C.outlineVariant + '80',
  },
  filterChipActive:     { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText:       { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  filterChipTextActive: { color: C.white, fontWeight: '700' },

  resetBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.tertiaryLight, borderRadius: 50 },
  resetText: { fontSize: 13, fontWeight: '700', color: C.tertiary },

  /* Active filter tags */
  activeTagsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  activeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: C.primaryLight, borderRadius: 50,
    borderWidth: 1, borderColor: C.primary + '40',
  },
  activeTagText: { fontSize: 12, fontWeight: '700', color: C.primary },

  /* Results header */
  resultsHdr: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: C.outlineVariant + '30',
  },
  resultsTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface, flex: 1, marginRight: 8 },
  countBadge:   { backgroundColor: C.surfaceContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countText:    { fontSize: 12, fontWeight: '700', color: C.onSurfaceVariant },

  /* List */
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },

  /* Card */
  card: {
    backgroundColor: C.surface, borderRadius: 18, marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1, borderColor: C.outlineVariant + '30',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardImgWrap: { position: 'relative' },
  cardImg:     { width: '100%', height: 170, resizeMode: 'cover' },
  cardImgGrad: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  catBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: C.primary + 'ee',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  catBadgeText: { color: C.white, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  diffBadge: {
    position: 'absolute', top: 12, right: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  diffBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  cardBody:     { padding: 14 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5, gap: 8 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: C.onSurface, flex: 1 },
  ratingBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef9ec', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: '#f59e0b30' },
  ratingText:   { fontSize: 12, fontWeight: '700', color: '#92400e' },
  cardLocRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  cardLocText:  { fontSize: 12, color: C.outline, flex: 1 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardPrice:    { fontSize: 18, fontWeight: '800', color: C.primary },
  cardPriceSub: { fontSize: 11, color: C.outline, marginTop: 1 },
  durationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  durationText: { fontSize: 12, fontWeight: '600', color: C.primary },

  /* States */
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadText: { fontSize: 14, color: C.outline, fontWeight: '500' },

  emptyBox:     { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyIconWrap:{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  emptySub:     { fontSize: 14, color: C.outline, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  clearAllBtn:  { paddingHorizontal: 28, paddingVertical: 13, backgroundColor: C.primary, borderRadius: 50 },
  clearAllText: { color: C.white, fontWeight: '700', fontSize: 14 },
});
