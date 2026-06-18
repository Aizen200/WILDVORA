import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { experienceAPI, aiAPI } from '../services/api';

const C = {
  primary:          '#1A5F45',
  background:       '#f7faf6',
  surface:          '#ffffff',
  surfaceContainer: '#ebefea',
  onSurface:        '#181d1a',
  onSurfaceVariant: '#3f4943',
  outlineVariant:   '#bec9c1',
  secondary:        '#0a6687',
  white:            '#ffffff',
};

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMxqmVZiEOLbS8iPmgbb6yZs6DOT2ueMpEqfGJceQT5UKb-vk8NYWZoAt-1MkZLPkvjsFtOReCDsVaBRG2KY5KP5LdT49c2FNnkGdDbeshfCbeECqk1lyKhgWaKU2qqSQj1pSjg3VQvAPEhnvArYc-0kRxN-egqoRdUN60Zei6Lxkitme_X-kKfjWYdpZLwNE3UQasoTRlT0cziDoDMIxVfscnKB10ZHEogVN5cDmdIQ9fXIkS0iIBlFS-U5ymQ8eXcWCBSG9l6Fg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwlcB3bQtzyJNOrLT4EsnoHFNw9cIRYARJ7T09kYY_AQYhYTBPp8P-JZ1ql_NGI3NiFwbW0OxMTzdUW5vwAyY6imbUS88XUUqVyZNLXi14OJIghFzuSgbwv5qfjjyyVCaE47qFk8AL4y2rHBjgcBC8hPxXywIJeN5COCXEVUbMkkAuD_IGQ55wzAfDXDnMLwC9CkmkVl3p7WXltYRzxGKBNefxfzmlLZ92u-XqtHzE41ZakGWrChYh9ccxbqDXnzVBfpvYA',
];

const SUGGESTED = [
  '3-day trek in Himachal under 5000',
  'Camping near a river, family-friendly',
  'Water sports trip in Goa for 2',
];

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Chat'); // 'Chat' or 'Planner'

  // Chat states
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: 'Hi! I am your Wildvora trip planner. Tell me about your dream adventure and I will recommend the perfect itinerary — budget, duration, group size, anything.',
      experiences: [],
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Form planner states
  const [budget, setBudget] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [duration, setDuration] = useState('');
  const [adventureLevel, setAdventureLevel] = useState('Easy'); // Easy, Moderate, Hard, Expert
  
  const [plannerResult, setPlannerResult] = useState(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError] = useState('');

  useEffect(() => {
    if (scrollRef.current && messages.length > 1) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const history = next.map((m) => ({ role: m.role, content: m.text }));
      const res = await aiAPI.getTripPlan({ messages: history });

      if (res.data?.success) {
        const { text: replyText, recommendedExperienceIds } = res.data.tripPlan;
        let resolved = [];
        if (Array.isArray(recommendedExperienceIds) && recommendedExperienceIds.length > 0) {
          const results = await Promise.all(
            recommendedExperienceIds.map((id) =>
              experienceAPI.getOne(id).then((r) => r.data.experience).catch(() => null)
            )
          );
          resolved = results.filter(Boolean);
        }
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', text: replyText, experiences: resolved },
        ]);
      } else {
        setError('Could not get a response. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reach the AI. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanTrip = async () => {
    if (!budget || !groupSize || !duration) {
      setPlannerError('Please fill in all fields.');
      return;
    }
    setPlannerLoading(true);
    setPlannerError('');
    setPlannerResult(null);
    try {
      const res = await aiAPI.getGuidedTripPlan({
        budget: Number(budget),
        groupSize: Number(groupSize),
        duration: duration,
        adventureLevel: adventureLevel,
      });
      if (res.data?.success) {
        const { tripPlan } = res.data;
        let resolved = [];
        if (Array.isArray(tripPlan.recommendedExperienceIds) && tripPlan.recommendedExperienceIds.length > 0) {
          const results = await Promise.all(
            tripPlan.recommendedExperienceIds.map((id) =>
              experienceAPI.getOne(id).then((r) => r.data.experience).catch(() => null)
            )
          );
          resolved = results.filter(Boolean);
        }
        setPlannerResult({
          ...tripPlan,
          experiences: resolved
        });
      } else {
        setPlannerError('Failed to generate a plan. Please try again.');
      }
    } catch (err) {
      setPlannerError(err.response?.data?.message || 'Failed to connect to the AI. Check connection.');
    } finally {
      setPlannerLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <View style={s.headerTitle}>
          <View style={s.aiBadge}>
            <MaterialCommunityIcons name="robot" size={16} color={C.white} />
          </View>
          <View>
            <Text style={s.headerLabel}>AI Trip Planner</Text>
            <Text style={s.headerSub}>Powered by Wildvora</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabContainer}>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'Chat' && s.tabButtonActive]}
          onPress={() => setActiveTab('Chat')}
        >
          <Text style={[s.tabText, activeTab === 'Chat' && s.tabTextActive]}>AI Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'Planner' && s.tabButtonActive]}
          onPress={() => setActiveTab('Planner')}
        >
          <Text style={[s.tabText, activeTab === 'Planner' && s.tabTextActive]}>AI Guided Planner</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Chat' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={s.scroll}
            contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 16 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View key={msg.id} style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAssistant]}>
                  {!isUser && (
                    <View style={s.avatar}>
                      <MaterialCommunityIcons name="robot-outline" size={16} color={C.primary} />
                    </View>
                  )}
                  <View style={s.msgContent}>
                    <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAssistant]}>
                      <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAssistant]}>
                        {msg.text}
                      </Text>
                    </View>
                    {msg.experiences?.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={s.expScroll}
                        contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                        nestedScrollEnabled
                      >
                        {msg.experiences.map((exp, idx) => (
                          <TouchableOpacity
                            key={exp._id || idx}
                            style={s.expCard}
                            onPress={() => navigation.navigate('ExperienceDetail', { experienceId: exp._id })}
                            activeOpacity={0.9}
                          >
                            <Image
                              source={{ uri: exp.coverImage || exp.images?.[0] || CARD_IMAGES[idx % CARD_IMAGES.length] }}
                              style={s.expImg}
                              resizeMode="cover"
                            />
                            <View style={s.expBody}>
                              <Text style={s.expTitle} numberOfLines={1}>{exp.title}</Text>
                              <Text style={s.expLoc} numberOfLines={1}>
                                {exp.location?.city}, {exp.location?.country}
                              </Text>
                              <View style={s.expFooter}>
                                <Text style={s.expPrice}>Rs. {exp.price}</Text>
                                <Text style={s.expCta}>View</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
              );
            })}

            {loading && (
              <View style={[s.msgRow, s.msgRowAssistant]}>
                <View style={s.avatar}>
                  <MaterialCommunityIcons name="robot-outline" size={16} color={C.primary} />
                </View>
                <View style={[s.bubble, s.bubbleAssistant, s.typingBubble]}>
                  <ActivityIndicator size="small" color={C.primary} style={{ marginRight: 8 }} />
                  <Text style={[s.bubbleText, s.bubbleTextAssistant, { fontStyle: 'italic' }]}>
                    Planning your trip...
                  </Text>
                </View>
              </View>
            )}

            {error ? (
              <View style={s.errorRow}>
                <Ionicons name="alert-circle-outline" size={15} color="#b91c1c" style={{ marginRight: 6 }} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Suggestions — only shown before first user message */}
          {messages.length === 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.suggestions}
              style={s.suggestionsWrap}
            >
              {SUGGESTED.map((s_) => (
                <TouchableOpacity key={s_} style={s.suggestion} onPress={() => send(s_)} activeOpacity={0.8}>
                  <Text style={s.suggestionText}>{s_}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input bar */}
          <View style={[s.inputBar, { paddingBottom: insets.bottom + 12 }]}>
            <TextInput
              style={s.input}
              placeholder="Tell me your dream adventure..."
              placeholderTextColor={C.onSurfaceVariant + '80'}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              editable={!loading}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
              onPress={() => send()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send" size={18} color={C.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={s.plannerScroll} contentContainerStyle={s.plannerScrollContent}>
          <Text style={s.plannerTitle}>AI Trip Planner</Text>
          <Text style={s.plannerSub}>Enter your trip preferences below, and we'll scan approved experiences in our database to craft your recommended plan.</Text>
          
          {/* Budget */}
          <View style={s.formGroup}>
            <Text style={s.formLabel}>Budget (₹)</Text>
            <TextInput
              style={s.formInput}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              placeholderTextColor="#9aafa5"
              value={budget}
              onChangeText={setBudget}
            />
          </View>

          {/* Group Size */}
          <View style={s.formGroup}>
            <Text style={s.formLabel}>Group Size</Text>
            <TextInput
              style={s.formInput}
              keyboardType="numeric"
              placeholder="e.g. 4"
              placeholderTextColor="#9aafa5"
              value={groupSize}
              onChangeText={setGroupSize}
            />
          </View>

          {/* Duration */}
          <View style={s.formGroup}>
            <Text style={s.formLabel}>Duration (e.g. 3 days)</Text>
            <TextInput
              style={s.formInput}
              placeholder="e.g. 3 days"
              placeholderTextColor="#9aafa5"
              value={duration}
              onChangeText={setDuration}
            />
          </View>

          {/* Adventure Level */}
          <View style={s.formGroup}>
            <Text style={s.formLabel}>Adventure Level</Text>
            <View style={s.levelContainer}>
              {['Easy', 'Moderate', 'Hard', 'Expert'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[s.levelBtn, adventureLevel === level && s.levelBtnActive]}
                  onPress={() => setAdventureLevel(level)}
                >
                  <Text style={[s.levelBtnText, adventureLevel === level && s.levelBtnTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {plannerError ? (
            <View style={s.plannerErrorBox}>
              <Text style={s.plannerErrorText}>{plannerError}</Text>
            </View>
          ) : null}

          {/* Plan button */}
          <TouchableOpacity
            style={s.planBtn}
            onPress={handlePlanTrip}
            disabled={plannerLoading}
          >
            {plannerLoading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={s.planBtnText}>Plan Trip</Text>
            )}
          </TouchableOpacity>

          {/* Planner Result Showcase */}
          {plannerResult && (
            <View style={s.resultCard}>
              <Text style={s.resultHeader}>Recommended Trip:</Text>
              <Text style={s.resultTripName}>{plannerResult.recommendedTrip}</Text>

              <View style={s.resultGrid}>
                <View style={s.resultGridItem}>
                  <Text style={s.resultItemLabel}>Cost</Text>
                  <Text style={s.resultItemValue}>{plannerResult.cost}</Text>
                </View>
                <View style={s.resultGridItem}>
                  <Text style={s.resultItemLabel}>Distance</Text>
                  <Text style={s.resultItemValue}>{plannerResult.distance}</Text>
                </View>
                <View style={s.resultGridItem}>
                  <Text style={s.resultItemLabel}>Difficulty</Text>
                  <Text style={s.resultItemValue}>{plannerResult.difficulty}</Text>
                </View>
              </View>

              {plannerResult.explanation ? (
                <Text style={s.resultExplanation}>{plannerResult.explanation}</Text>
              ) : null}

              {/* Show matching experience cards if any */}
              {plannerResult.experiences?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={s.resultExpTitle}>Book matching adventures:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.expScroll}
                    contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                    nestedScrollEnabled
                  >
                    {plannerResult.experiences.map((exp, idx) => (
                      <TouchableOpacity
                        key={exp._id || idx}
                        style={s.expCard}
                        onPress={() => navigation.navigate('ExperienceDetail', { experienceId: exp._id })}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: exp.coverImage || exp.images?.[0] || CARD_IMAGES[idx % CARD_IMAGES.length] }}
                          style={s.expImg}
                          resizeMode="cover"
                        />
                        <View style={s.expBody}>
                          <Text style={s.expTitle} numberOfLines={1}>{exp.title}</Text>
                          <Text style={s.expLoc} numberOfLines={1}>
                            {exp.location?.city}, {exp.location?.country}
                          </Text>
                          <View style={s.expFooter}>
                            <Text style={s.expPrice}>Rs. {exp.price}</Text>
                            <Text style={s.expCta}>View</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant + '40',
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  headerLabel: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  headerSub:   { fontSize: 11, color: C.onSurfaceVariant, marginTop: 1 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant + '30',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: C.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: '700',
  },

  plannerScroll: {
    flex: 1,
    backgroundColor: C.background,
  },
  plannerScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  plannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.onSurface,
  },
  plannerSub: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.outlineVariant + '80',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.onSurface,
  },
  levelContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  levelBtn: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.outlineVariant + '80',
    backgroundColor: C.surface,
    alignItems: 'center',
  },
  levelBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  levelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  levelBtnTextActive: {
    color: C.white,
    fontWeight: '700',
  },
  planBtn: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  planBtnText: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  plannerErrorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  plannerErrorText: {
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.outlineVariant + '80',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  resultHeader: {
    fontSize: 11,
    fontWeight: '850',
    color: C.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  resultTripName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.onSurface,
    marginTop: 4,
    marginBottom: 16,
  },
  resultGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.outlineVariant + '30',
    paddingVertical: 12,
    marginBottom: 12,
  },
  resultGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultItemLabel: {
    fontSize: 10,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  resultItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.onSurface,
    marginTop: 2,
  },
  resultExplanation: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  resultExpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
    marginBottom: 8,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  msgRow:          { flexDirection: 'row', gap: 8, alignItems: 'flex-start', maxWidth: '88%' },
  msgRowUser:      { alignSelf: 'flex-end', justifyContent: 'flex-end', flexDirection: 'row-reverse' },
  msgRowAssistant: { alignSelf: 'flex-start' },
  msgContent:      { flex: 1 },

  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2, flexShrink: 0,
  },

  bubble: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
  },
  bubbleUser:          { backgroundColor: C.primary, borderTopRightRadius: 4 },
  bubbleAssistant:     { backgroundColor: C.surface, borderTopLeftRadius: 4, borderWidth: 1, borderColor: C.outlineVariant + '50' },
  typingBubble:        { flexDirection: 'row', alignItems: 'center' },
  bubbleText:          { fontSize: 14, lineHeight: 20 },
  bubbleTextUser:      { color: C.white },
  bubbleTextAssistant: { color: C.onSurface },

  expScroll: { marginTop: 10 },
  expCard: {
    width: 190,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant + '50',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  expImg:    { width: '100%', height: 90 },
  expBody:   { padding: 10 },
  expTitle:  { fontSize: 13, fontWeight: '700', color: C.onSurface },
  expLoc:    { fontSize: 11, color: C.onSurfaceVariant, marginTop: 2 },
  expFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.outlineVariant + '30' },
  expPrice:  { fontSize: 12, fontWeight: '800', color: C.primary },
  expCta:    { fontSize: 11, fontWeight: '700', color: C.secondary },

  errorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { fontSize: 12, color: '#b91c1c', flex: 1 },

  suggestionsWrap: { paddingHorizontal: 16, marginBottom: 8 },
  suggestions:     { gap: 8, paddingVertical: 4 },
  suggestion: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.primary + '10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.primary + '25',
  },
  suggestionText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant + '40',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.outlineVariant + '80',
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: C.onSurface,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
    ...Platform.select({
      ios:     { shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  sendBtnDisabled: { backgroundColor: C.outlineVariant },
});
