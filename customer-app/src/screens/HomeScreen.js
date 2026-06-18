import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  ImageBackground, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { experienceAPI, userAPI } from '../services/api';

const { width } = Dimensions.get('window');

const C = {
  primary:             '#1A5F45',
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

function FeaturedCard({ item, index, onPress, onWishlist, isWishlisted }) {
  const imgUri = item.coverImage || item.images?.[0] || CARD_IMAGES[index % CARD_IMAGES.length];
  return (
    <TouchableOpacity style={s.featCard} onPress={() => onPress(item)} activeOpacity={0.92}>
      <View style={s.featImgWrap}>
        <Image source={{ uri: imgUri }} style={s.featImg} resizeMode="cover" />
        <View style={s.featImgOverlay} />
        <TouchableOpacity style={s.wishBtn} onPress={() => onWishlist(item)} activeOpacity={0.8}>
          <MaterialCommunityIcons name={isWishlisted ? 'heart' : 'heart-outline'} size={18} color={isWishlisted ? '#ff6b6b' : C.white} />
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
            <Text style={s.featPriceNum}>₹{item.price}</Text>
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

function NewCard({ item, index, onPress }) {
  const imgUri = item.coverImage || item.images?.[0] || CARD_IMAGES[index % CARD_IMAGES.length];
  return (
    <TouchableOpacity style={s.newCard} onPress={() => onPress(item)} activeOpacity={0.9}>
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: imgUri }} style={s.newImg} resizeMode="cover" />
        <View style={s.newBadge}>
          <Text style={s.newBadgeText}>NEW</Text>
        </View>
      </View>
      <View style={s.newBody}>
        <Text style={s.newTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.newLoc}>{item.location?.city || 'India'}</Text>
        <Text style={s.newPrice}>₹{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

function TrendingItem({ item, index, onPress }) {
  const imgUri = item.coverImage || item.images?.[0] || CARD_IMAGES[index % CARD_IMAGES.length];
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
          <Text style={s.trendPrice}>₹{item.price}</Text>
        </View>
        <Text style={s.trendTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.trendMeta}>{item.duration} • {item.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [search, setSearch]               = useState('');
  const [category, setCategory]           = useState('All Destinations');
  const [featured, setFeatured]           = useState([]);
  const [allExperiences, setAllExperiences] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [wishlistIds, setWishlistIds]     = useState(() => {
    const ids = user?.wishlist?.map(w => w._id || w) || [];
    return new Set(ids);
  });


  const fetchData = useCallback(async () => {
    try {
      const [featRes, allRes] = await Promise.all([
        experienceAPI.getAll({ featured: true, limit: 6 }),
        experienceAPI.getAll({ limit: 20 }),
      ]);
      setFeatured(featRes.data.experiences || []);
      setAllExperiences(allRes.data.experiences || []);
    } catch {
      setFeatured([]);
      setAllExperiences([]);
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

  const handleWishlist = async (item) => {
    try {
      await userAPI.toggleWishlist(item._id);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.has(item._id) ? next.delete(item._id) : next.add(item._id);
        return next;
      });
    } catch {
      // silently fail — user can try again
    }
  };

  const filteredAll = category === 'All Destinations'
    ? allExperiences
    : allExperiences.filter((e) => e.category === category);

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
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
              ) : (
                <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
              )}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsWrap}>
          <View style={s.chips}>
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
          </View>
        </ScrollView>

        {/* Empty state — no approved adventures yet */}
        {featured.length === 0 && allExperiences.length === 0 && (
          <View style={s.noAdventuresBox}>
            <MaterialCommunityIcons name="compass-off-outline" size={48} color={C.outlineVariant} />
            <Text style={s.noAdventuresTitle}>No adventures available yet</Text>
            <Text style={s.noAdventuresSub}>
              Check back soon — new experiences are being reviewed and will appear here once approved.
            </Text>
          </View>
        )}

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
                <FeaturedCard item={item} index={index} onPress={goToExperience} onWishlist={handleWishlist} isWishlisted={wishlistIds.has(item._id)} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.featList}
            />
          </View>
        )}

        {/* New on Wildvora */}
        {allExperiences.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View>
                <Text style={s.sectionTitle}>New on Wildvora</Text>
                <Text style={s.sectionSub}>Fresh off-concrete wilderness trails</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={allExperiences.slice(0, 6)}
              keyExtractor={(i) => 'new-' + i._id}
              renderItem={({ item, index }) => (
                <NewCard item={item} index={index} onPress={goToExperience} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.newList}
            />
          </View>
        )}

        {/* Experiences — filtered by active category */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <View>
              <Text style={s.sectionTitle}>
                {category === 'All Destinations' ? 'All Experiences' : category}
              </Text>
              <Text style={s.sectionSub}>
                {category === 'All Destinations'
                  ? 'Every approved adventure on Wildvora'
                  : `Live ${category.toLowerCase()} experiences`}
              </Text>
            </View>
            {category !== 'All Destinations' && (
              <TouchableOpacity onPress={() => setCategory('All Destinations')}>
                <Text style={s.clearFilter}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          {filteredAll.length > 0 ? (
            <View style={s.trendList}>
              {filteredAll.map((item, i) => (
                <TrendingItem key={'cat-' + item._id} item={item} index={i} onPress={goToExperience} />
              ))}
            </View>
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="compass-off-outline" size={32} color={C.outlineVariant} />
              <Text style={s.emptyText}>
                {allExperiences.length === 0
                  ? 'No experiences yet. Pull to refresh.'
                  : `No ${category.toLowerCase()} experiences available yet.`}
              </Text>
            </View>
          )}
        </View>

        {/* Safety & Prep Guides */}
        <View style={s.section}>
          <View style={{ marginBottom: 10 }}>
            <Text style={s.sectionTitle}>Safety & Prep Guides</Text>
            <Text style={s.sectionSub}>Mandatory guidelines for outdoor experiences</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.safetyList}>
            {[
              { title: 'High-Altitude AMS', icon: 'mountain', color: '#1A5F45', desc: 'Acclimatization & AMS' },
              { title: 'River Rafting Grades', icon: 'water', color: '#0a6687', desc: 'Understanding rapids' },
              { title: 'Jungle Code of Conduct', icon: 'tree', color: '#8f4645', desc: 'Wildlife safety rules' }
            ].map((guide, idx) => (
              <TouchableOpacity key={idx} style={s.safetyCard} activeOpacity={0.8}>
                <View style={[s.safetyIconBg, { backgroundColor: guide.color + '15' }]}>
                  <MaterialCommunityIcons name={guide.icon} size={20} color={guide.color} />
                </View>
                <Text style={s.safetyTitle}>{guide.title}</Text>
                <Text style={s.safetyDesc}>{guide.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Floating AI chat bubble */}
      <TouchableOpacity
        style={s.aiFab}
        onPress={() => navigation.navigate('AIChat')}
        activeOpacity={0.88}
      >
        <MaterialCommunityIcons name="robot" size={24} color={C.white} />
      </TouchableOpacity>
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

  chipsWrap: { backgroundColor: C.background, height: 60 },
  chips:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  chip:           { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, marginRight: 10 },
  chipActive:     { backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  chipInactive:   { backgroundColor: C.surfaceContainerLow, borderWidth: 1, borderColor: C.outlineVariant },
  chipText:           { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  chipTextActive:     { color: '#ffffff' },
  chipTextInactive:   { color: '#1a1a1a' },

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

  emptyBox:  { padding: 24, backgroundColor: C.surfaceContainerLow, borderRadius: 12, alignItems: 'center', marginTop: 8, gap: 8 },
  emptyText: { color: C.onSurfaceVariant, fontSize: 14, textAlign: 'center' },

  clearFilter: { fontSize: 13, fontWeight: '700', color: C.primary },

  aiFab: {
    position: 'absolute',
    bottom: 22,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  noAdventuresBox: {
    margin: 20, marginTop: 8, padding: 32,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 20, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: C.outlineVariant + '40',
  },
  noAdventuresTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, textAlign: 'center' },
  noAdventuresSub:   { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },

  /* New on Wildvora */
  newList:      { paddingLeft: 0, paddingRight: 12, paddingBottom: 4 },
  newCard:      { width: 140, marginRight: 12, backgroundColor: C.white, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.outlineVariant + '40' },
  newImg:       { width: '100%', height: 90 },
  newBadge:     { position: 'absolute', top: 6, left: 6, backgroundColor: '#1A5F45', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newBadgeText: { fontSize: 8, fontWeight: '800', color: C.white },
  newBody:      { padding: 8 },
  newTitle:     { fontSize: 12, fontWeight: '700', color: C.onSurface },
  newLoc:       { fontSize: 10, color: C.onSurfaceVariant, marginTop: 2 },
  newPrice:     { fontSize: 11, fontWeight: '700', color: C.primary, marginTop: 4 },

  /* Safety & Prep Guides */
  safetyList:   { gap: 12, paddingVertical: 10 },
  safetyCard:   { width: 150, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.outlineVariant + '40', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  safetyIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  safetyTitle:  { fontSize: 12, fontWeight: '700', color: C.onSurface, lineHeight: 16 },
  safetyDesc:   { fontSize: 10, color: C.onSurfaceVariant, marginTop: 2 },

});