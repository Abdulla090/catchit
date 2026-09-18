import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { typography, shadows } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { hapticFeedback } from '../../utils/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const colors = isDarkMode ? darkColors : lightColors;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.95, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1.0, { damping: 15, stiffness: 350 });
  };

  const handlePress = () => {
    if (disabled) return;
    hapticFeedback.light();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Variant Styles
  let bg = colors.primary;
  let textCol = colors.textInverse;
  let borderCol = 'transparent';
  let elevationStyle = shadows.soft;

  if (variant === 'secondary') {
    bg = colors.surfaceMuted;
    textCol = colors.textPrimary;
    borderCol = colors.border;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textCol = colors.primary;
    borderCol = colors.primary;
    elevationStyle = {};
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textCol = colors.textSecondary;
    elevationStyle = {};
  } else if (variant === 'glass') {
    bg = isDarkMode ? 'rgba(41, 37, 36, 0.75)' : 'rgba(255, 255, 255, 0.85)';
    textCol = colors.textPrimary;
    borderCol = colors.borderSubtle;
  }

  // Size padding
  let padV = 12;
  let padH = 20;
  let font = typography.button;
  let rad = 24;

  if (size === 'sm') {
    padV = 8;
    padH = 14;
    font = typography.headingSmall;
    rad = 18;
  } else if (size === 'lg') {
    padV = 16;
    padH = 28;
    font = typography.headingMedium;
    rad = 30;
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? colors.surfaceMuted : bg,
          borderColor: borderCol,
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: rad,
          opacity: disabled ? 0.6 : 1,
        },
        elevationStyle,
        animatedStyle,
        style,
      ]}
    >
      {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
      <Text
        style={[
          font,
          {
            color: disabled ? colors.textMuted : textCol,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
});
