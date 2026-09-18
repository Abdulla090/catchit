const selectShadow = (ios: any, android: any, def: any): any => {
  try {
    const { Platform } = require('react-native');
    if (Platform && Platform.select) {
      return Platform.select({ ios, android, default: def });
    }
  } catch {
    // Pure node/web fallback
  }
  return def;
};

export const shadows: Record<string, any> = {
  soft: selectShadow(
    {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    { elevation: 2 },
    { boxShadow: '0 2px 6px rgba(28, 25, 23, 0.06)' }
  ),

  card: selectShadow(
    {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    { elevation: 4 },
    { boxShadow: '0 4px 12px rgba(28, 25, 23, 0.08)' }
  ),

  sticker: selectShadow(
    {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
    },
    { elevation: 6 },
    { boxShadow: '0 6px 14px rgba(28, 25, 23, 0.16)' }
  ),

  stickerFloating: selectShadow(
    {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
    },
    { elevation: 10 },
    { boxShadow: '0 12px 24px rgba(28, 25, 23, 0.22)' }
  ),

  popover: selectShadow(
    {
      shadowColor: '#1C1917',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    { elevation: 8 },
    { boxShadow: '0 8px 18px rgba(28, 25, 23, 0.12)' }
  ),
};
