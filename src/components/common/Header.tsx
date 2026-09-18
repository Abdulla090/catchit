import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, shadows } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { PawIcon } from './PawIcons';
import { Sun, Moon } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showThemeToggle = true,
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 14),
          backgroundColor: isDarkMode ? 'rgba(12, 10, 9, 0.92)' : 'rgba(250, 248, 245, 0.94)',
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Left item */}
        <View style={styles.leftContainer}>
          {leftAction || (
            <View style={styles.brandBadge}>
              <PawIcon size={20} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={[typography.headingLarge, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right actions */}
        <View style={styles.rightContainer}>
          {rightAction}
          {showThemeToggle && (
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                toggleDarkMode();
              }}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={8}
            >
              {isDarkMode ? (
                <Sun size={17} color={colors.primary} />
              ) : (
                <Moon size={17} color={colors.textSecondary} />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
