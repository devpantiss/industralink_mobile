import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { useUiStore } from '../../store/uiStore';
import { radii } from '../../theme/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import { identityGradient } from '../../theme/effects';

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

  // Initials on a gradient picked from the name, so each person keeps the same colour.
  return (
    <View style={[styles.fallback, { width: numSize, height: numSize, borderRadius }, style]}>
      <LinearGradient
        colors={identityGradient(name)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <Text style={[styles.text, { fontSize: numSize * 0.38, color: '#FFFFFF' }]}>{initials || '?'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '700',
  },
});
