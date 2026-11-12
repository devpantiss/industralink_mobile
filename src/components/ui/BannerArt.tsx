import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Polygon, Defs, ClipPath, G, Rect } from 'react-native-svg';

// Diagonal hazard stripes for the bottom-right block, drawn as shapes
// (rotated SVG patterns render as dots in react-native-svg).
const STRIPES = Array.from({ length: 12 }, (_, i) => {
  const x = 430 + i * 16;
  return `${x},260 ${x + 8},260 ${x + 68},200 ${x + 60},200`;
});
import { useUiStore } from '../../store/uiStore';

interface BannerArtProps {
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
  opacity?: number;
}

/** Geometric shapes for banners: cobalt, ink and safety-yellow blocks with a hazard stripe. */
export const BannerArt: React.FC<BannerArtProps> = ({
  style,
  width = '100%',
  height = '100%',
  opacity = 0.25,
}) => {
  const { colors } = useUiStore();

  return (
    <View style={[styles.container, { opacity }, style]} pointerEvents="none">
      <Svg viewBox="0 0 600 260" width={width} height={height} preserveAspectRatio="xMaxYMid slice">
        <Defs>
          <ClipPath id="il-hazard-clip">
            <Polygon points="495,200 600,200 600,260 460,260" />
          </ClipPath>
        </Defs>
        <Polygon points="70,40 230,40 175,150 15,150" fill={colors.primary} />
        <Polygon points="250,0 400,0 530,130 400,260 250,260 380,130" fill={colors.inkFill} />
        <Polygon points="330,0 365,0 495,130 365,260 330,260 460,130" fill={colors.surfaceMuted} />
        <Polygon points="455,0 600,0 600,150" fill={colors.accent} />
        <G clipPath="url(#il-hazard-clip)">
          <Rect x="440" y="200" width="160" height="60" fill={colors.accent} />
          {STRIPES.map((pts) => (
            <Polygon key={pts} points={pts} fill={colors.inkFill} />
          ))}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  // Pinned to the right edge; callers set the width (default: half the banner).
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
  },
});

