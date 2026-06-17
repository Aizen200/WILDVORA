import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { experienceAPI } from '../services/api';

// ── Custom slider ─────────────────────────────────────────────────────────────
function CustomSlider({ min, max, value, onChange }) {
  const [trackWidth, setTrackWidth] = useState(280);
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const handleTouch = (e) => {
    const x = e.nativeEvent.locationX;
    const p = Math.max(0, Math.min(1, x / trackWidth));
    onChange(Math.round(min + p * (max - min)));
  };

  return (
    <View style={sl.wrap} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
      <TouchableOpacity activeOpacity={1} onPress={handleTouch} style={sl.hit}>
        <View style={sl.track}>
          <View style={[sl.fill, { width: `${pct}%` }]} />
          <View style={[sl.thumb, { left: `${pct}%`, marginLeft: -10 }]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
const sl = StyleSheet.create({
  wrap:  { width: '100%', height: 30, justifyContent: 'center' },
  hit:   { height: 24, justifyContent: 'center', width: '100%' },
  track: { height: 4, backgroundColor: '#bec9c1', borderRadius: 2, width: '100%', position: 'relative' },
  fill:  { height: 4, backgroundColor: '#bec9c1', borderRadius: 2, position: 'absolute', left: 0, top: 0 },
  thumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#1A5F45',
    position: 'absolute', top: -9,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },
});

// ── Category images ───────────────────────────────────────────────────────────
const CAT_IMAGES = {
  Trekking:      'https://images.unsplash.com/photo-1551632811-561730d1e4a6?auto=format&fit=crop&w=400&q=80',
  Camping:       'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80',
  'Water Sports':'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=400&q=80',
  Jungle:        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
  Cycling:       'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
  Climbing:      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=400&q=80',
  Safari:        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=400&q=80',
  Skiing:        'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?auto=format&fit=crop&w=400&q=80',
};

export default function FilterScreen({ navigation }) {
  const { user } = useAuth();

  const [search, setSearch]         = useState('');
  const [activities, setActivities] = useState({
    'Mountain Trekking': true, 'Coastal Kayaking': false,
    'Forest Survival': false,  'Rock Climbing': false,
    'Alpine Skiing': false,    'Wildlife Safari': false,
  });
  const [price, setPrice]       = useState(1500);
  const [difficulty, setDifficulty] = useState('Moderate');
  const [duration, setDuration] = useState('2-3 days');
  const [distance, setDistance] = useState(50);

  const [allResults, setAllResults]           = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [viewResults, setViewResults] = useState(false);

  const categoryMap = {
    Trekking: 'Mountain Trekking', 'Water Sports': 'Coastal Kayaking',
    Camping: 'Forest Survival',    Jungle: 'Forest Survival',
    Climbing: 'Rock Climbing',     Skiing: 'Alpine Skiing',
    Safari: 'Wildlife Safari',
  };

  // ── Logic unchanged ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await experienceAPI.getAll({});
      setAllResults(res.data.experiences || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    let temp = [...allResults];
    if (search.trim()) {
      const s = search.toLowerCase();
      temp = temp.filter(i =>
        i.title?.toLowerCase().includes(s) ||
        i.location?.city?.toLowerCase().includes(s) ||
        i.category?.toLowerCase().includes(s)
      );
    }
    const active = Object.keys(activities).filter(k => activities[k]);
    if (active.length > 0) {
      temp = temp.filter(i => {
        const n = categoryMap[i.category];
        return n ? activities[n] : false;
      });
    }
    temp = temp.filter(i => i.price <= price);
    if (difficulty && difficulty !== 'All') temp = temp.filter(i => i.difficulty === difficulty);
    if (duration === '1 day')     temp = temp.filter(i => i.duration?.toLowerCase().includes('1 day'));
    else if (duration === '2-3 days') temp = temp.filter(i => i.duration?.toLowerCase().includes('2 day') || i.duration?.toLowerCase().includes('3 day') || i.duration?.toLowerCase().includes('2-3'));
    else if (duration === '1 week+')  temp = temp.filter(i => i.duration?.toLowerCase().includes('week') || parseInt(i.duration) >= 7);
    setFilteredResults(temp);
  }, [allResults, search, activities, price, difficulty, duration, distance]);

  const toggleActivity = (act) => setActivities(prev => ({ ...prev, [act]: !prev[act] }));

  const handleReset = () => {
    setSearch(''); setPrice(5000); setDifficulty('Moderate');
    setDuration('2-3 days'); setDistance(50); setViewResults(false);
    setActivities({ 'Mountain Trekking': false, 'Coastal Kayaking': false, 'Forest Survival': false, 'Rock Climbing': false, 'Alpine Skiing': false, 'Wildlife Safari': false });
  };
  // ─────────────────────────────────────────────────────────────────────────

  const renderResult = ({ item }) => {
    const imgUri = CAT_IMAGES[item.category] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80';
    return (
      <TouchableOpacity
        style={s.resultCard}
        onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item._id })}
        activeOpacity={0.9}
      >
        <View style={s.resultImgWrap}>
          <Image source={{ uri: imgUri }} style={s.resultImg} />
          <View style={s.catBadge}><Text style={s.catBadgeText}>{item.category}</Text></View>
        </View>
        <View style={s.resultBody}>
          <Text style={s.resultTitle} numberOfLines={1}>{item.title}</Text>
          <View style={s.resultMetaRow}>
            <Ionicons name="location-outline" size={13} color="#6f7a73" />
            <Text style={s.resultMeta}>{item.location?.city}, {item.location?.country}</Text>
          </View>
          <View style={s.resultFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 1 }}>
              <Text style={s.resultPrice}>₹{item.price}</Text>
              <Text style={s.resultPriceSub}>/person</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="star" size={13} color="#1A5F45" />
              <Text style={s.resultRating}>{item.rating || '4.9'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── App bar ── */}
      <View style={s.appBar}>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="menu-outline" size={24} color="#1A5F45" />
        </TouchableOpacity>
        <Text style={s.appBarLogo}>Wildvora</Text>
        <View style={s.avatarCircle}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%', borderRadius: 19 }} />
          ) : (
            <Text style={s.avatarInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          )}
        </View>
      </View>

      {!viewResults ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Search */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={20} color="#1A5F45" style={{ marginRight: 10 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Where to next?"
              placeholderTextColor="#6f7a73"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* ── Activity Type ── */}
          <View style={s.secRow}>
            <MaterialCommunityIcons name="hiking" size={24} color="#1A5F45" />
            <Text style={s.secTitle}>Activity Type</Text>
          </View>
          <View style={s.actGrid}>
            {Object.keys(activities).map((act) => (
              <TouchableOpacity
                key={act}
                style={s.actCard}
                onPress={() => toggleActivity(act)}
                activeOpacity={0.8}
              >
                {activities[act]
                  ? <View style={s.cbChecked}><MaterialIcons name="check" size={13} color="#fff" /></View>
                  : <View style={s.cbUnchecked} />
                }
                <Text style={s.actText}>{act}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Price Range ── */}
          <View style={[s.secRow, { marginTop: 28 }]}>
            <MaterialIcons name="payments" size={24} color="#1A5F45" />
            <Text style={s.secTitle}>Price Range</Text>
            <View style={s.priceBadge}>
              <Text style={s.priceBadgeText}>₹200 – ₹{price.toLocaleString()}</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 4, marginBottom: 28 }}>
            <CustomSlider min={0} max={5000} value={price} onChange={setPrice} />
            <View style={s.sliderLabels}>
              <Text style={s.sliderLabel}>₹0</Text>
              <Text style={s.sliderLabel}>₹5,000+</Text>
            </View>
          </View>

          {/* ── Difficulty ── */}
          <View style={s.secRow}>
            <MaterialIcons name="signal-cellular-alt" size={24} color="#1A5F45" />
            <Text style={s.secTitle}>Difficulty Level</Text>
          </View>
          <View style={s.chipsRow}>
            {['Easy', 'Moderate', 'Hard', 'Expert'].map((lvl) => {
              const active = difficulty === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setDifficulty(lvl)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Duration ── */}
          <View style={[s.infoCard, { marginTop: 28 }]}>
            <Text style={s.infoCardLabel}>DURATION</Text>
            {['1 day', '2-3 days', '1 week+'].map((dur) => {
              const checked = duration === dur;
              return (
                <TouchableOpacity key={dur} style={s.radioRow} onPress={() => setDuration(dur)} activeOpacity={0.8}>
                  <Text style={s.radioText}>{dur}</Text>
                  {checked
                    ? <View style={s.radioOn}><View style={s.radioInner} /></View>
                    : <View style={s.radioOff} />
                  }
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Distance ── */}
          <View style={s.infoCard}>
            <View style={s.distHdr}>
              <Text style={s.infoCardLabel}>DISTANCE</Text>
              <Text style={s.distValue}>{distance}km</Text>
            </View>
            <CustomSlider min={5} max={500} value={distance} onChange={setDistance} />
            <Text style={s.distSub}>Radius from your current location or selected city.</Text>
          </View>

          {/* ── Actions ── */}
          <View style={s.actions}>
            <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={s.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.showBtn} onPress={() => setViewResults(true)} activeOpacity={0.88}>
              <Text style={s.showText}>Show {filteredResults.length} Results</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      ) : (
        /* ── Results view ── */
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={s.resultsHdr}>
            <TouchableOpacity style={s.backCircle} onPress={() => setViewResults(false)}>
              <Ionicons name="arrow-back" size={22} color="#1A5F45" />
            </TouchableOpacity>
            <View>
              <Text style={s.resultsTitle}>Matching Results</Text>
              <Text style={s.resultsSub}>{filteredResults.length} experiences found</Text>
            </View>
          </View>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1A5F45" />
            </View>
          ) : (
            <FlatList
              data={filteredResults}
              keyExtractor={(i) => i._id}
              renderItem={renderResult}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.emptyBox}>
                  <MaterialCommunityIcons name="image-filter-hdr" size={40} color="#bec9c1" style={{ marginBottom: 12 }} />
                  <Text style={s.emptyText}>No experiences match your filters.</Text>
                  <TouchableOpacity onPress={handleReset}>
                    <Text style={s.emptyLink}>Reset all filters</Text>
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7faf6' },

  /* App bar */
  appBar: {
    height: 60,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f7faf6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190,201,193,0.2)',
  },
  appBarLogo:    { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#1A5F45' },
  avatarCircle:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ebefea', borderWidth: 2, borderColor: 'rgba(17,105,75,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 15, fontWeight: '700', color: '#1A5F45' },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  /* Search */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 50, backgroundColor: '#fff',
    borderRadius: 25, borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.6)',
    paddingHorizontal: 16, marginBottom: 28,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#181d1a', padding: 0 },

  /* Section header row — icon LEFT of title, tight together */
  secRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  secTitle: { fontSize: 20, fontWeight: '700', color: '#181d1a' },

  /* Price badge sits after secTitle via marginLeft: 'auto' */
  priceBadge: { marginLeft: 'auto', backgroundColor: '#c2e8ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  priceBadgeText: { fontSize: 12, fontWeight: '700', color: '#005f7f' },

  /* Activity grid */
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ebefea', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    width: '47%',
  },
  cbChecked:   { width: 20, height: 20, borderRadius: 4, backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cbUnchecked: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#bec9c1', backgroundColor: '#fff', flexShrink: 0 },
  actText:     { fontSize: 13, fontWeight: '600', color: '#181d1a', flexShrink: 1 },

  /* Slider labels */
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabel:  { fontSize: 11, fontWeight: '600', color: '#6f7a73' },

  /* Difficulty chips */
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 0 },
  chip:     { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 50, borderWidth: 1.5, borderColor: '#bec9c1', backgroundColor: '#fff' },
  chipActive: {
    backgroundColor: '#1A5F45', borderColor: '#1A5F45',
    ...Platform.select({ ios: { shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }, android: { elevation: 2 } }),
  },
  chipText:       { fontSize: 13, fontWeight: '600', color: '#6f7a73' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  /* Info cards (duration / distance) */
  infoCard: {
    backgroundColor: '#f1f4f0', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(190,201,193,0.3)',
    padding: 16, marginBottom: 16,
  },
  infoCardLabel: { fontSize: 11, fontWeight: '700', color: '#6f7a73', letterSpacing: 1.2, marginBottom: 10 },
  radioRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  radioText:     { fontSize: 15, color: '#181d1a', fontWeight: '500' },
  radioOn:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  radioInner:    { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A5F45' },
  radioOff:      { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#bec9c1', backgroundColor: '#fff' },
  distHdr:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  distValue:     { fontSize: 13, fontWeight: '700', color: '#1A5F45' },
  distSub:       { fontSize: 11, color: '#6f7a73', marginTop: 8, lineHeight: 16 },

  /* Action buttons */
  actions:   { gap: 12, marginTop: 8 },
  resetBtn:  { borderWidth: 2, borderColor: '#8f4645', borderRadius: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  resetText: { fontSize: 15, fontWeight: '700', color: '#8f4645' },
  showBtn:   {
    backgroundColor: '#1A5F45', borderRadius: 50, height: 50,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    ...Platform.select({ ios: { shadowColor: '#1A5F45', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 4 } }),
  },
  showText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* Results */
  resultsHdr:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(190,201,193,0.2)', marginBottom: 14 },
  backCircle:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ebefea', justifyContent: 'center', alignItems: 'center' },
  resultsTitle: { fontSize: 17, fontWeight: '700', color: '#181d1a' },
  resultsSub:   { fontSize: 12, color: '#6f7a73' },
  resultCard:   { flexDirection: 'row', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(190,201,193,0.2)', borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }) },
  resultImgWrap:{ width: 100, height: 92, position: 'relative' },
  resultImg:    { width: '100%', height: '100%', resizeMode: 'cover' },
  catBadge:     { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(17,105,75,0.85)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  catBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  resultBody:   { flex: 1, padding: 10, justifyContent: 'center' },
  resultTitle:  { fontSize: 14, fontWeight: '700', color: '#181d1a', marginBottom: 4 },
  resultMetaRow:{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 7 },
  resultMeta:   { fontSize: 11, color: '#6f7a73' },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultPrice:  { fontSize: 14, fontWeight: '700', color: '#1A5F45' },
  resultPriceSub:{ fontSize: 10, color: '#6f7a73' },
  resultRating: { fontSize: 11, fontWeight: '700', color: '#181d1a' },

  emptyBox:  { alignItems: 'center', paddingTop: 70 },
  emptyText: { fontSize: 14, color: '#6f7a73', marginBottom: 8, fontWeight: '600' },
  emptyLink: { fontSize: 13, color: '#1A5F45', fontWeight: '700', textDecorationLine: 'underline' },
});