import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Hiking', 'Camping', 'Photography', 'Kayaking', 'Wildlife', 'Trekking', 'Safari'];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Oct 2023 starts on Sunday (index 6 in Mon-first grid → 6 empty cells)
// We show a few prev-month days + current month days
const CALENDAR = [
  { n: 25, prev: true }, { n: 26, prev: true }, { n: 27, prev: true },
  { n: 28, prev: true }, { n: 29, prev: true }, { n: 30, prev: true },
  { n: 1  }, { n: 2  }, { n: 3  }, { n: 4  }, { n: 5  }, { n: 6  }, { n: 7  },
  { n: 8  }, { n: 9  }, { n: 10 },
];

const INIT_AVAILABLE = [1, 4, 8]; // green days shown in screenshot

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateEditListing({ editListing, setListings, setActiveTab }) {
  const isEdit = !!editListing;

  /* form state */
  const [title,      setTitle]      = useState(editListing?.title      ?? '');
  const [desc,       setDesc]       = useState(editListing?.description ?? '');
  const [category,   setCategory]   = useState(editListing?.category   ?? 'Hiking');
  const [price,      setPrice]      = useState(editListing?.price      ? String(editListing.price) : '');
  const [available,  setAvailable]  = useState([...INIT_AVAILABLE]);

  /* toggle a calendar day */
  const toggleDay = (n) =>
    setAvailable(prev => prev.includes(n) ? prev.filter(d => d !== n) : [...prev, n]);

  /* save */
  const handleSave = () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Missing fields', 'Please enter a title and price.'); return;
    }
    const entry = {
      id: editListing?.id ?? String(Date.now()),
      title, description: desc, category,
      price: Number(price), status: editListing?.status ?? 'draft',
      groupSizeMin: editListing?.groupSizeMin ?? 1,
      groupSizeMax: editListing?.groupSizeMax ?? 10,
      inclusions: editListing?.inclusions ?? '',
      exclusions: editListing?.exclusions ?? '',
      cancellationPolicy: editListing?.cancellationPolicy ?? '',
      photos: [], availability: available,
    };
    if (isEdit) {
      setListings(prev => prev.map(l => l.id === entry.id ? entry : l));
    } else {
      setListings(prev => [...prev, entry]);
    }
    Alert.alert('Saved', isEdit ? 'Listing updated.' : 'Draft saved.');
    setActiveTab('listings');
  };

  return (
    <View style={styles.root}>
      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step progress ── */}
        <View style={styles.progressWrap}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressStep}>Step 1 of 4</Text>
            <Text style={styles.progressName}>Basic Information</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressBar} />
          </View>
        </View>

        {/* ══════════ CARD 1 — Experience Basics ══════════ */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Experience Basics</Text>

          {/* Title */}
          <Text style={styles.label}>Experience Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Coastal Ridge Sunset Hike"
            placeholderTextColor="#BEC9C1"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          {/* Description */}
          <Text style={[styles.label, { marginTop: 18 }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Tell adventurers what makes this experience unique..."
            placeholderTextColor="#BEC9C1"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* ══════════ CARD 2 — Category ══════════ */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Select Category</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map(cat => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ══════════ CARD 3 — Pricing ══════════ */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pricing</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>$</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0.00"
              placeholderTextColor="#BEC9C1"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.priceHint}>Per person, including gear.</Text>
        </View>

        {/* ══════════ CARD 4 — Photos ══════════ */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Photos</Text>
          <TouchableOpacity style={styles.photoBox} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={38} color="#BEC9C1" />
            <Text style={styles.photoBoxText}>Upload Cover</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════ CARD 5 — Availability Calendar ══════════ */}
        <View style={styles.card}>
          {/* Calendar header */}
          <View style={styles.calHeader}>
            <Text style={styles.cardHeading} numberOfLines={1}>Availability</Text>
            <View style={styles.calNav}>
              <TouchableOpacity style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color="#6F7A73" />
              </TouchableOpacity>
              <Text style={styles.calMonth}>October 2023</Text>
              <TouchableOpacity style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color="#6F7A73" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.calRow}>
            {WEEK_DAYS.map((d, i) => (
              <View key={i} style={styles.calCell}>
                <Text style={styles.calWeekDay}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.calRow}>
            {CALENDAR.map((d, i) => {
              const isAvail = !d.prev && available.includes(d.n);
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.calCell,
                    styles.calDayCell,
                    d.prev   && styles.calDayCellPrev,
                    isAvail  && styles.calDayCellAvail,
                  ]}
                  onPress={() => !d.prev && toggleDay(d.n)}
                  activeOpacity={d.prev ? 1 : 0.7}
                >
                  <Text style={[
                    styles.calDayText,
                    d.prev  && styles.calDayTextPrev,
                    isAvail && styles.calDayTextAvail,
                  ]}>
                    {d.n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.calLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#338263' }]} />
              <Text style={styles.legendLabel}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {
                backgroundColor: '#F0F3FF',
                borderWidth: 1, borderColor: '#BEC9C1',
              }]} />
              <Text style={styles.legendLabel}>Unavailable</Text>
            </View>
          </View>
        </View>

        {/* bottom spacer so content isn't under footer */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Fixed footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBack}
          onPress={() => setActiveTab('listings')}
        >
          <Text style={styles.footerBackText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerNext} onPress={handleSave}>
          <Text style={styles.footerNextText}>
            {isEdit ? 'Update Listing' : 'Next Step'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BEIGE   = '#F7F4EE';   // warm bg matching screenshot
const WHITE   = '#FFFFFF';
const PRIMARY = '#11694B';
const PRIMARY_CONTAINER = '#338263';
const ON_PC   = '#F5FFF7';
const OUTLINE = '#BEC9C1';
const TEXT    = '#111C2D';
const MUTED   = '#3F4943';
const LIGHT   = '#6F7A73';
const SURF_LO = '#F0F3FF';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BEIGE },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },

  /* Progress */
  progressWrap:  { marginBottom: 20 },
  progressMeta:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressStep:  { color: PRIMARY, fontSize: 13, fontWeight: '700' },
  progressName:  { color: LIGHT, fontSize: 13 },
  progressTrack: {
    height: 6, backgroundColor: SURF_LO, borderRadius: 99, overflow: 'hidden',
  },
  progressBar: {
    width: '25%', height: '100%', backgroundColor: PRIMARY, borderRadius: 99,
  },

  /* Card */
  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  cardHeading: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },

  /* Inputs */
  label: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#F9F9FF',
    borderWidth: 1,
    borderColor: OUTLINE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: TEXT,
    fontSize: 14,
  },
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },

  /* Category chips */
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: SURF_LO,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: PRIMARY_CONTAINER,
    borderColor: PRIMARY_CONTAINER,
  },
  chipText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: ON_PC,
  },

  /* Price */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FF',
    borderWidth: 1,
    borderColor: OUTLINE,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  priceCurrency: {
    color: MUTED,
    fontSize: 22,
    fontWeight: '500',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 13,
    color: TEXT,
    fontSize: 22,
    fontWeight: '700',
  },
  priceHint: {
    color: LIGHT,
    fontSize: 12,
    marginTop: 6,
  },

  /* Photo upload */
  photoBox: {
    height: 150,
    backgroundColor: '#F9F9FF',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: OUTLINE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  photoBoxText: {
    color: LIGHT,
    fontSize: 14,
    fontWeight: '600',
  },

  /* Calendar */
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: { padding: 6, borderRadius: 99 },
  calMonth: { color: MUTED, fontSize: 13, fontWeight: '600' },

  calRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  calWeekDay: {
    color: LIGHT,
    fontSize: 12,
    fontWeight: '600',
  },
  calDayCell: {
    aspectRatio: 1,
    borderRadius: 10,
  },
  calDayCellPrev: {
    opacity: 0.3,
  },
  calDayCellAvail: {
    backgroundColor: PRIMARY_CONTAINER,
  },
  calDayText: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '500',
  },
  calDayTextPrev: {
    color: OUTLINE,
  },
  calDayTextAvail: {
    color: ON_PC,
    fontWeight: '700',
  },

  calLegend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { color: MUTED, fontSize: 12 },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: 'rgba(249,249,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 10,
  },
  footerBack: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerBackText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: '600',
  },
  footerNext: {
    backgroundColor: PRIMARY,
    borderRadius: 99,
    paddingHorizontal: 36,
    paddingVertical: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footerNextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});