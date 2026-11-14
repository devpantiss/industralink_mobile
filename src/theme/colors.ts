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
    /*
     * Light theme, retuned 2026-11 for a crisper look. Rules:
     * - White cards on a cool grey page, with a visible (still soft) shadow, so cards lift.
     * - Text close to black for titles, darker cool greys for secondary text (AA everywhere).
     * - Tiles / status: clean tints with saturated text, not washed-out pastels.
     */
    primary: '#2454E6',       // Cobalt Blue
    primaryHover: '#1D45C4',  // Pressed state
    primarySoft: '#E6EDFF',   // Subtle blue chip
    accent: '#F2B418',        // Safety Industrial Yellow
    onAccent: '#1C1917',
    navy: '#0E1525',          // Deep ink
    canvas: '#F1F4F9',        // App background (cool grey)
    surface: '#FFFFFF',       // Card background
    surfaceMuted: '#F3F5F9',  // Soft grey panel / input
    surfaceStrong: '#E8ECF3', // Active / pressed card
    border: '#E2E7EF',        // Card outline
    borderStrong: '#CDD4DF',
    ink: '#0E1525',           // Titles and primary text
    inkSecondary: '#475467',  // Subtext
    inkMuted: '#667085',      // Timestamps & metadata
    inkFill: '#141A26',       // Dark pill button
    onInk: '#FFFFFF',

    // Status colours: clean tint + saturated text
    successFg: '#0E7A3E',
    successBg: '#DCF7E6',
    warningFg: '#A84A06',
    warningBg: '#FFEBD6',
    dangerFg:  '#D21F45',
    dangerBg:  '#FFE4EA',
    infoFg:    '#2454E6',
    infoBg:    '#E6EDFF',
    interviewFg: '#5B3FD0',
    interviewBg: '#ECE6FF',
    neutralFg: '#475467',
    neutralBg: '#EEF1F5',

    // Fact / stat tiles
    tiles: {
      green:  { bg: '#DCF7E6', text: '#0E7A3E' }, // Salary
      blue:   { bg: '#DCEBFF', text: '#1659C7' }, // Shift timing
      orange: { bg: '#FFEBD6', text: '#A84A06' }, // Experience required
      purple: { bg: '#ECE6FF', text: '#5B3FD0' }, // Trade category
      rose:   { bg: '#FFE0E8', text: '#C41E4F' }, // Overtime rate
      yellow: { bg: '#FFF0C2', text: '#8F5A00' }, // Urgent openings
    }
  },
  dark: {
    /*
     * Dark theme, retuned 2026-11 for a livelier look. Rules:
     * - Three clear elevation steps (canvas -> surface -> muted -> strong), each visibly lighter,
     *   with a slight cool-blue tint so greys don't look dead. Shadows don't show on dark,
     *   so lightness and hairline borders do the lifting.
     * - Text is near-white (not pure white) with a readable secondary grey (AA on every surface).
     * - Accents are bright and clean: status/tile colours are deep tinted fills with vivid
     *   foregrounds, so chips and tiles read as colour, not mud.
     */
    primary: '#4D7CFF',       // Bright cobalt (white label stays readable on buttons)
    primaryHover: '#6A92FF',
    primarySoft: '#1B2B5C',   // Selected pill / soft chip, clearly blue
    accent: '#FFC21A',        // Safety yellow, a touch brighter on dark
    onAccent: '#1C1917',
    navy: '#06070A',
    canvas: '#0B0D12',        // Page: near black, so cards stand out
    surface: '#171A22',       // Cards
    surfaceMuted: '#20242E',  // Inputs, inner panels, tab bar
    surfaceStrong: '#2A2F3B', // Pressed / selected
    border: '#272C37',
    borderStrong: '#3A4150',
    ink: '#F4F6FA',
    inkSecondary: '#B6BFCC',
    inkMuted: '#8D97A8',
    inkFill: '#323949',       // Dark pill buttons, banner chevrons
    onInk: '#FFFFFF',

    // Status colours: deep tint + vivid text
    successFg: '#4ADE8B',
    successBg: '#0F3324',
    warningFg: '#FFB057',
    warningBg: '#3D2810',
    dangerFg:  '#FF7A93',
    dangerBg:  '#45162A',
    infoFg:    '#7FA6FF',
    infoBg:    '#1B2B5C',
    interviewFg: '#B8A6FF',
    interviewBg: '#2C2361',
    neutralFg: '#C0C8D4',
    neutralBg: '#272C37',

    // Fact / stat tiles: saturated deep fills, bright foregrounds
    tiles: {
      green:  { bg: '#0F3324', text: '#4ADE8B' },
      blue:   { bg: '#12305C', text: '#7CB8FF' },
      orange: { bg: '#3D2810', text: '#FFB057' },
      purple: { bg: '#2C2361', text: '#B8A6FF' },
      rose:   { bg: '#45162A', text: '#FF8AA8' },
      yellow: { bg: '#3A2E0C', text: '#FFD04D' },
    }
  }
};

export type ThemeMode = 'light' | 'dark';
