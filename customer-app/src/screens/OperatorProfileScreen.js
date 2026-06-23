import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { hostAPI } from '../services/api';
import Alert from '../utils/alert';

const HERO_FALLBACK = require('../../assets/heroimage.png');

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const memberSinceYear = (iso) => {
  if (!iso) return null;
  return new Date(iso).getFullYear();
};

export default function OperatorProfileScreen({ route, navigation }) {
  const { hostId } = route.params;
  const insets = useSafeAreaInsets();

  const [host, setHost]             = useState(null);
  const [experiences, setExp]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [imgError, setImgError]     = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await hostAPI.getProfile(hostId);
        setHost(res.data.host);
        setExp(res.data.experiences);
        setStats(res.data.stats);
      } catch {
        Alert.alert('Error', 'Could not load operator profile');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [hostId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A5F45" />
      </View>
    );
  }
  if (!host) return null;

  const guestsLabel = stats.guestsHosted >= 500
    ? `${Math.floor(stats.guestsHosted / 100) * 100}+`
    : stats.guestsHosted >= 100
    ? `${Math.floor(stats.guestsHosted / 10) * 10}+`
    : `${stats.guestsHosted}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
          <Ionicons name="arrow-back" size={20} color="#1A5F45" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operator Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          {host.avatar
            ? <Image source={{ uri: host.avatar }} style={styles.avatar} />
            : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{getInitials(host.name)}</Text>
              </View>
            )
          }

          {/* Name + badges */}
          <Text style={styles.hostName}>{host.name}</Text>

          <View style={styles.badgesRow}>
            {host.verified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={13} color="#1A5F45" />
                <Text style={styles.verifiedText}>Verified Operator</Text>
              </View>
            )}
            {stats.avgRating > 0 && (
              <View style={styles.ratingBadge}>
                <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>{stats.avgRating}</Text>
              </View>
            )}
          </View>

          {/* Location + member since */}
          <View style={styles.metaRow}>
            {!!host.city && (
              <>
                <Ionicons name="location-outline" size={13} color="#888" />
                <Text style={styles.metaText}>{host.city}</Text>
                <Text style={styles.metaSep}>·</Text>
              </>
            )}
            {!!memberSinceYear(host.memberSince) && (
              <>
                <Ionicons name="calendar-outline" size={13} color="#888" />
                <Text style={styles.metaText}>Since {memberSinceYear(host.memberSince)}</Text>
              </>
            )}
          </View>
        </View>

        {/* ── Stats strip ── */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.experienceCount}</Text>
            <Text style={styles.statLabel}>Experiences</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgRating > 0 ? stats.avgRating : '–'}</Text>
            <Text style={styles.statLabel}>Avg rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{guestsLabel}</Text>
            <Text style={styles.statLabel}>Guests hosted</Text>
          </View>
        </View>

        {/* ── Bio ── */}
        {!!host.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{host.bio}</Text>
          </View>
        )}

        {/* ── Experiences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {experiences.length > 0 ? `Experiences (${experiences.length})` : 'Experiences'}
          </Text>

          {experiences.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="compass-outline" size={36} color="#D1D5DB" />
              <Text style={styles.emptyText}>No live experiences yet</Text>
            </View>
          ) : (
            experiences.map((exp) => {
              const cover = exp.coverImage || exp.images?.[0];
              const hasErr = imgError[exp._id];
              return (
                <TouchableOpacity
                  key={exp._id}
                  style={styles.expCard}
                  onPress={() => navigation.navigate('ExperienceDetail', { experienceId: exp._id })}
                  activeOpacity={0.85}
                >
                  <View style={styles.expImgWrap}>
                    <Image source={HERO_FALLBACK} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    {!hasErr && !!cover && (
                      <Image
                        source={{ uri: cover }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        onError={() => setImgError(p => ({ ...p, [exp._id]: true }))}
                      />
                    )}
                    {exp.isFeatured && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>Featured</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.expInfo}>
                    {exp.category && (
                      <Text style={styles.expCategory}>{exp.category.toUpperCase()}</Text>
                    )}
                    <Text style={styles.expTitle} numberOfLines={2}>{exp.title}</Text>

                    <View style={styles.expMeta}>
                      <Ionicons name="location-outline" size={12} color="#888" />
                      <Text style={styles.expMetaText}>{exp.location?.city}</Text>
                      <Text style={styles.expMetaSep}>·</Text>
                      <Ionicons name="time-outline" size={12} color="#888" />
                      <Text style={styles.expMetaText}>{exp.duration}</Text>
                    </View>

                    <View style={styles.expBottom}>
                      <View style={styles.expRatingRow}>
                        <Ionicons name="star" size={12} color="#1A5F45" />
                        <Text style={styles.expRating}>{exp.rating || '–'}</Text>
                        {exp.reviewCount > 0 && (
                          <Text style={styles.expReviews}>({exp.reviewCount})</Text>
                        )}
                      </View>
                      <Text style={styles.expPrice}>₹{exp.price}<Text style={styles.expPriceSub}>/person</Text></Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#f7faf8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } }),
  },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0faf5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

  /* Profile card */
  profileCard: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, paddingHorizontal: 20, marginBottom: 12 },
  avatar:          { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#cce0d8', marginBottom: 14 },
  avatarFallback:  { backgroundColor: '#1A5F45', justifyContent: 'center', alignItems: 'center' },
  avatarInitials:  { fontSize: 28, fontWeight: '700', color: '#fff' },
  hostName:        { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.3, marginBottom: 10, textAlign: 'center' },

  badgesRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#edf5f0', borderWidth: 1, borderColor: '#cce0d8' },
  verifiedText:  { fontSize: 12, fontWeight: '700', color: '#1A5F45' },
  ratingBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  ratingText:    { fontSize: 12, fontWeight: '700', color: '#b45309' },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#666' },
  metaSep:  { fontSize: 13, color: '#ccc' },

  /* Stats */
  statsStrip: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 16, marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 18,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 3 } }),
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  statLabel:   { fontSize: 11, color: '#888', marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#f0f0f0' },

  /* Section */
  section:      { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 18,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 3 } }),
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 14, letterSpacing: -0.2 },

  /* Bio */
  bioText: { fontSize: 14, color: '#555', lineHeight: 22 },

  /* Empty */
  emptyBox:  { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },

  /* Experience cards */
  expCard: {
    flexDirection: 'row', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e5ede9', marginBottom: 14, backgroundColor: '#fff',
  },
  expImgWrap:   { width: 110, height: 110 },
  featuredBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#1A5F45', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  featuredText:  { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  expInfo:       { flex: 1, padding: 12, justifyContent: 'space-between' },
  expCategory:   { fontSize: 10, fontWeight: '700', color: '#1A5F45', letterSpacing: 0.5, marginBottom: 3 },
  expTitle:      { fontSize: 14, fontWeight: '700', color: '#111', lineHeight: 19, marginBottom: 6 },
  expMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  expMetaText:   { fontSize: 11, color: '#888' },
  expMetaSep:    { fontSize: 11, color: '#ccc' },
  expBottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expRatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  expRating:     { fontSize: 12, fontWeight: '700', color: '#111' },
  expReviews:    { fontSize: 11, color: '#999' },
  expPrice:      { fontSize: 14, fontWeight: '800', color: '#111' },
  expPriceSub:   { fontSize: 11, fontWeight: '400', color: '#999' },
});
