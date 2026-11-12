import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

interface HazardStripProps {
  height?: number;
}

/**
 * Yellow-black diagonal safety hazard strip along the banner edge.
 */
export const HazardStrip: React.FC<HazardStripProps> = ({ height = 8 }) => {
  return (
    <View style={[styles.container, { height }]}>
      <Svg width="100%" height={height}>
        <Defs>
          <Pattern
            id="hazardPattern"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width="16" height="16" fill="#F2B418" />
            <Rect width="8" height="16" fill="#15191E" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hazardPattern)" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});

