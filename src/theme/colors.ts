// PawCut Premium Warm Natural Palette (strictly adhering to anti-slop, no pink/purple gradients)

export const lightColors = {
  // Brand Accents
  primary: '#D97706',        // Warm Amber
  primaryHover: '#B45309',
  primaryMuted: '#FEF3C7',   // Light Warm Butter
  secondary: '#C2410C',      // Warm Terracotta / Clay
  secondaryMuted: '#FFEDD5',
  accent: '#059669',         // Earthy Sage Green (for nature/sightings)
  accentMuted: '#D1FAE5',

  // Surfaces & Backgrounds
  background: '#FAF8F5',     // Soft warm cream
  surface: '#FFFFFF',        // Pure white card
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F5EFEB',   // Warm oatmeal
  border: '#E7E2DA',         // Subtle warm divider
  borderSubtle: '#F0EBE5',

  // Typography
  textPrimary: '#1C1917',    // Deep warm charcoal
  textSecondary: '#57534E',  // Warm slate
  textMuted: '#A8A29E',      // Soft pebble
  textInverse: '#FFFFFF',

  // Sticker Elements
  stickerWhiteBorder: '#FFFFFF',
  stickerShadow: 'rgba(28, 25, 23, 0.14)',
  stickerGlow: 'rgba(217, 119, 6, 0.25)',

  // Overlays
  overlay: 'rgba(28, 25, 23, 0.65)',
  glass: 'rgba(255, 255, 255, 0.85)',
};

export const darkColors = {
  // Brand Accents
  primary: '#F59E0B',        // Vibrant Honey
  primaryHover: '#D97706',
  primaryMuted: '#3D2800',
  secondary: '#EA580C',      // Warm Flame Terracotta
  secondaryMuted: '#3D1700',
  accent: '#10B981',         // Crisp Sage Emerald
  accentMuted: '#064E3B',

  // Surfaces & Backgrounds
  background: '#0C0A09',     // Rich dark espresso
  surface: '#1C1917',        // Warm dark card
  surfaceElevated: '#292524',
  surfaceMuted: '#221F1D',
  border: '#383431',
  borderSubtle: '#292524',

  // Typography
  textPrimary: '#F5F5F4',    // Warm light
  textSecondary: '#D6D3D1',  // Muted light
  textMuted: '#78716C',
  textInverse: '#1C1917',

  // Sticker Elements
  stickerWhiteBorder: '#FFFFFF',
  stickerShadow: 'rgba(0, 0, 0, 0.45)',
  stickerGlow: 'rgba(245, 158, 11, 0.35)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.8)',
  glass: 'rgba(28, 25, 23, 0.85)',
};

export type ColorTheme = typeof lightColors;
