import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, AccessibilityInfo } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/Text';

/** Same as the native splash (app.json), so the hand-off is seamless. */
const BG = '#0B0D12';
const COBALT = '#2454E6';
const YELLOW = '#F2B418';
const LOGO = 120;
const WORD = 'IndustriaLink';
/** Shortest time the splash stays, so the animation can finish even when the app is ready at once. */
const MIN_SHOW = 2100;

const ease = Easing.bezier(0.2, 0, 0, 1);

interface Props {
  /** True once fonts, saved settings and the signed-in user are loaded. */
  ready: boolean;
  /** Called after the first frame is drawn, to hide the native splash under it. */
  onShown: () => void;
  /** Called when the exit animation has finished; unmount the splash then. */
  onDone: () => void;
}

/**
 * Brand intro shown over the app while it starts.
 * 1. Starts exactly like the native splash: the logo tile on the dark canvas.
 * 2. The tile settles with a spring, a ring ripples out, the yellow block pops.
 * 3. Cobalt chevrons (the hero art) sweep across behind it.
 * 4. The logo rises; "IndustriaLink" types in letter by letter, then the tagline.
 * 5. A safety-stripe bar fills at the bottom while the app loads.
 * 6. Exit: the logo zooms toward the viewer and the splash fades into the app.
 * Respects the phone's "reduce motion" setting (simple fade only).
 */
export const AnimatedSplash: React.FC<Props> = ({ ready, onShown, onDone }) => {
  const { width, height } = useWindowDimensions();
  const start = useRef(0);
  const exiting = useRef(false);
  const reduce = useRef(false);

  const intro = useSharedValue(0); // 0 -> 1 over the opening beat
  const settle = useSharedValue(1); // logo tile scale
  const ring = useSharedValue(0);
  const block = useSharedValue(0);
  const rise = useSharedValue(0); // logo moves up, words appear
  const sweep = useSharedValue(0);
  const tagline = useSharedValue(0);
  const bar = useSharedValue(0);
  const stripes = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    start.current = Date.now();
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => {
        if (cancelled) return;
        reduce.current = r;
        if (r) {
          rise.set(1);
          tagline.set(1);
          bar.set(withTiming(1, { duration: 600 }));
          return;
        }
        settle.set(withSequence(withTiming(0.9, { duration: 220, easing: ease }), withSpring(1, { damping: 9, stiffness: 180 })));
        ring.set(withDelay(180, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
        block.set(withDelay(260, withSpring(1, { damping: 7, stiffness: 220 })));
        sweep.set(withDelay(120, withTiming(1, { duration: 1300, easing: ease })));
        rise.set(withDelay(520, withSpring(1, { damping: 16, stiffness: 140 })));
        tagline.set(withDelay(1250, withTiming(1, { duration: 420, easing: ease })));
        bar.set(withDelay(600, withTiming(0.85, { duration: 1300, easing: ease })));
        stripes.set(withRepeat(withTiming(1, { duration: 700, easing: Easing.linear }), -1));
        intro.set(withTiming(1, { duration: 600 }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [settle, ring, block, sweep, rise, tagline, bar, stripes, intro]);

  // Leave once the app is ready and the intro has had time to play.
  useEffect(() => {
    if (!ready || exiting.current) return;
    const wait = Math.max(0, (reduce.current ? 500 : MIN_SHOW) - (Date.now() - start.current));
    const id = setTimeout(() => {
      exiting.current = true;
      bar.set(withTiming(1, { duration: 200 }));
      exit.set(
        withDelay(
          180,
          withTiming(1, { duration: reduce.current ? 250 : 520, easing: Easing.in(Easing.cubic) }, (done) => {
            if (done) runOnJS(onDone)();
          })
        )
      );
    }, wait);
    return () => clearTimeout(id);
  }, [ready, bar, exit, onDone]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: intro.get() }));
  const root = useAnimatedStyle(() => ({ opacity: interpolate(exit.get(), [0, 0.4, 1], [1, 1, 0]) }));

  const logo = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(rise.get(), [0, 1], [0, -64]) },
      { scale: settle.get() * interpolate(rise.get(), [0, 1], [1, 0.72]) * interpolate(exit.get(), [0, 1], [1, 7]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.get(), [0, 0.15, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(ring.get(), [0, 1], [0.8, 2.6]) }],
  }));

  const blockStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(block.get(), [0, 1], [-10, 0]) },
      { rotate: `${interpolate(block.get(), [0, 1], [-18, 0])}deg` },
      { scale: interpolate(block.get(), [0, 0.6, 1], [1, 1.25, 1]) },
    ],
  }));

  const content = useAnimatedStyle(() => ({ opacity: interpolate(exit.get(), [0, 0.5], [1, 0]) }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.get(),
    transform: [{ translateY: interpolate(tagline.get(), [0, 1], [10, 0]) }],
  }));

  const barStyle = useAnimatedStyle(() => ({ width: `${bar.get() * 100}%` }));
  const stripeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(stripes.get(), [0, 1], [-19.8, 0]) }] }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, root]}
      pointerEvents="none"
      onLayout={onShown}
      accessibilityLabel="IndustriaLink is starting"
    >
      {/* Soft cobalt light from the top, like the hero band. */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <LinearGradient
          colors={['rgba(36,84,230,0.28)', 'rgba(36,84,230,0.06)', 'rgba(11,13,18,0)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Chevrons sweeping across behind the logo. */}
      <Animated.View style={[StyleSheet.absoluteFill, content]}>
        {[0, 1, 2].map((i) => (
          <Chevron key={i} index={i} sweep={sweep} width={width} height={height} />
        ))}
      </Animated.View>

      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={logo}>
          <View style={styles.tile}>
            <LinearGradient colors={['#3468F8', COBALT]} style={StyleSheet.absoluteFill} />
            <Svg width={LOGO} height={LOGO} viewBox="0 0 32 32" style={StyleSheet.absoluteFill}>
              <Path d="M9 8h4.2v12.2H23V24H9z" fill="#FFFFFF" />
            </Svg>
            <Animated.View style={[styles.block, blockStyle]} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.words, content]}>
          <View style={styles.wordRow}>
            {WORD.split('').map((ch, i) => (
              <Letter key={i} ch={ch} index={i} rise={rise} accent={i >= 9} />
            ))}
          </View>
          <Animated.View style={taglineStyle}>
            <Text style={styles.tagline} maxFontSizeMultiplier={1.1}>
              Verified factory jobs, close to home
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Safety-stripe loading bar. */}
      <Animated.View style={[styles.track, content]}>
        <Animated.View style={[styles.fill, barStyle]}>
          <Animated.View style={[styles.stripes, stripeStyle]}>
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern id="hz" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <Rect width="7" height="14" fill={YELLOW} />
                  <Rect x="7" width="7" height="14" fill="#1A1D24" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#hz)" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

/** One letter of the wordmark: fades and lifts in, each a little after the previous one. */
const Letter: React.FC<{ ch: string; index: number; rise: SharedValue<number>; accent: boolean }> = ({ ch, index, rise, accent }) => {
  const s = useAnimatedStyle(() => {
    // Letters start only once the logo has moved clear of them.
    const t = Math.min(1, Math.max(0, (rise.get() - 0.35) * 2.4 - index * 0.06));
    return { opacity: t, transform: [{ translateY: (1 - t) * 14 }] };
  });
  return (
    <Animated.View style={s}>
      <Text style={[styles.word, accent && styles.wordAccent]} maxFontSizeMultiplier={1}>
        {ch}
      </Text>
    </Animated.View>
  );
};

/** A tall cobalt chevron that slides from left to right across the screen. */
const Chevron: React.FC<{ index: number; sweep: SharedValue<number>; width: number; height: number }> = ({ index, sweep, width, height }) => {
  const w = 120;
  const s = useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, sweep.get() * 1.4 - index * 0.18));
    return {
      opacity: interpolate(t, [0, 0.2, 0.8, 1], [0, 0.16 - index * 0.04, 0.16 - index * 0.04, 0]),
      transform: [{ translateX: interpolate(t, [0, 1], [-w * 2, width + w]) }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', top: height * 0.5 - 160, left: 0 }, s]}>
      <Svg width={w} height={320} viewBox="0 0 120 320">
        <Path d="M0 0 H60 L120 160 L60 320 H0 L60 160 Z" fill={COBALT} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { backgroundColor: BG, zIndex: 1000, elevation: 1000 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: LOGO, height: LOGO, borderRadius: LOGO * 0.28, borderWidth: 2, borderColor: '#4D7CFF' },
  tile: { width: LOGO, height: LOGO, borderRadius: (LOGO * 9) / 32, overflow: 'hidden' },
  block: {
    position: 'absolute',
    left: (LOGO * 17) / 32,
    top: (LOGO * 8) / 32,
    width: (LOGO * 6) / 32,
    height: (LOGO * 6) / 32,
    borderRadius: (LOGO * 1.2) / 32,
    backgroundColor: YELLOW,
  },
  words: { position: 'absolute', top: '50%', marginTop: 20, alignItems: 'center' },
  wordRow: { flexDirection: 'row' },
  word: { color: '#FFFFFF', fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.6 },
  wordAccent: { color: '#7FA2FF' },
  tagline: { color: '#9AA3B2', fontSize: 15, marginTop: 6, letterSpacing: 0.2 },
  track: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 72,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  fill: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  stripes: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 600 },
});
