import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Line, Rect } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { StickerBorderStyle, StickerAccessory } from '../../types';
import { shadows } from '../../theme';
import { hapticFeedback } from '../../utils/haptics';
import { StickerAccessoryLayer } from '../common/StickerAccessoryLayer';
import { SparkleStarIcon } from '../common/PawIcons';

const { width } = Dimensions.get('window');
const STICKER_SIZE = Math.min(width * 0.76, 310);
const PEEL_THRESHOLD = 70; // px drag to trigger full peel release

interface PeelingStickerProps {
  imageUri: string;
  borderStyle: StickerBorderStyle;
  accessories?: StickerAccessory[];
  onPeelComplete?: () => void;
}

export const PeelingSticker: React.FC<PeelingStickerProps> = ({
  imageUri,
  borderStyle,
  accessories,
  onPeelComplete,
}) => {
  // 3D Peeling curl & sheen shared values
  const peelProgress = useSharedValue(0); // 0 = flat on sheet, 1 = peeled & floating
  const dragCurlX = useSharedValue(0);
  const dragCurlY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const peelRotationZ = useSharedValue(-18);
  const peelRotationX = useSharedValue(22);
  const peelRotationY = useSharedValue(-12);
  const peelScale = useSharedValue(0.78);
  const peelOpacity = useSharedValue(0);
  const sheenOffset = useSharedValue(-STICKER_SIZE * 1.5);
  const liftHeight = useSharedValue(0);

  // Sparkle stars animation
  const sparklePulse = useSharedValue(1);

  const triggerHapticSuccess = () => {
    hapticFeedback.peelComplete();
  };

  const triggerHapticTick = () => {
    hapticFeedback.selection();
  };

  const startAutoPeel = () => {
    peelOpacity.value = withTiming(1, { duration: 160 });
    peelScale.value = withSpring(1.0, { damping: 13, stiffness: 210 });
    peelRotationX.value = withSpring(0, { damping: 14, stiffness: 180 });
    peelRotationY.value = withSpring(0, { damping: 14, stiffness: 180 });
    peelRotationZ.value = withSpring(0, { damping: 12, stiffness: 190 }, () => {
      if (onPeelComplete) {
        runOnJS(onPeelComplete)();
      }
    });

    sheenOffset.value = withSequence(
      withTiming(-STICKER_SIZE * 1.5, { duration: 0 }),
      withTiming(STICKER_SIZE * 1.8, {
        duration: 850,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    sparklePulse.value = withSequence(
      withTiming(1.3, { duration: 300 }),
      withTiming(1.0, { duration: 400 })
    );

    hapticFeedback.peelComplete();
  };

  useEffect(() => {
    startAutoPeel();
  }, [imageUri, borderStyle.width, borderStyle.color, borderStyle.effect, accessories?.length]);

  // Interactive Pan Gesture to peel corner with real-time 3D curl physics
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      runOnJS(triggerHapticTick)();
    })
    .onUpdate((event) => {
      'worklet';
      // Restrict drag primarily to pulling up-left from corner
      dragCurlX.value = Math.min(0, Math.max(event.translationX, -160));
      dragCurlY.value = Math.min(0, Math.max(event.translationY, -160));
      const dist = Math.sqrt(dragCurlX.value * dragCurlX.value + dragCurlY.value * dragCurlY.value);
      liftHeight.value = Math.min(dist * 0.35, 32);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      const dist = Math.sqrt(dragCurlX.value * dragCurlX.value + dragCurlY.value * dragCurlY.value);

      if (dist > PEEL_THRESHOLD) {
        // Successful peel release!
        dragCurlX.value = withSpring(0, { damping: 12, stiffness: 240 });
        dragCurlY.value = withSpring(0, { damping: 12, stiffness: 240 });
        liftHeight.value = withSequence(
          withSpring(18, { damping: 12, stiffness: 350 }),
          withSpring(0, { damping: 14, stiffness: 280 })
        );
        peelRotationZ.value = withSequence(
          withTiming(-8, { duration: 120 }),
          withSpring(0, { damping: 12, stiffness: 220 })
        );
        peelRotationX.value = withSequence(
          withTiming(14, { duration: 120 }),
          withSpring(0, { damping: 12, stiffness: 220 })
        );

        sheenOffset.value = withSequence(
          withTiming(-STICKER_SIZE * 1.5, { duration: 0 }),
          withTiming(STICKER_SIZE * 1.8, {
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        );

        runOnJS(triggerHapticSuccess)();
        if (onPeelComplete) {
          runOnJS(onPeelComplete)();
        }
      } else {
        // Snap back flat onto backing paper
        dragCurlX.value = withSpring(0, { damping: 16, stiffness: 300 });
        dragCurlY.value = withSpring(0, { damping: 16, stiffness: 300 });
        liftHeight.value = withSpring(0, { damping: 16, stiffness: 300 });
      }
    });

  // Tap gesture to replay auto peel
  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(startAutoPeel)();
  });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const stickerContainerStyle = useAnimatedStyle(() => {
    const curlDegX = interpolate(dragCurlY.value, [-160, 0], [32, 0]);
    const curlDegY = interpolate(dragCurlX.value, [-160, 0], [-28, 0]);
    const curlDegZ = interpolate(dragCurlX.value + dragCurlY.value, [-320, 0], [-14, 0]);

    return {
      opacity: peelOpacity.value,
      transform: [
        { perspective: 900 },
        { scale: peelScale.value },
        { rotateX: `${peelRotationX.value + curlDegX}deg` },
        { rotateY: `${peelRotationY.value + curlDegY}deg` },
        { rotateZ: `${peelRotationZ.value + curlDegZ}deg` },
        { translateY: -liftHeight.value },
      ],
    };
  });

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheenOffset.value }, { rotateZ: '28deg' }],
  }));

  const curlShadowStyle = useAnimatedStyle(() => {
    const shadowScale = interpolate(liftHeight.value, [0, 32], [0.85, 1.25]);
    const shadowOpacity = interpolate(liftHeight.value, [0, 32], [0.15, 0.35]);
    return {
      transform: [{ scale: shadowScale }],
      opacity: shadowOpacity,
    };
  });

  const isHolo = borderStyle.effect === 'holo';
  const isSparkles = borderStyle.effect === 'sparkles';
  const isVintage = borderStyle.effect === 'vintage';

  return (
    <View style={styles.container}>
      {/* Wax Backing Paper Sheet Underneath */}
      <View style={styles.backingSheetWrapper} pointerEvents="none">
        <View style={styles.backingSheet}>
          <Svg width={STICKER_SIZE - 20} height={STICKER_SIZE - 20} style={StyleSheet.absoluteFill}>
            {/* Release cut guide line */}
            <Line
              x1="0"
              y1={(STICKER_SIZE - 20) * 0.52}
              x2={STICKER_SIZE - 20}
              y2={(STICKER_SIZE - 20) * 0.52}
              stroke="rgba(120, 113, 108, 0.22)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Corner peel tab graphic indicator */}
            <Path
              d={`M ${STICKER_SIZE - 65} ${STICKER_SIZE - 20} L ${STICKER_SIZE - 20} ${STICKER_SIZE - 65}`}
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </Svg>
          {/* Subtle peel instruction badge on backing paper */}
          <View style={styles.peelHintTab}>
            <Text style={styles.peelHintText}>PEEL HERE ↗</Text>
          </View>
        </View>

        {/* Dynamic Oval Lift Shadow */}
        <Animated.View style={[styles.backingShadow, curlShadowStyle]} />
      </View>

      {/* Floating Peeling Sticker with Gesture Handler */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.stickerWrapper, stickerContainerStyle]}>
          <View
            style={[
              styles.dieCutPlate,
              {
                borderWidth: borderStyle.width,
                borderColor: borderStyle.color,
                backgroundColor: 'transparent',
                borderStyle: isVintage ? 'dashed' : 'solid',
              },
              borderStyle.shadow ? shadows.stickerFloating : {},
            ]}
          >
            {/* Transparent Cutout Sticker Image */}
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="contain"
              transition={200}
            />

            {/* Layered Sticker Accessories (Crown, Glasses, Fishbone, etc.) */}
            <StickerAccessoryLayer
              accessories={accessories}
              containerSize={STICKER_SIZE - 20}
            />

            {/* Specular Sheen or Holographic Band */}
            <Animated.View
              style={[
                styles.sheenBand,
                isHolo && styles.holoSheenBand,
                sheenStyle,
              ]}
              pointerEvents="none"
            />

            {/* Twinkling Glitter Shimmer Stars */}
            {isSparkles && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={[styles.sparkleItem, { top: '14%', left: '18%' }]}>
                  <SparkleStarIcon size={14} color="#F59E0B" />
                </View>
                <View style={[styles.sparkleItem, { top: '22%', right: '16%' }]}>
                  <SparkleStarIcon size={18} color="#FEF3C7" />
                </View>
                <View style={[styles.sparkleItem, { bottom: '26%', left: '22%' }]}>
                  <SparkleStarIcon size={15} color="#F59E0B" />
                </View>
                <View style={[styles.sparkleItem, { bottom: '28%', right: '20%' }]}>
                  <SparkleStarIcon size={13} color="#D97706" />
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    position: 'relative',
  },
  backingSheetWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  backingSheet: {
    width: STICKER_SIZE - 20,
    height: STICKER_SIZE - 20,
    borderRadius: 36,
    backgroundColor: 'rgba(231, 226, 218, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(120, 113, 108, 0.2)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  peelHintTab: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  peelHintText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  backingShadow: {
    position: 'absolute',
    bottom: -10,
    width: STICKER_SIZE * 0.75,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(28, 25, 23, 0.3)',
    zIndex: -1,
  },
  stickerWrapper: {
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dieCutPlate: {
    width: STICKER_SIZE - 20,
    height: STICKER_SIZE - 20,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '94%',
    height: '94%',
  },
  sheenBand: {
    position: 'absolute',
    top: -STICKER_SIZE * 0.8,
    width: 65,
    height: STICKER_SIZE * 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  holoSheenBand: {
    width: 95,
    backgroundColor: 'rgba(254, 243, 199, 0.65)',
  },
  sparkleItem: {
    position: 'absolute',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
