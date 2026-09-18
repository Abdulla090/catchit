export type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800';
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
};

const getFontFamily = (): string => {
  try {
    const { Platform } = require('react-native');
    if (Platform && Platform.select) {
      return Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });
    }
  } catch {
    // Pure node/web fallback
  }
  return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
};

const fontFamily = getFontFamily();

export const typography: Record<string, TextStyle> = {
  // Display & Headers
  displayLarge: {
    fontFamily,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headingLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headingMedium: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headingSmall: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.1,
  },

  // Interactive & Badges
  button: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
};
