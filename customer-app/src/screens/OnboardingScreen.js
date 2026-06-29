import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, PanResponder,
  Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

// ─── VIDEO SOURCE ────────────────────────────────────────────────────────────
// Local file  →  require('../../assets/onboarding.mp4')
// Remote URL  →  { uri: 'https://your-cdn.com/wildvora-reel.mp4' }
const VIDEO_SOURCE = require('../../assets/onboarding.mp4');

const THUMB_SIZE = 58;
const TRACK_PAD  = 8;

export default function OnboardingScreen({ navigation }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const maxSlideRef = useRef(0);

  const thumbX       = useRef(new Animated.Value(0)).current;
  const fillWidth    = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.7;
    p.play();
  });

  const handleTrackLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    maxSlideRef.current = w - THUMB_SIZE - TRACK_PAD * 2;
  };

  const completeRef = useRef(null);

  const completeOnboarding = useCallback(() => {
    const max     = maxSlideRef.current;
    const fullFill = max + THUMB_SIZE + TRACK_PAD * 2;

    // Snap thumb to end, then navigate — no fade so no white flash
    Animated.parallel([
      Animated.timing(thumbX,       { toValue: max,      duration: 180, useNativeDriver: false }),
      Animated.timing(fillWidth,    { toValue: fullFill, duration: 180, useNativeDriver: false }),
      Animated.timing(labelOpacity, { toValue: 0,        duration: 100, useNativeDriver: false }),
    ]).start(() => {
      setTimeout(() => navigation.replace('Main'), 150);
    });
  }, [navigation, thumbX, fillWidth, labelOpacity]);

  completeRef.current = completeOnboarding;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gs) => {
        const max = maxSlideRef.current;
        const dx  = Math.max(0, Math.min(gs.dx, max));
        thumbX.setValue(dx);
        fillWidth.setValue(dx + THUMB_SIZE / 2 + TRACK_PAD);
        labelOpacity.setValue(Math.max(0, 1 - dx / max));
      },
      onPanResponderRelease: (_, gs) => {
        const max = maxSlideRef.current;
        const dx  = Math.max(0, Math.min(gs.dx, max));
        if (dx >= max * 0.92) {
          completeRef.current?.();
        } else {
          Animated.parallel([
            Animated.spring(thumbX, {
              toValue: 0, useNativeDriver: false, tension: 100, friction: 12,
            }),
            Animated.timing(fillWidth,    { toValue: 0, duration: 300, useNativeDriver: false }),
            Animated.timing(labelOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <View style={s.root}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* ── Video background ──────────────────────────────────────────── */}
      <View style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
        />
        <View style={s.overlay} />
      </View>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Top bar */}
        <View style={s.topBar}>
          <Text style={s.logo}>WILDVORA</Text>
          <MaterialCommunityIcons name="menu" size={26} color="rgba(255,255,255,0.72)" />
        </View>

        <View style={{ flex: 1 }} />

        {/* Hero copy */}
        <View style={s.heroWrap}>
          <Text style={s.heroDisplay}>
            Explore{'\n'}Travel{'\n'}Inspire
          </Text>
          <Text style={s.heroSub}>
            Life is all about the journey.{'\n'}Find yours.
          </Text>
        </View>

        <View style={{ flex: 0.6 }} />

        {/* Slide-to-begin */}
        <View style={s.sliderWrap}>
          <View style={s.track} onLayout={handleTrackLayout}>
            <Animated.View style={[s.fill, { width: fillWidth }]} />

            <Animated.Text style={[s.trackLabel, { opacity: labelOpacity }]}>
              SLIDE TO BEGIN
            </Animated.Text>

            <Animated.View
              style={[s.thumb, { transform: [{ translateX: thumbX }] }]}
              {...panResponder.panHandlers}
            >
              <MaterialCommunityIcons name="chevron-right" size={30} color="#439171" />
            </Animated.View>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a1a12',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  heroWrap: {
    paddingHorizontal: 24,
    gap: 16,
  },
  heroDisplay: {
    fontSize: 54,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.97)',
    lineHeight: 22,
    maxWidth: 240,
  },
  sliderWrap: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  track: {
    height: 72,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: TRACK_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#439171',
    borderRadius: 36,
  },
  trackLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
});
