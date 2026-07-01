import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image, Platform,
  Animated, Easing, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { experienceAPI, aiAPI } from '../services/api';

/* Local fallbacks — used whenever an experience has no usable image */
const LOCAL_CARD_IMAGES = [
  require('../../assets/browse/weekend.jpg'),
  require('../../assets/browse/women.jpg'),
  require('../../assets/browse/toprated.jpg'),
  require('../../assets/browse/verified.jpg'),
];

const PROMPTS = [
  [
    { t: '"Show me beginner-friendly treks near ' },
    { t: 'Bangalore', hl: true },
    { t: ' under ' },
    { t: '₹5,000', hl: true },
    { t: '."' },
  ],
  [
    { t: '"Plan a ' },
    { t: '3-day monsoon escape', hl: true },
    { t: ' for ' },
    { t: '2 people', hl: true },
    { t: '."' },
  ],
  [
    { t: '"Family ' },
    { t: 'camping', hl: true },
    { t: ' near rivers ' },
    { t: 'this weekend', hl: true },
    { t: '."' },
  ],
  [
    { t: '"How is ' },
    { t: 'Pachmarhi', hl: true },
    { t: ' in ' },
    { t: 'July', hl: true },
    { t: '?"' },
  ],
];

/* ─── Image resolution — checks every possible image field, validates the   ─
 ─ URL, and always falls back to a stable local asset so a card never shows ─
 ─ a blank/broken image.                                                    ─ */
function isValidImageUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return /^(https?:\/\/|data:image\/)/i.test(trimmed);
}

// On Android emulator `localhost` routes to the emulator itself, not the host
// machine. Rewrite stored localhost URLs so images load on every platform.
function platformUrl(url) {
  if (!url) return url;
  if (Platform.OS === 'android') {
    return url.replace(/http:\/\/localhost:/gi, 'http://10.0.2.2:');
  }
  return url;
}

function pickExperienceImageUri(exp) {
  const candidates = [
    exp?.coverImage,
    ...(Array.isArray(exp?.images) ? exp.images : []),
    ...(Array.isArray(exp?.adventureImages) ? exp.adventureImages : []),
  ];
  const found = candidates.find(isValidImageUrl);
  return found ? found.trim() : null;
}

function localFallbackFor(exp) {
  const seed = `${exp?.category || ''}${exp?._id || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return LOCAL_CARD_IMAGES[hash % LOCAL_CARD_IMAGES.length];
}

/* ─── Dynamic suggestion chips — built from the real catalogue so every    ─
 ─ chip is guaranteed to return at least one result before it is shown.    ─ */
function buildDynamicChips(experiences, max = 6) {
  if (!experiences || experiences.length === 0) return [];

  const candidates = [];
  const seen = new Set();
  const addCandidate = (label, test) => {
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ label, test });
  };

  [...new Set(experiences.map(e => e.category).filter(Boolean))]
    .forEach(cat => addCandidate(`${cat} adventures`, e => e.category === cat));

  [...new Set(experiences.map(e => e.location?.city).filter(Boolean))]
    .slice(0, 4)
    .forEach(city => addCandidate(`Trips in ${city}`, e => e.location?.city === city));

  const prices = experiences.map(e => e.price).filter(p => typeof p === 'number' && p > 0).sort((a, b) => a - b);
  if (prices.length > 0) {
    const budget = prices[Math.floor(prices.length * 0.4)];
    addCandidate(`Budget under ₹${budget.toLocaleString('en-IN')}`, e => (e.price || 0) <= budget);
  }

  addCandidate('Top rated picks', e => parseFloat(e.rating || 0) >= 4.5);
  addCandidate('Beginner friendly', e => (e.difficulty || '').toLowerCase() === 'easy');
  addCandidate('Weekend getaways', e => /weekend|1\s*day|2\s*day/i.test(e.duration || ''));
  addCandidate('Family friendly', e => (e.minGroupSize || 1) <= 2 && (e.maxGroupSize || 12) >= 4);

  return candidates
    .filter(c => experiences.some(c.test))
    .slice(0, max)
    .map(c => c.label);
}

/* ─── LoadingCard ───────────────────────────────────────────── */
function LoadingCard() {
  const pulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{ opacity: pulse }}>
      <View style={s.loadCard}>
        <View style={s.loadImg} />
        <View style={{ padding: 14, gap: 10 }}>
          <View style={[s.loadLine, { width: '65%', height: 16 }]} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[72, 88, 68].map((w, i) => (
              <View key={i} style={[s.loadPill, { width: w }]} />
            ))}
          </View>
          <View style={[s.loadLine, { width: '92%' }]} />
          <View style={[s.loadLine, { width: '78%' }]} />
          <View style={s.loadBtn} />
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── GlassAICard ───────────────────────────────────────────── */
function GlassAICard({ promptIdx, promptOpacity }) {
  return (
    <View style={s.shadowWrap}>
      <View style={s.clipWrap}>
        <BlurView intensity={24} tint="dark">
          <View style={s.glassBody}>
            <View style={s.cardHeaderRow}>
              <Text style={s.aiLabel}>AI Search</Text>
              <Ionicons name="flash-outline" size={15} color="rgba(163,243,205,0.55)" />
            </View>
            <View style={s.promptArea}>
              <Animated.View style={{ opacity: promptOpacity, alignItems: 'center' }}>
                <Text style={s.promptText}>
                  {PROMPTS[promptIdx].map((seg, i) => (
                    <Text key={i} style={seg.hl ? s.promptHL : null}>
                      {seg.t}
                    </Text>
                  ))}
                </Text>
              </Animated.View>
            </View>
            <View style={s.dividerRow}>
              <View style={s.divider} />
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

/* ─── AIAnswerCard — the assistant's conversational reply ──── */
function AIAnswerCard({ text, isTravelRelated }) {
  return (
    <View
      style={[s.answerCard, !isTravelRelated && s.answerCardMuted]}
      accessibilityRole="text"
      accessibilityLabel={`Wildvora AI says: ${text}`}
    >
      <View style={s.answerHeaderRow}>
        <Ionicons
          name={isTravelRelated ? 'sparkles' : 'compass-outline'}
          size={15}
          color={isTravelRelated ? '#a3f3cd' : 'rgba(255,255,255,0.55)'}
        />
        <Text style={s.answerLabel}>Wildvora AI</Text>
      </View>
      <Text style={s.answerText}>{text}</Text>
    </View>
  );
}

/* ─── ExperienceCard ────────────────────────────────────────── */
function ExperienceCard({ exp, reason, onView }) {
  const [imgErr, setImgErr] = useState(false);
  const rawUri  = useMemo(() => pickExperienceImageUri(exp), [exp]);
  const remoteUri = useMemo(() => (rawUri ? platformUrl(rawUri) : null), [rawUri]);
  const fallback  = useMemo(() => localFallbackFor(exp), [exp]);

  const ratingValue = parseFloat(exp.rating || 0);
  const hasRating = ratingValue > 0;
  const stars = Math.round(ratingValue);

  return (
    <View style={s.expShadow}>
      <View style={s.expClip}>
        {/* Hero image */}
        <View style={s.expImgWrap}>
          {/* Local fallback always renders — no blank slot even if onError never fires */}
          <Image
            source={fallback}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          {/* Remote image loads on top; fallback stays visible if remote fails */}
          {!imgErr && !!remoteUri && (
            <Image
              source={{ uri: remoteUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setImgErr(true)}
              accessibilityLabel={`Photo of ${exp.title || 'experience'}`}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.72)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Price badge — top right */}
          <View style={s.priceBadge}>
            <Text style={s.priceBadgeText}>
              ₹{(exp.price || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Location — bottom left */}
          <View style={s.locOverlay}>
            <Ionicons
              name="location-outline"
              size={11}
              color="rgba(255,255,255,0.88)"
            />
            <Text style={s.locText} numberOfLines={1}>
              {exp.location?.city || 'India'}
            </Text>
          </View>
        </View>

        {/* Card body */}
        <View style={s.expContent}>
          <Text style={s.expTitle} numberOfLines={2}>
            {exp.title}
          </Text>

          {/* Why this was recommended */}
          {!!reason && (
            <View style={s.reasonRow}>
              <Ionicons name="sparkles-outline" size={13} color="#a3f3cd" />
              <Text style={s.reasonText} numberOfLines={2}>{reason}</Text>
            </View>
          )}

          {/* Duration + difficulty meta pills */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {exp.duration && (
              <View style={s.metaPill}>
                <Ionicons
                  name="time-outline"
                  size={11}
                  color="rgba(255,255,255,0.60)"
                />
                <Text style={s.metaText}>{exp.duration}</Text>
              </View>
            )}
            {exp.difficulty && (
              <View style={s.metaPill}>
                <Ionicons
                  name="bar-chart-outline"
                  size={11}
                  color="rgba(255,255,255,0.60)"
                />
                <Text style={s.metaText}>{exp.difficulty}</Text>
              </View>
            )}
          </View>

          {/* Star rating, or an honest "New listing" badge when unrated */}
          {hasRating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Ionicons
                  key={i}
                  name={i < stars ? 'star' : 'star-outline'}
                  size={12}
                  color={i < stars ? '#f59e0b' : 'rgba(255,255,255,0.22)'}
                />
              ))}
              <Text style={s.ratingNum}>{ratingValue.toFixed(1)}</Text>
              {exp.reviewCount > 0 && (
                <Text style={s.reviewCount}>({exp.reviewCount})</Text>
              )}
            </View>
          ) : (
            <View style={s.newBadge}>
              <Text style={s.newBadgeText}>New listing</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={onView}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`View ${exp.title}`}
          >
            <Text style={s.ctaTxt}>View Experience</Text>
            <Ionicons name="arrow-forward" size={15} color="#002115" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ─── ErrorState — friendly recovery UI, never a dead end ──── */
function ErrorState({ message, onRetry, onReset }) {
  return (
    <View style={s.stateWrap}>
      <Ionicons name="cloud-offline-outline" size={40} color="rgba(255,255,255,0.30)" />
      <Text style={s.stateTitle}>Couldn't reach Wildvora AI</Text>
      <Text style={s.stateSubtitle}>
        {message || 'Something went wrong. Please check your connection and try again.'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <TouchableOpacity
          onPress={onRetry}
          style={s.stateBtn}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Retry search"
        >
          <Text style={s.stateBtnText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onReset}
          style={[s.stateBtn, s.stateBtnSecondary]}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={[s.stateBtnText, s.stateBtnSecondaryText]}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const scrollRef = useRef(null);

  /* state */
  const [allExperiences, setAllExperiences] = useState([]);
  const [appState, setAppState] = useState('idle'); // 'idle' | 'loading' | 'answered' | 'error'
  const [result, setResult] = useState(null);        // { query, text, isTravelRelated, cards: [{exp, reason}] }
  const [input, setInput]         = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);

  /* conversation context for the AI (not rendered) + last query for retry */
  const conversationRef = useRef([]);
  const lastQueryRef    = useRef('');

  /* animations */
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealSlideY  = useRef(new Animated.Value(32)).current;
  const promptOpacity = useRef(new Animated.Value(1)).current;
  const cardFade      = useRef(new Animated.Value(1)).current;
  const respSlideY    = useRef(new Animated.Value(48)).current;
  const respOpacity   = useRef(new Animated.Value(0)).current;
  const searchLift    = useRef(new Animated.Value(0)).current;

  /* pre-load all experiences on mount so chips + cards resolve instantly */
  useEffect(() => {
    experienceAPI
      .getAll({ limit: 100 })
      .then(r => setAllExperiences(r.data.experiences || []))
      .catch(() => {});
  }, []);

  /* initial reveal */
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(revealOpacity, {
          toValue: 1, duration: 700,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(revealSlideY, {
          toValue: 0, duration: 700,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  /* prompt rotation */
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(promptOpacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start(() => {
        setPromptIdx(i => (i + 1) % PROMPTS.length);
        Animated.timing(promptOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  /* scroll newest response into view */
  useEffect(() => {
    if (appState === 'answered' && scrollRef.current)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350);
  }, [result, appState]);

  const onFocus = () =>
    Animated.timing(searchLift, { toValue: -3, duration: 160, useNativeDriver: true }).start();
  const onBlur = () =>
    Animated.timing(searchLift, { toValue: 0, duration: 160, useNativeDriver: true }).start();

  const resetToIdle = () => {
    setAppState('idle');
    setResult(null);
    setInput('');
    setErrorMessage('');
    conversationRef.current = [];
    lastQueryRef.current = '';
    Animated.timing(cardFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    respOpacity.setValue(0);
    respSlideY.setValue(48);
  };

  const submitSearch = async (queryText) => {
    const q = (queryText ?? input).trim();
    if (!q || appState === 'loading') return;
    setInput('');
    lastQueryRef.current = q;

    Animated.timing(cardFade, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setAppState('loading');

    /* fetch experiences if not yet loaded */
    let exps = allExperiences;
    if (exps.length === 0) {
      try {
        const res = await experienceAPI.getAll({ limit: 100 });
        exps = res.data.experiences || [];
        setAllExperiences(exps);
      } catch (_) {}
    }

    conversationRef.current = [...conversationRef.current, { role: 'user', content: q }].slice(-8);

    try {
      const res = await aiAPI.getTripPlan({ messages: conversationRef.current });
      const plan = res.data?.tripPlan;
      if (!plan || typeof plan.text !== 'string') throw new Error('Invalid AI response');

      const isTravelRelated = plan.isTravelRelated !== false;
      const recs = Array.isArray(plan.recommendations) ? plan.recommendations : [];

      const cards = recs
        .map(r => {
          const exp = exps.find(e => e._id === r.id || e._id?.toString() === r.id);
          return exp ? { exp, reason: r.reason || '' } : null;
        })
        .filter(Boolean)
        .slice(0, 4);

      conversationRef.current.push({ role: 'assistant', content: plan.text });

      setResult({ query: q, text: plan.text, isTravelRelated, cards });
      setAppState('answered');

      respSlideY.setValue(48);
      respOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(respSlideY, {
          toValue: 0, duration: 500,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(respOpacity, {
          toValue: 1, duration: 450, useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      setErrorMessage("Wildvora AI couldn't respond right now. Please check your connection and try again.");
      setAppState('error');
    }
  };

  /* dynamic, pre-validated suggestion chips */
  const idleChips = useMemo(() => buildDynamicChips(allExperiences, 6), [allExperiences]);
  const followChips = useMemo(() => {
    if (appState !== 'answered' || !result) return [];
    const usedCategories = new Set(result.cards.map(c => c.exp.category));
    const freshPool = allExperiences.filter(e => !usedCategories.has(e.category));
    const fresh = buildDynamicChips(freshPool.length > 0 ? freshPool : allExperiences, 5);
    return fresh.length > 0 ? fresh : buildDynamicChips(allExperiences, 5);
  }, [appState, result, allExperiences]);
  const chips = appState === 'answered' ? followChips : idleChips;

  const safeBottom = Math.max(insets.bottom, 16) + 12;

  return (
    <View style={{ flex: 1, backgroundColor: '#030c07' }}>
      <LinearGradient
        colors={['#0b2817', '#0e4b31', '#158661', '#22a364', '#54d38d']}
        locations={[0, 0.22, 0.50, 0.76, 1]}
        style={{ position: 'absolute', width: W, height: H }}
      />

      <View style={{ width: W, height: H, flexDirection: 'column' }}>

          {/* ── HEADER ──────────────────────────────────────── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: insets.top + 10,
            paddingBottom: 10,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="grid-outline" size={26} color="#fff" />
              <Text style={s.logo}>Wildvora</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {appState !== 'idle' && (
                <TouchableOpacity
                  onPress={resetToIdle}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Start a new search"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={22}
                    color="rgba(255,255,255,0.65)"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close AI search"
              >
                <Ionicons name="close" size={28} color="rgba(255,255,255,0.80)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── MIDDLE (hero / results) ──────────────────────── */}
          <View style={{ flex: 1, overflow: 'hidden' }}>

            {appState === 'idle' && <View style={{ flex: 1 }} />}

            {appState === 'loading' && (
              <View style={{
                flex: 1, justifyContent: 'flex-end',
                paddingHorizontal: 24, paddingBottom: 14, gap: 10,
              }}>
                <View style={s.thinkingRow} accessibilityLabel="Wildvora AI is thinking">
                  <ActivityIndicator size="small" color="#a3f3cd" />
                  <Text style={s.thinkingText}>Wildvora AI is thinking…</Text>
                </View>
                <LoadingCard />
              </View>
            )}

            {appState === 'error' && (
              <View style={{
                flex: 1, justifyContent: 'flex-end',
                paddingHorizontal: 24, paddingBottom: 14,
              }}>
                <ErrorState
                  message={errorMessage}
                  onRetry={() => submitSearch(lastQueryRef.current)}
                  onReset={resetToIdle}
                />
              </View>
            )}

            {appState === 'answered' && result && (
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'flex-end',
                  paddingHorizontal: 24,
                  paddingTop: 8,
                  paddingBottom: 10,
                  gap: 16,
                }}
                showsVerticalScrollIndicator={false}
              >
                <View style={s.queryBadge}>
                  <Ionicons
                    name="search-outline"
                    size={11}
                    color="rgba(255,255,255,0.55)"
                  />
                  <Text style={s.queryText} numberOfLines={2}>
                    {result.query}
                  </Text>
                </View>

                <Animated.View
                  style={{
                    opacity: respOpacity,
                    transform: [{ translateY: respSlideY }],
                    gap: 16,
                  }}
                >
                  <AIAnswerCard text={result.text} isTravelRelated={result.isTravelRelated} />

                  {result.cards.length > 0 && (
                    <View style={{ gap: 14 }}>
                      {result.cards.map(({ exp, reason }) => (
                        <ExperienceCard
                          key={exp._id}
                          exp={exp}
                          reason={reason}
                          onView={() =>
                            navigation.navigate('ExperienceDetail', {
                              experienceId: exp._id,
                            })
                          }
                        />
                      ))}
                    </View>
                  )}

                  {result.isTravelRelated && result.cards.length === 0 && (
                    <TouchableOpacity
                      style={s.browseBtn}
                      onPress={() => navigation.navigate('Main', { screen: 'Search' })}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Browse all experiences"
                    >
                      <Ionicons name="compass-outline" size={16} color="#a3f3cd" />
                      <Text style={s.browseBtnText}>Browse all experiences</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </ScrollView>
            )}
          </View>

          {/* ── FIXED BOTTOM SECTION ────────────────────────── */}
          <Animated.View style={{
            paddingHorizontal: 24,
            paddingBottom: safeBottom,
            gap: 10,
            opacity: revealOpacity,
            transform: [{ translateY: revealSlideY }],
          }}>

            {/* Glass card — idle only */}
            {appState === 'idle' && (
              <Animated.View style={{ opacity: cardFade }}>
                <GlassAICard
                  promptIdx={promptIdx}
                  promptOpacity={promptOpacity}
                />
              </Animated.View>
            )}

            {/* ── Suggestion pills — dynamic, only shown when they have real results ── */}
            {chips.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
              >
                {chips.map(chip => (
                  <TouchableOpacity
                    key={chip}
                    style={appState !== 'answered' ? s.chip : s.followChip}
                    onPress={() => submitSearch(chip)}
                    activeOpacity={0.70}
                    accessibilityRole="button"
                    accessibilityLabel={`Search: ${chip}`}
                  >
                    <Text
                      style={
                        appState !== 'answered' ? s.chipText : s.followChipText
                      }
                    >
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* ── Search bar ── */}
            <Animated.View style={{ transform: [{ translateY: searchLift }] }}>
              <View style={s.searchBar}>
                <Ionicons
                  name="search-outline"
                  size={22}
                  color="#6f7a73"
                  style={{ flexShrink: 0 }}
                />
                <TextInput
                  style={s.searchInput}
                  placeholder={
                    appState === 'idle'
                      ? 'Ask about a trip, trek, or destination...'
                      : 'Ask a follow-up...'
                  }
                  placeholderTextColor="#9ca3af"
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => submitSearch()}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  returnKeyType="search"
                  selectionColor="#11694b"
                  editable={appState !== 'loading'}
                  accessibilityLabel="Ask Wildvora AI about travel and adventures"
                />
                {appState === 'loading' ? (
                  <ActivityIndicator
                    size="small"
                    color="#11694b"
                    style={{ marginRight: 6, flexShrink: 0 }}
                  />
                ) : (
                  <TouchableOpacity
                    style={s.sendBtn}
                    onPress={() => submitSearch()}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityLabel="Send"
                  >
                    <Ionicons name="arrow-up" size={20} color="#002115" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

          </Animated.View>

          {/* Atmospheric footer line */}
          <LinearGradient
            colors={['transparent', 'rgba(17,105,75,0.35)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 8, opacity: 0.55 }}
          />

        </View>
    </View>
  );
}

const s = StyleSheet.create({
  logo: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  shadowWrap: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.50,
    shadowRadius: 22,
    elevation: 14,
  },
  clipWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  glassBody: {
    backgroundColor: 'rgba(0,0,0,0.40)',
    padding: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 2.2, textTransform: 'uppercase',
  },
  promptArea:  { paddingVertical: 8, alignItems: 'center' },
  promptText:  { fontSize: 22, fontWeight: '500', color: '#fff', lineHeight: 32, textAlign: 'center' },
  promptHL:    { color: '#a3f3cd' },
  dividerRow:  { marginTop: 20, alignItems: 'center' },
  divider:     { height: 4, width: 48, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 9999 },

  /* ── Thinking row ─────────────────────────────────────────── */
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  thinkingText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.2 },

  /* ── AI answer card ───────────────────────────────────────── */
  answerCard: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 20, padding: 18, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  answerCardMuted: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  answerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  answerLabel: {
    fontSize: 11, fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.6, textTransform: 'uppercase',
  },
  answerText: { fontSize: 15.5, color: '#fff', lineHeight: 23 },

  /* ── Browse CTA (no recommendations, still travel-related) ── */
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(163,243,205,0.12)',
    borderWidth: 1, borderColor: 'rgba(163,243,205,0.30)',
    borderRadius: 16, paddingVertical: 13,
  },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: '#a3f3cd' },

  /* ── Search bar ──────────────────────────────────────────── */
  searchBar: {
    height: 58,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16, paddingRight: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 14,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1c1c18' },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#a3f3cd',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  /* ── Suggestion pills ────────────────────────────────────── */
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: 22,
  },
  chipText: {
    fontSize: 13.5, fontWeight: '600',
    color: '#ffffff', letterSpacing: 0.1,
  },
  followChip: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: 'rgba(163,243,205,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163,243,205,0.30)',
    borderRadius: 20,
  },
  followChipText: { fontSize: 13.5, fontWeight: '600', color: '#a3f3cd' },

  /* ── Query badge ─────────────────────────────────────────── */
  queryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  queryText: {
    fontSize: 13, color: 'rgba(255,255,255,0.68)',
    fontWeight: '500', maxWidth: 280,
  },

  /* ── Experience card ─────────────────────────────────────── */
  expShadow: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },
  expClip: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  expImgWrap: { height: 200, width: '100%' },
  priceBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  priceBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  locOverlay: {
    position: 'absolute', bottom: 10, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  locText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.90)' },
  expContent: {
    backgroundColor: 'rgba(8,8,8,0.92)',
    padding: 16, gap: 12,
  },
  expTitle: {
    fontSize: 20, fontWeight: '700', color: '#fff',
    letterSpacing: -0.3, lineHeight: 27,
  },
  reasonRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(163,243,205,0.10)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(163,243,205,0.22)',
  },
  reasonText: { fontSize: 12.5, color: '#a3f3cd', fontWeight: '600', flex: 1, lineHeight: 17 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  metaText:    { fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: '500' },
  ratingNum:   { fontSize: 12.5, fontWeight: '700', color: '#f59e0b', marginLeft: 4 },
  reviewCount: { fontSize: 11.5, color: 'rgba(255,255,255,0.45)' },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  newBadgeText: { fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  ctaBtn: {
    backgroundColor: '#a3f3cd', borderRadius: 13,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 2,
  },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#002115' },

  /* ── Error / info state ──────────────────────────────────── */
  stateWrap: {
    alignItems: 'center', padding: 28, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  stateTitle:    { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  stateSubtitle: {
    fontSize: 13.5, color: 'rgba(255,255,255,0.52)',
    textAlign: 'center', lineHeight: 21,
  },
  stateBtn: {
    paddingHorizontal: 24, paddingVertical: 11,
    backgroundColor: '#a3f3cd',
    borderRadius: 20,
  },
  stateBtnText: { fontSize: 14, fontWeight: '700', color: '#002115' },
  stateBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  stateBtnSecondaryText: { color: '#fff' },

  /* ── Loading skeleton ────────────────────────────────────── */
  loadCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  loadImg:  { height: 180, backgroundColor: 'rgba(255,255,255,0.07)' },
  loadLine: { height: 13, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.09)' },
  loadPill: { height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)' },
  loadBtn:  { height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
});
