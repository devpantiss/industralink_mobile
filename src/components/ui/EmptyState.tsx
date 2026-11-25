import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useUiStore } from '../../store/uiStore';
import { typography } from '../../theme/typography';
import { Button } from './Button';
import { Illustration } from './Illustration';
import type { ArtName } from './illustrations';
import { Text } from './Text';

interface Props {
  art: ArtName;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  /** Smaller, for a space inside a card. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Shown when a list or screen has nothing yet: a drawing, a short title, and what to do next. */
export const EmptyState: React.FC<Props> = ({ art, title, description, action, compact, style }) => {
  const colors = useUiStore((s) => s.colors);
  return (
    <View
      style={[
        styles.box,
        compact ? styles.compact : { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Illustration name={art} height={compact ? 72 : 112} />
      <Text style={[compact ? typography.body : typography.h3, styles.title, { color: colors.ink }]}>{title}</Text>
      {description ? (
        <Text style={[typography.small, styles.description, { color: colors.inkSecondary }]}>{description}</Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} size="sm" style={styles.action} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28, borderRadius: 16, borderWidth: 1, marginTop: 12 },
  compact: { paddingVertical: 16, borderWidth: 0, marginTop: 0 },
  title: { marginTop: 12, textAlign: 'center', fontWeight: '700' },
  description: { marginTop: 4, textAlign: 'center', maxWidth: 280 },
  action: { marginTop: 16 },
});
