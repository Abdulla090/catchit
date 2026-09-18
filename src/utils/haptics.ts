import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const hapticFeedback = {
  // Soft tactile tick for button presses and tab switches
  light: async () => {
    if (isWeb) return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored if unsupported on current environment
    }
  },

  // Satisfying snap when sticker aligns, drops, or focuses
  medium: async () => {
    if (isWeb) return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignored
    }
  },

  // Heavier mechanical thud for shutter release or board clear
  heavy: async () => {
    if (isWeb) return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Ignored
    }
  },

  // Magical peeling completion pop
  peelComplete: async () => {
    if (isWeb) return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored
    }
  },

  // Warning or limit hit
  warning: async () => {
    if (isWeb) return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignored
    }
  },

  // Selection change in segmented picker or slider
  selection: async () => {
    if (isWeb) return;
    try {
      const Haptics = require('expo-haptics');
      await Haptics.selectionAsync();
    } catch {
      // Ignored
    }
  },
};
