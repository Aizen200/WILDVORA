import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { reviewAPI } from '../services/api';

const C = {
  primary:             '#1A5F45',
  primaryContainer:    '#338263',
  onPrimaryContainer:  '#f5fff7',
  secondary:           '#0a6687',
  background:          '#f7faf6',
  surface:             '#f7faf6',
  surfaceContainer:    '#ebefea',
  surfaceContainerLow: '#f1f4f0',
  white:               '#ffffff',
  onSurface:           '#181d1a',
  onSurfaceVariant:    '#3f4943',
  outline:             '#6f7a73',
  outlineVariant:      '#bec9c1',
};

const FILTERS = ['All'];

function Stars({ count, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <MaterialCommunityIcons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={size}
          color={i < count ? '#f59e0b' : C.outlineVariant}
        />
      ))}
    </View>
  );
}

function ReviewCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        {item.img
          ? <Image source={{ uri: item.img }} style={s.cardImg} resizeMode="cover" />
          : (
            <View style={[s.cardImg, { backgroundColor: C.surfaceContainer, justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="image-outline" size={24} color={C.outlineVariant} />
            </View>
          )
        }
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.location ? (
            <View style={s.cardMeta}>
              <MaterialCommunityIcons name="map-marker-outline" size={12} color={C.outline} />
              <Text style={s.cardLocation}>{item.location}</Text>
            </View>
          ) : null}
          <View style={s.cardRatingRow}>
            <Stars count={item.rating} />
            <Text style={s.cardDate}>{item.date}</Text>
          </View>
        </View>
      </View>

      {item.text ? (
        <>
          <Text style={s.cardText} numberOfLines={expanded ? undefined : 2}>
            {item.text}
          </Text>
          {item.text.length > 100 && (
            <TouchableOpacity onPress={() => setExpanded(p => !p)}>
              <Text style={s.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  );
}

export default function ReviewHistoryScreen({ navigation }) {
  const [active,  setActive]  = useState('All');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewAPI.getMy()
      .then(res => setReviews(res.data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered  = reviews;
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* App bar */}
      <View style={s.appBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.onSurfaceVariant} />
        </TouchableOpacity>
        <Text style={s.appBarTitle}>Review History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary banner */}
        <View style={s.banner}>
          <View style={s.bannerStat}>
            <Text style={s.bannerNum}>{reviews.length}</Text>
            <Text style={s.bannerLabel}>TOTAL REVIEWS</Text>
          </View>
          <View style={s.bannerDivider} />
          <View style={s.bannerStat}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={s.bannerNum}>{avgRating}</Text>
              {reviews.length > 0 && <MaterialCommunityIcons name="star" size={20} color={C.onPrimaryContainer + 'CC'} />}
            </View>
            <Text style={s.bannerLabel}>AVG RATING</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 48 }}>
          <View style={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.chip, active === f && s.chipActive]}
                onPress={() => setActive(f)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, active === f && s.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Cards */}
        <View style={s.list}>
          {loading ? (
            <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="star-off-outline" size={48} color={C.outlineVariant} />
              <Text style={s.emptyText}>You haven't written any reviews yet</Text>
            </View>
          ) : (
            filtered.map(item => (
              <ReviewCard
                key={item._id}
                item={{
                  id:       item._id,
                  title:    item.experience?.title || 'Experience',
                  location: item.experience?.location
                    ? `${item.experience.location.city || ''}, ${item.experience.location.country || ''}`.replace(/^, |, $/, '')
                    : '',
                  rating:   item.rating,
                  date:     new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                  text:     item.comment,
                  img:      item.experience?.images?.[0] || '',
                }}
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#f7faf6' },
  appBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f7faf6', borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '40' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },

  banner:      { margin: 20, backgroundColor: C.primaryContainer, borderRadius: 18, flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'space-around' },
  bannerStat:  { alignItems: 'center', flex: 1 },
  bannerNum:   { fontSize: 28, fontWeight: '800', color: C.onPrimaryContainer, letterSpacing: -0.5 },
  bannerLabel: { fontSize: 10, fontWeight: '700', color: C.onPrimaryContainer + '99', letterSpacing: 0.8, marginTop: 2 },
  bannerDivider: { width: 1, height: 40, backgroundColor: C.onPrimaryContainer + '25' },

  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  chip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, backgroundColor: C.white, borderWidth: 1, borderColor: C.outlineVariant + '60', marginRight: 8 },
  chipActive:{ backgroundColor: C.primary, borderColor: C.primary },
  chipText:  { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  chipTextActive: { color: '#ffffff' },

  list: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },

  card:       { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.outlineVariant + '40', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardTop:    { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardImg:    { width: 60, height: 60, borderRadius: 12 },
  cardInfo:   { flex: 1, justifyContent: 'center', gap: 3 },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.onSurface },
  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLocation:{ fontSize: 12, color: C.outline },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate:   { fontSize: 11, color: C.outline },
  cardText:   { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20 },
  readMore:   { fontSize: 12, fontWeight: '700', color: C.primary, marginTop: 4 },
  empty:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: C.outline, fontWeight: '500' },
});