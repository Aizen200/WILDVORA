import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  ImageBackground, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { experienceAPI } from '../services/api';

const { width } = Dimensions.get('window');

const C = {
  primary:             '#11694b',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
  background:          '#f7faf6',
  surface:             '#f7faf6',
  surfaceContainer:    '#ebefea',
  surfaceContainerLow: '#f1f4f0',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
  tertiary:            '#8f4645',
  white:               '#ffffff',
};

const CATEGORIES = ['All Destinations', 'Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling'];

const HERO_URI = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi3QcaG2bLnRuOY0N1ZO5UUTXljceSVPVabyxaU8dRHnMjCr_Yy-JhlgjUZS9oTUZok8uSoCZOFnWIZPC3QFI5xHtPczzdsJ2ubLwDOJdCVPruhB1-9pZ290GEwUF0x_cu0jw_Gbayg7DS5qS_MQDRsNwTZj6fopGMybNuukchuoer2IaNPdbhagRYviTmnLFemqljAx-iJEMnFaH8SdoeYHIYExqOnnykhsyQDZ2olfKC6cD6j6sIAnByfJ88_tl8SMxmyYc2H1w';

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMxqmVZiEOLbS8iPmgbb6yZs6DOT2ueMpEqfGJceQT5UKb-vk8NYWZoAt-1MkZLPkvjsFtOReCDsVaBRG2KY5KP5LdT49c2FNnkGdDbeshfCbeECqk1lyKhgWaKU2qqSQj1pSjg3VQvAPEhnvArYc-0kRxN-egqoRdUN60Zei6Lxkitme_X-kKfjWYdpZLwNE3UQasoTRlT0cziDoDMIxVfscnKB10ZHEogVN5cDmdIQ9fXIkS0iIBlFS-U5ymQ8eXcWCBSG9l6Fg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwlcB3bQtzyJNOrLT4EsnoHFNw9cIRYARJ7T09kYY_AQYhYTBPp8P-JZ1ql_NGI3NiFwbW0OxMTzdUW5vwAyY6imbUS88XUUqVyZNLXi14OJIghFzuSgbwv5qfjjyyVCaE47qFk8AL4y2rHBjgcBC8hPxXywIJeN5COCXEVUbMkkAuD_IGQ55wzAfDXDnMLwC9CkmkVl3p7WXltYRzxGKBNefxfzmlLZ92u-XqtHzE41ZakGWrChYh9ccxbqDXnzVBfpvYA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJND2DExd4tGk_meQf3SbpfLq-GLxo93wvzwp56njlr4Zhn4mIK_MyF1Z7sluqq9Mi2IKVA2bcvfxz58GOOHUfxI0tC2SNuBns2UxkhTK2dN4Z3LeA_Imjnnlef1fIkh8ynlFgxxjQZOB8nAwINlP5KZ2PE8lE0qkpSRhKgfmcNLRCFW7JbXC6ibRsL2uQUODYToVddox-MKbxwD337hZnFdme4awUJgknShzN_lJl8Ei6IyPx0HZP4SxSeRVPj9Dy-BnIvySDt4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKQ_7zuwqBLhH-dTfmOPPDE8NQP5nYs1P8iv3gBb5kXzYakFrj6jj3IuBWARt0plEZ6JVJwfr3aRD6dcUmWeDu_Xmequ4XcTmd3CfCrXdrg5p3fJd0ussi8Xn1kNAMvifznmR7ikIce7hLec3PXFYeGmGdR2JOVjnPYbpIKKT9sZmO10AlAh_Gneo8I2vOWx2l3s0S0WnTj068m0aRhfZHBT7yG7oir8YPpGwXyAHaJsdAK44n5LCDlAN-OLUveDqBLeGbvLsxzZo',
];

function StarBadge({ rating }) {
  return (
    <View style={s.starBadge}>
      <MaterialCommunityIcons name="star" size={12} color={C.tertiary} />
      <Text style={s.starText}>{rating}</Text>
    </View>
  );
}

function FeaturedCard({ item, index, onPress, onWishlist }) {
  const imgUri = item.images?.[0] || CARD_IMAGES[index % CARD_IMAGES.length];
  return (
    <TouchableOpacity style={s.featCard} onPress={() => onPress(item)} activeOpacity={0.92}>
      <View style={s.featImgWrap}>
        <Image source={{ uri: imgUri }} style={s.featImg} resizeMode="cover" />
        <View style={s.featImgOverlay} />
        <TouchableOpacity style={s.wishBtn} onPress={() => onWishlist(item)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="heart-outline" size={18} color={C.white} />
        </TouchableOpacity>
      </View>
      <View style={s.featBody}>
        <View style={s.featTitleRow}>
          <Text style={s.featTitle} numberOfLines={1}>{item.title}</Text>
          <StarBadge rating={item.rating || '4.9'} />
        </View>
        <View style={s.featLocRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={C.onSurfaceVariant} />
          <Text style={s.featLoc} numberOfLines={1}>{item.location?.city}, {item.location?.country}</Text>
        </View>
        <View style={s.featFooter}>
          <Text style={s.featPrice}>
            <Text style={s.featPriceNum}>${item.price}</Text>
            <Text style={s.featPriceSub}> / {item.duration?.includes('day') ? 'day' : 'trip'}</Text>
          </Text>
          <TouchableOpacity onPress={() => onPress(item)}>
            <Text style={s.detailsLink}>DETAILS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TrendingItem({ item, index, onPress }) {
  const imgUri = item.images?.[0] || CARD_IMAGES[index % CARD_IMAGES.length];
  const isWater = item.category === 'Water Sports' || item.category === 'Cycling';
  const tagStyle = isWater
    ? { bg: '#d0ecf8', text: C.secondary }
    : { bg: '#fce8e6', text: C.tertiary };
  return (
    <TouchableOpacity style={s.trendItem} onPress={() => onPress(item)} activeOpacity={0.88}>
      <Image source={{ uri: imgUri }} style={s.trendImg} resizeMode="cover" />
      <View style={s.trendBody}>
        <View style={s.trendTopRow}>
          <View style={[s.trendTag, { backgroundColor: tagStyle.bg }]}>
            <Text style={[s.trendTagText, { color: tagStyle.text }]}>{item.category?.toUpperCase()}</Text>
          </View>
          <Text style={s.trendPrice}>${item.price}</Text>
        </View>
        <Text style={s.trendTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.trendMeta}>{item.duration} • {item.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All Destinations');
  const [featured, setFeatured]     = useState([]);
  const [trending, setTrending]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [featRes, trendRes] = await Promise.all([
        experienceAPI.getAll({ featured: true, limit: 6 }),
        experienceAPI.getAll({ trending: true, limit: 6 }),
      ]);
      setFeatured(featRes.data.experiences || []);
      setTrending(trendRes.data.experiences || []);
    } catch {
      try {
        await experienceAPI.seed();
        const [f, t] = await Promise.all([
          experienceAPI.getAll({ featured: true, limit: 6 }),
          experienceAPI.getAll({ trending: true, limit: 6 }),
        ]);
        setFeatured(f.data.experiences || []);
        setTrending(t.data.experiences || []);
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () =>
    navigation.navigate('Search', { initialSearch: search, initialCategory: category });

  const goToExperience = (item) =>
    navigation.navigate('ExperienceDetail', { experienceId: item._id });

  const handleWishlist = (item) =>
    navigation.navigate('ExperienceDetail', { experienceId: item._id });

  const filteredTrending = category === 'All Destinations'
    ? trending
    : trending.filter((e) => e.category === category);

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={C.primary} />
        }
      >
        {/* App bar */}
        <View style={s.appBar}>
          <View style={s.appBarLeft}>
            <MaterialCommunityIcons name="menu" size={24} color={C.onSurfaceVariant} />
            <Text style={s.appBarLogo}>Wildvora</Text>
          </View>
          <View style={s.appBarRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} style={s.appBarIconBtn}>
              <MaterialCommunityIcons name="magnify" size={22} color={C.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatar}>
              <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <ImageBackground source={{ uri: HERO_URI }} style={s.hero} resizeMode="cover">
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>Find your next{'\n'}adventure</Text>
            <View style={s.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color={C.primary} style={{ marginRight: 6 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Where do you want to go?"
                placeholderTextColor="#9aafa5"
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={s.exploreBtn} onPress={handleSearch}>
                <Text style={s.exploreBtnText}>Explore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Category chips */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips} style={s.chipsWrap}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[s.chip, active ? s.chipActive : s.chipInactive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, active ? s.chipTextActive : s.chipTextInactive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured */}
        {featured.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View>
                <Text style={s.sectionTitle}>Featured Experiences</Text>
                <Text style={s.sectionSub}>Handpicked adventures for the bold</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Search', { featured: true })}>
                <View style={s.viewAllRow}>
                  <Text style={s.viewAll}>View all</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={C.primary} />
                </View>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={(i) => i._id}
              renderItem={({ item, index }) => (
                <FeaturedCard item={item} index={index} onPress={goToExperience} onWishlist={handleWishlist} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.featList}
            />
          </View>
        )}

        {/* Trending + Pro */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Trending This Week</Text>
          <View style={s.trendGrid}>
            <View style={s.trendList}>
              {(filteredTrending.length > 0 ? filteredTrending : trending).slice(0, 4).map((item, i) => (
                <TrendingItem key={item._id} item={item} index={i} onPress={goToExperience} />
              ))}
              {filteredTrending.length === 0 && trending.length === 0 && (
                <View style={s.emptyBox}>
                  <Text style={s.emptyText}>No experiences yet. Pull to refresh.</Text>
                </View>
              )}
            </View>

            {/* Pro card */}
            <View style={s.proCard}>
              <MaterialCommunityIcons name="shield-star" size={52} color={C.primary} style={{ marginBottom: 10 }} />
              <Text style={s.proTitle}>Wildvora Pro</Text>
              <Text style={s.proBody}>
                Unlock exclusive access to hidden trails and professional local guides.
              </Text>
              <TouchableOpacity style={s.proBtn} activeOpacity={0.85}>
                <Text style={s.proBtnText}>Join The Club</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

  appBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.outlineVariant + '40' },
  appBarLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appBarLogo:     { fontSize: 20, fontWeight: '700', color: C.primary, letterSpacing: -0.3 },
  appBarRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appBarIconBtn:  { padding: 4 },
  avatar:         { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceContainer, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.primary + '30' },
  avatarText:     { fontSize: 14, fontWeight: '700', color: C.primary },

  hero:         { width: '100%', height: 340, justifyContent: 'flex-end' },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroContent:  { padding: 20, paddingBottom: 28 },
  heroTitle:    { fontSize: 36, fontWeight: '700', color: C.white, marginBottom: 18, lineHeight: 44, letterSpacing: -0.5, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },

  searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 50, paddingLeft: 14, paddingRight: 4, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8 },
  searchInput:    { flex: 1, fontSize: 14, color: C.onSurface, paddingVertical: 10 },
  exploreBtn:     { backgroundColor: C.primary, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10, marginLeft: 4 },
  exploreBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },

  chipsWrap: { backgroundColor: C.background },
  chips:     { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  chip:           { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50 },
  chipActive:     { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  chipInactive:   { backgroundColor: C.surfaceContainerLow, borderWidth: 1, borderColor: C.outlineVariant },
  chipText:           { fontSize: 13, fontWeight: '600' },
  chipTextActive:     { color: C.white },
  chipTextInactive:   { color: C.onSurfaceVariant },

  section:    { paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: C.onSurface, letterSpacing: -0.3 },
  sectionSub:   { fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 },
  viewAllRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll:      { fontSize: 13, fontWeight: '700', color: C.primary },

  featList:     { paddingLeft: 0, paddingRight: 12, paddingBottom: 4 },
  featCard:     { width: width * 0.72, marginRight: 16, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.outlineVariant + '50', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  featImgWrap:  { height: 200, position: 'relative' },
  featImg:      { width: '100%', height: '100%' },
  featImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  wishBtn:      { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  featBody:     { padding: 16 },
  featTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  featTitle:    { fontSize: 17, fontWeight: '700', color: C.onSurface, flex: 1, marginRight: 8 },
  starBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.surfaceContainer, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  starText:     { fontSize: 11, fontWeight: '700', color: C.onSurface },
  featLocRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  featLoc:      { fontSize: 13, color: C.onSurfaceVariant, flex: 1 },
  featFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: C.outlineVariant + '30', paddingTop: 12 },
  featPrice:    { fontSize: 14 },
  featPriceNum: { fontSize: 18, fontWeight: '700', color: C.primary },
  featPriceSub: { fontSize: 12, color: C.onSurfaceVariant, fontWeight: '400' },
  detailsLink:  { fontSize: 12, fontWeight: '700', color: C.primary, letterSpacing: 0.8 },

  trendGrid:  { gap: 12 },
  trendList:  { gap: 10 },
  trendItem:  { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.outlineVariant + '50', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  trendImg:   { width: 88, height: 88, borderRadius: 10 },
  trendBody:  { flex: 1, justifyContent: 'center', gap: 4 },
  trendTopRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendTag:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  trendTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  trendPrice: { fontSize: 14, fontWeight: '700', color: C.onSurfaceVariant },
  trendTitle: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  trendMeta:  { fontSize: 12, color: C.onSurfaceVariant },

  proCard:     { marginTop: 12, backgroundColor: C.primary + '18', borderRadius: 20, padding: 24, alignItems: 'center', overflow: 'hidden' },
  proTitle:    { fontSize: 22, fontWeight: '700', color: C.primary, marginBottom: 8 },
  proBody:     { fontSize: 14, color: C.onSurface + 'cc', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  proBtn:      { width: '100%', paddingVertical: 14, backgroundColor: C.primary, borderRadius: 50, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  proBtnText:  { color: C.white, fontWeight: '700', fontSize: 15 },

  emptyBox:  { padding: 24, backgroundColor: C.surfaceContainerLow, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  emptyText: { color: C.onSurfaceVariant, fontSize: 14 },
});