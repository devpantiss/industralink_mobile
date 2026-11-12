import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { radii } from '../../theme/spacing';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | number;

interface AvatarProps {
  name: string;
  src?: string;
  uri?: string;
  size?: AvatarSize;
  square?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  uri,
  size = 'md',
  square = false,
  style,
  imageStyle,
}) => {
  const { colors } = useUiStore();

  const numSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 32
      : size === 'lg'
      ? 56
      : size === 'xl'
      ? 72
      : 42;

  const borderRadius = square ? radii.md : numSize / 2;
  const imageSource = src || uri;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  if (imageSource) {
    return (
      <Image
        source={{ uri: imageSource }}
        style={[
          {
            width: numSize,
            height: numSize,
            borderRadius,
            backgroundColor: colors.surfaceStrong,
          },
          imageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: numSize,
          height: numSize,
          borderRadius,
          backgroundColor: colors.primarySoft,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: numSize * 0.38,
            color: colors.primary,
          },
        ]}
      >
        {initials || '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
  },
});
