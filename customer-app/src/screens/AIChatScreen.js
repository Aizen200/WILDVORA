import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image,ImageBackground, Platform, KeyboardAvoidingView,
  Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { experienceAPI, aiAPI } from '../services/api';

const HERO_IMAGE = require('../../assets/heroimage.png');

const EXAMPLE_PROMPTS = [
  '"Show me beginner-friendly treks\nnear Bangalore under ₹5,000."',
  '"Plan a 3-day monsoon escape\nfor 2 people."',
  '"Family camping near rivers\nthis weekend."',
  '"Hidden gems off the beaten path\nin South India."',
];

const CHIPS = [
  'Weekend Trips', 'Budget Treks', 'Camping',
  'Hidden Gems', 'Family Adventures', 'Monsoon Escapes',
];

const FOLLOW_UPS = ['Best time to go?', 'Similar options?', 'What to pack?', 'How to book?'];

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMxqmVZiEOLbS8iPmgbb6yZs6DOT2ueMpEqfGJceQT5UKb-vk8NYWZoAt-1MkZLPkvjsFtOReCDsVaBRG2KY5KP5LdT49c2FNnkGdDbeshfCbeECqk1lyKhgWaKU2qqSQj1pSjg3VQvAPEhnvArYc-0kRxN-egqoRdUN60Zei6Lxkitme_X-kKfjWYdpZLwNE3UQasoTRlT0cziDoDMIxVfscnKB10ZHEogVN5cDmdIQ9fXIkS0iIBlFS-U5ymQ8eXcWCBSG9l6Fg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCwlcB3bQtzyJNOrLT4EsnoHFNw9cIRYARJ7T09kYY_AQYhYTBPp8P-JZ1ql_NGI3NiFwbW0OxMTzdUW5vwAyY6imbUS88XUUqVyZNLXI14OJIghFzuSgbwv5qfjjyyVCaE47qFk8AL4y2rHBjgcBC8hPxXywIJeN5COCXEVUbMkkAuD_IGQ55wzAfDXDnMLwC9CkmkVl3p7WXltYRzxGKBNefxfzmlLZ92u-XqtHzE41ZakGWrChYh9ccxbqDXnzVBfpvYA',
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

/* ── Typing dots ── */
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDot = (val, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: -5, duration: 260, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0,  duration: 260, useNativeDriver: true }),
          Animated.delay(480),
        ])
      );
    const a1 = makeDot(dot1, 0);
    const a2 = makeDot(dot2, 160);
    const a3 = makeDot(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.5)',
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
};

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [screen, setScreen]       = useState('landing');
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [promptIdx, setPromptIdx] = useState(0);

  /* ── Landing ↔ chat transition ── */
  const landingOpacity = useRef(new Animated.Value(1)).current;
  const chatOpacity    = useRef(new Animated.Value(0)).current;
  const chatSlideY     = useRef(new Animated.Value(30)).current;

  /* ── Glass card pulsing border (useNativeDriver must be false for color) ── */
  const pulseBorder = useRef(new Animated.Value(0)).current;
  const cardBorderColor = pulseBorder.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [
      'rgba(255,255,255,0.10)',
      'rgba(255,255,255,0.40)',
      'rgba(255,255,255,0.10)',
    ],
  });

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseBorder, {
        toValue: 1, duration: 4000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  /* ── Rotate example prompts ── */
  useEffect(() => {
    const t = setInterval(() => setPromptIdx(i => (i + 1) % EXAMPLE_PROMPTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    if (screen === 'chat' && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages, loading, screen]);

  /* ── Send message ── */
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
      const res = await aiAPI.getTripPlan({
        messages: next.map(m => ({ role: m.role, content: m.text })),
      });
      if (res.data?.success) {
        const { text: reply, recommendedExperienceIds } = res.data.tripPlan;
        let resolved = [];
        if (recommendedExperienceIds?.length) {
          const results = await Promise.all(
            recommendedExperienceIds.map(id =>
              experienceAPI.getOne(id).then(r => r.data.experience).catch(() => null)
            )
          );
          resolved = results.filter(Boolean);
        }
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: cleanText(reply),
            experiences: resolved,
            time: getTime(),
          },
        ]);
      } else {
        setError('Could not get a response. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reach the AI.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Transitions ── */
  const goToChat = (query) => {
    const q = (query || input).trim();
    if (!q || loading) return;
    send(q);
    Animated.timing(landingOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
      setScreen('chat');
      Animated.parallel([
        Animated.timing(chatOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(chatSlideY,  { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  };

  const goBackToLanding = () => {
    Animated.parallel([
      Animated.timing(chatOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(chatSlideY,  { toValue: 30, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setScreen('landing');
      Animated.timing(landingOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    });
  };

  /* ── Experience cards in chat ── */
  const renderExpCards = (exps) => (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      style={{ marginTop: 12 }}
      contentContainerStyle={{ gap: 10 }}
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
            source={{ uri: exp.coverImage || exp.images?.[0] || CARD_IMAGES[idx % 2] }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFillObject} />
          <View style={s.expBody}>
            <Text style={s.expCategory}>{exp.category || 'Adventure'}</Text>
            <Text style={s.expTitle} numberOfLines={2}>{exp.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }}>
              <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.55)" />
              <Text style={s.expLoc} numberOfLines={1}>{exp.location?.city}</Text>
              <Text style={s.expPrice}> · ₹{exp.price}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  /* ════════════════════════════════════════════════════════ */
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {/* ══════════════════ LANDING ══════════════════ */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { opacity: landingOpacity }]}
        pointerEvents={screen === 'landing' ? 'auto' : 'none'}
      >
        {/* Full-screen hero image via ImageBackground */}
        <ImageBackground source={HERO_IMAGE} style={{ flex: 1 }} resizeMode="cover">

          {/* Dark cinematic overlay — matches HTML hero-overlay */}
          <LinearGradient
            colors={[
  'rgba(0,0,0,0.08)',
  'rgba(0,0,0,0.18)',
  'rgba(0,0,0,0.40)',
]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Flex column: nav at top → spacer → bottom content */}
          <View style={{ flex: 1, paddingTop: insets.top }}>

            {/* ── Top nav (h-24 = 96px in HTML, paddingVertical handles height) ── */}
            <View style={s.topNav}>
              <Text style={s.logo}>Wildvora</Text>
              <TouchableOpacity
                style={s.iconBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Spacer fills the middle — hero image visible */}
            <View style={{ flex: 1 }} />

            {/* ── Bottom section: card + search + chips ── */}
            <View style={[s.bottomSection, { paddingBottom: insets.bottom + 32 }]}>

              {/* ── Glass card with pulsing border ── */}
              <Animated.View style={[s.glassCard, { borderColor: cardBorderColor }]}>
                {/* Dismiss chip in card top-right */}
                <TouchableOpacity style={s.cardCloseBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={16} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                  {/* "AI Search" label */}
                  <Text style={s.aiLabel}>AI Search</Text>
                  {/* Rotating example prompt — large headline */}
                  <Text style={s.examplePrompt}>{EXAMPLE_PROMPTS[promptIdx]}</Text>
                </View>
              </Animated.View>

              {/* ── Search interface ── */}
              <View style={s.searchSection}>
                {/* Search input row */}
                <View style={s.searchRow}>
                  <TextInput
                    style={s.searchInput}
                    placeholder="Ask Wildvora anything..."
                    placeholderTextColor="rgba(255,255,255,0.50)"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={() => goToChat()}
                    returnKeyType="search"
                  />
                  <TouchableOpacity
                    style={s.searchBtn}
                    onPress={() => goToChat()}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-forward" size={22} color="#002115" />
                  </TouchableOpacity>
                </View>

                {/* Suggestion chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingRight: 8 }}
                >
                  {CHIPS.map(chip => (
                    <TouchableOpacity
                      key={chip}
                      style={s.chip}
                      onPress={() => goToChat(chip)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.chipTxt}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

            </View>
          </View>
        </ImageBackground>
      </Animated.View>

      {/* ══════════════════ CHAT ══════════════════ */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: chatOpacity, transform: [{ translateY: chatSlideY }] },
        ]}
        pointerEvents={screen === 'chat' ? 'auto' : 'none'}
      >
        <View style={{ flex: 1, backgroundColor: '#0b1310' }}>

          {/* Chat header */}
          <View style={[s.chatHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={s.iconBtn} onPress={goBackToLanding} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.chatTitle}>Wildvora AI</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                <Text style={s.chatSub}>Powered by Wildvora</Text>
              </View>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={[s.chatList, { paddingBottom: insets.bottom + 20 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLastAI = !isUser && idx === messages.length - 1 && !loading;
                return (
                  <View key={msg.id}>
                    <View style={[s.msgRow, isUser ? s.msgUser : s.msgAI]}>
                      {!isUser && (
                        <View style={s.aiBadge}>
                          <Text style={s.aiBadgeTxt}>AI</Text>
                        </View>
                      )}
                      <View style={[s.bubble, isUser ? s.bubUser : s.bubAI]}>
                        <Text style={[s.bubTxt, isUser && { color: '#fff' }]}>{msg.text}</Text>
                      </View>
                    </View>

                    {!isUser && msg.experiences?.length > 0 && (
                      <View style={{ paddingLeft: 44 }}>
                        {renderExpCards(msg.experiences)}
                      </View>
                    )}

                    {isLastAI && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                          gap: 8, paddingLeft: 44, paddingVertical: 10, paddingRight: 8,
                        }}
                      >
                        {FOLLOW_UPS.map(fc => (
                          <TouchableOpacity
                            key={fc} style={s.followChip}
                            onPress={() => send(fc)} activeOpacity={0.75}
                          >
                            <Text style={s.followTxt}>{fc}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                );
              })}

              {loading && (
                <View style={[s.msgRow, s.msgAI]}>
                  <View style={s.aiBadge}><Text style={s.aiBadgeTxt}>AI</Text></View>
                  <View style={[s.bubble, s.bubAI]}><TypingDots /></View>
                </View>
              )}

              {!!error && (
                <View style={s.errRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
                  <Text style={{ fontSize: 12, color: '#f87171', flex: 1 }}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* Chat input bar */}
            <View style={[s.inputBar, { paddingBottom: insets.bottom + 10 }]}>
              <TextInput
                style={s.chatInputField}
                placeholder="Ask Wildvora anything..."
                placeholderTextColor="rgba(255,255,255,0.32)"
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
                <Ionicons
                  name="send"
                  size={16}
                  color={input.trim() && !loading ? '#002115' : 'rgba(255,255,255,0.28)'}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>

    </View>
  );
}

const s = StyleSheet.create({

  /* ══ LANDING ══ */

  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 20,
  },
  logo: {
    fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5,
  },
  iconBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Bottom section holds card + search — matches HTML main pb-24 layout */
  bottomSection: {
    paddingHorizontal: 20,
    gap: 0,
  },

  /* Glass card — rgba(10,10,10,0.45) + animated border */
  glassCard: {
    backgroundColor: 'rgba(10,10,10,0.45)',
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    marginBottom: 32,
  },
  cardCloseBtn: {
    position: 'absolute', top: 18, right: 18,
    padding: 4,
  },
  aiLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 5, textTransform: 'uppercase',
    marginBottom: 18,
  },
  examplePrompt: {
    fontSize: 26, fontWeight: '700', color: '#fff',
    lineHeight: 34, textAlign: 'center', letterSpacing: -0.4,
  },

  /* Search section — gap between search and chips */
  searchSection: {
    gap: 20,
  },

  /* Search input row — h-20 (80px) in HTML → 72px on mobile */
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 50, paddingLeft: 24, paddingRight: 6, height: 72,
  },
  searchInput: {
    flex: 1, fontSize: 17, color: '#fff',
  },
  searchBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#88D6B2',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Chips — px-6 py-2.5 in HTML */
  chip: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 50,
  },
  chipTxt: {
    fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* ══ CHAT ══ */

  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  chatTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  chatSub:   { fontSize: 11, color: 'rgba(255,255,255,0.38)' },

  chatList: { paddingHorizontal: 16, paddingTop: 24, gap: 14 },

  msgRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', maxWidth: '90%' },
  msgUser: { alignSelf: 'flex-end' },
  msgAI:   { alignSelf: 'flex-start' },

  aiBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(136,214,178,0.1)',
    borderWidth: 1, borderColor: 'rgba(136,214,178,0.25)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  aiBadgeTxt: { fontSize: 9, color: '#88D6B2', fontWeight: '800', letterSpacing: 0.5 },

  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, maxWidth: '88%' },
  bubUser: { backgroundColor: '#1A5F45', borderBottomRightRadius: 5 },
  bubAI: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 5,
  },
  bubTxt: { fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.88)' },

  followChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(136,214,178,0.08)',
    borderWidth: 1, borderColor: 'rgba(136,214,178,0.2)',
    borderRadius: 50,
  },
  followTxt: { fontSize: 12, color: '#88D6B2', fontWeight: '600' },

  errRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#0b1310',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  chatInputField: {
    flex: 1, minHeight: 46, maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 23, paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, color: '#fff',
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#88D6B2',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  sendBtnOff: { backgroundColor: 'rgba(255,255,255,0.08)' },

  /* ══ EXPERIENCE CARDS ══ */
  expCard: {
    width: 200, height: 148, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#1a2820',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  expBody:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  expCategory: {
    fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3,
  },
  expTitle:    { fontSize: 13, fontWeight: '700', color: '#fff', lineHeight: 17 },
  expLoc:      { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  expPrice:    { fontSize: 11, color: '#88D6B2', fontWeight: '700' },
});
