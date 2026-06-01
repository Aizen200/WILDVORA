import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList,
} from 'react-native';
import Alert from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ExperienceDetailScreen({ route, navigation }) {
  const { experienceId } = route.params;
  const { user } = useAuth();
  const [experience, setExperience] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [expRes, revRes] = await Promise.all([
          experienceAPI.getOne(experienceId),
          reviewAPI.getForExperience(experienceId),
        ]);
        setExperience(expRes.data.experience);
        setReviews(revRes.data.reviews);
        // Check wishlist
        if (user?.wishlist) {
          setInWishlist(user.wishlist.some((w) => w._id === experienceId || w === experienceId));
        }
      } catch (err) {
        Alert.alert('Error', 'Could not load experience');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [experienceId]);

  const handleWishlist = async () => {
    try {
      await userAPI.toggleWishlist(experienceId);
      setInWishlist((prev) => !prev);
    } catch {
      Alert.alert('Error', 'Could not update wishlist');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#111" /></View>;
  if (!experience) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image placeholder */}
        <View style={styles.hero}>
          <Text style={styles.heroText}>{experience.category}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.wishBtn} onPress={handleWishlist}>
            <Text style={styles.wishBtnText}>{inWishlist ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title and location */}
          <Text style={styles.title}>{experience.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>📍 {experience.location?.city}, {experience.location?.country}</Text>
            <Text style={styles.rating}>★ {experience.rating} ({experience.reviewCount})</Text>
          </View>

          {/* Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {[experience.duration, experience.difficulty, experience.category].map((tag) => (
              <View key={tag} style={styles.pill}><Text style={styles.pillText}>{tag}</Text></View>
            ))}
            {experience.hostVerified && (
              <View style={[styles.pill, styles.pillVerified]}><Text style={styles.pillTextVerified}>✓ Verified</Text></View>
            )}
          </ScrollView>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{experience.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{experience.reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{experience.maxGroupSize}</Text>
              <Text style={styles.statLabel}>Max group</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>The Experience</Text>
          <Text style={styles.description}>{experience.description}</Text>

          {/* What's included */}
          {experience.includes?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>What's Included</Text>
              {experience.includes.map((item, i) => (
                <Text key={i} style={styles.includeItem}>✓  {item}</Text>
              ))}
            </>
          )}

          {/* Host */}
          <View style={styles.divider} />
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}><Text style={styles.hostAvatarText}>{experience.hostName?.[0]}</Text></View>
            <View>
              <Text style={styles.hostName}>{experience.hostName}</Text>
              <Text style={styles.hostSub}>{experience.hostVerified ? '✓ Verified Host' : 'Host'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Reviews */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Text style={styles.sectionLink}>★ {experience.rating} · {experience.reviewCount} reviews</Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
          ) : (
            reviews.slice(0, 3).map((r) => (
              <View key={r._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{r.userName || r.user?.name}</Text>
                  <Text style={styles.reviewRating}>{'★'.repeat(r.rating)}</Text>
                </View>
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrice}>${experience.price}</Text>
          <Text style={styles.footerPriceSub}>per person</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', { experience })}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { height: 240, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  heroText: { fontSize: 16, color: '#888', fontWeight: '600' },
  backBtn: { position: 'absolute', top: 12, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  backBtnText: { fontSize: 18, color: '#111' },
  wishBtn: { position: 'absolute', top: 12, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  wishBtnText: { fontSize: 18 },
  body: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  meta: { fontSize: 13, color: '#666' },
  rating: { fontSize: 13, color: '#555', fontWeight: '600' },
  pillRow: { marginBottom: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', marginRight: 8, backgroundColor: '#fff' },
  pillText: { fontSize: 12, color: '#555' },
  pillVerified: { borderColor: '#111', backgroundColor: '#F0F0F0' },
  pillTextVerified: { fontSize: 12, color: '#111', fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#F8F8F8', borderRadius: 10, padding: 14, marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 8 },
  description: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 },
  includeItem: { fontSize: 14, color: '#444', marginBottom: 6 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  hostAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  hostName: { fontSize: 15, fontWeight: '600', color: '#111' },
  hostSub: { fontSize: 12, color: '#888', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLink: { fontSize: 13, color: '#555' },
  noReviews: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  reviewCard: { borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 12, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: '#111' },
  reviewRating: { color: '#F0992C', fontSize: 13 },
  reviewText: { fontSize: 13, color: '#555', lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#fff' },
  footerPrice: { fontSize: 22, fontWeight: '700', color: '#111' },
  footerPriceSub: { fontSize: 12, color: '#888' },
  bookBtn: { backgroundColor: '#111', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});