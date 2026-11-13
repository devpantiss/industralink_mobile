import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { FONT, FONT_DISPLAY } from '../../theme/fonts';

/**
 * Largest the system text size may scale our text. Without a cap, a phone set to "Largest"
 * breaks the fixed-height buttons, tabs and tab bar. 1.3 keeps text clearly bigger but intact.
 */
export const MAX_FONT_SCALE = 1.3;

/** Headline size: bold text this big or bigger uses the display font, everything else uses the body font. */
const DISPLAY_FROM = 17;

/** Picks the font family from the final style, unless the style names one already. */
function familyFor(style: StyleProp<TextStyle>): string {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return flat.fontFamily;
  const weight = Number(flat.fontWeight === 'bold' ? 700 : flat.fontWeight ?? 400);
  return (flat.fontSize ?? 14) >= DISPLAY_FROM && weight >= 600 ? FONT_DISPLAY : FONT;
}

/** React Native Text with the app fonts applied. Use instead of Text from 'react-native'. */
export function Text({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: React.ComponentProps<typeof RNText>) {
  return <RNText style={[{ fontFamily: familyFor(style) }, style]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}

/** React Native TextInput with the app font applied. Input text is body text. */
export function TextInput({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: React.ComponentProps<typeof RNTextInput>) {
  return <RNTextInput style={[{ fontFamily: FONT }, style]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}
