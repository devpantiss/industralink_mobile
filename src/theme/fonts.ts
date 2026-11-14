import type { FontFamilyDefinition } from 'expo-font';

/** Body text: Inter. Plain, very readable at small sizes on cheap screens. */
export const FONT = 'Inter';
/** Headlines, card titles, salaries and big numbers (16pt+ and semibold+): Plus Jakarta Sans. */
export const FONT_DISPLAY = 'PlusJakartaSans';

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
      { path: require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'), weight: 600 },
      { path: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'), weight: 700 },
      { path: require('@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf'), weight: 800 },
    ],
  },
];
