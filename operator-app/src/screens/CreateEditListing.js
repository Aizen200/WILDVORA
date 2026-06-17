import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI } from '../services/api';

const CATEGORIES = ['Camping', 'Trekking', 'Water Sports', 'Jungle', 'Cycling', 'Climbing', 'Safari', 'Skiing'];
const DIFFICULTIES = ['Easy', 'Moderate', 'Hard', 'Expert'];
const DURATIONS = ['1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days', '2 weeks', '1 month'];

export default function CreateEditListing({ editListing, onSaveSuccess, setActiveTab }) {
  const isEdit     = !!editListing;
  const isRejected = isEdit && ['rejected', 'changes_requested'].includes(editListing?.status);

  const [title,       setTitle]       = useState(editListing?.title           ?? '');
  const [desc,        setDesc]        = useState(editListing?.description     ?? '');
  const [category,    setCategory]    = useState(editListing?.category        ?? 'Camping');
  const [city,        setCity]        = useState(editListing?.location?.city  ?? '');
  const [country,     setCountry]     = useState(editListing?.location?.country ?? '');
  const [price,       setPrice]       = useState(editListing?.price           ? String(editListing.price) : '');
  const [duration,    setDuration]    = useState(editListing?.duration        ?? '1 day');
  const [difficulty,  setDifficulty]  = useState(editListing?.difficulty      ?? 'Moderate');
  const [maxGroup,    setMaxGroup]    = useState(editListing?.maxGroupSize    ? String(editListing.maxGroupSize) : '12');
  const [includes,    setIncludes]    = useState(
    Array.isArray(editListing?.includes) ? editListing.includes.join(', ') : ''
  );
  const [exclusions,  setExclusions]  = useState(
    Array.isArray(editListing?.exclusions) ? editListing.exclusions.join(', ') : ''
  );
  const [dates,       setDates]       = useState(
    Array.isArray(editListing?.availableDates) ? editListing.availableDates.join(', ') : ''
  );
  const [imageUrl,    setImageUrl]    = useState(editListing?.images?.[0]     ?? '');
  const [saving,      setSaving]      = useState(false);

  const parseCSV = (str) =>
    str.split(',').map(s => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!title.trim())   { Alert.alert('Missing', 'Please enter a title.'); return; }
    if (!desc.trim())    { Alert.alert('Missing', 'Please enter a description.'); return; }
    if (!city.trim())    { Alert.alert('Missing', 'Please enter a city.'); return; }
    if (!country.trim()) { Alert.alert('Missing', 'Please enter a country.'); return; }
    if (!price.trim() || isNaN(Number(price))) { Alert.alert('Missing', 'Please enter a valid price.'); return; }

    const payload = {
      title:              title.trim(),
      description:        desc.trim(),
      category,
      location:           { city: city.trim(), country: country.trim() },
      price:              Number(price),
      duration,
      difficulty,
      maxGroupSize:       Number(maxGroup) || 12,
      includes:           parseCSV(includes),
      exclusions:         parseCSV(exclusions),
      availableDates:     parseCSV(dates),
      images:             imageUrl.trim() ? [imageUrl.trim()] : [],
    };

    setSaving(true);
    try {
      if (isEdit) {
        await operatorAPI.editListing(editListing._id, payload);
        const msg = isRejected
          ? 'Your listing has been updated and resubmitted for admin review.'
          : 'Listing updated and submitted for admin review.';
        Alert.alert('Success', msg);
      } else {
        await operatorAPI.createListing(payload);
        Alert.alert('Submitted!', 'Your listing has been submitted for admin review. It will appear in the customer app once approved.');
      }
      onSaveSuccess();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitLabel = isRejected
    ? 'Update & Resubmit'
    : isEdit
    ? 'Submit for Review'
    : 'Submit for Review';

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={PRIMARY} />
          <Text style={s.infoText}>
            {isRejected
              ? `Address the admin feedback and resubmit. Reason: "${editListing?.rejectionReason}"`
              : 'New listings are submitted for admin review. Once approved they appear in the customer app.'}
          </Text>
        </View>

        {/* ── Card 1: Basics ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Experience Basics</Text>

          <Text style={s.label}>Title *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Himalayan Trek – 5 Days"
            placeholderTextColor={OUTLINE}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          <Text style={[s.label, { marginTop: 16 }]}>Description *</Text>
          <TextInput
            style={[s.input, s.multiline]}
            placeholder="Tell adventurers what makes this experience unique..."
            placeholderTextColor={OUTLINE}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* ── Card 2: Location ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Location</Text>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>City *</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., Manali"
                placeholderTextColor={OUTLINE}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Country *</Text>
              <TextInput
                style={s.input}
                placeholder="e.g., India"
                placeholderTextColor={OUTLINE}
                value={country}
                onChangeText={setCountry}
              />
            </View>
          </View>
        </View>

        {/* ── Card 3: Category ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Category</Text>
          <View style={s.chipWrap}>
            {CATEGORIES.map(cat => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Card 4: Pricing & Duration ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Pricing & Duration</Text>

          <Text style={s.label}>Price per person (₹) *</Text>
          <View style={s.priceRow}>
            <Text style={s.priceCurrency}>₹</Text>
            <TextInput
              style={s.priceInput}
              placeholder="0"
              placeholderTextColor={OUTLINE}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>Duration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DURATIONS.map(d => {
                const active = duration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setDuration(d)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text style={[s.label, { marginTop: 16 }]}>Difficulty</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {DIFFICULTIES.map(d => {
              const active = difficulty === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[s.chip, active && s.chipActive]}
                  onPress={() => setDifficulty(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.label, { marginTop: 16 }]}>Max Group Size</Text>
          <TextInput
            style={s.input}
            placeholder="12"
            placeholderTextColor={OUTLINE}
            value={maxGroup}
            onChangeText={setMaxGroup}
            keyboardType="number-pad"
          />
        </View>

        {/* ── Card 5: Inclusions / Exclusions ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Inclusions & Exclusions</Text>
          <Text style={s.label}>What's included (comma-separated)</Text>
          <TextInput
            style={[s.input, s.multiline, { height: 80 }]}
            placeholder="e.g., Meals, Guide, Camping gear"
            placeholderTextColor={OUTLINE}
            value={includes}
            onChangeText={setIncludes}
            multiline
            textAlignVertical="top"
          />
          <Text style={[s.label, { marginTop: 14 }]}>What's excluded (comma-separated)</Text>
          <TextInput
            style={[s.input, s.multiline, { height: 80 }]}
            placeholder="e.g., Travel insurance, Personal equipment"
            placeholderTextColor={OUTLINE}
            value={exclusions}
            onChangeText={setExclusions}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Card 6: Available Dates ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Available Dates</Text>
          <Text style={s.hint}>Enter dates in YYYY-MM-DD format, comma-separated</Text>
          <TextInput
            style={[s.input, s.multiline, { height: 80, marginTop: 8 }]}
            placeholder="e.g., 2026-07-01, 2026-07-15, 2026-08-01"
            placeholderTextColor={OUTLINE}
            value={dates}
            onChangeText={setDates}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ── Card 7: Image URL ── */}
        <View style={s.card}>
          <Text style={s.cardHeading}>Cover Image</Text>
          <Text style={s.hint}>Paste a public image URL (HTTPS)</Text>
          <TextInput
            style={[s.input, { marginTop: 8 }]}
            placeholder="https://images.unsplash.com/..."
            placeholderTextColor={OUTLINE}
            value={imageUrl}
            onChangeText={setImageUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Fixed footer ── */}
      <View style={s.footer}>
        <TouchableOpacity style={s.footerBack} onPress={() => setActiveTab('listings')}>
          <Text style={s.footerBackText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.footerNext, saving && s.footerNextDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.footerNextText}>{submitLabel}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PRIMARY           = '#1A5F45';
const PRIMARY_CONTAINER = '#338263';
const ON_PC             = '#F5FFF7';
const OUTLINE           = '#BEC9C1';
const TEXT              = '#111C2D';
const MUTED             = '#3F4943';
const LIGHT             = '#6F7A73';
const BEIGE             = '#F7F4EE';
const WHITE             = '#FFFFFF';

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BEIGE },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },

  infoBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: PRIMARY + '12', borderRadius: 12,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: PRIMARY + '30',
  },
  infoText: { flex: 1, color: '#064E3B', fontSize: 13, lineHeight: 18 },

  card: {
    backgroundColor: WHITE, borderRadius: 24, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    borderWidth: 1, borderColor: '#F0ECE4',
  },
  cardHeading: { color: TEXT, fontSize: 16, fontWeight: '700', marginBottom: 14 },

  label: { color: MUTED, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  hint:  { color: LIGHT, fontSize: 12 },
  input: {
    backgroundColor: '#F9F9FF', borderWidth: 1, borderColor: OUTLINE,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    color: TEXT, fontSize: 14,
  },
  multiline: { height: 120, textAlignVertical: 'top' },

  row: { flexDirection: 'row' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderRadius: 99, paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#F0F3FF', borderWidth: 2, borderColor: 'transparent',
  },
  chipActive:     { backgroundColor: PRIMARY_CONTAINER, borderColor: PRIMARY_CONTAINER },
  chipText:       { color: MUTED, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: ON_PC },

  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9FF', borderWidth: 1, borderColor: OUTLINE,
    borderRadius: 14, paddingHorizontal: 16,
  },
  priceCurrency: { color: MUTED, fontSize: 22, fontWeight: '500', marginRight: 4 },
  priceInput:    { flex: 1, paddingVertical: 13, color: TEXT, fontSize: 22, fontWeight: '700' },

  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: 'rgba(249,249,255,0.97)',
    borderTopWidth: 1, borderTopColor: '#F0ECE4',
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 10,
  },
  footerBack:         { paddingHorizontal: 20, paddingVertical: 12 },
  footerBackText:     { color: MUTED, fontSize: 15, fontWeight: '600' },
  footerNext: {
    backgroundColor: PRIMARY, borderRadius: 99,
    paddingHorizontal: 28, paddingVertical: 14,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    minWidth: 160, alignItems: 'center',
  },
  footerNextDisabled: { opacity: 0.6 },
  footerNextText:     { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
