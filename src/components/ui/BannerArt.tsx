import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Polygon, Defs, Pattern, Rect } from 'react-native-svg';
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
          <Pattern id="il-hazard" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width="22" height="22" fill={colors.accent} />
            <Rect width="11" height="22" fill={colors.inkFill} />
          </Pattern>
        </Defs>
        <Polygon points="70,40 230,40 175,150 15,150" fill={colors.primary} />
        <Polygon points="250,0 400,0 530,130 400,260 250,260 380,130" fill={colors.inkFill} />
        <Polygon points="330,0 365,0 495,130 365,260 330,260 460,130" fill={colors.surfaceMuted} />
        <Polygon points="455,0 600,0 600,150" fill={colors.accent} />
        <Polygon points="495,200 600,200 600,260 460,260" fill="url(#il-hazard)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
});

