import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  Animated, ImageBackground, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { experienceAPI, userAPI } from '../services/api';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import AuthPromptSheet from '../components/AuthPromptSheet';

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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

function WhyRow({ item, index, divider }) {
  const translateX = useRef(new Animated.Value(-20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 360, delay: index * 100, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 360, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <>
      <Animated.View style={[s.whyRow, { opacity, transform: [{ translateX }] }]}>
        <Text style={s.whyNum}>{item.num}</Text>
        <View style={[s.whyIconDot, { backgroundColor: item.color + '16' }]}>
          <MaterialCommunityIcons name={item.icon} size={17} color={item.color} />
        </View>
        <View style={s.whyRowBody}>
          <Text style={s.whyRowTitle}>{item.title}</Text>
          <Text style={s.whyRowDesc}>{item.desc}</Text>
        </View>
      </Animated.View>
      {divider && <View style={s.whyDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { user }  = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Explorer';
  const { requireAuth, promptVisible, hidePrompt } = useAuthGuard();
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

  const handleWishlist = requireAuth(async (item) => {
    try {
      await userAPI.toggleWishlist(item._id);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.has(item._id) ? next.delete(item._id) : next.add(item._id);
        return next;
      });
    } catch {}
  });

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
        {/* ── Header ── */}
        <ImageBackground source={HERO_IMAGE} style={s.header} resizeMode="cover">
          <View style={s.headerOverlay} />
          <View style={s.headerNav}>
            <Text style={s.headerLogo}>wildvora</Text>
            <TouchableOpacity
              onPress={() => user ? navigation.navigate('Profile') : navigation.navigate('Login')}
              style={s.headerAvatar}
            >
              {user?.avatar
                ? <Image source={{ uri: user.avatar }} style={s.avatarImg} />
                : user
                  ? <Text style={s.headerAvatarText}>{user.name?.[0]?.toUpperCase()}</Text>
                  : <MaterialCommunityIcons name="account-outline" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
          <View style={s.headerGreetWrap}>
            <Text style={s.headerGreet}>
              {getGreeting()},{'\n'}<Text style={s.headerGreetName}>{firstName}</Text>
            </Text>
            <Text style={s.headerGreetSub}>Where to next?</Text>
          </View>
          
          <View style={s.statsStrip}>
            {[
              { num: '250+', label: 'Adventures' },
              { num: '50+',  label: 'Operators'  },
              { num: '4.8★', label: 'Avg Rating' },
            ].map((item, i, arr) => (
              <React.Fragment key={i}>
                <View style={s.statItem}>
                  <Text style={s.statNum}>{item.num}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.statDivider} />}
              </React.Fragment>
            ))}
          </View>
          <TouchableOpacity style={s.searchPill} onPress={() => navigation.navigate('Search')} activeOpacity={0.88}>
            <View style={s.searchPillIconWrap}>
              <MaterialCommunityIcons name="magnify" size={19} color={C.primary} />
            </View>
            <View style={s.searchPillDivider} />
            <Text style={s.searchPillText}>Destinations, treks, camps…</Text>
            <View style={s.searchPillFilter}>
              <MaterialCommunityIcons name="tune-variant" size={16} color={C.onSurfaceVariant} />
            </View>
          </TouchableOpacity>
        </ImageBackground>

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
        <View style={s.interestSection}>
          <View style={s.interestSectionHdr}>
            <Text style={s.sectionTitle}>Browse by Interest</Text>
            <Text style={s.sectionSub}>Adventures filtered just for you</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.interestStrip}
            decelerationRate="fast"
            snapToInterval={width * 0.44 + 12}
          >
            {INTEREST_FILTERS.map(f => {
              const active = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[s.interestTile, { backgroundColor: f.color }, active && s.interestTileActive]}
                  onPress={() => handleInterestChange(f.key)}
                  activeOpacity={0.88}
                >
                  <MaterialCommunityIcons name={f.icon} size={92} color="rgba(255,255,255,0.09)" style={s.interestWatermark} />
                  {active && (
                    <View style={s.interestCheckBadge}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                    </View>
                  )}
                  <View style={s.interestIconBubble}>
                    <MaterialCommunityIcons name={f.icon} size={26} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={s.interestTileLabel}>{f.label}</Text>
                  <Text style={s.interestTileSub}>{f.sub}</Text>
                  <View style={s.interestTileBottom}>
                    <Text style={s.interestTileExplore}>Explore</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color="rgba(255,255,255,0.75)" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
        <View style={s.whySection}>
          <View style={s.whySectionHdr}>
            <Text style={s.sectionTitle}>Why Wildvora</Text>
            <Text style={s.sectionSub}>What sets us apart</Text>
          </View>
          {[
            { num: '01', icon: 'shield-check-outline', color: C.primary, title: 'Verified Operators',  desc: 'Background-checked and licensed operators only.' },
            { num: '02', icon: 'medical-bag',          color: '#b45309', title: 'Safety Audited',       desc: 'Every experience passes our safety audit.' },
            { num: '03', icon: 'headset',              color: C.blue,    title: 'Emergency Support',    desc: '24/7 helpline available on every booking.' },
            { num: '04', icon: 'certificate-outline',  color: C.purple,  title: 'Certified Guides',     desc: 'Govt-certified local guides, always.' },
          ].map((item, i, arr) => (
            <WhyRow key={i} item={item} index={i} divider={i < arr.length - 1} />
          ))}
        </View>

        {/* ── Safety & Prep Guides ── */}
        <View style={s.safetySection}>
          <View style={s.safetySectionHdr}>
            <Text style={s.sectionTitle}>Safety & Prep Guides</Text>
            <Text style={s.sectionSub}>Read before you head out</Text>
          </View>
          <View style={s.safetyStack}>
            {[
              { cat: 'Trekking',     catColor: C.primary, icon: 'summit', title: 'High-Altitude AMS',      desc: 'Acclimatisation, symptoms & prevention', readTime: '5 min' },
              { cat: 'Water Sports', catColor: C.blue,    icon: 'wave',   title: 'River Rafting Grades',   desc: 'Rapid grades & what they mean for you',   readTime: '3 min' },
              { cat: 'Jungle',       catColor: '#7c3aed', icon: 'tree',   title: 'Jungle Code of Conduct', desc: 'Wildlife safety rules & field etiquette',  readTime: '4 min' },
            ].map((g, i) => (
              <TouchableOpacity key={i} style={s.safetyCard} activeOpacity={0.82}>
                <View style={[s.safetyCardBar, { backgroundColor: g.catColor }]} />
                <View style={s.safetyCardBody}>
                  <View style={s.safetyCardHeader}>
                    <View style={[s.safetyCardIconWrap, { backgroundColor: g.catColor + '14' }]}>
                      <MaterialCommunityIcons name={g.icon} size={15} color={g.catColor} />
                    </View>
                    <Text style={[s.safetyCardCat, { color: g.catColor }]}>{g.cat}</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={s.safetyReadTime}>{g.readTime} read</Text>
                  </View>
                  <Text style={s.safetyCardTitle}>{g.title}</Text>
                  <Text style={s.safetyCardDesc}>{g.desc}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#C4C9CE" style={s.safetyCardArrow} />
              </TouchableOpacity>
            ))}
          </View>
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

      <AuthPromptSheet
        visible={promptVisible}
        onDismiss={hidePrompt}
        onSignUp={() => { hidePrompt(); navigation.navigate('Register'); }}
        onSignIn={() => { hidePrompt(); navigation.navigate('Login'); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: C.background },
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

  /* Shared */
  iconBtn:    { padding: 4 },
  avatarImg:  { width: 36, height: 36, borderRadius: 18 },

  /* Header */
  header:            { paddingBottom: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  headerOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  headerNav:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20 },
  headerLogo:        { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  headerAvatarText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerGreetWrap:   { paddingHorizontal: 22, marginBottom: 22 },
  headerGreet:       { fontSize: 30, fontWeight: '700', color: '#fff', letterSpacing: -0.5, lineHeight: 38 },
  headerGreetName:   { fontWeight: '900', color: '#fff' },
  headerGreetSub:    { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 5 },
  searchPill:        { marginHorizontal: 22, marginTop: 26, flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 50, paddingVertical: 13, paddingLeft: 13, paddingRight: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8, borderWidth: 1, borderColor: C.outlineVariant },
  searchPillIconWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary + '12', justifyContent: 'center', alignItems: 'center' },
  searchPillDivider: { width: 1, height: 22, backgroundColor: C.outlineVariant, marginHorizontal: 12 },
  searchPillText:    { flex: 1, fontSize: 15, color: '#a0afa8', fontWeight: '500' },
  searchPillFilter:  { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  statsStrip:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: 22, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  statItem:          { flex: 1, alignItems: 'center' },
  statNum:           { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  statLabel:         { fontSize: 11, color: 'rgba(255,255,255,0.72)', fontWeight: '500', marginTop: 3 },
  statDivider:       { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },

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

  /* Browse by interest — horizontal filmstrip */
  interestSection:     { paddingTop: 32 },
  interestSectionHdr:  { paddingHorizontal: 22, marginBottom: 18 },
  interestStrip:       { paddingHorizontal: 22, gap: 12 },
  interestTile:        { width: width * 0.44, height: 190, borderRadius: 18, padding: 16, overflow: 'hidden', justifyContent: 'flex-start' },
  interestTileActive:  { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 6 },
  interestWatermark:   { position: 'absolute', right: -8, bottom: -8 },
  interestCheckBadge:  { position: 'absolute', top: 12, right: 12 },
  interestIconBubble:  { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  interestTileLabel:   { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2, marginBottom: 4 },
  interestTileSub:     { fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 15, marginBottom: 12 },
  interestTileBottom:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  interestTileExplore: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },

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

  /* Why Wildvora — numbered editorial rows */
  whySection:    { marginTop: 32, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.outlineVariant },
  whySectionHdr: { paddingHorizontal: 22, paddingTop: 24, marginBottom: 8 },
  whyRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 15, gap: 14 },
  whyNum:        { fontSize: 11, fontWeight: '800', color: '#D1D5DB', letterSpacing: 0.5, width: 20 },
  whyIconDot:    { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  whyRowBody:    { flex: 1 },
  whyRowTitle:   { fontSize: 14, fontWeight: '700', color: C.onSurface, marginBottom: 2 },
  whyRowDesc:    { fontSize: 12, color: C.onSurfaceVariant, lineHeight: 17 },
  whyDivider:    { height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant, marginHorizontal: 22 },

  /* Safety & Prep Guides — accent-bar cards */
  safetySection:     { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.outlineVariant, marginTop: 32, paddingBottom: 8 },
  safetySectionHdr:  { paddingHorizontal: 22, paddingTop: 24, marginBottom: 16 },
  safetyStack:       { paddingHorizontal: 22, gap: 12 },
  safetyCard:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  safetyCardBar:     { width: 4, alignSelf: 'stretch' },
  safetyCardBody:    { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  safetyCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  safetyCardIconWrap:{ width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  safetyCardCat:     { fontSize: 12, fontWeight: '700' },
  safetyReadTime:    { fontSize: 11, color: C.onSurfaceVariant, fontWeight: '500' },
  safetyCardTitle:   { fontSize: 15, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2, marginBottom: 4 },
  safetyCardDesc:    { fontSize: 12, color: C.onSurfaceVariant, lineHeight: 17 },
  safetyCardArrow:   { paddingRight: 14 },

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
