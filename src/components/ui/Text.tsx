import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { FONT } from '../../theme/fonts';

const base = StyleSheet.create({ font: { fontFamily: FONT } });

/**
 * Largest the system text size may scale our text. Without a cap, a phone set to "Largest"
 * breaks the fixed-height buttons, tabs and tab bar. 1.3 keeps text clearly bigger but intact.
 */
export const MAX_FONT_SCALE = 1.3;

/** React Native Text with the app font applied. Use instead of Text from 'react-native'. */
export function Text({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: React.ComponentProps<typeof RNText>) {
  return <RNText style={[base.font, style]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}

/** React Native TextInput with the app font applied. */
export function TextInput({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: React.ComponentProps<typeof RNTextInput>) {
  return <RNTextInput style={[base.font, style]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
