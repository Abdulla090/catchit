import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { typography } from '../../theme';

const { width, height } = Dimensions.get('window');
const RETICLE_SIZE = Math.min(width * 0.68, 250);

interface FocusReticleProps {
  targetX?: number | null;
  targetY?: number | null;
  isLocked?: boolean;
  detectedPet?: boolean;
  petLabel?: string;
}

export const FocusReticle: React.FC<FocusReticleProps> = ({
  targetX = null,
  targetY = null,
  isLocked = true,
  detectedPet = true,
  petLabel = 'Target: Neighborhood Companion',
}) => {
  const breathingScale = useSharedValue(1);
  const breathingOpacity = useSharedValue(0.7);
  const lockSnapScale = useSharedValue(1);
  const rippleRadius = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const compassRotation = useSharedValue(0);

  // Position coordinates
  const posX = useSharedValue(width / 2 - RETICLE_SIZE / 2);
  const posY = useSharedValue(height * 0.42 - RETICLE_SIZE / 2);

  // Idle continuous breathing animation
  useEffect(() => {
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    breathingOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    compassRotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // When tap coordinates change, spring-morph reticle & trigger sonar lock ripple
  useEffect(() => {
    if (targetX != null && targetY != null) {
      posX.value = withSpring(targetX - RETICLE_SIZE / 2, { damping: 14, stiffness: 260 });
      posY.value = withSpring(targetY - RETICLE_SIZE / 2, { damping: 14, stiffness: 260 });

      // Lock snap bounce
      lockSnapScale.value = withSequence(
        withTiming(1.35, { duration: 80, easing: Easing.out(Easing.quad) }),
        withSpring(1.0, { damping: 12, stiffness: 320 })
      );

      // Expanding sonar ripple ring
      rippleRadius.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) })
      );
      rippleOpacity.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withTiming(0, { duration: 570, easing: Easing.out(Easing.quad) })
      );
    } else {
      posX.value = withSpring(width / 2 - RETICLE_SIZE / 2, { damping: 15, stiffness: 200 });
      posY.value = withSpring(height * 0.42 - RETICLE_SIZE / 2, { damping: 15, stiffness: 200 });
    }
  }, [targetX, targetY]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
      { scale: breathingScale.value * lockSnapScale.value },
    ],
    opacity: breathingOpacity.value,
  }));

  const animatedCompassStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${compassRotation.value}deg` }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(rippleRadius.value, [0, 1], [0.2, 1.35]) }],
    opacity: rippleOpacity.value,
  }));

  const cornerColor = detectedPet ? '#F59E0B' : '#FFFFFF';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.reticleFrame, animatedContainerStyle]}>
        {/* Sonar Lock Radar Ring */}
        <Animated.View style={[styles.rippleRing, animatedRippleStyle]} />

        {/* Rotating Compass Outer Ticks */}
        <Animated.View style={[styles.compassWrapper, animatedCompassStyle]}>
          <Svg width={RETICLE_SIZE} height={RETICLE_SIZE} viewBox="0 0 200 200" fill="none">
            <Line x1="100" y1="6" x2="100" y2="12" stroke={cornerColor} strokeWidth="2" strokeLinecap="round" />
            <Line x1="100" y1="188" x2="100" y2="194" stroke={cornerColor} strokeWidth="2" strokeLinecap="round" />
            <Line x1="6" y1="100" x2="12" y2="100" stroke={cornerColor} strokeWidth="2" strokeLinecap="round" />
            <Line x1="188" y1="100" x2="194" y2="100" stroke={cornerColor} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </Animated.View>

        {/* Static Precision Corner Brackets */}
        <Svg width={RETICLE_SIZE} height={RETICLE_SIZE} viewBox="0 0 200 200" fill="none">
          {/* Top-Left Corner */}
          <Path d="M12 48 V22 C12 16.5 16.5 12 22 12 H48" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" />
          <Circle cx="22" cy="22" r="3" fill={cornerColor} />

          {/* Top-Right Corner */}
          <Path d="M152 12 H178 C183.5 12 188 16.5 188 22 V48" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" />
          <Circle cx="178" cy="22" r="3" fill={cornerColor} />

          {/* Bottom-Left Corner */}
          <Path d="M12 152 V178 C12 183.5 16.5 188 22 188 H48" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" />
          <Circle cx="22" cy="178" r="3" fill={cornerColor} />

          {/* Bottom-Right Corner */}
          <Path d="M152 188 H178 C183.5 188 188 183.5 188 178 V152" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" />
          <Circle cx="178" cy="178" r="3" fill={cornerColor} />

          {/* Precision Center Crosshair */}
          <Circle cx="100" cy="100" r="3" fill="#FFFFFF" />
          <Circle cx="100" cy="84" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
          <Circle cx="100" cy="116" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
          <Circle cx="84" cy="100" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
          <Circle cx="116" cy="100" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
        </Svg>

        {/* Pet AI Detection HUD Tag */}
        {detectedPet && (
          <View style={styles.hudBadge}>
            <View style={styles.hudDot} />
            <Text style={[typography.caption, styles.hudText]}>{petLabel}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  reticleFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: RETICLE_SIZE * 0.7,
    height: RETICLE_SIZE * 0.7,
    borderRadius: (RETICLE_SIZE * 0.7) / 2,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  hudBadge: {
    position: 'absolute',
    top: -26,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 25, 23, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    gap: 6,
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  hudText: {
    color: '#F59E0B',
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
