import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { Button } from '../common/Button';
import {
  PawIcon,
  CatHeadIcon,
  DogHeadIcon,
  PeelStickerIcon,
  StickerPackIcon,
} from '../common/PawIcons';
import { Camera, Layers, MapPin, X } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  renderVisual: (colors: typeof lightColors) => React.ReactNode;
}

export const OnboardingModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { hasCompletedOnboarding, completeOnboarding, isDarkMode } = useAppStore();
  const colors = isDarkMode ? darkColors : lightColors;

  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES: Slide[] = [
    {
      id: 0,
      badge: 'SILENT ON-DEVICE CAMERA',
      title: 'Spot & Capture Community Pets',
      subtitle:
        'Point the gentle silent shutter at neighborhood cats, playful rescue dogs, and stray friends. Fast tap-to-focus keeps animals calm.',
      renderVisual: (c) => (
        <View style={[styles.visualBox, { backgroundColor: c.primaryMuted }]}>
          <CatHeadIcon size={76} color={c.primary} strokeWidth={2} />
        </View>
      ),
    },
    {
      id: 1,
      badge: 'VISION & ML KIT ENGINE',
      title: 'Instant On-Device Sticker Magic',
      subtitle:
        'Apple Vision & Google ML Kit lift pet silhouettes with soft fur edge preservation. Peel them with realistic 3D curl physics & specular sheen!',
      renderVisual: (c) => (
        <View style={[styles.visualBox, { backgroundColor: c.secondaryMuted }]}>
          <PeelStickerIcon size={76} color={c.secondary} />
        </View>
      ),
    },
    {
      id: 2,
      badge: 'NEIGHBORHOOD FREEBOARDS',
      title: 'Infinite Boards & Neighborhood Maps',
      subtitle:
        'Layer cutouts with multi-touch gestures, pin sightings to the interactive map, and export beautiful die-cut sticker packs to share.',
      renderVisual: (c) => (
        <View style={[styles.visualBox, { backgroundColor: c.accentMuted }]}>
          <DogHeadIcon size={76} color={c.accent} />
        </View>
      ),
    },
  ];

  if (hasCompletedOnboarding) return null;

  const handleNext = () => {
    hapticFeedback.light();
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      hapticFeedback.heavy();
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    hapticFeedback.medium();
    completeOnboarding();
  };

  const slide = SLIDES[currentSlide];

  return (
    <Modal visible={!hasCompletedOnboarding} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom + 24, 36),
            },
            shadows.popover,
          ]}
        >
          {/* Top Skip Bar */}
          <View style={styles.topSkipBar}>
            <View style={[styles.badgePill, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                {slide.badge}
              </Text>
            </View>
            <Pressable onPress={handleSkip} hitSlop={8} style={styles.skipBtn}>
              <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '600' }]}>
                Skip
              </Text>
            </Pressable>
          </View>

          {/* Visual Icon Illustration Box */}
          <View style={styles.visualContainer}>
            {slide.renderVisual(colors)}
          </View>

          {/* Title & Subtitle */}
          <Text
            style={[
              typography.displayMedium,
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            {slide.title}
          </Text>
          <Text
            style={[
              typography.bodyLarge,
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            {slide.subtitle}
          </Text>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {SLIDES.map((s, idx) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setCurrentSlide(idx);
                }}
                hitSlop={6}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: idx === currentSlide ? colors.primary : colors.border,
                      width: idx === currentSlide ? 24 : 8,
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          {/* Bottom Action Button */}
          <Button
            title={currentSlide === SLIDES.length - 1 ? "Let's Make Stickers!" : 'Continue'}
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 24,
    alignItems: 'center',
  },
  topSkipBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skipBtn: {
    padding: 6,
  },
  visualContainer: {
    marginBottom: 24,
  },
  visualBox: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
    paddingHorizontal: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 26,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
