import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Platform, ActivityIndicator, Switch,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { theme } from '../theme';
import { operatorAPI } from '../services/api';

const CATEGORIES = [
  'Trekking', 'Camping', 'Paragliding', 'Rafting', 'Scuba Diving',
  'Cycling', 'Wildlife Safari', 'Climbing', 'Skiing', 'Water Sports', 'Jungle',
];
const DIFFICULTIES = ['Easy', 'Moderate', 'Difficult'];
const REQ_PRESETS = [
  'Trekking Shoes', 'Water Bottle (2L)', 'Rain Jacket', 'Government ID',
  'Personal Medicines', 'Backpack', 'Power Bank', 'Warm Clothing',
  'Torch / Headlamp', 'Sunscreen', 'First Aid Kit', 'Trekking Pole',
];
const CUSTOMER_FIELDS = [
  'Full Name', 'Phone Number', 'Email Address',
  'Emergency Contact Name', 'Emergency Contact Number', 'Age',
  'Gender (Optional)', 'Medical Conditions (Optional)', 'Special Requirements',
];

const CANCELLATION_DEFAULT = 'Flexible: Cancel up to 24 hours in advance for a full refund.';

function initForm(e) {
  return {
    title:               e?.title                             ?? '',
    category:            e?.category                          ?? 'Trekking',
    description:         e?.description                       ?? '',
    state:               e?.location?.state                   ?? '',
    city:                e?.location?.city                    ?? '',
    country:             e?.location?.country                 ?? 'India',
    meetingPoint:        e?.location?.meetingPoint            ?? '',
    googleMapsLink:      e?.location?.googleMapsLink          ?? '',
    instagram:           e?.socialLinks?.instagram            ?? '',
    website:             e?.socialLinks?.website              ?? '',
    price:               e?.price                            ? String(e.price) : '',
    duration:            e?.duration                          ?? '',
    availableDates:      Array.isArray(e?.availableDates)
                           ? e.availableDates.join(', ') : '',
    minGroupSize:        e?.minGroupSize                     ? String(e.minGroupSize) : '1',
    maxGroupSize:        e?.maxGroupSize                     ? String(e.maxGroupSize) : '12',
    bookingDeadline:     e?.bookingDeadline                  ? String(e.bookingDeadline) : '',
    cancellationPolicy:  e?.cancellationPolicy               ?? CANCELLATION_DEFAULT,
    difficulty:          e?.difficulty                        ?? 'Moderate',
    ageRestriction:      e?.ageRestriction                   ?? '',
    medicalRestrictions: e?.medicalRestrictions              ?? '',
    firstAidAvailable:       e?.safetyInfo?.firstAidAvailable      ?? false,
    safetyBriefingIncluded:  e?.safetyInfo?.safetyBriefingIncluded ?? false,
    emergencyContact:        e?.safetyInfo?.emergencyContact        ?? '',
    nearestFacility:         e?.emergencyInfo?.nearestFacility      ?? '',
    includes:    Array.isArray(e?.includes)   ? e.includes.join(', ')   : '',
    exclusions:  Array.isArray(e?.exclusions) ? e.exclusions.join(', ') : '',
    coverImageUrl:       e?.coverImage ?? e?.images?.[0] ?? '',
    businessRegistrationNumber: e?.operatorInfo?.businessRegistrationNumber ?? '',
    gstNumber:               e?.operatorInfo?.gstNumber              ?? '',
    tourismRegistration:     e?.operatorInfo?.tourismRegistration    ?? '',
    yearsOfOperation:        e?.operatorInfo?.yearsOfOperation       ? String(e.operatorInfo.yearsOfOperation) : '',
    guideCertifications:     e?.operatorInfo?.guideCertifications    ?? '',
  };
}

function initAdvImages(e) {
  const imgs = e?.adventureImages?.length
    ? e.adventureImages
    : (e?.images?.slice(1) ?? []);
  return imgs.length ? imgs : [''];
}

function initRequirements(e) {
  return Array.isArray(e?.requirements) ? e.requirements : [];
}

export default function CreateEditListing({ editListing, onSaveSuccess, setActiveTab }) {
  const isEdit     = !!editListing;
  const isRejected = isEdit && ['rejected', 'changes_requested'].includes(editListing?.status);
  const isPending  = isEdit && editListing?.status === 'pending';

  const [form,         setFormState]  = useState(() => initForm(editListing));
  const [advImages,    setAdvImages]  = useState(() => initAdvImages(editListing));
  const [requirements, setRequirements] = useState(() => initRequirements(editListing));
  const [reqInput,     setReqInput]   = useState('');
  const [saving,       setSaving]     = useState(false);

  const set = (key, val) => setFormState(prev => ({ ...prev, [key]: val }));

  const parseCSV = str => str.split(',').map(s => s.trim()).filter(Boolean);

  const addAdvImage    = () => setAdvImages(prev => [...prev, '']);
  const removeAdvImage = idx => setAdvImages(prev => prev.filter((_, i) => i !== idx));
  const setAdvImage    = (idx, val) => setAdvImages(prev => prev.map((v, i) => i === idx ? val : v));

  const addReq = () => {
    const val = reqInput.trim();
    if (!val) return;
    setRequirements(prev => [...prev, val]);
    setReqInput('');
  };
  const removeReq = idx => setRequirements(prev => prev.filter((_, i) => i !== idx));
  const togglePreset = preset => {
    if (requirements.includes(preset)) {
      setRequirements(prev => prev.filter(r => r !== preset));
    } else {
      setRequirements(prev => [...prev, preset]);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim())       { Alert.alert('Missing', 'Please enter a title.'); return; }
    if (!form.description.trim()) { Alert.alert('Missing', 'Please enter a description.'); return; }
    if (!form.city.trim())        { Alert.alert('Missing', 'Please enter a city/region.'); return; }
    if (!form.price.trim() || isNaN(Number(form.price))) {
      Alert.alert('Missing', 'Please enter a valid price.');
      return;
    }
    if (!form.duration.trim()) { Alert.alert('Missing', 'Please enter a duration.'); return; }

    const coverUrl  = form.coverImageUrl.trim();
    const advUrls   = advImages.map(u => u.trim()).filter(Boolean);
    const allImages = coverUrl ? [coverUrl, ...advUrls] : advUrls;

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim(),
      category:    form.category,
      location: {
        city:           form.city.trim(),
        state:          form.state.trim(),
        country:        form.country.trim() || 'India',
        meetingPoint:   form.meetingPoint.trim(),
        googleMapsLink: form.googleMapsLink.trim(),
      },
      socialLinks: {
        instagram: form.instagram.trim(),
        website:   form.website.trim(),
      },
      coverImage:      coverUrl,
      adventureImages: advUrls,
      images:          allImages,
      price:           Number(form.price),
      duration:        form.duration.trim(),
      difficulty:      form.difficulty,
      minGroupSize:    Number(form.minGroupSize) || 1,
      maxGroupSize:    Number(form.maxGroupSize) || 12,
      bookingDeadline: form.bookingDeadline ? Number(form.bookingDeadline) : undefined,
      cancellationPolicy:  form.cancellationPolicy.trim(),
      ageRestriction:      form.ageRestriction.trim(),
      medicalRestrictions: form.medicalRestrictions.trim(),
      safetyInfo: {
        firstAidAvailable:      form.firstAidAvailable,
        emergencyContact:       form.emergencyContact.trim(),
        safetyBriefingIncluded: form.safetyBriefingIncluded,
      },
      emergencyInfo: {
        contact:         form.emergencyContact.trim(),
        nearestFacility: form.nearestFacility.trim(),
      },
      requirements:   requirements,
      includes:       parseCSV(form.includes),
      exclusions:     parseCSV(form.exclusions),
      availableDates: parseCSV(form.availableDates),
      operatorInfo: {
        businessRegistrationNumber: form.businessRegistrationNumber.trim(),
        gstNumber:                  form.gstNumber.trim(),
        tourismRegistration:        form.tourismRegistration.trim(),
        yearsOfOperation:           form.yearsOfOperation ? Number(form.yearsOfOperation) : undefined,
        guideCertifications:        form.guideCertifications.trim(),
      },
    };

    setSaving(true);
    try {
      if (isEdit) {
        await operatorAPI.editListing(editListing._id, payload);
        Alert.alert('Success', isRejected
          ? 'Listing updated and resubmitted for admin review.'
          : 'Listing updated and submitted for admin review.');
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
    ? 'Update & Resubmit for Review'
    : isEdit
    ? 'Save & Submit for Review'
    : 'Submit for Review';

  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Status banners ── */}
        {!isEdit && (
          <View style={s.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={PRIMARY} />
            <Text style={s.infoText}>
              New listings go through <Text style={{ fontWeight: '700' }}>admin review</Text> before appearing to customers.
            </Text>
          </View>
        )}
        {isPending && (
          <View style={[s.infoBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <Ionicons name="time-outline" size={16} color="#92400E" />
            <Text style={[s.infoText, { color: '#92400E' }]}>
              Awaiting admin review — you cannot edit until the review is complete.
            </Text>
          </View>
        )}
        {isRejected && editListing?.rejectionReason && (
          <View style={[s.infoBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={[s.infoText, { color: '#DC2626', fontWeight: '700', marginBottom: 2 }]}>
                Admin Feedback — Action Required
              </Text>
              <Text style={[s.infoText, { color: '#7F1D1D' }]}>
                {editListing.rejectionReason}
              </Text>
            </View>
          </View>
        )}

        {/* ── 1. Basic Information ── */}
        <Card heading="Basic Information">
          <Label required>Adventure Title</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder="e.g. Alpine Glacier Trek & Lake Camping"
            placeholderTextColor={OUTLINE}
            value={form.title}
            onChangeText={v => set('title', v)}
            editable={!isPending}
          />

          <Label required style={{ marginTop: 14 }}>Adventure Category</Label>
          <View style={s.chipWrap}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.chip, form.category === cat && s.chipActive]}
                onPress={() => !isPending && set('category', cat)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, form.category === cat && s.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label required style={{ marginTop: 14 }}>Detailed Description</Label>
          <TextInput
            style={[s.input, s.multiline, isPending && s.disabled]}
            placeholder="Tell adventurers what makes this experience special — the landscape, the journey, the highlights..."
            placeholderTextColor={OUTLINE}
            value={form.description}
            onChangeText={v => set('description', v)}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!isPending}
          />
        </Card>

        {/* ── 2. Location ── */}
        <Card heading="Location">
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Label>State</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="e.g. Himachal Pradesh"
                placeholderTextColor={OUTLINE}
                value={form.state}
                onChangeText={v => set('state', v)}
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label required>City / Region</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="e.g. Manali"
                placeholderTextColor={OUTLINE}
                value={form.city}
                onChangeText={v => set('city', v)}
                editable={!isPending}
              />
            </View>
          </View>

          <Label style={{ marginTop: 14 }}>Country</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder="India"
            placeholderTextColor={OUTLINE}
            value={form.country}
            onChangeText={v => set('country', v)}
            editable={!isPending}
          />

          <Label style={{ marginTop: 14 }}>Meeting Point</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder="e.g. Solang Valley Parking Lot, Manali"
            placeholderTextColor={OUTLINE}
            value={form.meetingPoint}
            onChangeText={v => set('meetingPoint', v)}
            editable={!isPending}
          />

          <Label style={{ marginTop: 14 }}>Google Maps Link (optional)</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder="https://maps.google.com/..."
            placeholderTextColor={OUTLINE}
            value={form.googleMapsLink}
            onChangeText={v => set('googleMapsLink', v)}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isPending}
          />
        </Card>

        {/* ── 3. Social Media (optional) ── */}
        <Card heading="Social Media Links (Optional)">
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Label>Instagram</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="https://instagram.com/..."
                placeholderTextColor={OUTLINE}
                value={form.instagram}
                onChangeText={v => set('instagram', v)}
                autoCapitalize="none"
                keyboardType="url"
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label>Website</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="https://yoursite.com"
                placeholderTextColor={OUTLINE}
                value={form.website}
                onChangeText={v => set('website', v)}
                autoCapitalize="none"
                keyboardType="url"
                editable={!isPending}
              />
            </View>
          </View>
        </Card>

        {/* ── 4. Booking Information ── */}
        <Card heading="Booking Information">
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Label required>Price Per Person (₹)</Label>
              <View style={s.priceRow}>
                <Text style={s.priceCurrency}>₹</Text>
                <TextInput
                  style={[s.priceInput, isPending && s.disabled]}
                  placeholder="2500"
                  placeholderTextColor={OUTLINE}
                  value={form.price}
                  onChangeText={v => set('price', v)}
                  keyboardType="decimal-pad"
                  editable={!isPending}
                />
              </View>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label required>Duration</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="3 days / 2 nights"
                placeholderTextColor={OUTLINE}
                value={form.duration}
                onChangeText={v => set('duration', v)}
                editable={!isPending}
              />
            </View>
          </View>

          <Label style={{ marginTop: 14 }}>Available Dates</Label>
          <Text style={s.hint}>Format: YYYY-MM-DD, comma-separated</Text>
          <TextInput
            style={[s.input, { marginTop: 6 }, isPending && s.disabled]}
            placeholder="2026-07-05, 2026-07-12, 2026-07-19"
            placeholderTextColor={OUTLINE}
            value={form.availableDates}
            onChangeText={v => set('availableDates', v)}
            editable={!isPending}
          />
          {form.availableDates.length > 0 && (
            <Text style={s.countHint}>
              {parseCSV(form.availableDates).length} date(s) added
            </Text>
          )}

          <View style={[s.row, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Label>Min Group Size</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="1"
                placeholderTextColor={OUTLINE}
                value={form.minGroupSize}
                onChangeText={v => set('minGroupSize', v)}
                keyboardType="number-pad"
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label>Max Group Size</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="12"
                placeholderTextColor={OUTLINE}
                value={form.maxGroupSize}
                onChangeText={v => set('maxGroupSize', v)}
                keyboardType="number-pad"
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label>Booking Deadline (days before)</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="2"
                placeholderTextColor={OUTLINE}
                value={form.bookingDeadline}
                onChangeText={v => set('bookingDeadline', v)}
                keyboardType="number-pad"
                editable={!isPending}
              />
            </View>
          </View>

          <Label style={{ marginTop: 14 }}>Cancellation Policy</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder={CANCELLATION_DEFAULT}
            placeholderTextColor={OUTLINE}
            value={form.cancellationPolicy}
            onChangeText={v => set('cancellationPolicy', v)}
            editable={!isPending}
          />
        </Card>

        {/* ── 5. Difficulty & Requirements ── */}
        <Card heading="Difficulty & Requirements">
          <Label>Difficulty Level</Label>
          <View style={[s.row, { gap: 10, marginTop: 6 }]}>
            {DIFFICULTIES.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.diffBtn, form.difficulty === d && s.diffBtnActive, { flex: 1 }]}
                onPress={() => !isPending && set('difficulty', d)}
              >
                <Text style={[s.diffText, form.difficulty === d && s.diffTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[s.row, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Label>Age Restrictions</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="e.g. 12–65 years"
                placeholderTextColor={OUTLINE}
                value={form.ageRestriction}
                onChangeText={v => set('ageRestriction', v)}
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label>Medical Restrictions</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="e.g. No heart conditions"
                placeholderTextColor={OUTLINE}
                value={form.medicalRestrictions}
                onChangeText={v => set('medicalRestrictions', v)}
                editable={!isPending}
              />
            </View>
          </View>
        </Card>

        {/* ── 6. Safety Information ── */}
        <Card heading="Safety Information">
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>First Aid Available</Text>
            </View>
            <Switch
              value={form.firstAidAvailable}
              onValueChange={v => !isPending && set('firstAidAvailable', v)}
              trackColor={{ false: '#D1D5DB', true: PRIMARY + '60' }}
              thumbColor={form.firstAidAvailable ? PRIMARY : '#9CA3AF'}
              disabled={isPending}
            />
          </View>
          <View style={[s.toggleRow, { marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Safety Briefing Included</Text>
            </View>
            <Switch
              value={form.safetyBriefingIncluded}
              onValueChange={v => !isPending && set('safetyBriefingIncluded', v)}
              trackColor={{ false: '#D1D5DB', true: PRIMARY + '60' }}
              thumbColor={form.safetyBriefingIncluded ? PRIMARY : '#9CA3AF'}
              disabled={isPending}
            />
          </View>

          <Label style={{ marginTop: 14 }}>Emergency Contact Number</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder="+91 9876543210"
            placeholderTextColor={OUTLINE}
            value={form.emergencyContact}
            onChangeText={v => set('emergencyContact', v)}
            keyboardType="phone-pad"
            editable={!isPending}
          />

          <Label style={{ marginTop: 14 }}>Nearest Hospital / Medical Facility</Label>
          <Text style={s.hint}>Visible to customers in the app for emergency planning.</Text>
          <TextInput
            style={[s.input, { marginTop: 6 }, isPending && s.disabled]}
            placeholder="e.g. Civil Hospital Manali — 4 km from base camp"
            placeholderTextColor={OUTLINE}
            value={form.nearestFacility}
            onChangeText={v => set('nearestFacility', v)}
            editable={!isPending}
          />
        </Card>

        {/* ── 7. Requirements & Must-Carry Essentials ── */}
        <Card heading="Requirements & Must-Carry Essentials">
          <Text style={s.hint}>Items participants must bring — shown as a checklist to customers before they book.</Text>

          <Text style={[s.subLabel, { marginTop: 12 }]}>Quick add common items:</Text>
          <View style={s.chipWrap}>
            {REQ_PRESETS.map(preset => {
              const added = requirements.includes(preset);
              return (
                <TouchableOpacity
                  key={preset}
                  style={[s.presetChip, added && s.presetChipActive]}
                  onPress={() => !isPending && togglePreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.presetChipText, added && s.presetChipTextActive]}>
                    {added ? '✓ ' : '+ '}{preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.subLabel, { marginTop: 14 }]}>Add custom item:</Text>
          <View style={s.reqInputRow}>
            <TextInput
              style={[s.input, { flex: 1 }, isPending && s.disabled]}
              placeholder="e.g. Trekking poles..."
              placeholderTextColor={OUTLINE}
              value={reqInput}
              onChangeText={setReqInput}
              onSubmitEditing={addReq}
              returnKeyType="done"
              editable={!isPending}
            />
            <TouchableOpacity
              style={[s.addBtn, (!reqInput.trim() || isPending) && { opacity: 0.4 }]}
              onPress={addReq}
              disabled={!reqInput.trim() || isPending}
            >
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {requirements.length > 0 && (
            <View style={s.chipWrap}>
              {requirements.map((r, i) => (
                <View key={i} style={s.reqTag}>
                  <Ionicons name="checkmark" size={11} color={PRIMARY} />
                  <Text style={s.reqTagText}>{r}</Text>
                  {!isPending && (
                    <TouchableOpacity onPress={() => removeReq(i)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close" size={13} color={MUTED} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
          {requirements.length === 0 && (
            <View style={s.emptyReq}>
              <Text style={s.emptyReqText}>No items added yet. Use quick-add or type a custom item above.</Text>
            </View>
          )}
        </Card>

        {/* ── 8. Inclusions & Exclusions ── */}
        <Card heading="Inclusions & Exclusions">
          <Text style={s.hint}>Comma-separated — each item becomes a bullet in the customer app.</Text>

          <Label style={{ marginTop: 12 }}>What's Included</Label>
          <Text style={s.hint}>e.g. Accommodation, Meals, Certified Guide</Text>
          <TextInput
            style={[s.input, s.multiline, { height: 90, marginTop: 6 }, isPending && s.disabled]}
            placeholder="Accommodation, Breakfast & Dinner, Certified Guide, Camping Equipment"
            placeholderTextColor={OUTLINE}
            value={form.includes}
            onChangeText={v => set('includes', v)}
            multiline
            textAlignVertical="top"
            editable={!isPending}
          />
          {form.includes.length > 0 && (
            <Text style={[s.countHint, { color: '#16A34A' }]}>
              {parseCSV(form.includes).length} item(s) will be shown
            </Text>
          )}

          <Label style={{ marginTop: 14 }}>What's Not Included</Label>
          <Text style={s.hint}>e.g. Travel Insurance, Personal Expenses</Text>
          <TextInput
            style={[s.input, s.multiline, { height: 90, marginTop: 6 }, isPending && s.disabled]}
            placeholder="Travel Insurance, Personal Expenses, Air/Train Tickets to Starting Point"
            placeholderTextColor={OUTLINE}
            value={form.exclusions}
            onChangeText={v => set('exclusions', v)}
            multiline
            textAlignVertical="top"
            editable={!isPending}
          />
          {form.exclusions.length > 0 && (
            <Text style={[s.countHint, { color: '#DC2626' }]}>
              {parseCSV(form.exclusions).length} item(s) will be shown
            </Text>
          )}
        </Card>

        {/* ── 9. Images ── */}
        <Card heading="Images & Media">
          <Label required>Cover Image URL</Label>
          <Text style={s.hint}>Main photo shown on listing cards. Paste a public HTTPS image URL.</Text>
          <TextInput
            style={[s.input, { marginTop: 6 }, isPending && s.disabled]}
            placeholder="https://images.unsplash.com/..."
            placeholderTextColor={OUTLINE}
            value={form.coverImageUrl}
            onChangeText={v => set('coverImageUrl', v)}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isPending}
          />

          <Label style={{ marginTop: 16 }}>Adventure Images</Label>
          <Text style={s.hint}>Additional photos showcasing the experience (paste public URLs).</Text>
          {advImages.map((url, idx) => (
            <View key={idx} style={[s.row, { marginTop: 8, alignItems: 'center' }]}>
              <TextInput
                style={[s.input, { flex: 1 }, isPending && s.disabled]}
                placeholder={`Adventure photo ${idx + 1} URL`}
                placeholderTextColor={OUTLINE}
                value={url}
                onChangeText={v => setAdvImage(idx, v)}
                autoCapitalize="none"
                keyboardType="url"
                editable={!isPending}
              />
              {advImages.length > 1 && !isPending && (
                <TouchableOpacity
                  style={s.removeImgBtn}
                  onPress={() => removeAdvImage(idx)}
                >
                  <Ionicons name="close-circle" size={20} color={DANGER} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {!isPending && (
            <TouchableOpacity style={s.addImgBtn} onPress={addAdvImage}>
              <Feather name="plus" size={14} color={PRIMARY} />
              <Text style={s.addImgBtnText}>Add Another Photo</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* ── 10. Trust & Verification ── */}
        <Card heading="Trust & Verification">
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Label>Business Registration No.</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="CIN / Registration No."
                placeholderTextColor={OUTLINE}
                value={form.businessRegistrationNumber}
                onChangeText={v => set('businessRegistrationNumber', v)}
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label>GST Number (Optional)</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="27AAAA0000A1Z5"
                placeholderTextColor={OUTLINE}
                value={form.gstNumber}
                onChangeText={v => set('gstNumber', v)}
                autoCapitalize="characters"
                editable={!isPending}
              />
            </View>
          </View>

          <View style={[s.row, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Label>Tourism Registration (Optional)</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="Tourism Dept. Reg. No."
                placeholderTextColor={OUTLINE}
                value={form.tourismRegistration}
                onChangeText={v => set('tourismRegistration', v)}
                editable={!isPending}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Label>Years of Operation</Label>
              <TextInput
                style={[s.input, isPending && s.disabled]}
                placeholder="5"
                placeholderTextColor={OUTLINE}
                value={form.yearsOfOperation}
                onChangeText={v => set('yearsOfOperation', v)}
                keyboardType="number-pad"
                editable={!isPending}
              />
            </View>
          </View>

          <Label style={{ marginTop: 14 }}>Guide Certifications</Label>
          <TextInput
            style={[s.input, isPending && s.disabled]}
            placeholder="e.g. IMF Certified, Wilderness First Responder"
            placeholderTextColor={OUTLINE}
            value={form.guideCertifications}
            onChangeText={v => set('guideCertifications', v)}
            editable={!isPending}
          />
        </Card>

        {/* ── 11. Customer Info Collected ── */}
        <Card heading="Customer Info Collected at Booking">
          <Text style={s.hint}>The following is automatically collected from customers when they book.</Text>
          <View style={s.customerFieldsGrid}>
            {CUSTOMER_FIELDS.map(field => (
              <View key={field} style={s.customerField}>
                <Ionicons name="checkmark" size={12} color="#16A34A" />
                <Text style={s.customerFieldText}>{field}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Fixed footer ── */}
      <View style={s.footer}>
        <TouchableOpacity style={s.footerBack} onPress={() => setActiveTab('listings')}>
          <Text style={s.footerBackText}>Cancel</Text>
        </TouchableOpacity>
        {!isPending && (
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
        )}
      </View>
    </View>
  );
}

function Card({ heading, children }) {
  return (
    <View style={s.card}>
      <Text style={s.cardHeading}>{heading}</Text>
      {children}
    </View>
  );
}

function Label({ children, required, style }) {
  return (
    <Text style={[s.label, style]}>
      {children}{required ? <Text style={{ color: DANGER }}> *</Text> : null}
    </Text>
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
const DANGER            = '#BA1A1A';

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BEIGE },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },

  infoBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: PRIMARY + '12', borderRadius: 12,
    padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: PRIMARY + '30',
  },
  infoText: { flex: 1, color: '#064E3B', fontSize: 13, lineHeight: 18 },

  card: {
    backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    borderWidth: 1, borderColor: '#F0ECE4',
  },
  cardHeading: {
    color: PRIMARY, fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    borderBottomWidth: 1, borderBottomColor: '#F0ECE4',
    paddingBottom: 10, marginBottom: 14,
  },

  label:    { color: MUTED, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  subLabel: { color: MUTED, fontSize: 12, fontWeight: '600' },
  hint:     { color: LIGHT, fontSize: 12, marginBottom: 2 },
  countHint:{ color: LIGHT, fontSize: 12, marginTop: 4 },

  input: {
    backgroundColor: '#F9F9FF', borderWidth: 1, borderColor: OUTLINE,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: TEXT, fontSize: 14,
  },
  multiline: { height: 120, textAlignVertical: 'top' },
  disabled:  { opacity: 0.55 },

  row: { flexDirection: 'row' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#F0F3FF', borderWidth: 1.5, borderColor: 'transparent',
  },
  chipActive:     { backgroundColor: PRIMARY_CONTAINER, borderColor: PRIMARY_CONTAINER },
  chipText:       { color: MUTED, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: ON_PC },

  diffBtn: {
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#F0F3FF', borderWidth: 1.5, borderColor: 'transparent',
  },
  diffBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  diffText:      { color: MUTED, fontSize: 13, fontWeight: '600' },
  diffTextActive:{ color: WHITE },

  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9FF', borderWidth: 1, borderColor: OUTLINE,
    borderRadius: 12, paddingHorizontal: 14,
  },
  priceCurrency: { color: MUTED, fontSize: 20, fontWeight: '500', marginRight: 4 },
  priceInput:    { flex: 1, paddingVertical: 12, color: TEXT, fontSize: 20, fontWeight: '700' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: OUTLINE,
  },
  toggleLabel: { color: TEXT, fontSize: 14, fontWeight: '500' },

  presetChip: {
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderStyle: 'dashed', borderColor: OUTLINE,
    backgroundColor: WHITE,
  },
  presetChipActive: {
    backgroundColor: PRIMARY + '12', borderColor: PRIMARY,
    borderStyle: 'solid',
  },
  presetChipText:       { color: MUTED, fontSize: 12, fontWeight: '500' },
  presetChipTextActive: { color: PRIMARY, fontWeight: '700' },

  reqInputRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  addBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: WHITE, fontSize: 13, fontWeight: '700' },

  reqTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: PRIMARY + '12', borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: PRIMARY + '25',
  },
  reqTagText: { color: PRIMARY, fontSize: 12, fontWeight: '600', flex: 1 },

  emptyReq: {
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10, marginTop: 10,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  emptyReqText: { color: '#92400E', fontSize: 12 },

  removeImgBtn: { marginLeft: 8 },
  addImgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: PRIMARY + '50',
  },
  addImgBtnText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },

  customerFieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  customerField: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0F9F4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  customerFieldText: { color: '#166534', fontSize: 12, fontWeight: '500' },

  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    backgroundColor: 'rgba(249,244,238,0.97)',
    borderTopWidth: 1, borderTopColor: '#E8E0D4',
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 10,
  },
  footerBack:         { paddingHorizontal: 20, paddingVertical: 12 },
  footerBackText:     { color: MUTED, fontSize: 15, fontWeight: '600' },
  footerNext: {
    flex: 1, backgroundColor: PRIMARY, borderRadius: 99,
    paddingHorizontal: 20, paddingVertical: 14, marginLeft: 12,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    alignItems: 'center',
  },
  footerNextDisabled: { opacity: 0.6 },
  footerNextText:     { color: WHITE, fontSize: 15, fontWeight: '700' },
});
