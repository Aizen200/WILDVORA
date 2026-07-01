import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, FlatList, ActivityIndicator, RefreshControl,
  Animated, ImageBackground, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { experienceAPI, userAPI } from '../services/api';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import AuthPromptSheet from '../components/AuthPromptSheet';

const { width } = Dimensions.get('window');
const INTEREST_CARD_WIDTH = Math.min(width * 0.44, 200);
const FEATURED_CARD_WIDTH = Math.min(width * 0.72, 320);



const C = {
  primary:          '#1A5F45',
  background:       '#F7F6F2',
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
  { key: 'All',          label: 'For You',      icon: 'compass-outline' },
  { key: 'Trekking',     label: 'Trekking',     icon: 'hiking' },
  { key: 'Camping',      label: 'Camping',      icon: 'tent' },
  { key: 'Water Sports', label: 'Water Sports', icon: 'wave' },
  { key: 'Jungle',       label: 'Jungle',       icon: 'tree' },
  { key: 'Cycling',      label: 'Cycling',      icon: 'bicycle' },
];


const INTEREST_IMG_ITEMS = [
  {
    key: 'verified',
    label: 'Verified Adventures',
    desc: 'Trusted experiences only',
    image: require('../../assets/browse/verified.jpg'),
  },
  {
    key: 'top_rated',
    label: 'Top Rated',
    desc: 'Loved by travellers',
    image: require('../../assets/browse/toprated.jpg'),
  },
  {
    key: 'budget',
    label: 'Weekend Escapes',
    desc: 'Perfect quick getaways',
    image: require('../../assets/browse/weekend.jpg'),
  },
  {
    key: 'women_friendly',
    label: 'Women Friendly',
    desc: 'Safe & curated adventures',
    image: require('../../assets/browse/women.jpg'),
  },
];

const WHY_FEATURES = [
  { icon: 'shield-check-outline', label: 'Verified Operators', desc: 'Licensed & background-checked', color: C.primary },
  { icon: 'medical-bag',          label: 'Safety First',       desc: 'Every experience safety-audited', color: '#b45309' },
  { icon: 'headset',              label: '24/7 Support',       desc: 'Emergency helpline always on',  color: C.blue    },
  { icon: 'certificate-outline',  label: 'Certified Guides',   desc: 'Govt-certified local experts',  color: C.purple  },
];

const HERO_IMAGE = require('../../assets/heroimage.png');

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMxqmVZiEOLbS8iPmgbb6yZs6DOT2ueMpEqfGJceQT5UKb-vk8NYWZoAt-1MkZLPkvjsFtOReCDsVaBRG2KY5KP5LdT49c2FNnkGdDbeshfCbeECqk1lyKhgWaKU2qqSQj1pSjg3VQvAPEhnvArYc-0kRxN-egqoRdUN60Zei6Lxkitme_X-kKfjWYdpZLwNE3UQasoTRlT0cziDoDMIxVfscnKB10ZHEogVN5cDmdIQ9fXIkS0iIBlFS-U5ymQ8eXcWCBSG9l6Fg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwlcB3bQtzyJNOrLT4EsnoHFNw9cIRYARJ7T09kYY_AQYhYTBPp8P-JZ1ql_NGI3NiFwbW0OxMTzdUW5vwAyY6imbUS88XUUqVyZNLXi14OJIghFzuSgbwv5qfjjyyVCaE47qFk8AL4y2rHBjgcBC8hPxXywIJeN5COCXEVUbMkkAuD_IGQ55wzAfDXDnMLwC9CkmkVl3p7WXltYRzxGKBNefxfzmlLZ92u-XqtHzE41ZakGWrChYh9ccxbqDXnzVBfpvYA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDbJND2DExd4tGk_meQf3SbpfLq-GLxo93wvzwp56njlr4Zhn4mIK_MyF1Z7sluqq9Mi2IKVA2bcvfxz58GOOHUfxI0tC2SNuBns2UxkhTK2dN4Z3LeA_Imjnnlef1fIkh8ynlFgxxjQZOB8nAwINlP5KZ2PE8lE0qkpSRhKgfmcNLRCFW7JbXC6ibRsL2uQUODYToVddox-MKbxwD337hZnFdme4awUJgknShzN_lJl8Ei6IyPx0HZP4SxSeRVPj9Dy-BnIvySDt4',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKQ_7zuwqBLhH-dTfmOPPDE8NQP5nYs1P8iv3gBb5kXzYakFrj6jj3IuBWARt0plEZ6JVJwfr3aRD6dcUmWeDu_Xmequ4XcTmd3CfCrXdrg5p3fJd0ussi8Xn1kNAMvifznmR7ikIce7hLec3PXFYeGmGdR2JOVjnPYbpIKKT9sZmO10AlAh_Gneo8I2vOWx2l3s0S0WnTj068m0aRhfZHBT7yG7oir8YPpGwXyAHaJsdAK44n5LCDlAN-OLUveDqBLeGbvLsxzZo',
];

// Featured card dimensions (portrait 3:4)
const PORTRAIT_W   = Math.min(width * 0.70, 320);
const PORTRAIT_H   = PORTRAIT_W * (4 / 3);
const PORTRAIT_GAP = 14;

// Discovery carousel card dimensions
const CARD_W   = Math.min(width * 0.56, 240);
const CARD_H   = CARD_W * 1.22;
const CARD_GAP = 12;

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

function FeaturedCard({ item, index, isActive, onPress, onWishlist, isWishlisted }) {
  const img      = useCardImage(item, index);
  const verified = item.isVerified || item.operator?.isVerified;
  const scaleVal = useRef(new Animated.Value(isActive ? 1.0 : 0.92)).current;
  const opacVal  = useRef(new Animated.Value(isActive ? 1.0 : 0.65)).current;

  const heartScale   = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleVal, { toValue: isActive ? 1.0 : 0.92, tension: 280, friction: 18, useNativeDriver: true }),
      Animated.timing(opacVal,  { toValue: isActive ? 1.0 : 0.65, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  const handleWishlistPress = () => {
    const adding = !isWishlisted;
    onWishlist(item);
    if (adding) {
      setShowHeart(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1.25, tension: 180, friction: 5, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1.0,  tension: 250, friction: 8, useNativeDriver: true }),
        Animated.delay(300),
        Animated.timing(heartOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => setShowHeart(false));
    }
  };

  return (
    <Animated.View style={{ width: PORTRAIT_W, transform: [{ scale: scaleVal }], opacity: opacVal }}>
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.93} style={s.featCardInner}>
        <Image source={{ uri: img.uri }} style={s.featImg} resizeMode="cover" onError={img.onError} />
        <View style={s.featGrad1} />
        <View style={s.featGrad2} />
        <View style={s.featGrad3} />
        {showHeart && (
          <Animated.View
            pointerEvents="none"
            style={[s.heartOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}
          >
            <MaterialCommunityIcons name="heart" size={90} color="rgba(255,255,255,0.95)" />
          </Animated.View>
        )}
        {verified && (
          <View style={s.featVerifiedBadge}>
            <MaterialCommunityIcons name="shield-check" size={10} color={C.primary} />
            <Text style={s.featVerifiedText}>Verified</Text>
          </View>
        )}
        <TouchableOpacity style={s.featWishBtn} onPress={handleWishlistPress} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? '#ef4444' : C.white}
          />
        </TouchableOpacity>
        <View style={s.featOverlay}>
          {item.category && (
            <View style={s.featCatBadge}>
              <Text style={s.featCatText}>{item.category.toUpperCase()}</Text>
            </View>
          )}
          <Text style={s.featOverlayTitle} numberOfLines={2}>{item.title}</Text>
          <View style={s.featLocRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={11} color="rgba(255,255,255,0.75)" />
            <Text style={s.featLocText} numberOfLines={1}>
              {item.location?.city}{item.location?.country ? `, ${item.location.country}` : ''}
            </Text>
          </View>
          <View style={s.featMetaRow}>
            <View style={s.featStarWrap}>
              <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
              <Text style={s.featRating}>{parseFloat(item.rating || 4.9).toFixed(1)}</Text>
            </View>
            {item.duration && (
              <View style={s.featDurBadge}>
                <Text style={s.featDurText}>{item.duration}</Text>
              </View>
            )}
            <Text style={s.featPriceText}>from ₹{item.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function DiscoveryCard({ item, index, isActive, onPress, onWishlist, isWishlisted }) {
  const img      = useCardImage(item, index);
  const verified = item.isVerified || item.operator?.isVerified;
  const scaleVal = useRef(new Animated.Value(isActive ? 1.0 : 0.93)).current;
  const opacVal  = useRef(new Animated.Value(isActive ? 1.0 : 0.70)).current;

  const heartScale   = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const [showHeart, setShowHeart] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleVal, { toValue: isActive ? 1.0 : 0.93, tension: 300, friction: 20, useNativeDriver: true }),
      Animated.timing(opacVal,  { toValue: isActive ? 1.0 : 0.70, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [isActive]);

  const handleWishlistPress = () => {
    const adding = !isWishlisted;
    onWishlist(item);
    if (adding) {
      setShowHeart(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1.25, tension: 180, friction: 5, useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1.0,  tension: 250, friction: 8, useNativeDriver: true }),
        Animated.delay(300),
        Animated.timing(heartOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start(() => setShowHeart(false));
    }
  };

  return (
    <Animated.View style={{ width: CARD_W, transform: [{ scale: scaleVal }], opacity: opacVal }}>
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.93} style={s.discCardInner}>
        <Image source={{ uri: img.uri }} style={s.discImg} resizeMode="cover" onError={img.onError} />
        <View style={s.discGrad1} />
        <View style={s.discGrad2} />
        {showHeart && (
          <Animated.View
            pointerEvents="none"
            style={[s.heartOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}
          >
            <MaterialCommunityIcons name="heart" size={60} color="rgba(255,255,255,0.95)" />
          </Animated.View>
        )}
        {verified && (
          <View style={s.discVerifiedBadge}>
            <MaterialCommunityIcons name="shield-check" size={9} color={C.primary} />
            <Text style={s.discVerifiedText}>Verified</Text>
          </View>
        )}
        {onWishlist && (
          <TouchableOpacity style={s.discWishBtn} onPress={handleWishlistPress} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={15}
              color={isWishlisted ? '#ef4444' : C.white}
            />
          </TouchableOpacity>
        )}
        <View style={s.discOverlay}>
          <Text style={s.discTitle} numberOfLines={2}>{item.title}</Text>
          <View style={s.discLocRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={10} color="rgba(255,255,255,0.72)" />
            <Text style={s.discLoc} numberOfLines={1}>{item.location?.city || 'India'}</Text>
          </View>
          <View style={s.discMetaRow}>
            <MaterialCommunityIcons name="star" size={10} color="#FBBF24" />
            <Text style={s.discRating}>{parseFloat(item.rating || 4.9).toFixed(1)}</Text>
            <Text style={s.discPrice}>  ₹{item.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, onSeeAll }) {
  return (
    <View style={s.sectionHdr}>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
      </View>
      {onSeeAll && (
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={s.seeAllText}>See all</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Carousel Section ─────────────────────────────────────────────────────────

function CarouselSection({ title, subtitle, data, onSeeAll, onPress, onWishlist, wishlistIds }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!data || data.length === 0) return null;
  return (
    <View style={s.section}>
      <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item, i) => `${i}-${item._id}`}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={s.carouselContent}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP));
          setActiveIdx(Math.max(0, idx));
        }}
        renderItem={({ item, index }) => (
          <DiscoveryCard
            item={item}
            index={index}
            isActive={index === activeIdx}
            onPress={onPress}
            onWishlist={onWishlist}
            isWishlisted={wishlistIds?.has(item._id)}
          />
        )}
      />
    </View>
  );
}

// ─── Interest Image Card ──────────────────────────────────────────────────────

function InterestImageCard({ item, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.key)}
      activeOpacity={0.9}
      style={s.intCard}
    >
      <Image
        source={item.image}
        style={s.intCardImg}
        resizeMode="cover"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={s.intCardContent}>
        <Text style={s.intCardLabel}>{item.label}</Text>
        <Text style={s.intCardDesc}>{item.desc}</Text>
      </View>
    </TouchableOpacity>
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
  const [activeFeatIdx, setActiveFeatIdx]   = useState(0);

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

  // Category filter applies to all carousels in place — no scrolling
  const handleCategoryChange = (key) => setCategory(key);
  const handleInterestChange = (key) => {
      navigation.navigate("Search", {
        category: key,
      });
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

  const filteredFeatured = category === 'All'
    ? featured
    : featured.filter(e => e.category === category);

  const filteredRecent = category === 'All'
    ? recentlyViewed
    : recentlyViewed.filter(e => e.category === category);

  const displayList      = activeFilter ? filteredList : baseList;
  const newItems         = displayList.slice(0, 8);
  const popularItems     = displayList.slice(0, 8);
  const weekendItems     = displayList.filter(e => parseFloat(e.price) < 4000).slice(0, 6);
  const recommendedItems = displayList.filter(e => parseFloat(e.rating || 0) >= 4.0).slice(0, 6);

  const scrollViewRef = useRef(null);

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
        {/* ── 1. Cinematic Hero ── */}
        <ImageBackground source={HERO_IMAGE} style={s.hero} resizeMode="cover">
          <View style={s.heroGrad1} />
          <View style={s.heroGrad2} />
          <View style={s.heroGrad3} />
          <View style={s.heroGrad4} />
          <View style={s.heroGrad5} />

          <View style={s.heroNav}>
            <Text style={s.heroLogo}>wildvora</Text>
            <TouchableOpacity
              onPress={() => user ? navigation.navigate('Profile') : navigation.navigate('Login')}
              style={s.heroAvatar}
            >
              {user?.avatar
                ? <Image source={{ uri: user.avatar }} style={s.avatarImg} />
                : user
                  ? <Text style={s.heroAvatarText}>{user.name?.[0]?.toUpperCase()}</Text>
                  : <MaterialCommunityIcons name="account-outline" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>

          <View style={s.heroContent}>
            <Text style={s.heroGreetLine}>{getGreeting()},</Text>
            <Text style={s.heroName}>{firstName} </Text>
            <Text style={s.heroSub}>Where will adventure take you today?</Text>
          </View>
        </ImageBackground>

        {/* ── 2. Search Bar ── */}
        <View style={s.searchWrap}>
          <TouchableOpacity style={s.searchPill} onPress={() => navigation.navigate('Search')} activeOpacity={0.88}>
            <View style={s.searchIconWrap}>
              <MaterialCommunityIcons name="magnify" size={19} color={C.primary} />
            </View>
            <View style={s.searchDivider} />
            <Text style={s.searchPlaceholder}>Destinations, treks, camps…</Text>
            <View style={s.searchFilterBtn}>
              <MaterialCommunityIcons name="tune-variant" size={16} color={C.onSurfaceVariant} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 3. Category Navigation ── */}
        <View style={s.catSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catRow}
          >
            {CATEGORIES.map(cat => {
              const active = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={s.catItem}
                  onPress={() => handleCategoryChange(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{cat.label}</Text>
                  {active && <View style={s.catUnderline} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={s.catBorderLine} />
        </View>

        {/* ── Empty state ── */}
        {allExperiences.length === 0 && (
          <View style={s.emptyFull}>
            <MaterialCommunityIcons name="compass-off-outline" size={44} color="#D1D5DB" />
            <Text style={s.emptyFullTitle}>No adventures yet</Text>
            <Text style={s.emptyFullSub}>New experiences will appear here once they are approved.</Text>
          </View>
        )}

        {/* ── 4. Featured This Week ── */}
        {filteredFeatured.length > 0 && (
          <View style={s.featSection}>
            <SectionHeader
              title="Featured This Week"
              subtitle="Handpicked for the bold"
              onSeeAll={() => navigation.navigate('Search', { featured: true })}
            />
            <FlatList
              horizontal
              data={filteredFeatured}
              keyExtractor={i => i._id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={PORTRAIT_W + PORTRAIT_GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={s.featListContent}
              ItemSeparatorComponent={() => <View style={{ width: PORTRAIT_GAP }} />}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (PORTRAIT_W + PORTRAIT_GAP));
                setActiveFeatIdx(Math.max(0, idx));
              }}
              renderItem={({ item, index }) => (
                <FeaturedCard
                  item={item}
                  index={index}
                  isActive={index === activeFeatIdx}
                  onPress={goToExperience}
                  onWishlist={handleWishlist}
                  isWishlisted={wishlistIds.has(item._id)}
                />
              )}
            />
            <View style={s.dotRow}>
              {filteredFeatured.map((_, i) => (
                <View key={i} style={[s.dot, i === activeFeatIdx && s.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {/* ── 5. Recently Viewed ── */}
        <CarouselSection
          title="Recently Viewed"
          subtitle="Pick up where you left off"
          data={filteredRecent}
          onPress={goToExperience}
          onWishlist={handleWishlist}
          wishlistIds={wishlistIds}
        />

        {/* ── 6. New on Wildvora ── */}
        <CarouselSection
          title="New on Wildvora"
          subtitle="Fresh experiences just added"
          data={newItems}
          onSeeAll={() => navigation.navigate('Search')}
          onPress={goToExperience}
          onWishlist={handleWishlist}
          wishlistIds={wishlistIds}
        />

        {/* ── 7. Popular Destinations ── */}
        <CarouselSection
          title="Popular Destinations"
          subtitle="Where explorers are heading"
          data={popularItems}
          onSeeAll={() => navigation.navigate('Search')}
          onPress={goToExperience}
          onWishlist={handleWishlist}
          wishlistIds={wishlistIds}
        />

        {/* ── 8. Weekend Escapes ── */}
        <CarouselSection
          title="Weekend Escapes"
          subtitle="Short trips for the quick break"
          data={weekendItems}
          onSeeAll={() => navigation.navigate('Search')}
          onPress={goToExperience}
          onWishlist={handleWishlist}
          wishlistIds={wishlistIds}
        />

        {/* ── 9. Recommended For You ── */}
        <CarouselSection
          title="Recommended For You"
          subtitle="Curated based on your interests"
          data={recommendedItems}
          onSeeAll={() => navigation.navigate('Search')}
          onPress={goToExperience}
          onWishlist={handleWishlist}
          wishlistIds={wishlistIds}
        />

        {/* ── 10. Browse by Interest ── */}
        <View style={s.section}>
          <SectionHeader
            title="Explore Adventures"
            subtitle="Find experiences you'll love"
            />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.intStrip}
            decelerationRate="fast"
            snapToInterval={160}
          >
            {INTEREST_IMG_ITEMS.map((item, index) => (
              <InterestImageCard
                key={item.key}
                item={item}
                index={index}
                onPress={handleInterestChange}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── 11. Trusted by Explorers ── */}
        <View style={s.statsSection}>
          <Text style={s.statsSectionEyebrow}>TRUSTED BY EXPLORERS</Text>
          <View style={s.statsRow}>
            {[
              { num: '250+', label: 'Experiences'       },
              { num: '50+',  label: 'Verified Operators' },
              { num: '4.8★', label: 'Average Rating'    },
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
        </View>

        {/* ── 12. Why Wildvora ── */}
        <View style={s.whySection}>
          <View style={{ marginBottom: 20 }}>
            <Text style={s.sectionTitle}>Why Wildvora</Text>
            <Text style={s.sectionSub}>What sets us apart</Text>
          </View>
          <View style={s.whyGrid}>
            {WHY_FEATURES.map((f, i) => (
              <View key={i} style={s.whyCard}>
                <View style={[s.whyCardIcon, { backgroundColor: f.color + '15' }]}>
                  <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
                </View>
                <Text style={s.whyCardTitle}>{f.label}</Text>
                <Text style={s.whyCardDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 13. Pro card (bottom) ── */}
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

  avatarImg: { width: 36, height: 36, borderRadius: 18 },

  /* ── Hero ── */
  hero:      { height: 300, justifyContent: 'flex-end' },
  heroGrad1: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.07)' },
  heroGrad2: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '78%',  backgroundColor: 'rgba(0,0,0,0.08)' },
  heroGrad3: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '57%',  backgroundColor: 'rgba(0,0,0,0.09)' },
  heroGrad4: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',  backgroundColor: 'rgba(0,0,0,0.13)' },
  heroGrad5: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%',  backgroundColor: 'rgba(0,0,0,0.17)' },
  heroNav:         { position: 'absolute', top: 14, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLogo:        { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  heroAvatarText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  heroContent:     { paddingHorizontal: 22, paddingBottom: 48 },
  heroGreetLine:   { fontSize: 18, fontWeight: '500', color: 'rgba(255, 255, 255, 0.94)', letterSpacing: 0.2, marginBottom: 4 },
  heroName:        { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1.5, lineHeight: 52, marginBottom: 10 },
  heroSub:         { fontSize: 18, color: 'rgba(255, 255, 255, 0.94)', lineHeight: 20 },

  /* ── Search ── */
  searchWrap:       { paddingHorizontal: 20, marginTop: -24, zIndex: 10 },
  searchPill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: "#e0e7e0", borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  searchIconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primary + '12', justifyContent: 'center', alignItems: 'center' },
  searchDivider:    { width: 1, height: 22, backgroundColor: C.outlineVariant, marginHorizontal: 12 },
  searchPlaceholder:{ flex: 1, fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  searchFilterBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceVariant, justifyContent: 'center', alignItems: 'center' },

  /* ── Category navigation ── */
  catSection:     { marginTop: 20 },
  catRow:         { paddingHorizontal: 20, gap: 28, paddingBottom: 12 },
  catItem:        { alignItems: 'center', paddingBottom: 2 },
  catLabel:       { fontSize: 14, fontWeight: '500', color: C.onSurfaceVariant, letterSpacing: 0.1 },
  catLabelActive: { fontWeight: '700', color: C.onSurface },
  catUnderline:   { height: 2, width: '100%', minWidth: 24, backgroundColor: C.primary, borderRadius: 1, marginTop: 6 },
  catBorderLine:  { height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant },

  /* ── Generic section ── */
  section:      { paddingTop: 36 },
  sectionHdr:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.onSurface, letterSpacing: -0.3 },
  sectionSub:   { fontSize: 12, color: C.onSurfaceVariant, marginTop: 3 },
  seeAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:   { fontSize: 13, fontWeight: '600', color: C.primary },

  /* ── Star row ── */
  starRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starNum:     { fontSize: 12, fontWeight: '700', color: C.onSurface },
  starDot:     { fontSize: 11, color: C.onSurfaceVariant },
  starReviews: { fontSize: 11, color: C.onSurfaceVariant },

  /* ── Verified badge ── */
  verifiedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#F0FAF4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: '#A7F3D0', marginTop: 5 },
  verifiedBadgeSmall: { paddingHorizontal: 4, paddingVertical: 2, marginTop: 0 },
  verifiedText:       { fontSize: 11, fontWeight: '600', color: C.primary },

  /* ── Duration pill ── */
  durationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceVariant, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  durationText: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },

  /* ── Featured This Week (portrait) ── */
  featSection:      { paddingTop: 36 },
  featListContent:  { paddingHorizontal: 20, paddingBottom: 8 },
  featCardInner:    { width: PORTRAIT_W, height: PORTRAIT_H, borderRadius: 22, overflow: 'hidden' },
  featImg:          { width: '100%', height: '100%' },
  featGrad1:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  featGrad2:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', backgroundColor: 'rgba(0,0,0,0.34)' },
  featGrad3:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', backgroundColor: 'rgba(0,0,0,0.30)' },
  featVerifiedBadge:{ position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.93)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  featVerifiedText: { fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 0.3 },
  featWishBtn:      { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  featOverlay:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, paddingBottom: 20 },
  featCatBadge:     { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginBottom: 8 },
  featCatText:      { fontSize: 9, fontWeight: '700', color: C.white, letterSpacing: 1.2, textTransform: 'uppercase' },
  featOverlayTitle: { fontSize: 20, fontWeight: '700', color: C.white, lineHeight: 26, marginBottom: 6, letterSpacing: -0.3 },
  featLocRow:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  featLocText:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', flex: 1 },
  featMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featStarWrap:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featRating:       { fontSize: 12, fontWeight: '700', color: '#fff' },
  featDurBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  featDurText:      { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  featPriceText:    { fontSize: 13, fontWeight: '700', color: '#fff', marginLeft: 'auto' },

  /* Dot indicators */
  dotRow:    { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 14, paddingBottom: 4 },
  dot:       { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.outlineVariant },
  dotActive: { width: 16, borderRadius: 3, backgroundColor: C.primary },

  /* ── Discovery carousel cards ── */
  carouselContent: { paddingHorizontal: 20, paddingBottom: 4 },
  discCardInner:   { width: CARD_W, height: CARD_H, borderRadius: 18, overflow: 'hidden' },
  discImg:         { width: '100%', height: '100%' },
  discGrad1:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  discGrad2:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: '52%', backgroundColor: 'rgba(0,0,0,0.50)' },
  discVerifiedBadge:{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  discVerifiedText: { fontSize: 9, fontWeight: '700', color: C.primary },
  discWishBtn:     { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  discOverlay:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, paddingBottom: 16 },
  discTitle:       { fontSize: 14, fontWeight: '700', color: C.white, lineHeight: 19, marginBottom: 4, letterSpacing: -0.2 },
  discLocRow:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5 },
  discLoc:         { fontSize: 11, color: 'rgba(255,255,255,0.72)', flex: 1 },
  discMetaRow:     { flexDirection: 'row', alignItems: 'center' },
  discRating:      { fontSize: 11, fontWeight: '700', color: '#fff', marginLeft: 3 },
  discPrice:       { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },


  /* ── Interest image cards ── */
  intStrip:        { paddingLeft: 20, paddingRight: 20, gap: 12 },
  intCard:         { width: 162, height: 210, borderRadius: 16, overflow: 'hidden' },
  intCardImg:      { width: '100%', height: '100%' },
  intCardCheck:    { position: 'absolute', top: 10, right: 10 },
  intCardIconWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 40, justifyContent: 'center', alignItems: 'center' },
  intCardContent:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  intCardLabel:    { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 19, marginBottom: 3, letterSpacing: -0.1 },
  intCardDesc:     { fontSize: 12, color: 'rgba(255,255,255,0.78)' },

  clearFilterBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, alignSelf: 'flex-start', marginLeft: 20 },
  clearFilterText: { fontSize: 12, color: C.onSurfaceVariant, fontWeight: '500' },

  /* ── Trusted by Explorers ── */
  statsSection:        { marginHorizontal: 20, marginTop: 40, padding: 24, backgroundColor: C.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statsSectionEyebrow: { fontSize: 10, fontWeight: '700', color: C.onSurfaceVariant, letterSpacing: 2, textAlign: 'center', marginBottom: 20 },
  statsRow:            { flexDirection: 'row', alignItems: 'center' },
  statItem:            { flex: 1, alignItems: 'center' },
  statNum:             { fontSize: 28, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  statLabel:           { fontSize: 11, color: C.onSurfaceVariant, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  statDivider:         { width: 1, height: 36, backgroundColor: C.outlineVariant },

  /* ── Why Wildvora (2×2 grid) ── */
  whySection: { marginTop: 40, paddingHorizontal: 20 },
  whyGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  whyCard:    { width: (width - 52) / 2, backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  whyCardIcon:{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  whyCardTitle:{ fontSize: 13, fontWeight: '700', color: C.onSurface, marginBottom: 4, letterSpacing: -0.1 },
  whyCardDesc: { fontSize: 11, color: C.onSurfaceVariant, lineHeight: 16 },

  /* kept for WhyRow component (defined, not rendered) */
  whyRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 15, gap: 14 },
  whyNum:     { fontSize: 11, fontWeight: '800', color: '#D1D5DB', letterSpacing: 0.5, width: 20 },
  whyIconDot: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  whyRowBody: { flex: 1 },
  whyRowTitle:{ fontSize: 14, fontWeight: '700', color: C.onSurface, marginBottom: 2 },
  whyRowDesc: { fontSize: 12, color: C.onSurfaceVariant, lineHeight: 17 },
  whyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.outlineVariant, marginHorizontal: 22 },

  /* ── ExperienceRow (defined, not rendered) ── */
  rowCard:    { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
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

  /* ── Empty states ── */
  emptyFull:     { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 12 },
  emptyFullTitle:{ fontSize: 17, fontWeight: '700', color: C.onSurface },
  emptyFullSub:  { fontSize: 13, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 19 },
  emptyBox:      { alignItems: 'center', paddingVertical: 32, gap: 10, backgroundColor: C.surface, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.outlineVariant },
  emptyText:     { fontSize: 13, color: C.onSurfaceVariant, textAlign: 'center' },

  /* ── Pro card ── */
  proCard:    { margin: 20, marginTop: 40, backgroundColor: C.primary, borderRadius: 20, padding: 28, alignItems: 'center' },
  proEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' },
  proTitle:   { fontSize: 26, fontWeight: '800', color: C.white, marginBottom: 10, letterSpacing: -0.5 },
  proBody:    { fontSize: 14, color: 'rgba(255,255,255,0.72)', textAlign: 'center', lineHeight: 22, marginBottom: 26 },
  proBtn:     { paddingVertical: 14, paddingHorizontal: 36, backgroundColor: C.white, borderRadius: 12 },
  proBtnText: { color: C.primary, fontWeight: '800', fontSize: 14 },

  /* ── Heart overlay (Instagram-style add animation) ── */
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── AI FAB ── */
  aiFab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
});
