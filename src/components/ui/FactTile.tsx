import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { radii, spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export type FactTileVariant = 'green' | 'blue' | 'orange' | 'purple' | 'rose' | 'yellow';

interface FactTileProps {
  label: string;
  variant: FactTileVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const FactTile: React.FC<FactTileProps> = ({ label, variant, icon, style }) => {
  const { colors } = useUiStore();
  const tileColors = colors.tiles[variant];

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: tileColors.bg,
          height: layout.factTileHeight,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        numberOfLines={1}
        style={[
          typography.caption,
          styles.text,
          { color: tileColors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});

