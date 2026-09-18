import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { ActiveTab } from '../../types';
import { PawIcon, SparklesIcon } from './PawIcons';
import { Layers, Calendar, MapPin, Camera } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

interface TabItem {
  id: ActiveTab;
  label: string;
  isCenter?: boolean;
}

const TABS: TabItem[] = [
  { id: 'board', label: 'Boards' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'camera', label: 'PawCut', isCenter: true },
  { id: 'map', label: 'Map' },
  { id: 'stickers', label: 'Stickers' },
];

export const TabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab, isDarkMode } = useAppStore();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: isDarkMode
              ? 'rgba(28, 25, 23, 0.94)'
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDarkMode ? '#383431' : '#E7E2DA',
          },
          shadows.popover,
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <CenterCameraButton
                key={tab.id}
                isActive={isActive}
                onPress={() => {
                  hapticFeedback.medium();
                  setActiveTab(tab.id);
                }}
              />
            );
          }

          return (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => {
                hapticFeedback.light();
                setActiveTab(tab.id);
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onPress }) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const colors = isDarkMode ? darkColors : lightColors;

  const scale = useSharedValue(1);
  const activePillOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activePillOpacity.value = withSpring(isActive ? 1 : 0, { damping: 16, stiffness: 260 });
  }, [isActive]);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: activePillOpacity.value,
    transform: [{ scale: interpolate(activePillOpacity.value, [0, 1], [0.85, 1]) }],
  }));

  const iconColor = isActive ? colors.primary : colors.textMuted;

  const renderIcon = () => {
    switch (tab.id) {
      case 'board':
        return <Layers size={20} color={iconColor} strokeWidth={isActive ? 2.4 : 1.8} />;
      case 'timeline':
        return <Calendar size={20} color={iconColor} strokeWidth={isActive ? 2.4 : 1.8} />;
      case 'map':
        return <MapPin size={20} color={iconColor} strokeWidth={isActive ? 2.4 : 1.8} />;
      case 'stickers':
        return <SparklesIcon size={20} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabButton}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {/* Subtle sliding pill background */}
        <Animated.View
          style={[
            styles.activeIndicatorPill,
            {
              backgroundColor: isDarkMode
                ? 'rgba(245, 158, 11, 0.14)'
                : 'rgba(217, 119, 6, 0.1)',
            },
            animatedPillStyle,
          ]}
        />
        {renderIcon()}
        <Text
          style={[
            typography.caption,
            styles.tabText,
            {
              color: isActive ? colors.primary : colors.textMuted,
              fontWeight: isActive ? '700' : '500',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const CenterCameraButton: React.FC<{ isActive: boolean; onPress: () => void }> = ({
  isActive,
  onPress,
}) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const colors = isDarkMode ? darkColors : lightColors;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 12, stiffness: 350 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 12, stiffness: 350 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.centerButtonOuter}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View
        style={[
          styles.centerButton,
          {
            backgroundColor: colors.primary,
          },
          shadows.sticker,
          animatedStyle,
        ]}
      >
        <Camera size={22} color="#FFFFFF" strokeWidth={2.4} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '92%',
    maxWidth: 420,
    height: 66,
    borderRadius: 33,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    position: 'relative',
  },
  activeIndicatorPill: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 4,
    right: 4,
    borderRadius: 16,
  },
  tabText: {
    marginTop: 3,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  centerButtonOuter: {
    top: -14,
    padding: 3,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
