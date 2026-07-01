import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const C = {
  primary:             '#1A5F45',
  background:          '#f7faf6',
  surface:             '#ffffff',
  surfaceContainerLow: '#f1f4f0',
  surfaceContainer:    '#ebefea',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
  error:               '#ba1a1a',
};

const CATEGORY_IMAGES = {
  Trekking:      'https://images.unsplash.com/photo-1551632811-561730d1e4a6?auto=format&fit=crop&w=400&q=80',
  Camping:       'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80',
  'Water Sports':'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=400&q=80',
  Jungle:        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
  Cycling:       'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
  Climbing:      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=400&q=80',
  Safari:        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=400&q=80',
  Skiing:        'https://images.unsplash.com/photo-1482867996988-2faec3cbb4f9?auto=format&fit=crop&w=400&q=80',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80';

// ── Per-card component so each card holds its own animation refs ──────────────
function WishlistCard({ item, onNavigate, onRemove }) {
  const heartBtnScale = useRef(new Animated.Value(1)).current;
  const cardOpacity   = useRef(new Animated.Value(1)).current;

  const imgUri = item.images?.[0] || CATEGORY_IMAGES[item.category] || FALLBACK_IMG;

  const handleRemoveTap = () => {
    // 1. Bounce the heart: scale up then snap to 0
    Animated.sequence([
      Animated.spring(heartBtnScale, {
        toValue: 1.5, tension: 400, friction: 5, useNativeDriver: true,
      }),
      Animated.spring(heartBtnScale, {
        toValue: 0, tension: 300, friction: 10, useNativeDriver: true,
      }),
    ]).start();

    // 2. Fade out the whole card, then fire remove callback
    setTimeout(() => {
      Animated.timing(cardOpacity, {
        toValue: 0, duration: 240, useNativeDriver: true,
      }).start(() => onRemove(item._id));
    }, 160);
  };

  return (
    <Animated.View style={{ opacity: cardOpacity }}>
      <TouchableOpacity
        style={s.card}
        onPress={() => onNavigate(item._id)}
        activeOpacity={0.88}
      >
        {/* Image */}
        <View style={s.cardImgWrap}>
          <Image source={{ uri: imgUri }} style={s.cardImg} resizeMode="cover" />
          <View style={s.categoryBadge}>
            <Text style={s.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={s.cardMetaRow}>
            <Ionicons name="location-outline" size={13} color={C.outline} />
            <Text style={s.cardMeta}>{item.location?.city}, {item.location?.country}</Text>
          </View>
          <View style={s.cardFooter}>
            <Text style={s.cardPrice}>
              <Text style={s.cardPriceNum}>₹{item.price}</Text>
              <Text style={s.cardPriceSub}>/person</Text>
            </Text>
            {item.rating > 0 && (
              <View style={s.ratingRow}>
                <Ionicons name="star" size={12} color={C.primary} />
                <Text style={s.ratingText}>{item.rating}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Remove button — heart bounces then disappears */}
        <TouchableOpacity
          style={s.removeBtn}
          onPress={handleRemoveTap}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={{ transform: [{ scale: heartBtnScale }] }}>
            <Ionicons name="heart" size={22} color={C.error} />
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function WishlistScreen({ navigation }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading]   = useState(!user ? false : true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await userAPI.getProfile();
        setWishlist(res.data.user.wishlist || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const handleRemove = async (id) => {
    await userAPI.toggleWishlist(id);
    setWishlist((prev) => prev.filter((e) => e._id !== id));
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.title}>My Wishlist</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.guestWrap}>
          <MaterialCommunityIcons name="heart-outline" size={64} color={C.outlineVariant} />
          <Text style={s.guestTitle}>Save adventures for later</Text>
          <Text style={s.guestSub}>Create an account to save your favourite experiences and access them anytime.</Text>
          <TouchableOpacity style={s.guestPrimaryBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.87}>
            <Text style={s.guestPrimaryBtnText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.guestSecondaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.87}>
            <Text style={s.guestSecondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>My Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(i) => i._id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <WishlistCard
            item={item}
            onNavigate={(id) => navigation.navigate('ExperienceDetail', { experienceId: id })}
            onRemove={handleRemove}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={56}
              color={C.outlineVariant}
              style={{ marginBottom: 16 }}
            />
            <Text style={s.emptyTitle}>No saved experiences</Text>
            <Text style={s.emptyText}>
              Tap the heart icon on any experience to save it here.
            </Text>
            <TouchableOpacity
              style={s.exploreBtn}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.85}
            >
              <Text style={s.exploreBtnText}>Explore Experiences</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.background,
    borderBottomWidth: 1, borderBottomColor: 'rgba(190,201,193,0.3)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(190,201,193,0.25)',
    overflow: 'hidden',
    marginBottom: 14,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },

  cardImgWrap:   { width: 110, height: 100, position: 'relative' },
  cardImg:       { width: '100%', height: '100%' },
  categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(17,105,75,0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  cardBody:    { flex: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: C.onSurface, marginBottom: 4 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  cardMeta:    { fontSize: 12, color: C.outline },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPrice:   {},
  cardPriceNum:{ fontSize: 15, fontWeight: '700', color: C.primary },
  cardPriceSub:{ fontSize: 11, color: C.outline, fontWeight: '400' },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:  { fontSize: 12, fontWeight: '700', color: C.onSurface },

  removeBtn: { paddingHorizontal: 14 },

  empty: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: 32,
  },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: C.onSurface, marginBottom: 8 },
  emptyText:      { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  exploreBtn:     { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 28, ...Platform.select({ ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 }, android: { elevation: 3 } }) },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  guestWrap:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 0 },
  guestTitle:        { fontSize: 20, fontWeight: '800', color: C.onSurface, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  guestSub:          { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  guestPrimaryBtn:   { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, marginBottom: 12, alignSelf: 'stretch', alignItems: 'center' },
  guestPrimaryBtnText:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  guestSecondaryBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, alignSelf: 'stretch', alignItems: 'center' },
  guestSecondaryBtnText: { fontSize: 15, fontWeight: '700', color: C.primary },
});
