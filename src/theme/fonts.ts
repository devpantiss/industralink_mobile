import type { FontFamilyDefinition } from 'expo-font';

/** Same typeface as the web dashboard. Weights are picked with the normal `fontWeight` style. */
export const FONT = 'Plus Jakarta Sans';

export const fontFamilies: FontFamilyDefinition[] = [
  {
    fontFamily: FONT,
    fontDefinitions: [
      { path: require('@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'), weight: 400 },
      { path: require('@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'), weight: 500 },
      { path: require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'), weight: 600 },
      { path: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'), weight: 700 },
      { path: require('@expo-google-fonts/plus-jakarta-sans/800ExtraBold/PlusJakartaSans_800ExtraBold.ttf'), weight: 800 },
    ],
  },
];
