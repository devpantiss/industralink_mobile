export interface TileColors {
  bg: string;
  text: string;
}

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  accent: string;
  onAccent: string;
  navy: string;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;
  border: string;
  borderStrong: string;
  ink: string;
  inkSecondary: string;
  inkMuted: string;
  inkFill: string;
  onInk: string;
  successFg: string;
  successBg: string;
  warningFg: string;
  warningBg: string;
  dangerFg: string;
  dangerBg: string;
  infoFg: string;
  infoBg: string;
  interviewFg: string;
  interviewBg: string;
  neutralFg: string;
  neutralBg: string;
  tiles: {
    green: TileColors;
    blue: TileColors;
    orange: TileColors;
    purple: TileColors;
    rose: TileColors;
    yellow: TileColors;
  };
}

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    primary: '#2454E6',       // Cobalt Blue
    primaryHover: '#1D45C4',  // Pressed state
    primarySoft: '#EBF0FE',   // Subtle blue chip
    accent: '#F2B418',        // Safety Industrial Yellow
    onAccent: '#1C1917',
    navy: '#15191E',          // Deep ink
    canvas: '#F4F5F7',        // App background
    surface: '#FFFFFF',       // Card background
    surfaceMuted: '#F5F6F8',  // Soft grey card
    surfaceStrong: '#EDEFF2', // Active / pressed card
    border: '#E6E8EC',        // Card outline
    borderStrong: '#D4D8DE',
    ink: '#15191E',           // Primary text (High contrast)
    inkSecondary: '#505A66',  // Subtext
    inkMuted: '#6E7783',      // Timestamps & metadata
    inkFill: '#15191E',       // Dark pill button
    onInk: '#FFFFFF',

    // Status Colors
    successFg: '#17603A',
    successBg: '#DDF3E4',
    warningFg: '#8A4A10',
    warningBg: '#FCE7D3',
    dangerFg:  '#BE1E40',
    dangerBg:  '#FCE5EB',
    infoFg:    '#2454E6',
    infoBg:    '#EBF0FE',
    interviewFg: '#4A3B8E',
    interviewBg: '#E9E4F8',
    neutralFg: '#505A66',
    neutralBg: '#EDEFF2',

    // Pastel Fact Tiles (Crucial for fast scanning on mobile)
    tiles: {
      green:  { bg: '#DDF3E4', text: '#17603A' }, // Salary
      blue:   { bg: '#DDEBF8', text: '#1D4D78' }, // Shift timing
      orange: { bg: '#FCE7D3', text: '#8A4A10' }, // Experience required
      purple: { bg: '#E9E4F8', text: '#4A3B8E' }, // Trade category
      rose:   { bg: '#FCE5EB', text: '#A3244B' }, // Overtime rate
      yellow: { bg: '#FFF2DC', text: '#A35B05' }, // Urgent openings
    }
  },
  dark: {
    primary: '#3D6AF5',       // High-contrast Cobalt
    primaryHover: '#547DFA',
    primarySoft: '#1E2A4D',
    accent: '#F2B418',
    onAccent: '#1C1917',
    navy: '#0A0C10',
    canvas: '#11131A',        // Deep slate night canvas
    surface: '#181B22',       // Elevated surface
    surfaceMuted: '#1F232C',  // Dark grey card
    surfaceStrong: '#272C37',
    border: '#2C313D',
    borderStrong: '#3A4050',
    ink: '#F1F5F9',           // Crisp white-slate text
    inkSecondary: '#A8B4C6',
    inkMuted: '#8896AB',
    inkFill: '#2F3648',
    onInk: '#FFFFFF',

    // Dark Status Colors
    successFg: '#6ED69B',
    successBg: '#163427',
    warningFg: '#F5C070',
    warningBg: '#3E2B14',
    dangerFg:  '#FF91A5',
    dangerBg:  '#441B26',
    infoFg:    '#7DA2FF',
    infoBg:    '#1E2A4D',
    interviewFg: '#BEAFFF',
    interviewBg: '#2E264E',
    neutralFg: '#A8B4C6',
    neutralBg: '#272C37',

    // Dark Pastel Tiles
    tiles: {
      green:  { bg: '#163427', text: '#6ED69B' },
      blue:   { bg: '#192C46', text: '#8CBEEB' },
      orange: { bg: '#3E2B14', text: '#F5C070' },
      purple: { bg: '#2E264E', text: '#BEAFFF' },
      rose:   { bg: '#441B26', text: '#FF96B2' },
      yellow: { bg: '#3C2F12', text: '#F5CA64' },
    }
  }
};

export type ThemeMode = 'light' | 'dark';
