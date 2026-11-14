// Symmetrical 4pt / 8pt geometric spacing scale
export const spacing = {
  xs: 4,      // Micro-padding, badge icon gap
  sm: 8,      // Chip padding, badge horizontal space
  md: 12,     // Input internal padding, card metadata spacing
  lg: 16,     // Standard screen margin (px-4), card padding
  xl: 20,     // Section headers, card-to-card gap
  '2xl': 24,  // Screen top/bottom margins, modal padding
  '3xl': 32,  // Hero section separators
  '4xl': 40,  // Bottom CTA float clearance
} as const;

export const radii = {
  xs: 4,
  sm: 8,      // Fact tiles, small chips
  md: 12,     // Inputs, buttons
  lg: 16,     // Standard cards
  xl: 24,     // Modals, bottom sheets
  full: 9999, // Circular avatars, pills
} as const;

export const layout = {
  screenPadding: 16,
  cardGap: 12,
  buttonHeight: 46,
  inputHeight: 48,
  factTileHeight: 28,
  minTouchTarget: 48,
} as const;

