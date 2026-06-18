import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, Platform, KeyboardAvoidingView, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { experienceAPI, aiAPI } from '../services/api';

const C = {
  primary:          '#1A5F45',
  primaryDark:      '#154D38',
  primaryLight:     '#E8F5EF',
  chatBg:           '#EDF1EF',
  surface:          '#ffffff',
  onSurface:        '#181d1a',
  onSurfaceVariant: '#5A6B64',
  outlineVariant:   '#C5D1CB',
  secondary:        '#0a6687',
  white:            '#ffffff',
};

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMxqmVZiEOLbS8iPmgbb6yZs6DOT2ueMpEqfGJceQT5UKb-vk8NYWZoAt-1MkZLPkvjsFtOReCDsVaBRG2KY5KP5LdT49c2FNnkGdDbeshfCbeECqk1lyKhgWaKU2qqSQj1pSjg3VQvAPEhnvArYc-0kRxN-egqoRdUN60Zei6Lxkitme_X-kKfjWYdpZLwNE3UQasoTRlT0cziDoDMIxVfscnKB10ZHEogVN5cDmdIQ9fXIkS0iIBlFS-U5ymQ8eXcWCBSG9l6Fg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwlcB3bQtzyJNOrLT4EsnoHFNw9cIRYARJ7T09kYY_AQYhYTBPp8P-JZ1ql_NGI3NiFwbW0OxMTzdUW5vwAyY6imbUS88XUUqVyZNLXi14OJIghFzuSgbwv5qfjjyyVCaE47qFk8AL4y2rHBjgcBC8hPxXywIJeN5COCXEVUbMkkAuD_IGQ55wzAfDXDnMLwC9CkmkVl3p7WXltYRzxGKBNefxfzmlLZ92u-XqtHzE41ZakGWrChYh9ccxbqDXnzVBfpvYA',
];

const SUGGESTED = [
  '3-day trek in Himachal under ₹5000',
  'Family camping near a river',
  'Water sports trip in Goa for 2',
  'Jungle safari under ₹8000',
];

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[\*\-] /gm, '• ')
    .replace(/^#{1,6} /gm, '')
    .replace(/`(.+?)`/g, '$1')
    .trim();
};

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/* ─── Animated typing indicator ─── */
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 260, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 260, useNativeDriver: true }),
          Animated.delay(480),
        ])
      );
    const a1 = make(dot1, 0);
    const a2 = make(dot2, 160);
    const a3 = make(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4, paddingHorizontal: 2 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 9, height: 9, borderRadius: 5,
            backgroundColor: C.onSurfaceVariant + '80',
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
};

/* ─── Smart message text renderer ─── */
const MessageText = ({ text, isUser }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const textColor = isUser ? C.white : C.onSurface;
  const accentColor = isUser ? 'rgba(255,255,255,0.9)' : C.primary;

  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={{ height: 5 }} />;

        if (trimmed.startsWith('•') || /^[-–]\s/.test(trimmed)) {
          const content = trimmed.replace(/^[•\-–]\s*/, '');
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 7, marginVertical: 1 }}>
              <Text style={{ color: accentColor, fontSize: 14, lineHeight: 21 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: textColor }}>{content}</Text>
            </View>
          );
        }

        if (!isUser && /^day\s*\d+[\s:]/i.test(trimmed)) {
          return (
            <Text key={i} style={{ fontSize: 13, fontWeight: '700', color: accentColor, marginTop: 10, marginBottom: 1 }}>
              {trimmed}
            </Text>
          );
        }

        return (
          <Text key={i} style={{ fontSize: 14, lineHeight: 21, color: textColor }}>
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
};

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Chat');

  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: 'Hi! I am your Wildvora trip planner. Tell me about your dream adventure and I will recommend the perfect itinerary — budget, duration, group size, anything.',
      experiences: [],
      time: getTime(),
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [budget, setBudget]               = useState('');
  const [groupSize, setGroupSize]         = useState('');
  const [duration, setDuration]           = useState('');
  const [adventureLevel, setAdventureLevel] = useState('Easy');
  const [plannerResult, setPlannerResult] = useState(null);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [plannerError, setPlannerError]   = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: trimmed, time: getTime() };
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
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: cleanText(replyText),
            experiences: resolved,
            time: getTime(),
          },
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
        duration,
        adventureLevel,
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
          explanation: cleanText(tripPlan.explanation),
          experiences: resolved,
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

  const renderExpCards = (exps) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 12 }}
      contentContainerStyle={{ gap: 10, paddingRight: 4 }}
      nestedScrollEnabled
    >
      {exps.map((exp, idx) => (
        <TouchableOpacity
          key={exp._id || idx}
          style={s.expCard}
          onPress={() => navigation.navigate('ExperienceDetail', { experienceId: exp._id })}
          activeOpacity={0.88}
        >
          <Image
            source={{ uri: exp.coverImage || exp.images?.[0] || CARD_IMAGES[idx % CARD_IMAGES.length] }}
            style={s.expImg}
            resizeMode="cover"
          />
          <View style={s.expCategoryTag}>
            <Text style={s.expCategoryText}>{exp.category || 'Adventure'}</Text>
          </View>
          <View style={s.expBody}>
            <Text style={s.expTitle} numberOfLines={2}>{exp.title}</Text>
            <View style={s.expLocRow}>
              <Ionicons name="location-outline" size={11} color={C.onSurfaceVariant} />
              <Text style={s.expLoc} numberOfLines={1}>
                {exp.location?.city}, {exp.location?.country}
              </Text>
            </View>
            <View style={s.expFooter}>
              <Text style={s.expPrice}>
                ₹{exp.price}
                <Text style={s.expPricePer}>/person</Text>
              </Text>
              <View style={s.expCtaRow}>
                <Text style={s.expCtaText}>View</Text>
                <Ionicons name="arrow-forward" size={10} color={C.secondary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerAvatar}>
            <MaterialCommunityIcons name="robot" size={18} color={C.white} />
          </View>
          <View>
            <Text style={s.headerLabel}>AI Trip Planner</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.headerSub}>Online · Powered by Wildvora</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabBar}>
        {[
          { key: 'Chat', label: 'AI Chat' },
          { key: 'Planner', label: 'AI Guided Planner' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, activeTab === key && s.tabBtnActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[s.tabText, activeTab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Chat' ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* ── Messages ── */}
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
                <View key={msg.id} style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAI]}>
                  {!isUser && (
                    <View style={s.msgAvatar}>
                      <MaterialCommunityIcons name="robot-outline" size={15} color={C.primary} />
                    </View>
                  )}
                  <View style={[s.msgCol, isUser && { alignItems: 'flex-end' }]}>
                    <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
                      <MessageText text={msg.text} isUser={isUser} />
                    </View>
                    {msg.time ? (
                      <Text style={s.timeLabel}>{msg.time}</Text>
                    ) : null}
                    {!isUser && msg.experiences?.length > 0 && renderExpCards(msg.experiences)}
                  </View>
                </View>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <View style={[s.msgRow, s.msgRowAI]}>
                <View style={s.msgAvatar}>
                  <MaterialCommunityIcons name="robot-outline" size={15} color={C.primary} />
                </View>
                <View style={[s.bubble, s.bubbleAI, { paddingVertical: 10 }]}>
                  <TypingDots />
                </View>
              </View>
            )}

            {error ? (
              <View style={s.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* ── Suggestion chips ── */}
          {messages.length === 1 && !loading && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 6 }}
              style={{ flexGrow: 0 }}
            >
              {SUGGESTED.map((label) => (
                <TouchableOpacity
                  key={label}
                  style={s.chip}
                  onPress={() => send(label)}
                  activeOpacity={0.78}
                >
                  <Text style={s.chipText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Input bar ── */}
          <View style={[s.inputBar, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              style={s.input}
              placeholder="Tell me your dream adventure..."
              placeholderTextColor={C.onSurfaceVariant + '70'}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              editable={!loading}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
              onPress={() => send()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color={C.white} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* ── Planner tab ── */
        <ScrollView style={{ flex: 1, backgroundColor: C.chatBg }} contentContainerStyle={s.plannerContent}>
          <View style={s.plannerHeaderCard}>
            <View style={s.plannerIconWrap}>
              <MaterialCommunityIcons name="map-search" size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.plannerTitle}>AI Guided Planner</Text>
              <Text style={s.plannerSub}>Tell us your preferences and we will scan approved experiences to craft your perfect trip.</Text>
            </View>
          </View>

          {[
            { label: 'Budget (₹)', placeholder: 'e.g. 5000', value: budget, onChange: setBudget, numeric: true },
            { label: 'Group Size', placeholder: 'e.g. 4', value: groupSize, onChange: setGroupSize, numeric: true },
            { label: 'Duration', placeholder: 'e.g. 3 days', value: duration, onChange: setDuration, numeric: false },
          ].map((field) => (
            <View key={field.label} style={s.formGroup}>
              <Text style={s.formLabel}>{field.label}</Text>
              <TextInput
                style={s.formInput}
                keyboardType={field.numeric ? 'numeric' : 'default'}
                placeholder={field.placeholder}
                placeholderTextColor={C.onSurfaceVariant + '65'}
                value={field.value}
                onChangeText={field.onChange}
              />
            </View>
          ))}

          <View style={s.formGroup}>
            <Text style={s.formLabel}>Adventure Level</Text>
            <View style={s.levelRow}>
              {[
                { key: 'Easy', color: '#16a34a' },
                { key: 'Moderate', color: '#d97706' },
                { key: 'Hard', color: '#ea580c' },
                { key: 'Expert', color: '#dc2626' },
              ].map(({ key, color }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    s.levelBtn,
                    adventureLevel === key && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setAdventureLevel(key)}
                >
                  <View
                    style={[
                      s.levelDot,
                      { backgroundColor: adventureLevel === key ? 'rgba(255,255,255,0.8)' : color + '30' },
                    ]}
                  >
                    <View
                      style={{
                        width: 6, height: 6, borderRadius: 3,
                        backgroundColor: adventureLevel === key ? C.white : color,
                      }}
                    />
                  </View>
                  <Text style={[s.levelText, adventureLevel === key && { color: C.white, fontWeight: '700' }]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {plannerError ? (
            <View style={s.errBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
              <Text style={s.errBoxText}>{plannerError}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={s.planBtn} onPress={handlePlanTrip} disabled={plannerLoading} activeOpacity={0.85}>
            {plannerLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.planBtnText}>Finding your adventure...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="creation" size={18} color="#fff" />
                <Text style={s.planBtnText}>Plan My Trip</Text>
              </View>
            )}
          </TouchableOpacity>

          {plannerResult && (
            <View style={s.resultCard}>
              <View style={s.resultBadgeRow}>
                <MaterialCommunityIcons name="check-decagram" size={14} color={C.primary} />
                <Text style={s.resultBadgeText}>RECOMMENDED FOR YOU</Text>
              </View>
              <Text style={s.resultTripName}>{plannerResult.recommendedTrip}</Text>

              <View style={s.statsRow}>
                {[
                  { icon: 'cash-multiple', label: 'Cost', value: plannerResult.cost },
                  { icon: 'map-marker-distance', label: 'Distance', value: plannerResult.distance },
                  { icon: 'gauge', label: 'Difficulty', value: plannerResult.difficulty },
                ].map(({ icon, label, value }) => (
                  <View key={label} style={s.statItem}>
                    <MaterialCommunityIcons name={icon} size={20} color={C.primary} style={{ marginBottom: 5 }} />
                    <Text style={s.statValue}>{value}</Text>
                    <Text style={s.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              {plannerResult.explanation ? (
                <View style={s.explanationBox}>
                  <MaterialCommunityIcons name="information-outline" size={14} color={C.primary} style={{ marginTop: 1, flexShrink: 0 }} />
                  <Text style={s.explanationText}>{plannerResult.explanation}</Text>
                </View>
              ) : null}

              {plannerResult.experiences?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={s.resultExpHeading}>Book matching adventures</Text>
                  {renderExpCards(plannerResult.experiences)}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.chatBg },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '50',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  headerLabel: { fontSize: 15, fontWeight: '700', color: C.onSurface },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  headerSub:   { fontSize: 11, color: C.onSurfaceVariant },

  /* Tabs */
  tabBar: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '50',
  },
  tabBtn: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: C.primary },
  tabText:      { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  tabTextActive: { color: C.primary, fontWeight: '700' },

  /* Chat */
  scroll: { flex: 1, backgroundColor: C.chatBg },
  scrollContent: { paddingHorizontal: 14, paddingTop: 16, gap: 10 },

  msgRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-end', maxWidth: '85%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowAI:  { alignSelf: 'flex-start' },
  msgCol:    { flex: 1, gap: 3 },

  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },

  bubble: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18 },
  bubbleUser: {
    backgroundColor: C.primary,
    borderTopRightRadius: 4,
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  bubbleAI: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.outlineVariant + '60',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },

  timeLabel: { fontSize: 10, color: C.onSurfaceVariant + '90', marginHorizontal: 2, marginTop: 1 },

  /* Suggestion chips */
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.primary + '40',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  chipText: { fontSize: 12, color: C.primary, fontWeight: '600' },

  /* Input bar */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingTop: 10,
    backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.outlineVariant + '60',
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 110,
    backgroundColor: C.chatBg,
    borderWidth: 1, borderColor: C.outlineVariant + '90',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 14, color: C.onSurface,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  sendBtnOff: {
    backgroundColor: C.outlineVariant,
    ...Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 } }),
  },

  /* Error */
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 12, color: '#dc2626', flex: 1 },

  /* Experience cards */
  expCard: {
    width: 185, backgroundColor: C.surface, borderRadius: 14, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  expImg: { width: '100%', height: 102 },
  expCategoryTag: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  expCategoryText: { fontSize: 10, color: '#fff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  expBody:    { padding: 10 },
  expTitle:   { fontSize: 13, fontWeight: '700', color: C.onSurface, lineHeight: 17 },
  expLocRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  expLoc:     { fontSize: 11, color: C.onSurfaceVariant, flex: 1 },
  expFooter:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.outlineVariant + '40',
  },
  expPrice:    { fontSize: 13, fontWeight: '800', color: C.primary },
  expPricePer: { fontSize: 10, fontWeight: '500', color: C.onSurfaceVariant },
  expCtaRow:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  expCtaText:  { fontSize: 11, fontWeight: '700', color: C.secondary },

  /* Planner tab */
  plannerContent: { padding: 20, paddingBottom: 40 },
  plannerHeaderCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 22,
    borderWidth: 1, borderColor: C.outlineVariant + '50',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  plannerIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  plannerTitle: { fontSize: 16, fontWeight: '800', color: C.onSurface },
  plannerSub:   { fontSize: 12, color: C.onSurfaceVariant, marginTop: 3, lineHeight: 17 },

  formGroup: { marginBottom: 16 },
  formLabel: {
    fontSize: 11, fontWeight: '700', color: C.onSurface,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  formInput: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.outlineVariant + '80',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.onSurface,
  },

  levelRow: { flexDirection: 'row', gap: 8 },
  levelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.outlineVariant + '90',
    backgroundColor: C.surface, alignItems: 'center', gap: 5,
  },
  levelDot: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  levelText: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },

  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#fecaca', marginBottom: 14,
  },
  errBoxText: { fontSize: 13, color: '#dc2626', flex: 1 },

  planBtn: {
    backgroundColor: C.primary, paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  planBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

  /* Result card */
  resultCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 18, marginTop: 24,
    borderWidth: 1, borderColor: C.outlineVariant + '60',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  resultBadgeRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  resultBadgeText: { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 0.9 },
  resultTripName:  { fontSize: 21, fontWeight: '800', color: C.onSurface, lineHeight: 27, marginBottom: 16 },

  statsRow: {
    flexDirection: 'row', backgroundColor: C.primaryLight,
    borderRadius: 12, paddingVertical: 16, marginBottom: 14,
  },
  statItem:  { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', color: C.onSurface, marginBottom: 2 },
  statLabel: {
    fontSize: 10, color: C.onSurfaceVariant,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4,
  },

  explanationBox: {
    flexDirection: 'row', gap: 8,
    backgroundColor: '#F0F8F4', borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.primary, marginBottom: 4,
  },
  explanationText: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19, flex: 1 },

  resultExpHeading: { fontSize: 13, fontWeight: '700', color: C.onSurface, marginBottom: 4 },
});
