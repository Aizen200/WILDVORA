import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  ImageBackground, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { experienceAPI, userAPI } from '../services/api';
import { getRecentlyViewed } from '../utils/recentlyViewed';

const { width } = Dimensions.get('window');

const C = {
  primary:          '#1A5F45',
  background:       '#F8F8F8',
  surface:          '#FFFFFF',
  surfaceVariant:   '#F1F5F2',
  onSurface:        '#111827',
  onSurfaceVariant: '#6B7280',
  outlineVariant:   '#E5E7EB',
  tertiary:         '#8f4645',
  amber:            '#b45309',
  blue:             '#0a6687',
  purple:           '#6d28d9',
  white:            '#FFFFFF',
};

const CATEGORIES = [
  { key: 'All',          label: 'All',          icon: 'compass-outline' },
  { key: 'Trekking',     label: 'Trekking',     icon: 'hiking' },
  { key: 'Camping',      label: 'Camping',      icon: 'tent' },
  { key: 'Water Sports', label: 'Water Sports', icon: 'wave' },
  { key: 'Jungle',       label: 'Jungle',       icon: 'tree' },
  { key: 'Cycling',      label: 'Cycling',      icon: 'bicycle' },
];

const INTEREST_FILTERS = [
  { key: 'verified',       label: 'Verified',        sub: 'Operator-verified experiences',  icon: 'shield-check-outline',  color: C.primary },
  { key: 'top_rated',      label: 'Top Rated',       sub: 'Rated 4.5 and above',            icon: 'star-outline',          color: C.amber },
  { key: 'budget',         label: 'Budget Friendly', sub: 'Under ₹3,000 per trip',          icon: 'tag-outline',           color: C.blue },
  { key: 'women_friendly', label: 'Women Friendly',  sub: 'Curated for groups of women',    icon: 'account-group-outline', color: C.purple },
];

const HERO_IMAGE = require('../../assets/heroimage.png');

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMxqmVZiEOLbS8iPmgbb6yZs6DOT2ueMpEqfGJceQT5UKb-vk8NYWZoAt-1MkZLPkvjsFtOReCDsVaBRG2KY5KP5LdT49c2FNnkGdDbeshfCbeECqk1lyKhgWaKU2qqSQj1pSjg3VQvAPEhnvArYc-0kRxN-egqoRdUN60Zei6Lxkitme_X-kKfjWYdpZLwNE3UQasoTRlT0cziDoDMIxVfscnKB10ZHEogVN5cDmdIQ9fXIkS0iIBlFS-U5ymQ8eXcWCBSG9l6Fg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwlcB3bQtzyJNOrLT4EsnoHFNw9cIRYARJ7T09kYY_AQYhYTBPp8P-JZ1ql_NGI3NiFwbW0OxMTzdUW5vwAyY6imbUS88XUUqVyZNLXi14OJIghFzuSgbwv5qfjjyyVCaE47qFk8AL4y2rHBjgcBC8hPxXywIJeN5COCXEVUbMkkAuD_IGQ55wzAfDXDnMLwC9CkmkVl3p7WXltYRzxGKBNefxfzmlLZ92u-XqtHzE41ZakGWrChYh9ccxbqDXnzVBfpvYA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJND2DExd4tGk_meQf3SbpfLq-GLxo93wvzwp56njlr4Zhn4mIK_MyF1Z7sluqq9Mi2IKVA2bcvfxz58GOOHUfxI0tC2SNuBns2UxkhTK2dN4Z3LeA_Imjnnlef1fIkh8ynlFgxxjQZOB8nAwINlP5KZ2PE8lE0qkpSRhKgfmcNLRCFW7JbXC6ibRsL2uQUODYToVddox-MKbxwD337hZnFdme4awUJgknShzN_lJl8Ei6IyPx0HZP4SxSeRVPj9Dy-BnIvySDt4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKQ_7zuwqBLhH-dTfmOPPDE8NQP5nYs1P8iv3gBb5kXzYakFrj6jj3IuBWARt0plEZ6JVJwfr3aRD6dcUmWeDu_Xmequ4XcTmd3CfCrXdrg5p3fJd0ussi8Xn1kNAMvifznmR7ikIce7hLec3PXFYeGmGdR2JOVjnPYbpIKKT9sZmO10AlAh_Gneo8I2vOWx2l3s0S0WnTj068m0aRhfZHBT7yG7oir8YPpGwXyAHaJsdAK44n5LCDlAN-OLUveDqBLeGbvLsxzZo',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCardImage(item, index) {
  const [imgError, setImgError] = useState(false);
  const fallback = CARD_IMAGES[index % CARD_IMAGES.length];
  const uri = (!imgError && (item.coverImage || item.images?.[0])) || fallback;
  return { uri, onError: () => setImgError(true) };
}

function StarRow({ rating, reviewCount, size = 12 }) {
  const num = parseFloat(rating || 4.9);
  return (
    <View style={s.starRow}>
      <MaterialCommunityIcons name="star" size={size} color="#d97706" />
      <Text style={s.starNum}>{num.toFixed(1)}</Text>
      {reviewCount > 0 && (
        <>
          <Text style={s.starDot}>·</Text>
          <Text style={s.starReviews}>{reviewCount} reviews</Text>
        </>
      )}
    </View>
  );
}

function VerifiedBadge({ small = false }) {
  return (
    <View style={[s.verifiedBadge, small && s.verifiedBadgeSmall]}>
      <MaterialCommunityIcons name="shield-check" size={small ? 10 : 11} color={C.primary} />
      {!small && <Text style={s.verifiedText}>Verified Operator</Text>}
    </View>
  );
}

function DurationPill({ duration }) {
  if (!duration) return null;
  return (
    <View style={s.durationPill}>
      <MaterialCommunityIcons name="clock-outline" size={10} color={C.onSurfaceVariant} />
      <Text style={s.durationText}>{duration}</Text>
    </View>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function FeaturedCard({ item, index, onPress, onWishlist, isWishlisted }) {
  const img      = useCardImage(item, index);
  const verified = item.isVerified || item.operator?.isVerified;
  return (
    <TouchableOpacity style={s.featCard} onPress={() => onPress(item)} activeOpacity={0.93}>
      {/* Image */}
      <View style={s.featImgWrap}>
        <Image source={{ uri: img.uri }} style={s.featImg} resizeMode="cover" onError={img.onError} />
        <View style={s.featGradient} />
        <TouchableOpacity style={s.wishBtn} onPress={() => onWishlist(item)} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={16}
            color={isWishlisted ? '#ef4444' : C.white}
          />
        </TouchableOpacity>
        {/* Overlay: category + title + location */}
        <View style={s.featOverlayContent}>
          {item.category && (
            <View style={s.featCatBadge}>
              <Text style={s.featCatText}>{item.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={s.featOverlayTitle} numberOfLines={2}>{item.title}</Text>
          <View style={s.featOverlayRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={11} color="rgba(255,255,255,0.8)" />
            <Text style={s.featOverlayLoc}>{item.location?.city}, {item.location?.country}</Text>
          </View>
        </View>
      </View>

      {/* Info bar */}
      <View style={s.featInfo}>
        <View style={s.featInfoLeft}>
          <StarRow rating={item.rating} reviewCount={item.reviewCount} />
          {verified && <VerifiedBadge />}
        </View>
        <DurationPill duration={item.duration} />
      </View>

      {/* Price + CTA */}
      <View style={s.featFooter}>
        <View>
          <Text style={s.featPriceNum}>
            ₹{item.price}
            <Text style={s.featPriceSub}> / {item.duration?.toLowerCase().includes('day') ? 'day' : 'trip'}</Text>
          </Text>
        </View>
        <TouchableOpacity style={s.bookBtn} onPress={() => onPress(item)}>
          <Text style={s.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function TrendingCard({ item, index, onPress }) {
  const img      = useCardImage(item, index);
  const verified = item.isVerified || item.operator?.isVerified;
  return (
    <TouchableOpacity style={s.trendCard} onPress={() => onPress(item)} activeOpacity={0.9}>
      <Image source={{ uri: img.uri }} style={s.trendImg} resizeMode="cover" onError={img.onError} />
      <View style={s.trendBody}>
        <Text style={s.trendTitle} numberOfLines={2}>{item.title}</Text>
        <View style={s.trendMetaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={10} color={C.onSurfaceVariant} />
          <Text style={s.trendLoc} numberOfLines={1}>
            {item.location?.city || 'India'}{item.duration ? `  ·  ${item.duration}` : ''}
          </Text>
        </View>
        <StarRow rating={item.rating} reviewCount={item.reviewCount} size={11} />
        <View style={s.trendBottom}>
          <Text style={s.trendPrice}>₹{item.price}</Text>
          {verified && <VerifiedBadge small />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ExperienceRow({ item, index, onPress }) {
  const img      = useCardImage(item, index);
  const verified = item.isVerified || item.operator?.isVerified;
  return (
    <TouchableOpacity style={s.rowCard} onPress={() => onPress(item)} activeOpacity={0.88}>
      <Image source={{ uri: img.uri }} style={s.rowImg} resizeMode="cover" onError={img.onError} />
      <View style={s.rowBody}>
        {item.category && <Text style={s.rowCat}>{item.category}</Text>}
        <Text style={s.rowTitle} numberOfLines={2}>{item.title}</Text>
        <View style={s.rowMetaRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={11} color={C.onSurfaceVariant} />
          <Text style={s.rowLoc}>{item.location?.city || 'India'}</Text>
          {item.duration ? <Text style={s.rowDot}>·</Text> : null}
          {item.duration ? <Text style={s.rowDur}>{item.duration}</Text> : null}
        </View>
        <StarRow rating={item.rating} reviewCount={item.reviewCount} />
        <View style={s.rowFooter}>
          <View>
            <Text style={s.rowPrice}>₹{item.price}</Text>
            <Text style={s.rowPriceSub}>per {item.duration?.toLowerCase().includes('day') ? 'day' : 'trip'}</Text>
          </View>
          {verified && <VerifiedBadge small />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [search, setSearch]                 = useState('');
  const [category, setCategory]             = useState('All');
  const [activeFilter, setActiveFilter]     = useState(null);
  const [featured, setFeatured]             = useState([]);
  const [allExperiences, setAllExperiences] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [wishlistIds, setWishlistIds]       = useState(() => new Set(
    user?.wishlist?.map(w => w._id || w) || []
  ));
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyViewed().then(setRecentlyViewed);
    }, [])
  );

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

  const goToExperience = item => navigation.navigate('ExperienceDetail', { experienceId: item._id });
  const handleSearch   = () => navigation.navigate('Search', { initialSearch: search });

  const handleWishlist = async (item) => {
    try {
      await userAPI.toggleWishlist(item._id);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.has(item._id) ? next.delete(item._id) : next.add(item._id);
        return next;
      });
    } catch {}
  };

  const baseList = category === 'All'
    ? allExperiences
    : allExperiences.filter(e => e.category === category);

  const filteredList = (() => {
    if (!activeFilter) return baseList;
    switch (activeFilter) {
      case 'verified':       return baseList.filter(e => e.operator?.isVerified || e.isVerified);
      case 'top_rated':      return baseList.filter(e => parseFloat(e.rating || 0) >= 4.5);
      case 'budget':         return baseList.filter(e => parseFloat(e.price) < 3000);
      case 'women_friendly': return baseList.filter(e => e.tags?.includes('Women Friendly') || e.womenFriendly);
      default:               return baseList;
    }
  })();

  const trendingItems  = allExperiences.slice(0, 5);
  const activeInterest = INTEREST_FILTERS.find(f => f.key === activeFilter);

  const scrollViewRef      = useRef(null);
  const adventuresSectionY = useRef(0);

  const scrollToAdventures = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: adventuresSectionY.current - 16, animated: true });
    }, 60);
  };

  const handleCategoryChange = (key) => {
    setCategory(key);
    if (key !== 'All') scrollToAdventures();
  };

  const handleInterestChange = (key) => {
    const next = activeFilter === key ? null : key;
    setActiveFilter(next);
    if (next) scrollToAdventures();
  };

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
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={C.primary}
          />
        }
      >
        {/* ── App bar ── */}
        <View style={s.appBar}>
          <Text style={s.appBarLogo}>Wildvora</Text>
          <View style={s.appBarRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')} style={s.iconBtn}>
              <MaterialCommunityIcons name="magnify" size={22} color={C.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.avatar}>
              {user?.avatar
                ? <Image source={{ uri: user.avatar }} style={s.avatarImg} />
                : <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero ── */}
        <ImageBackground source={HERO_IMAGE} style={s.hero} resizeMode="cover">
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroEyebrow}>Trusted adventure travel in India</Text>
            <Text style={s.heroTitle}>Find your next{'\n'}adventure</Text>
            <TouchableOpacity style={s.searchRow} onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
              <MaterialCommunityIcons name="magnify" size={18} color="#9aafa5" />
              <Text style={s.searchPlaceholder}>Search destinations, treks, camps…</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* ── Trust stats ── */}
        <View style={s.statsStrip}>
          <View style={s.statItem}>
            <Text style={s.statNum}>250+</Text>
            <Text style={s.statLabel}>Adventures</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>50+</Text>
            <Text style={s.statLabel}>Verified Operators</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>4.8</Text>
            <Text style={s.statLabel}>Avg. Rating</Text>
          </View>
        </View>

        {/* ── Category selector ── */}
        <View style={s.catSection}>
          <Text style={s.catHeading}>What are you looking for?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
            {CATEGORIES.map(cat => {
              const active = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={s.catItem}
                  onPress={() => handleCategoryChange(cat.key)}
                  activeOpacity={0.75}
                >
                  <View style={[s.catIconBg, active && s.catIconBgActive]}>
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={22}
                      color={active ? C.white : C.onSurfaceVariant}
                    />
                  </View>
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
                  {active && <View style={s.catActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Empty state ── */}
        {allExperiences.length === 0 && (
          <View style={s.emptyFull}>
            <MaterialCommunityIcons name="compass-off-outline" size={44} color="#D1D5DB" />
            <Text style={s.emptyFullTitle}>No adventures yet</Text>
            <Text style={s.emptyFullSub}>New experiences will appear here once they are approved.</Text>
          </View>
        )}

        {/* ── Recently Viewed ── */}
        {recentlyViewed.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View>
                <Text style={s.sectionTitle}>Recently Viewed</Text>
                <Text style={s.sectionSub}>Pick up where you left off</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={recentlyViewed}
              keyExtractor={i => 'rv-' + i._id}
              renderItem={({ item, index }) => (
                <TrendingCard item={item} index={index} onPress={goToExperience} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
            />
          </View>
        )}

        {/* ── Trending this weekend ── */}
        {trendingItems.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View>
                <Text style={s.sectionTitle}>Trending This Weekend</Text>
                <Text style={s.sectionSub}>What adventurers are booking right now</Text>
              </View>
            </View>
            <FlatList
              horizontal
              data={trendingItems}
              keyExtractor={i => 'tw-' + i._id}
              renderItem={({ item, index }) => (
                <TrendingCard item={item} index={index} onPress={goToExperience} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
            />
          </View>
        )}

        {/* ── Featured ── */}
        {featured.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View>
                <Text style={s.sectionTitle}>Featured Experiences</Text>
                <Text style={s.sectionSub}>Handpicked for the bold</Text>
              </View>
              <TouchableOpacity style={s.seeAllBtn} onPress={() => navigation.navigate('Search', { featured: true })}>
                <Text style={s.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={featured}
              keyExtractor={i => i._id}
              renderItem={({ item, index }) => (
                <FeaturedCard
                  item={item}
                  index={index}
                  onPress={goToExperience}
                  onWishlist={handleWishlist}
                  isWishlisted={wishlistIds.has(item._id)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
            />
          </View>
        )}

        {/* ── Browse by interest ── */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <View>
              <Text style={s.sectionTitle}>Browse by Interest</Text>
              <Text style={s.sectionSub}>Find adventures that match what matters to you</Text>
            </View>
          </View>
          <View style={s.interestGrid}>
            {INTEREST_FILTERS.map(f => {
              const active = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[s.interestCard, active && s.interestCardActive]}
                  onPress={() => handleInterestChange(f.key)}
                  activeOpacity={0.78}
                >
                  <View style={s.interestTopRow}>
                    <View style={[s.interestIconBg, { backgroundColor: active ? f.color + '22' : f.color + '14' }]}>
                      <MaterialCommunityIcons name={f.icon} size={20} color={f.color} />
                    </View>
                    <MaterialCommunityIcons
                      name={active ? 'check-circle' : 'chevron-right'}
                      size={18}
                      color={active ? C.primary : '#C4C9CE'}
                    />
                  </View>
                  <Text style={[s.interestTitle, active && s.interestTitleActive]}>{f.label}</Text>
                  <Text style={s.interestSub}>{f.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── All adventures (filtered) ── */}
        <View
          style={s.section}
          onLayout={e => { adventuresSectionY.current = e.nativeEvent.layout.y; }}
        >
          <View style={s.sectionHdr}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitle}>
                {activeInterest ? activeInterest.label : category === 'All' ? 'All Adventures' : category}
              </Text>
              <Text style={s.sectionSub}>
                {filteredList.length} experience{filteredList.length !== 1 ? 's' : ''} available
              </Text>
            </View>
            {(category !== 'All' || activeFilter) && (
              <TouchableOpacity
                style={s.clearBtn}
                onPress={() => { setCategory('All'); setActiveFilter(null); }}
              >
                <MaterialCommunityIcons name="close" size={13} color={C.primary} />
                <Text style={s.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredList.length > 0 ? (
            <View style={s.rowList}>
              {filteredList.map((item, i) => (
                <ExperienceRow key={'row-' + item._id} item={item} index={i} onPress={goToExperience} />
              ))}
            </View>
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="compass-off-outline" size={32} color="#D1D5DB" />
              <Text style={s.emptyText}>No experiences match these filters.</Text>
            </View>
          )}
        </View>

        {/* ── Why Wildvora ── */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <View>
              <Text style={s.sectionTitle}>Why Wildvora</Text>
              <Text style={s.sectionSub}>Safety and trust at every step</Text>
            </View>
          </View>
          <View style={s.whyGrid}>
            {[
              { icon: 'shield-check-outline', color: C.primary, title: 'Verified Operators',    desc: 'Background-checked and licensed.' },
              { icon: 'medical-bag',          color: '#b45309', title: 'Safety Audited',         desc: 'Every experience passes our audit.' },
              { icon: 'headset',              color: C.blue,    title: 'Emergency Support',      desc: '24/7 helpline on every booking.' },
              { icon: 'certificate-outline',  color: C.purple,  title: 'Certified Guides',       desc: 'Govt-certified local guides only.' },
            ].map((item, i) => (
              <View key={i} style={s.whyItem}>
                <View style={[s.whyIconBg, { backgroundColor: item.color + '14' }]}>
                  <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={s.whyTitle}>{item.title}</Text>
                <Text style={s.whyDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Safety & Prep Guides ── */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <View>
              <Text style={s.sectionTitle}>Safety & Prep Guides</Text>
              <Text style={s.sectionSub}>Mandatory reading before you head out</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.safetyList}>
            {[
              { title: 'High-Altitude AMS',      icon: 'mountain', color: C.primary,  desc: 'Acclimatization & AMS prevention' },
              { title: 'River Rafting Grades',    icon: 'wave',     color: C.blue,     desc: 'Understanding rapid grades' },
              { title: 'Jungle Code of Conduct',  icon: 'tree',     color: '#7c3aed',  desc: 'Wildlife safety rules' },
            ].map((g, i) => (
              <TouchableOpacity key={i} style={s.safetyCard} activeOpacity={0.8}>
                <View style={[s.safetyIconBg, { backgroundColor: g.color + '14' }]}>
                  <MaterialCommunityIcons name={g.icon} size={20} color={g.color} />
                </View>
                <Text style={s.safetyTitle}>{g.title}</Text>
                <Text style={s.safetyDesc}>{g.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Pro card ── */}
        <View style={s.proCard}>
          <Text style={s.proEyebrow}>MEMBERSHIP</Text>
          <Text style={s.proTitle}>Wildvora Pro</Text>
          <Text style={s.proBody}>
            Exclusive trails, priority booking, and professional local guides — for serious adventurers.
          </Text>
          <TouchableOpacity style={s.proBtn} activeOpacity={0.85}>
            <Text style={s.proBtnText}>Join the Club</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── AI FAB ── */}
      <TouchableOpacity style={s.aiFab} onPress={() => navigation.navigate('AIChat')} activeOpacity={0.88}>
        <MaterialCommunityIcons name="robot-outline" size={22} color={C.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

  /* App bar */
  appBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  appBarLogo: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  appBarRight:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:    { padding: 4 },
  avatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  avatarImg:  { width: 34, height: 34, borderRadius: 17 },
  avatarText: { fontSize: 13, fontWeight: '700', color: C.primary },

  /* Hero */
  hero:        { width: '100%', height: 360, justifyContent: 'flex-end' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroContent: { padding: 20, paddingBottom: 32 },
  heroEyebrow: { fontSize: 11, fontWeight: '600', color: 'rgba(255, 255, 255, 0.96)', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  heroTitle:   { fontSize: 36, fontWeight: '800', color: C.white, lineHeight: 44, letterSpacing: -0.5, marginBottom: 22 },
  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#9aafa5' },

  /* Trust stats */
  statsStrip:  { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statNum:     { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },
  statLabel:   { fontSize: 11, color: C.onSurfaceVariant, marginTop: 3, fontWeight: '500', textAlign: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant, marginVertical: 12 },

  /* Category selector */
  catSection: { backgroundColor: C.surface, paddingTop: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  catHeading: { fontSize: 13, fontWeight: '700', color: C.onSurfaceVariant, paddingHorizontal: 20, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 },
  catRow:     { paddingHorizontal: 20, gap: 20 },
  catItem:    { alignItems: 'center', gap: 7 },
  catIconBg:      { width: 54, height: 54, borderRadius: 27, backgroundColor: C.surfaceVariant, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  catIconBgActive:{ backgroundColor: C.primary, borderColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 7, elevation: 5 },
  catLabel:       { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant, textAlign: 'center' },
  catLabelActive: { color: C.primary, fontWeight: '700' },
  catActiveDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: C.primary, marginTop: 2 },

  /* Section layout */
  section:    { paddingHorizontal: 20, paddingTop: 32 },
  sectionHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },
  sectionSub:   { fontSize: 12, color: C.onSurfaceVariant, marginTop: 3 },
  seeAllBtn:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
  seeAllText: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },

  /* Star row */
  starRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starNum:     { fontSize: 12, fontWeight: '700', color: C.onSurface },
  starDot:     { fontSize: 11, color: C.onSurfaceVariant },
  starReviews: { fontSize: 11, color: C.onSurfaceVariant },

  /* Verified badge */
  verifiedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#F0FAF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: '#A7F3D0', marginTop: 5 },
  verifiedBadgeSmall: { paddingHorizontal: 4, paddingVertical: 2, marginTop: 0 },
  verifiedText:       { fontSize: 11, fontWeight: '600', color: C.primary },

  /* Duration pill */
  durationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceVariant, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  durationText: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },

  /* Featured cards */
  featCard:    { width: width * 0.72, marginRight: 14, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  featImgWrap: { height: 190, position: 'relative' },
  featImg:     { width: '100%', height: '100%' },
  featGradient:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  wishBtn:     { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  featOverlayContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingBottom: 14, backgroundColor: 'rgba(0,0,0,0.48)' },
  featCatBadge:{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, marginBottom: 6 },
  featCatText: { fontSize: 9, fontWeight: '700', color: C.white, letterSpacing: 1, textTransform: 'uppercase' },
  featOverlayTitle: { fontSize: 16, fontWeight: '700', color: C.white, lineHeight: 21, marginBottom: 4 },
  featOverlayRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featOverlayLoc: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  featInfo:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  featInfoLeft:    { gap: 6, flex: 1 },
  featFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  featPriceNum:    { fontSize: 18, fontWeight: '800', color: C.primary },
  featPriceSub:    { fontSize: 11, fontWeight: '400', color: C.onSurfaceVariant },
  bookBtn:         { paddingHorizontal: 18, paddingVertical: 9, backgroundColor: C.primary, borderRadius: 9 },
  bookBtnText:     { fontSize: 13, fontWeight: '700', color: C.white },

  /* Trending cards */
  trendCard:    { width: 165, marginRight: 12, backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  trendImg:     { width: '100%', height: 115 },
  trendBody:    { padding: 10, gap: 5 },
  trendTitle:   { fontSize: 13, fontWeight: '700', color: C.onSurface, lineHeight: 18 },
  trendMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendLoc:     { fontSize: 11, color: C.onSurfaceVariant, flex: 1 },
  trendBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  trendPrice:   { fontSize: 14, fontWeight: '800', color: C.primary },

  /* Browse by interest */
  interestGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  interestCard:      { width: (width - 52) / 2, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  interestCardActive:{ borderColor: C.primary, backgroundColor: '#F0FAF4', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  interestTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  interestIconBg:    { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  interestTitle:     { fontSize: 13, fontWeight: '700', color: C.onSurface, marginBottom: 4 },
  interestTitleActive: { color: C.primary },
  interestSub:       { fontSize: 11, color: C.onSurfaceVariant, lineHeight: 15 },

  /* Experience row */
  rowList:    { gap: 12 },
  rowCard:    { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  rowImg:     { width: 110, height: 130 },
  rowBody:    { flex: 1, padding: 12, justifyContent: 'space-between' },
  rowCat:     { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.6 },
  rowTitle:   { fontSize: 14, fontWeight: '700', color: C.onSurface, lineHeight: 19, marginTop: 2 },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowLoc:     { fontSize: 11, color: C.onSurfaceVariant },
  rowDot:     { fontSize: 11, color: C.outlineVariant },
  rowDur:     { fontSize: 11, color: C.onSurfaceVariant },
  rowFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rowPrice:   { fontSize: 16, fontWeight: '800', color: C.primary },
  rowPriceSub:{ fontSize: 11, color: C.onSurfaceVariant, marginTop: 1 },

  /* Clear filter */
  clearBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: C.primary },
  clearText: { fontSize: 12, fontWeight: '600', color: C.primary },

  /* Empty states */
  emptyFull:     { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyFullTitle:{ fontSize: 17, fontWeight: '700', color: C.onSurface },
  emptyFullSub:  { fontSize: 13, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 19 },
  emptyBox:      { alignItems: 'center', paddingVertical: 32, gap: 10, backgroundColor: C.surface, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  emptyText:     { fontSize: 13, color: C.onSurfaceVariant, textAlign: 'center' },

  /* Why Wildvora */
  whyGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  whyItem:  { width: (width - 52) / 2, backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  whyIconBg:{ width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  whyTitle: { fontSize: 13, fontWeight: '700', color: C.onSurface, marginBottom: 4, lineHeight: 17 },
  whyDesc:  { fontSize: 11, color: C.onSurfaceVariant, lineHeight: 15 },

  /* Safety guides */
  safetyList:   { gap: 10, paddingBottom: 4 },
  safetyCard:   { width: 148, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  safetyIconBg: { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  safetyTitle:  { fontSize: 12, fontWeight: '700', color: C.onSurface, lineHeight: 16 },
  safetyDesc:   { fontSize: 10, color: C.onSurfaceVariant, marginTop: 3, lineHeight: 14 },

  /* Pro card */
  proCard:    { margin: 20, marginTop: 32, backgroundColor: C.primary, borderRadius: 18, padding: 28, alignItems: 'center' },
  proEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' },
  proTitle:   { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 10, letterSpacing: -0.3 },
  proBody:    { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  proBtn:     { paddingVertical: 13, paddingHorizontal: 32, backgroundColor: C.white, borderRadius: 10 },
  proBtnText: { color: C.primary, fontWeight: '800', fontSize: 14 },

  /* AI FAB */
  aiFab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
});
