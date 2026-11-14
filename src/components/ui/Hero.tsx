import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from './Text';
import { BannerArt } from './BannerArt';
import { useUiStore } from '../../store/uiStore';
import { shadows } from '../../theme/shadows';

interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Height of the colour band with the geometric art. */
  artHeight?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Page banner, phone version of the web Hero: the cobalt / ink / safety-yellow art
 * as a full-colour band on top, heading and content below on the grey card.
 */
export const Hero: React.FC<HeroProps> = ({ eyebrow, title, subtitle, artHeight = 96, children, style }) => {
  const colors = useUiStore((s) => s.colors);
  const dark = useUiStore((s) => s.theme) === 'dark';
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.card, style]}
    >
      {/* Dark: the band gets a solid deep-cobalt backdrop so the banner reads as brand colour, not grey. */}
      <View style={[styles.band, { height: artHeight }, dark && { backgroundColor: HERO_BAND_DARK }]}>
        {/* Art keeps its 600x260 shape so the whole composition (incl. hazard stripe) shows. */}
        <BannerArt opacity={1} style={{ width: Math.round((artHeight * 600) / 260) }} />
        {eyebrow ? (
          <View style={[styles.eyebrow, { backgroundColor: colors.surface }, dark && styles.eyebrowDark]}>
            <Text style={[styles.eyebrowText, { color: colors.primary }]} numberOfLines={1}>
              {eyebrow}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.inkSecondary }]}>{subtitle}</Text> : null}
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </Animated.View>
  );
};

const HERO_BAND_DARK = '#111A36';

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  // The art band clips to the top corners (the card itself must not clip, or the shadow is cut).
  band: { overflow: 'hidden', borderTopLeftRadius: 15, borderTopRightRadius: 15, position: 'relative', justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 10 },
  eyebrow: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(16,24,40,0.08)' },
  eyebrowDark: { borderColor: 'rgba(255,255,255,0.10)' },
  eyebrowText: { fontSize: 12, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  children: { marginTop: 14 },
});
