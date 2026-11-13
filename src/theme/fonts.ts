import type { FontFamilyDefinition } from 'expo-font';

/** Body text: Inter. Plain, very readable at small sizes on cheap screens. */
export const FONT = 'Inter';
/** Headlines and big numbers (17pt and up): Manrope. A little more character, still modern. */
export const FONT_DISPLAY = 'Manrope';

/** Weights are chosen with the normal `fontWeight` style. */
export const fontFamilies: FontFamilyDefinition[] = [
  {
    fontFamily: FONT,
    fontDefinitions: [
      { path: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'), weight: 400 },
      { path: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'), weight: 500 },
      { path: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'), weight: 600 },
      { path: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'), weight: 700 },
    ],
  },
  {
    fontFamily: FONT_DISPLAY,
    fontDefinitions: [
      { path: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'), weight: 600 },
      { path: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'), weight: 700 },
      { path: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'), weight: 800 },
    ],
  },
];
