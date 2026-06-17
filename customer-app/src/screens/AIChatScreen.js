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
