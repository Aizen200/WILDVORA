import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Image,
  Animated, Easing, useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { experienceAPI } from '../services/api';

/* Local fallbacks — used only when an experience has no image at all */
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
    { t: '"Hidden gems off the beaten path in ' },
    { t: 'South India', hl: true },
    { t: '."' },
  ],
];

const TRY_ASKING = [
  'Weekend trip under ₹5,000',
  'Beginner-friendly Himalayan trek',
  'Best camping near Bangalore',
  'Family adventure for 3 days',
  'Monsoon road trips',
  'Hidden gems in Uttarakhand',
  'Solo women-friendly trips',
  'Adventure near Pune',
];

const FOLLOW_UP_CHIPS = [
  'Budget under ₹3,000',
  'Top rated picks',
  'Weekend getaways',
  'Adventure treks',
  'Family friendly',
];

const STOP_WORDS = new Set([
  'for', 'the', 'and', 'near', 'from', 'with', 'this', 'that', 'are',
  'find', 'show', 'me', 'some', 'any', 'a', 'an', 'in', 'on', 'at',
  'to', 'of', 'its', 'my', 'plan', 'get', 'what', 'how', 'where',
  'when', 'which', 'travel', 'want', 'looking', 'trips', 'under',
  'above', 'below', 'pick', 'picks', 'rated', 'rating',
]);

function filterExperiences(experiences, query) {
  const q = query.toLowerCase().trim();

  // Extract max budget: "under ₹5,000", "below 3000", "upto 2000"
  const budgetMatch = q.match(
    /(?:under|below|within|upto?|less\s+than)\s*[₹₨rs.]?\s*([\d,]+)/i
  );
  const maxBudget = budgetMatch
    ? parseInt(budgetMatch[1].replace(/,/g, ''), 10)
    : null;

  const wantsTopRated = /\b(top|best|highest?[\s-]?rated?|popular)\b/i.test(q);

  const keywords = q
    .replace(/[₹₨,.\-!?'"]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const scored = experiences
    .filter(exp => {
      if (maxBudget && (exp.price || 0) > maxBudget) return false;
      if (wantsTopRated && parseFloat(exp.rating || 0) < 4.0) return false;
      if (keywords.length === 0) return true;

      const haystack = [
        exp.title,
        exp.location?.city,
        exp.location?.state,
        exp.location?.country,
        exp.description,
        exp.category,
        exp.difficulty,
        exp.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return keywords.some(kw => haystack.includes(kw));
    })
    .map(exp => {
      const haystack = [exp.title, exp.location?.city, exp.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const score = keywords.filter(k => haystack.includes(k)).length;
      return { exp, score };
    });

  scored.sort((a, b) =>
    a.score !== b.score
      ? b.score - a.score
      : parseFloat(b.exp.rating || 0) - parseFloat(a.exp.rating || 0)
  );

  return scored.slice(0, 4).map(x => x.exp);
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

/* ─── ExperienceCard ────────────────────────────────────────── */
function ExperienceCard({ exp, onView }) {
  const [imgErr, setImgErr] = useState(false);
  const imgUrl = exp.coverImage || exp.images?.[0];
  const src =
    imgUrl && !imgErr ? { uri: imgUrl } : LOCAL_CARD_IMAGES[0];
  const rating = parseFloat(exp.rating || 4.9);
  const stars = Math.round(rating);

  return (
    <View style={s.expShadow}>
      <View style={s.expClip}>
        {/* Hero image */}
        <View style={s.expImgWrap}>
          <Image
            source={src}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setImgErr(true)}
          />
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

          {/* Star rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <Ionicons
                key={i}
                name={i < stars ? 'star' : 'star-outline'}
                size={12}
                color={i < stars ? '#f59e0b' : 'rgba(255,255,255,0.22)'}
              />
            ))}
            <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
            {exp.reviewCount > 0 && (
              <Text style={s.reviewCount}>({exp.reviewCount})</Text>
            )}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={onView}
            activeOpacity={0.85}
          >
            <Text style={s.ctaTxt}>View Experience</Text>
            <Ionicons name="arrow-forward" size={15} color="#002115" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ─── EmptyState ────────────────────────────────────────────── */
function EmptyState({ query, onReset }) {
  return (
    <View style={s.emptyWrap}>
      <Ionicons
        name="telescope-outline"
        size={42}
        color="rgba(255,255,255,0.22)"
      />
      <Text style={s.emptyTitle}>No experiences found</Text>
      <Text style={s.emptySubtitle}>
        Nothing in our catalogue matches "{query}".{'\n'}
        Try "trekking", "camping", or a city name.
      </Text>
      <TouchableOpacity
        onPress={onReset}
        style={s.emptyBtn}
        activeOpacity={0.75}
      >
        <Text style={s.emptyBtnText}>Clear search</Text>
      </TouchableOpacity>
    </View>
  );
}
export default function AIChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const scrollRef = useRef(null);

  /* state */
  const [allExperiences, setAllExperiences] = useState([]);
  const [appState, setAppState] = useState('idle'); // 'idle' | 'loading' | 'answered'
  const [responses, setResponses] = useState([]);   // [{ query, experiences: Experience[] }]
  const [input, setInput]         = useState('');
  const [error, setError]         = useState('');
  const [promptIdx, setPromptIdx] = useState(0);

  /* animations */
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealSlideY  = useRef(new Animated.Value(32)).current;
  const promptOpacity = useRef(new Animated.Value(1)).current;
  const cardFade      = useRef(new Animated.Value(1)).current;
  const respSlideY    = useRef(new Animated.Value(48)).current;
  const respOpacity   = useRef(new Animated.Value(0)).current;
  const searchLift    = useRef(new Animated.Value(0)).current;

  /* pre-load all experiences on mount so filtering is instant */
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
  }, [responses, appState]);

  const onFocus = () =>
    Animated.timing(searchLift, { toValue: -3, duration: 160, useNativeDriver: true }).start();
  const onBlur = () =>
    Animated.timing(searchLift, { toValue: 0, duration: 160, useNativeDriver: true }).start();

  const resetToIdle = () => {
    setAppState('idle');
    setResponses([]);
    setInput('');
    setError('');
    Animated.timing(cardFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    respOpacity.setValue(0);
    respSlideY.setValue(48);
  };

  const submitSearch = async (query) => {
    const q = (query || input).trim();
    if (!q || appState === 'loading') return;
    setInput('');
    setError('');

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

    const matched = filterExperiences(exps, q);
    setResponses(prev => [...prev, { query: q, experiences: matched }]);
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
  };

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
                paddingHorizontal: 24, paddingBottom: 14,
              }}>
                <LoadingCard />
              </View>
            )}

            {appState === 'answered' && (
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'flex-end',
                  paddingHorizontal: 24,
                  paddingTop: 8,
                  paddingBottom: 10,
                  gap: 20,
                }}
                showsVerticalScrollIndicator={false}
              >
                {responses.map((item, idx) => (
                  <View key={idx}>
                    {/* Query badge for follow-up searches */}
                    {idx > 0 && (
                      <View style={s.queryBadge}>
                        <Ionicons
                          name="search-outline"
                          size={11}
                          color="rgba(255,255,255,0.55)"
                        />
                        <Text style={s.queryText} numberOfLines={1}>
                          {item.query}
                        </Text>
                      </View>
                    )}

                    {item.experiences.length === 0 ? (
                      <Animated.View
                        style={
                          idx === responses.length - 1
                            ? { opacity: respOpacity, transform: [{ translateY: respSlideY }] }
                            : {}
                        }
                      >
                        <EmptyState query={item.query} onReset={resetToIdle} />
                      </Animated.View>
                    ) : (
                      <Animated.View
                        style={[
                          { gap: 14 },
                          idx === responses.length - 1
                            ? { opacity: respOpacity, transform: [{ translateY: respSlideY }] }
                            : {},
                        ]}
                      >
                        {item.experiences.map(exp => (
                          <ExperienceCard
                            key={exp._id}
                            exp={exp}
                            onView={() =>
                              navigation.navigate('ExperienceDetail', {
                                experienceId: exp._id,
                              })
                            }
                          />
                        ))}
                      </Animated.View>
                    )}
                  </View>
                ))}
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

            {/* ── Suggestion pills — sit ABOVE the search bar ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 4 }}
            >
              {(appState !== 'answered' ? TRY_ASKING : FOLLOW_UP_CHIPS).map(
                chip => (
                  <TouchableOpacity
                    key={chip}
                    style={appState !== 'answered' ? s.chip : s.followChip}
                    onPress={() => submitSearch(chip)}
                    activeOpacity={0.70}
                  >
                    <Text
                      style={
                        appState !== 'answered' ? s.chipText : s.followChipText
                      }
                    >
                      {chip}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>

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
                      ? 'Search experiences...'
                      : 'Search again...'
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
                  >
                    <Ionicons name="arrow-up" size={20} color="#002115" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Error */}
            {!!error && (
              <View style={s.errorRow}>
                <Ionicons
                  name="alert-circle-outline"
                  size={13}
                  color="#f87171"
                />
                <Text style={{ fontSize: 12, color: '#f87171', flex: 1 }}>
                  {error}
                </Text>
              </View>
            )}

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

  /* Error */
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.20)',
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
    alignSelf: 'flex-start', marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  queryText: {
    fontSize: 13, color: 'rgba(255,255,255,0.68)',
    fontWeight: '500', maxWidth: 260,
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
  expImgWrap: { height: 200 },
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
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  metaText:    { fontSize: 12, color: 'rgba(255,255,255,0.82)', fontWeight: '500' },
  ratingNum:   { fontSize: 12.5, fontWeight: '700', color: '#f59e0b', marginLeft: 4 },
  reviewCount: { fontSize: 11.5, color: 'rgba(255,255,255,0.45)' },
  ctaBtn: {
    backgroundColor: '#a3f3cd', borderRadius: 13,
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 2,
  },
  ctaTxt: { fontSize: 15, fontWeight: '700', color: '#002115' },

  /* ── Empty state ─────────────────────────────────────────── */
  emptyWrap: {
    alignItems: 'center', padding: 28, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  emptyTitle:    { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  emptySubtitle: {
    fontSize: 13.5, color: 'rgba(255,255,255,0.52)',
    textAlign: 'center', lineHeight: 21,
  },
  emptyBtn: {
    marginTop: 4, paddingHorizontal: 24, paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

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
