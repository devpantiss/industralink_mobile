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
    navy: '#1E232B',          // Deep ink
    canvas: '#F5F6F8',        // App background
    surface: '#FFFFFF',       // Card background
    surfaceMuted: '#F2F4F7',  // Soft grey card
    surfaceStrong: '#EAEDF1', // Active / pressed card
    border: '#E6E9EE',        // Card outline
    borderStrong: '#D3D8DF',
    ink: '#1E232B',           // Primary text (High contrast)
    inkSecondary: '#566170',  // Subtext
    inkMuted: '#737D8A',      // Timestamps & metadata
    inkFill: '#262C35',       // Dark pill button
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
    primary: '#4A78FF',       // High-contrast Cobalt
    primaryHover: '#6690FF',
    primarySoft: '#18244A',
    accent: '#F2B418',
    onAccent: '#1C1917',
    navy: '#07080B',
    canvas: '#0A0C10',        // Deep slate night canvas
    surface: '#14171D',       // Elevated surface
    surfaceMuted: '#1B1F27',  // Dark grey card
    surfaceStrong: '#232833',
    border: '#242934',
    borderStrong: '#343B49',
    ink: '#EDF0F5',           // Soft off-white text (pure white glares on dark)
    inkSecondary: '#AEB7C5',
    inkMuted: '#7E899B',
    inkFill: '#2A303C',
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
