import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { FONT } from '../../theme/fonts';

const base = StyleSheet.create({ font: { fontFamily: FONT } });

/** React Native Text with the app font applied. Use instead of Text from 'react-native'. */
export function Text({ style, ...rest }: React.ComponentProps<typeof RNText>) {
  return <RNText style={[base.font, style]} {...rest} />;
}

/** React Native TextInput with the app font applied. */
export function TextInput({ style, ...rest }: React.ComponentProps<typeof RNTextInput>) {
  return <RNTextInput style={[base.font, style]} {...rest} />;
}
