import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'amber' | 'clay' | 'sage' | 'neutral';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
}) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const colors = isDarkMode ? darkColors : lightColors;

  let bg = colors.surfaceMuted;
  let text = colors.textSecondary;
  let border = colors.borderSubtle;

  if (variant === 'amber') {
    bg = isDarkMode ? 'rgba(245, 158, 11, 0.15)' : colors.primaryMuted;
    text = colors.primary;
    border = isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A';
  } else if (variant === 'clay') {
    bg = isDarkMode ? 'rgba(234, 88, 12, 0.15)' : colors.secondaryMuted;
    text = colors.secondary;
    border = isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#FED7AA';
  } else if (variant === 'sage') {
    bg = isDarkMode ? 'rgba(16, 185, 129, 0.15)' : colors.accentMuted;
    text = colors.accent;
    border = isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0';
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderColor: border,
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[typography.caption, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});
