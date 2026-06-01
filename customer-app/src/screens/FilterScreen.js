import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { experienceAPI } from '../services/api';

const CATEGORIES = ['All', 'Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const DIFFICULTIES = ['All', 'Easy', 'Moderate', 'Hard', 'Expert'];
const DURATIONS = ['All', '1 day', '2-3 days', '1 week+'];

const CATEGORY_IMAGES = {
  Trekking: 'https://images.unsplash.com/photo-1551632811-561730d1e4a6?auto=format&fit=crop&w=300&q=80',
  Camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80',
  'Water Sports': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=300&q=80',
  Jungle: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80',
  Cycling: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=300&q=80',
  Climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=300&q=80',
  Safari: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=300&q=80',
  Skiing: 'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?auto=format&fit=crop&w=300&q=80',
  Default: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80',
};

function ExperienceCard({ item, onPress }) {
  const imageUri = CATEGORY_IMAGES[item.category] || CATEGORY_IMAGES.Default;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.9}>
      <View style={styles.cardImgContainer}>
        <Image source={{ uri: imageUri }} style={styles.cardImg} />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.cardMetaRow}>
          <Ionicons name="location-outline" size={13} color="#6f7a73" />
          <Text style={styles.cardMeta}>{item.location?.city}, {item.location?.country}</Text>
        </View>
        <View style={styles.cardRow}>
          <View style={styles.priceRow}>
            <Text style={styles.cardPrice}>${item.price}</Text>
            <Text style={styles.cardPriceSub}>/person</Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#11694b" />
            <Text style={styles.cardRating}>{item.rating || '4.9'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FilterScreen({ navigation, route }) {
  const [search, setSearch] = useState(route.params?.initialSearch || '');
  const [category, setCategory] = useState(route.params?.initialCategory || 'All');
  const [difficulty, setDifficulty] = useState('All');
  const [duration, setDuration] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [featured, setFeatured] = useState(route.params?.featured || false);
  const [trending, setTrending] = useState(route.params?.trending || false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (difficulty !== 'All') params.difficulty = difficulty;
      if (duration !== 'All') params.duration = duration;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (featured) params.featured = 'true';
      if (trending) params.trending = 'true';

      const res = await experienceAPI.getAll(params);
      setResults(res.data.experiences || []);
      setTotal(res.data.total || 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, difficulty, duration, minPrice, maxPrice, featured, trending]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setDifficulty('All');
    setDuration('All');
    setMinPrice('');
    setMaxPrice('');
    setFeatured(false);
    setTrending(false);
  };

  const goToExperience = (item) => navigation.navigate('ExperienceDetail', { experienceId: item._id });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={16} color="#6f7a73" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search experiences..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchResults}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name={showFilters ? "chevron-up" : "options-outline"} size={20} color="#11694b" />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Expandable filters */}
      {showFilters && (
        <ScrollView style={styles.filtersScrollView} contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={styles.filtersBox}>
            <Text style={styles.filterLabel}>Difficulty</Text>
            <View style={styles.filterRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, difficulty === d && styles.filterChipActive]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text style={[styles.filterChipText, difficulty === d && styles.filterChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Duration</Text>
            <View style={styles.filterRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, duration === d && styles.filterChipActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.filterChipText, duration === d && styles.filterChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Price Range ($)</Text>
            <View style={styles.priceRow}>
              <TextInput style={styles.priceInput} placeholder="Min" placeholderTextColor="#AAA" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
              <Text style={styles.priceDash}>—</Text>
              <TextInput style={styles.priceInput} placeholder="Max" placeholderTextColor="#AAA" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => { setShowFilters(false); fetchResults(); }}>
                <Text style={styles.applyBtnText}>Show {total} results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Results header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{total} experiences found</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#11694b" /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i._id}
          renderItem={({ item }) => <ExperienceCard item={item} onPress={goToExperience} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="mountain" size={40} color="#6f7a73" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No experiences found.</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.emptyLink}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7faf6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 10, alignItems: 'center' },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.4)',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 }
    })
  },
  searchInput: { flex: 1, fontSize: 14, color: '#181d1a', height: '100%', padding: 0 },
  filterToggle: {
    width: 48, height: 48,
    borderWidth: 1, borderColor: 'rgba(190, 201, 193, 0.4)',
    borderRadius: 24, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { cursor: 'pointer' }
    })
  },
  chipsWrapper: { borderBottomWidth: 1, borderBottomColor: 'rgba(190, 201, 193, 0.2)', paddingBottom: 12 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.5)',
    backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  chipActive: { backgroundColor: '#11694b', borderColor: '#11694b' },
  chipText: { fontSize: 13, color: '#3f4943', fontWeight: '600', fontFamily: 'Quicksand' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  filtersScrollView: { maxHeight: 320, borderBottomWidth: 1, borderBottomColor: 'rgba(190, 201, 193, 0.2)' },
  filtersBox: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#f1f4f0', borderRadius: 16,
    padding: 16, borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.3)'
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#6f7a73', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.5)',
    backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  filterChipActive: { backgroundColor: '#11694b', borderColor: '#11694b' },
  filterChipText: { fontSize: 12, color: '#3f4943', fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff', fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  priceInput: { flex: 1, borderWidth: 1, borderColor: 'rgba(190, 201, 193, 0.5)', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#ffffff', color: '#181d1a' },
  priceDash: { color: '#6f7a73', fontSize: 16 },
  filterActions: { flexDirection: 'row', gap: 10 },
  resetBtn: {
    flex: 1, paddingVertical: 12,
    borderWidth: 1, borderColor: '#11694b',
    borderRadius: 24, alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  resetBtnText: { fontSize: 13, color: '#11694b', fontWeight: '700' },
  applyBtn: {
    flex: 2, paddingVertical: 12,
    backgroundColor: '#11694b', borderRadius: 24,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  applyBtnText: { fontSize: 13, color: '#ffffff', fontWeight: '700' },
  resultsHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  resultsCount: { fontSize: 12, color: '#6f7a73', fontWeight: '600', letterSpacing: 0.2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.2)',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
      android: { elevation: 1 },
      web: { cursor: 'pointer', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 }
    })
  },
  cardImgContainer: { width: 110, height: 100, position: 'relative' },
  cardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryBadge: {
    position: 'absolute',
    top: 8, left: 8,
    backgroundColor: 'rgba(17, 105, 75, 0.85)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12,
  },
  categoryBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#181d1a', marginBottom: 4, fontFamily: 'Quicksand' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  cardMeta: { fontSize: 12, color: '#6f7a73' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#11694b' },
  cardPriceSub: { fontSize: 11, color: '#6f7a73' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardRating: { fontSize: 12, fontWeight: '700', color: '#181d1a' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: '#6f7a73', marginBottom: 8, fontWeight: '600' },
  emptyLink: { fontSize: 13, color: '#11694b', fontWeight: '700', textDecorationLine: 'underline' },
});