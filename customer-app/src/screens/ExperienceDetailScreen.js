import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { experienceAPI, reviewAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Alert from '../utils/alert';

export default function ExperienceDetailScreen({ route, navigation }) {
  const { experienceId } = route.params;
  const { user } = useAuth();
  const [experience, setExperience] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [readMore, setReadMore] = useState(false);

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#11694b" /></View>;
  if (!experience) return null;

  // Exact cinematic image URLs from the user HTML specification
  const heroImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWD971kShMZZtm1tqLB1M4tT3C06H-IIw4sAIM6q8Is0Z9f0vV3ghGpyKWw2nsI4RtbB5uFyLJ5KVbQBPqQZ6gfNwyC1lom8RMKstswmSXAi0R33J96h_T0nlJ7drHXfktm54c2af9pWrWq-mvNbCkov7u8y65OtgNfN26r9q0XApuM_gY2XgxZLsXXkdn9w-FJhi7TZIApYrX9KkoguY-CxCc-IZM5n1re5sZpl6C3J0RkedcQGyLBdqfw99XC6CuwtXrTw8BrHI';
  const hostAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxvAqhiKslj3TU3hkTN0aTpyErN45FaI1bC5dTIh145GMLa5MKJKC-y_PZLsWw2boHuKnNn852nWapfByDXJIYTSyYA4OzkCrrq4T-VIDhRdkQMMOYzQgl1iE_FybIikOHI2SgX6h0Xs0NqxpfGGwKfS1jLl-sAWDpfnTdsWhsljtlNN1CjlKjGbpVNIJUOl0UB3dZxDiXjE4hKH6Qp18eU17iLI5YCVvtp11ej88ZBVBYmVoRXHQwkvdSJV2HoH5FvbNleuMCDFg';

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#11694b" style={{ marginRight: 2 }} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={14} color="#11694b" style={{ marginRight: 2 }} />);
      }
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          
          {/* Header Controls */}
          <View style={styles.headerControls}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#11694b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={handleWishlist}>
              <Ionicons 
                name={inWishlist ? "heart" : "heart-outline"} 
                size={20} 
                color={inWishlist ? "#ba1a1a" : "#11694b"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Canvas */}
        <View style={styles.body}>
          {/* Title & Tags */}
          <View style={styles.metaSection}>
            <View style={styles.tagsRow}>
              <View style={[styles.tag, styles.tagBlue]}>
                <Text style={styles.tagBlueText}>High Altitude</Text>
              </View>
              <View style={[styles.tag, styles.tagTerracotta]}>
                <Text style={styles.tagTerracottaText}>2-Day Trek</Text>
              </View>
            </View>
            <Text style={styles.title}>{experience.title || 'Sunrise Peak Trek & High-Altitude Camping'}</Text>
            
            <View style={styles.ratingLocationRow}>
              <View style={styles.ratingCol}>
                <Ionicons name="star" size={16} color="#11694b" />
                <Text style={styles.ratingNum}>{experience.rating || '4.9'}</Text>
                <Text style={styles.reviewCount}>({experience.reviewCount || '124'} reviews)</Text>
              </View>
              <View style={styles.locationCol}>
                <Ionicons name="location" size={16} color="#11694b" />
                <Text style={styles.locationText}>{experience.location?.city || 'Cascades'}, {experience.location?.country || 'WA'}</Text>
              </View>
            </View>
          </View>

          {/* Host Profile */}
          <View style={styles.hostCard}>
            <View style={styles.hostInfo}>
              <Image source={{ uri: hostAvatar }} style={styles.avatar} />
              <View style={styles.hostMeta}>
                <Text style={styles.hostName}>{experience.hostName || 'Alex Explorer'}</Text>
                <View style={styles.verifiedRow}>
                  <MaterialIcons name="verified" size={14} color="#11694b" />
                  <Text style={styles.verifiedText}>Verified Host</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn}>
              <Text style={styles.contactBtnText}>Contact</Text>
            </TouchableOpacity>
          </View>

          {/* The Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Experience</Text>
            <Text style={styles.description} numberOfLines={readMore ? undefined : 3}>
              {experience.description || 'Embark on a soul-stirring journey into the heart of the Cascades. This 2-day expedition isn\'t just a trek; it\'s an immersion into the wild silence of high altitudes. We begin our ascent through ancient evergreen forests, emerging onto sub-alpine meadows before reaching our private basecamp situated directly below the jagged peaks of Sunrise Crest.'}
            </Text>
            <TouchableOpacity onPress={() => setReadMore(!readMore)} style={styles.readMoreBtn}>
              <Text style={styles.readMoreText}>{readMore ? 'Read less' : 'Read more'}</Text>
              <Ionicons 
                name={readMore ? "chevron-up" : "chevron-down"} 
                size={14} 
                color="#11694b" 
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>

          {/* Bento Grid Highlights */}
          <View style={styles.bentoGrid}>
            <View style={styles.bentoItem}>
              <MaterialCommunityIcons name="flag-outline" size={24} color="#11694b" style={styles.bentoIcon} />
              <Text style={styles.bentoText}>12km Hike</Text>
            </View>
            <View style={styles.bentoItem}>
              <MaterialCommunityIcons name="elevation-rise" size={24} color="#11694b" style={styles.bentoIcon} />
              <Text style={styles.bentoText}>2,400m Peak</Text>
            </View>
            <View style={styles.bentoItem}>
              <Ionicons name="restaurant-outline" size={24} color="#11694b" style={styles.bentoIcon} />
              <Text style={styles.bentoText}>All Meals</Text>
            </View>
            <View style={styles.bentoItem}>
              <MaterialCommunityIcons name="tent" size={24} color="#11694b" style={styles.bentoIcon} />
              <Text style={styles.bentoText}>Gear Included</Text>
            </View>
          </View>

          {/* Adventurer Reviews */}
          <View style={[styles.section, styles.borderTop]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Adventurer Reviews</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.reviewGrid}>
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={{ flexDirection: 'row' }}>{renderStars(5)}</View>
                    <Text style={styles.reviewDate}>2 days ago</Text>
                  </View>
                  <Text style={styles.reviewComment}>"The sunrise was life-changing. Alex is an incredible guide who knows every rock on that mountain. Highly recommend for any serious hiker."</Text>
                  <Text style={styles.reviewAuthor}>— Sarah M.</Text>
                </View>
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={{ flexDirection: 'row' }}>{renderStars(5)}</View>
                    <Text style={styles.reviewDate}>1 week ago</Text>
                  </View>
                  <Text style={styles.reviewComment}>"Expertly organized. The food was surprisingly good for being at 2000 meters altitude. A perfect mix of challenge and comfort."</Text>
                  <Text style={styles.reviewAuthor}>— James L.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.reviewGrid}>
                {reviews.slice(0, 2).map((r) => (
                  <View key={r._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={{ flexDirection: 'row' }}>{renderStars(r.rating)}</View>
                      <Text style={styles.reviewDate}>{r.createdAt?.split('T')[0] || 'Recently'}</Text>
                    </View>
                    <Text style={styles.reviewComment}>"{r.comment}"</Text>
                    <Text style={styles.reviewAuthor}>— {r.userName || r.user?.name || 'Anonymous'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer CTA */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.priceRow}>
            <Text style={styles.footerPrice}>${experience.price || '240'}</Text>
            <Text style={styles.footerPriceSub}>/ person</Text>
          </View>
          <TouchableOpacity style={styles.viewDatesBtn} onPress={() => navigation.navigate('Booking', { experience })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.viewDatesText}>View dates</Text>
              <Ionicons name="calendar-outline" size={13} color="#11694b" />
            </View>
          </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: '#f7faf6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7faf6' },
  heroContainer: { height: 360, width: '100%', position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 80,
    backgroundColor: '#f7faf6',
    opacity: 0.85,
  },
  headerControls: {
    position: 'absolute',
    top: 16, left: 16, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { cursor: 'pointer', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
    })
  },
  body: { paddingHorizontal: 16, marginTop: -20 },
  metaSection: { marginBottom: 20 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  tagBlue: { backgroundColor: 'rgba(146, 216, 254, 0.2)' },
  tagBlueText: { color: '#005f7f', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Quicksand' },
  tagTerracotta: { backgroundColor: 'rgba(255, 218, 216, 0.25)' },
  tagTerracottaText: { color: '#753231', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Quicksand' },
  title: { fontSize: 24, fontWeight: '700', color: '#181d1a', lineHeight: 32, marginBottom: 8, fontFamily: 'Quicksand' },
  ratingLocationRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  ratingCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum: { fontSize: 14, fontWeight: '700', color: '#181d1a', fontFamily: 'Quicksand' },
  reviewCount: { fontSize: 12, color: '#6f7a73', fontFamily: 'Quicksand' },
  locationCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, color: '#3f4943', fontWeight: '500', fontFamily: 'Quicksand' },
  hostCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f4f0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.3)',
    marginBottom: 24,
  },
  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(17, 105, 75, 0.2)' },
  hostMeta: { gap: 2 },
  hostName: { fontSize: 16, fontWeight: '700', color: '#181d1a', fontFamily: 'Quicksand' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 12, color: '#11694b', fontWeight: '600', fontFamily: 'Quicksand' },
  contactBtn: {
    borderWidth: 1, borderColor: '#11694b',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  contactBtnText: { fontSize: 13, color: '#11694b', fontWeight: '600', fontFamily: 'Quicksand' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#181d1a', marginBottom: 10, fontFamily: 'Quicksand' },
  description: { fontSize: 14, color: '#3f4943', lineHeight: 22, fontFamily: 'Quicksand' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 6, ...Platform.select({ web: { cursor: 'pointer' } }) },
  readMoreText: { fontSize: 13, color: '#11694b', fontWeight: '700', textDecorationLine: 'underline', fontFamily: 'Quicksand' },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  bentoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(224, 227, 223, 0.3)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.2)',
  },
  bentoIcon: { marginBottom: 6 },
  bentoText: { fontSize: 13, fontWeight: '600', color: '#181d1a', fontFamily: 'Quicksand' },
  borderTop: { borderTopWidth: 1, borderTopColor: 'rgba(190, 201, 193, 0.3)', paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText: { fontSize: 14, color: '#11694b', fontWeight: '700', fontFamily: 'Quicksand' },
  reviewGrid: { gap: 12 },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(190, 201, 193, 0.2)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 }
    })
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewDate: { fontSize: 11, color: '#6f7a73', fontFamily: 'Quicksand' },
  reviewComment: { fontSize: 13, color: '#3f4943', fontStyle: 'italic', lineHeight: 18, marginBottom: 8, fontFamily: 'Quicksand' },
  reviewAuthor: { fontSize: 12, fontWeight: '600', color: '#181d1a', fontFamily: 'Quicksand' },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 80,
    backgroundColor: 'rgba(247, 250, 246, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(190, 201, 193, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  footerLeft: { gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  footerPrice: { fontSize: 22, fontWeight: '700', color: '#181d1a', fontFamily: 'Quicksand' },
  footerPriceSub: { fontSize: 12, color: '#3f4943', fontFamily: 'Quicksand' },
  viewDatesBtn: { ...Platform.select({ web: { cursor: 'pointer' } }) },
  viewDatesText: { fontSize: 12, color: '#11694b', fontWeight: '700', fontFamily: 'Quicksand' },
  bookBtn: {
    backgroundColor: '#11694b',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 36,
    shadowColor: '#11694b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({ web: { cursor: 'pointer' } })
  },
  bookBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15, fontFamily: 'Quicksand' },
});