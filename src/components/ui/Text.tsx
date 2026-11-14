import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { FONT, FONT_DISPLAY } from '../../theme/fonts';
import { notifyInputFocus } from '../../lib/keyboard';

/**
 * Largest the system text size may scale our text. Without a cap, a phone set to "Largest"
 * breaks the fixed-height buttons, tabs and tab bar. 1.2 keeps text bigger but the layout calm.
 */
export const MAX_FONT_SCALE = 1.2;

/**
 * Plus Jakarta Sans draws noticeably larger than Inter at the same point size, so headings set
 * with it looked oversized on phones. Display-font text is drawn at 90% of its declared size
 * (line height too), which lines it up with Apple / Swiggy-style heading sizes.
 */
const DISPLAY_SCALE = 0.9;

/**
 * App-wide text size trim (points). Everything was reading a size too large on phones, so all
 * text is drawn 1pt smaller than declared; small text (13pt and under) is left alone so captions
 * stay readable. Change this one number to make the whole app bigger or smaller.
 */
const TEXT_TRIM = -1;
const trim = (size: number) => (size > 13 ? size + TEXT_TRIM : size);

/** Headline size: bold text this big or bigger uses the display font, everything else uses the body font. */
const DISPLAY_FROM = 16;

/** Picks the font family (and the display-size correction) from the final style. */
function fontFor(style: StyleProp<TextStyle>): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = Number(flat.fontWeight === 'bold' ? 700 : flat.fontWeight ?? 400);
  const display = flat.fontFamily
    ? flat.fontFamily === FONT_DISPLAY
    : (flat.fontSize ?? 14) >= DISPLAY_FROM && weight >= 600;
  const size = flat.fontSize ?? 14;
  if (!display) {
    return {
      ...(flat.fontFamily ? null : { fontFamily: FONT }),
      fontSize: trim(size),
      ...(flat.lineHeight && size > 13 ? { lineHeight: flat.lineHeight + TEXT_TRIM } : null),
    };
  }
  return {
    fontFamily: FONT_DISPLAY,
    fontSize: trim(Math.round(size * DISPLAY_SCALE * 2) / 2),
    ...(flat.lineHeight ? { lineHeight: Math.round(flat.lineHeight * DISPLAY_SCALE) + TEXT_TRIM } : null),
  };
}

/** React Native Text with the app fonts applied. Use instead of Text from 'react-native'. */
export function Text({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, ...rest }: React.ComponentProps<typeof RNText>) {
  return <RNText style={[style, fontFor(style)]} maxFontSizeMultiplier={maxFontSizeMultiplier} {...rest} />;
}

/**
 * React Native TextInput with the app font applied. Input text is body text.
 * Focus is announced so KeyboardScrollView can scroll the field above the keyboard.
 */
export function TextInput({ style, maxFontSizeMultiplier = MAX_FONT_SCALE, onFocus, ...rest }: React.ComponentProps<typeof RNTextInput>) {
  return (
    <RNTextInput
      style={[{ fontFamily: FONT }, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      onFocus={(e) => {
        onFocus?.(e);
        notifyInputFocus();
      }}
      {...rest}
    />
  );
}
