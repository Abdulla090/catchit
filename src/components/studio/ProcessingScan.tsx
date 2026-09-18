import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { typography } from '../../theme';
import { CatHeadIcon, SparklesIcon, SparkleStarIcon } from '../common/PawIcons';
import { BackgroundRemovalProgress } from '../../services/backgroundRemoval';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = Math.min(width * 0.74, 290);

interface ProcessingScanProps {
  progress: BackgroundRemovalProgress;
}

export const ProcessingScan: React.FC<ProcessingScanProps> = ({ progress }) => {
  const scanLineY = useSharedValue(0);
  const glowPulse = useSharedValue(0.4);
  const ringScale = useSharedValue(0.85);
  const starOpacity = useSharedValue(0.3);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(SCAN_BOX_SIZE - 6, {
        duration: 1500,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.94, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    starOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.2, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
  }));

  const getStepLabel = () => {
    switch (progress.step) {
      case 'scanning':
        return 'Analyzing Fur & Contour';
      case 'segmenting':
        return 'Lifting Pet Silhouette';
      case 'feathering_fur':
        return 'Softening Whisker Contours';
      case 'applying_border':
        return 'Applying Die-Cut Rim';
      case 'done':
        return 'Sticker Ready!';
      default:
        return 'Magic PawCut Scanning';
    }
  };

  return (
    <View style={styles.container}>
      {/* Central Holographic Pet Silhouette Box */}
      <View style={styles.scanBox}>
        {/* Pulsing Aura */}
        <Animated.View style={[styles.glowAura, glowStyle]} />

        {/* Animated Outer Concentric Ring */}
        <Animated.View style={[styles.concentricRing, ringStyle]} />

        {/* Floating Twinkling Stars */}
        <Animated.View style={[styles.starParticle, { top: 24, left: 32 }, starStyle]}>
          <SparkleStarIcon size={14} color="#FEF3C7" />
        </Animated.View>
        <Animated.View style={[styles.starParticle, { bottom: 28, right: 32 }, starStyle]}>
          <SparkleStarIcon size={16} color="#F59E0B" />
        </Animated.View>
        <Animated.View style={[styles.starParticle, { top: 32, right: 40 }, starStyle]}>
          <SparkleStarIcon size={12} color="#D97706" />
        </Animated.View>

        {/* Center Pet Icon */}
        <View style={styles.petCenter}>
          <CatHeadIcon size={102} color="#F59E0B" strokeWidth={1.8} />
        </View>

        {/* Moving Holographic Laser Beam Line */}
        <Animated.View style={[styles.scanLine, scanLineStyle]}>
          <View style={styles.scanBeamGlow} />
          <View style={styles.scanBeamCore} />
        </Animated.View>
      </View>

      {/* Progress Information (Anti-slop, no generic spinners) */}
      <View style={styles.progressContainer}>
        <View style={styles.stepBadge}>
          <SparklesIcon size={15} color="#F59E0B" />
          <Text style={[typography.caption, styles.stepBadgeText]}>
            {getStepLabel()}
          </Text>
        </View>

        <Text style={[typography.bodyMedium, styles.statusMessage]}>
          {progress.message}
        </Text>

        {/* Sleek Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.max(progress.percentage, 12)}%` },
            ]}
          />
        </View>

        <View style={styles.progressStatsRow}>
          <Text style={[typography.caption, { color: '#78716C' }]}>
            On-Device CoreML / MLKit
          </Text>
          <Text style={[typography.caption, styles.percentageText]}>
            {progress.percentage}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 36,
    backgroundColor: '#171513',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    width: SCAN_BOX_SIZE * 0.82,
    height: SCAN_BOX_SIZE * 0.82,
    borderRadius: (SCAN_BOX_SIZE * 0.82) / 2,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
  },
  concentricRing: {
    position: 'absolute',
    width: SCAN_BOX_SIZE * 0.75,
    height: SCAN_BOX_SIZE * 0.75,
    borderRadius: (SCAN_BOX_SIZE * 0.75) / 2,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderStyle: 'dashed',
  },
  starParticle: {
    position: 'absolute',
  },
  petCenter: {
    zIndex: 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 5,
  },
  scanBeamGlow: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.32)',
  },
  scanBeamCore: {
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 1.5,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 24,
    width: '84%',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 8,
  },
  stepBadgeText: {
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusMessage: {
    color: '#A8A29E',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#292524',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  percentageText: {
    color: '#F59E0B',
    fontWeight: '700',
  },
});
