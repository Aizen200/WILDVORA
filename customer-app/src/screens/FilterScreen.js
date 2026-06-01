import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { experienceAPI } from '../services/api';

// Custom Slider Component representing a solid gray track with a green thumb
function CustomSlider({ min, max, value, onChange }) {
  const [trackWidth, setTrackWidth] = useState(250);

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleTouch = (event) => {
    const locationX = event.nativeEvent.locationX;
    const clickPercent = Math.max(0, Math.min(1, locationX / trackWidth));
    const newValue = Math.round(min + clickPercent * (max - min));
    onChange(newValue);
  };

  return (
    <View
      style={sliderStyles.container}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTouch}
        style={sliderStyles.trackWrapper}
      >
        <View style={sliderStyles.track}>
          {/* Active track is also styled gray/dark gray to match the exact visual solid track in the screenshot */}
          <View style={[sliderStyles.activeTrack, { width: `${percentage}%` }]} />
          <View style={[sliderStyles.thumb, { left: `${percentage}%`, marginLeft: -10 }]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
  },
  trackWrapper: {
    height: 20,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    height: 4,
    backgroundColor: '#bec9c1',
    borderRadius: 2,
    width: '100%',
    position: 'relative',
  },
  activeTrack: {
    height: 4,
    backgroundColor: '#bec9c1',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#11694b',
    position: 'absolute',
    top: -8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
});

export default function FilterScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState({
    'Mountain Trekking': true,
    'Coastal Kayaking': false,
    'Forest Survival': false,
    'Rock Climbing': false,
    'Alpine Skiing': false,
    'Wildlife Safari': false,
  });
  const [price, setPrice] = useState(1500);
  const [difficulty, setDifficulty] = useState('Moderate');
  const [duration, setDuration] = useState('2-3 days');
  const [distance, setDistance] = useState(50);

  const [allResults, setAllResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewResults, setViewResults] = useState(false);

  // Mapping from seed data categories to filter screen checkboxes
  const categoryMap = {
    Trekking: 'Mountain Trekking',
    'Water Sports': 'Coastal Kayaking',
    Camping: 'Forest Survival',
    Jungle: 'Forest Survival',
    Climbing: 'Rock Climbing',
    Skiing: 'Alpine Skiing',
    Safari: 'Wildlife Safari',
  };

  // Fetch experiences
  const fetchAndFilter = useCallback(async () => {
    setLoading(true);
    try {
      const res = await experienceAPI.getAll({});
      const data = res.data.experiences || [];
      setAllResults(data);
    } catch (err) {
      console.log('Error fetching experiences', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndFilter();
  }, [fetchAndFilter]);

  // Apply filters dynamically
  useEffect(() => {
    let temp = [...allResults];

    // 1. Text Search Filter
    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.title?.toLowerCase().includes(s) ||
          item.location?.city?.toLowerCase().includes(s) ||
          item.category?.toLowerCase().includes(s)
      );
    }

    // 2. Activity Type Checkboxes
    const activeActivities = Object.keys(activities).filter((k) => activities[k]);
    if (activeActivities.length > 0) {
      temp = temp.filter((item) => {
        const checkboxName = categoryMap[item.category];
        return checkboxName ? activities[checkboxName] : false;
      });
    }

    // 3. Price Filter (Maximum value from Slider)
    temp = temp.filter((item) => item.price <= price);

    // 4. Difficulty Chip Filter
    if (difficulty && difficulty !== 'All') {
      temp = temp.filter((item) => item.difficulty === difficulty);
    }

    // 5. Duration Radio Filter
    if (duration && duration !== 'All') {
      if (duration === '1 day') {
        temp = temp.filter((item) => item.duration?.toLowerCase().includes('1 day'));
      } else if (duration === '2-3 days') {
        temp = temp.filter(
          (item) =>
            item.duration?.toLowerCase().includes('2 day') ||
            item.duration?.toLowerCase().includes('3 day') ||
            item.duration?.toLowerCase().includes('2-3')
        );
      } else if (duration === '1 week+') {
        temp = temp.filter(
          (item) =>
            item.duration?.toLowerCase().includes('week') ||
            parseInt(item.duration) >= 7
        );
      }
    }

    setFilteredResults(temp);
  }, [allResults, search, activities, price, difficulty, duration, distance]);

  const toggleActivity = (act) => {
    setActivities((prev) => ({
      ...prev,
      [act]: !prev[act],
    }));
  };

  const handleReset = () => {
    setSearch('');
    setActivities({
      'Mountain Trekking': false,
      'Coastal Kayaking': false,
      'Forest Survival': false,
      'Rock Climbing': false,
      'Alpine Skiing': false,
      'Wildlife Safari': false,
    });
    setPrice(5000);
    setDifficulty('Moderate');
    setDuration('2-3 days');
    setDistance(50);
    setViewResults(false);
  };

  const renderExperienceItem = ({ item }) => {
    const categoryImages = {
      Trekking: 'https://images.unsplash.com/photo-1551632811-561730d1e4a6?auto=format&fit=crop&w=400&q=80',
      Camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80',
      'Water Sports': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=400&q=80',
      Jungle: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
      Cycling: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
      Climbing: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=400&q=80',
      Safari: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=400&q=80',
      Skiing: 'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?auto=format&fit=crop&w=400&q=80',
    };

    const imageUri = categoryImages[item.category] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80';

    return (
      <TouchableOpacity
        style={styles.resultsCard}
        onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardImgContainer}>
          <Image source={{ uri: imageUri }} style={styles.cardImg} />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.cardMetaRow}>
            <Ionicons name="location-outline" size={13} color="#6f7a73" />
            <Text style={styles.cardMeta}>
              {item.location?.city}, {item.location?.country}
            </Text>
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
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={24} color="#11694b" />
        </TouchableOpacity>
        <Text style={styles.logo}>Wildvora</Text>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsDN40cmn5CU3uFPAmg4Qj9POqEV0eEEFrDAqXXnx5y7g5QVlRDP8v2LjOmbX1mibQfusVKZEks-vXkKP42H8vuqSaImwViSlDnBRruOvICT1sW0wYPtkFoDQriYInXt0leyduPF482g5WgmxaQ0eQLLarEJOtYqs2mP8fNhnnQv8HaYEdAuCF6eKIGSsX9lXQLB0VjX7lztgxEy1vC8iT5RcgH4hcCGmzMDmcEiXcwLiUGrnKQqMuqCTnMMyOqpCHLUGC0OpTCaw',
            }}
            style={styles.avatar}
          />
        </View>
      </View>

      {!viewResults ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Input Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#11694b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Where to next?"
                placeholderTextColor="#6f7a73"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Activity Type */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <MaterialCommunityIcons name="hiking" size={24} color="#11694b" />
              <Text style={styles.sectionTitle}>Activity Type</Text>
            </View>
            <View style={styles.activityGrid}>
              {Object.keys(activities).map((act) => (
                <TouchableOpacity
                  key={act}
                  style={styles.activityCard}
                  onPress={() => toggleActivity(act)}
                  activeOpacity={0.8}
                >
                  {/* Custom Styled Square Checkbox exactly matching screenshot */}
                  {activities[act] ? (
                    <View style={styles.customCheckboxChecked}>
                      <MaterialIcons name="check" size={14} color="#ffffff" />
                    </View>
                  ) : (
                    <View style={styles.customCheckboxUnchecked} />
                  )}
                  <Text style={styles.activityText}>{act}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.headingLeft}>
                <MaterialIcons name="payments" size={24} color="#11694b" />
                <Text style={styles.sectionTitle}>Price Range</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>$200 - ${price.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.sliderContainer}>
              <CustomSlider min={0} max={5000} value={price} onChange={setPrice} />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>$0</Text>
                <Text style={styles.sliderLabel}>$5,000+</Text>
              </View>
            </View>
          </View>

          {/* Difficulty Level */}
          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <MaterialIcons name="signal-cellular-alt" size={24} color="#11694b" />
              <Text style={styles.sectionTitle}>Difficulty Level</Text>
            </View>
            <View style={styles.chipsRow}>
              {['Easy', 'Moderate', 'Hard', 'Expert'].map((lvl) => {
                const isSelected = difficulty === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.difficultyChip, isSelected && styles.difficultyChipActive]}
                    onPress={() => setDifficulty(lvl)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.difficultyChipText,
                        isSelected && styles.difficultyChipTextActive,
                      ]}
                    >
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration Card */}
          <View style={styles.durationCard}>
            <Text style={styles.cardHeader}>DURATION</Text>
            <View style={styles.radioList}>
              {['1 day', '2-3 days', '1 week+'].map((dur) => {
                const isChecked = duration === dur;
                return (
                  <TouchableOpacity
                    key={dur}
                    style={styles.radioRow}
                    onPress={() => setDuration(dur)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.radioLabel}>{dur}</Text>
                    {/* Custom Radio Button on the far right exactly matching screenshot */}
                    {isChecked ? (
                      <View style={styles.customRadioChecked}>
                        <View style={styles.customRadioInner} />
                      </View>
                    ) : (
                      <View style={styles.customRadioUnchecked} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Distance Radius Card */}
          <View style={styles.durationCard}>
            <View style={styles.distanceHeader}>
              <Text style={styles.cardHeader}>DISTANCE</Text>
              <Text style={styles.distanceValue}>{distance}km</Text>
            </View>
            <View style={styles.sliderContainer}>
              <CustomSlider min={5} max={500} value={distance} onChange={setDistance} />
            </View>
            <Text style={styles.distanceSub}>
              Radius from your current location or selected city.
            </Text>
          </View>

          {/* Stacked Reset & Results Buttons perfectly matching the HTML and screenshot mobile layout */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resultsBtn}
              onPress={() => setViewResults(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.resultsBtnText}>Show {filteredResults.length} Results</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Results View Page */
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeaderRow}>
            <TouchableOpacity onPress={() => setViewResults(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#11694b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.resultsTitle}>Matching Results</Text>
              <Text style={styles.resultsSubtitle}>{filteredResults.length} experiences found</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#11694b" />
            </View>
          ) : (
            <FlatList
              data={filteredResults}
              keyExtractor={(item) => item._id}
              renderItem={renderExperienceItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="mountain" size={40} color="#6f7a73" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyText}>No experiences match your filters.</Text>
                  <TouchableOpacity onPress={handleReset}>
                    <Text style={styles.emptyLink}>Reset all filters</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7faf6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#f7faf6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190, 201, 193, 0.15)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  menuBtn: {
    padding: 4,
  },
  logo: {
    fontFamily: 'Quicksand',
    fontSize: 24,
    fontWeight: '700',
    color: '#11694b',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(17, 105, 75, 0.15)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  searchSection: {
    marginBottom: 28,
  },
  searchContainer: {
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Quicksand',
    fontSize: 16,
    color: '#181d1a',
    height: '100%',
    padding: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Quicksand',
    fontSize: 22,
    fontWeight: '700',
    color: '#181d1a',
    marginLeft: 8,
  },
  priceBadge: {
    backgroundColor: '#c2e8ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  priceBadgeText: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '700',
    color: '#005f7f',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ebefea',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    width: '46%',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  customCheckboxChecked: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#11694b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customCheckboxUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#bec9c1',
    backgroundColor: '#ffffff',
  },
  activityText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    fontWeight: '600',
    color: '#181d1a',
    flexShrink: 1,
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabel: {
    fontFamily: 'Quicksand',
    fontSize: 11,
    fontWeight: '600',
    color: '#6f7a73',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  difficultyChip: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bec9c1',
    backgroundColor: '#ffffff',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  difficultyChipActive: {
    backgroundColor: '#11694b',
    borderColor: '#11694b',
    ...Platform.select({
      ios: { shadowColor: '#11694b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  difficultyChipText: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    fontWeight: '600',
    color: '#6f7a73',
  },
  difficultyChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  durationCard: {
    backgroundColor: '#f1f4f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.3)',
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '700',
    color: '#6f7a73',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  radioList: {
    gap: 2,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  radioLabel: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    color: '#181d1a',
    fontWeight: '500',
  },
  customRadioChecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#11694b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#11694b',
  },
  customRadioUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bec9c1',
    backgroundColor: '#ffffff',
  },
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceValue: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    fontWeight: '700',
    color: '#11694b',
  },
  distanceSub: {
    fontFamily: 'Quicksand',
    fontSize: 11,
    color: '#6f7a73',
    marginTop: 8,
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 12,
  },
  resetBtn: {
    borderWidth: 2,
    borderColor: '#8f4645',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  resetBtnText: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    fontWeight: '700',
    color: '#8f4645',
  },
  resultsBtn: {
    backgroundColor: '#11694b',
    borderRadius: 24,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#11694b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 3 },
      web: { cursor: 'pointer' },
    }),
  },
  resultsBtnText: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  /* Results view styles */
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190, 201, 193, 0.2)',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ebefea',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  resultsTitle: {
    fontFamily: 'Quicksand',
    fontSize: 18,
    fontWeight: '700',
    color: '#181d1a',
  },
  resultsSubtitle: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: '#6f7a73',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 40,
  },
  resultsCard: {
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
      web: { cursor: 'pointer' },
    }),
  },
  cardImgContainer: {
    width: 110,
    height: 100,
    position: 'relative',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(17, 105, 75, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    fontWeight: '700',
    color: '#181d1a',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardMeta: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    color: '#6f7a73',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  cardPrice: {
    fontFamily: 'Quicksand',
    fontSize: 15,
    fontWeight: '700',
    color: '#11694b',
  },
  cardPriceSub: {
    fontFamily: 'Quicksand',
    fontSize: 11,
    color: '#6f7a73',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cardRating: {
    fontFamily: 'Quicksand',
    fontSize: 12,
    fontWeight: '700',
    color: '#181d1a',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Quicksand',
    fontSize: 14,
    color: '#6f7a73',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyLink: {
    fontFamily: 'Quicksand',
    fontSize: 13,
    color: '#11694b',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});