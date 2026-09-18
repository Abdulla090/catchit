import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BoardSticker, Sticker } from '../../types';
import { shadows, typography } from '../../theme';
import { hapticFeedback } from '../../utils/haptics';
import { StickerAccessoryLayer } from '../common/StickerAccessoryLayer';
import {
  Trash2,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  Eye,
  Check,
} from 'lucide-react-native';

interface BoardStickerItemProps {
  boardSticker: BoardSticker;
  sticker: Sticker;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate: (updates: Partial<BoardSticker>) => void;
  onBringToFront: () => void;
  onSendToBack?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  onInspect?: () => void;
}

const STICKER_BASE_SIZE = 132;
const SNAP_ROTATION_THRESHOLD = 5.5; // degrees within which rotation snaps to cardinal angles
const SNAP_SCALE_THRESHOLD = 0.08;   // scale factor within which scale snaps to 1.0

const BoardStickerItemComponent: React.FC<BoardStickerItemProps> = ({
  boardSticker,
  sticker,
  isSelected = false,
  onSelect,
  onUpdate,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onInspect,
}) => {
  const [showToolbar, setShowToolbar] = useState(false);

  // Shared values running 100% on Hermes UI thread (Worklets)
  const translateX = useSharedValue(boardSticker.x);
  const translateY = useSharedValue(boardSticker.y);
  const scale = useSharedValue(boardSticker.scale);
  const rotation = useSharedValue(boardSticker.rotation);
  const isDragging = useSharedValue(false);
  const activeGesturesCount = useSharedValue(0);
  const liftScale = useSharedValue(1);

  // Sync shared values when boardSticker prop updates from outside (e.g. undo or board load)
  useEffect(() => {
    if (!isDragging.value) {
      translateX.value = boardSticker.x;
      translateY.value = boardSticker.y;
      scale.value = boardSticker.scale;
      rotation.value = boardSticker.rotation;
    }
  }, [boardSticker.x, boardSticker.y, boardSticker.scale, boardSticker.rotation]);

  // Gesture context offsets
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startRotation = useSharedValue(0);

  const triggerSnapHaptic = () => {
    hapticFeedback.selection();
  };

  const toggleToolbar = useCallback(() => {
    setShowToolbar((prev) => !prev);
  }, []);

  const openToolbar = useCallback(() => {
    setShowToolbar(true);
  }, []);

  // Pan gesture (Physics Dragging with pure UI thread worklet)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
      startY.value = translateY.value;
      activeGesturesCount.value += 1;
      isDragging.value = true;
      liftScale.value = withSpring(1.08, { damping: 15, stiffness: 220 });
      runOnJS(hapticFeedback.light)();
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onFinalize((event, success) => {
      'worklet';
      activeGesturesCount.value = Math.max(0, activeGesturesCount.value - 1);
      if (activeGesturesCount.value === 0) {
        isDragging.value = false;
        liftScale.value = withSpring(1.0, { damping: 15, stiffness: 220 });
      }
      if (success) {
        runOnJS(onUpdate)({
          x: translateX.value,
          y: translateY.value,
        });
        runOnJS(hapticFeedback.medium)();
      }
    });

  // Pinch to Scale Gesture with Magnetic Snapping to 1.0x
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      'worklet';
      startScale.value = scale.value;
      activeGesturesCount.value += 1;
      isDragging.value = true;
      liftScale.value = withSpring(1.08, { damping: 15, stiffness: 220 });
    })
    .onUpdate((event) => {
      'worklet';
      let rawScale = Math.min(Math.max(startScale.value * event.scale, 0.45), 2.8);

      // Tactile Snapping to natural 1.0x size
      if (Math.abs(rawScale - 1.0) < SNAP_SCALE_THRESHOLD) {
        if (scale.value !== 1.0) {
          runOnJS(triggerSnapHaptic)();
        }
        rawScale = 1.0;
      }
      scale.value = rawScale;
    })
    .onFinalize((event, success) => {
      'worklet';
      activeGesturesCount.value = Math.max(0, activeGesturesCount.value - 1);
      if (activeGesturesCount.value === 0) {
        isDragging.value = false;
        liftScale.value = withSpring(1.0, { damping: 15, stiffness: 220 });
      }
      if (success) {
        runOnJS(onUpdate)({
          scale: scale.value,
        });
      }
    });

  // Rotation Gesture with Magnetic Snapping to 0°, 90°, 180°, -90°
  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      'worklet';
      startRotation.value = rotation.value;
      activeGesturesCount.value += 1;
      isDragging.value = true;
      liftScale.value = withSpring(1.08, { damping: 15, stiffness: 220 });
    })
    .onUpdate((event) => {
      'worklet';
      let rawRotation = startRotation.value + (event.rotation * 180) / Math.PI;

      // Normalize between -180 and 180
      let norm = rawRotation % 360;
      if (norm > 180) norm -= 360;
      if (norm < -180) norm += 360;

      // Snap to 0° upright
      if (Math.abs(norm) < SNAP_ROTATION_THRESHOLD) {
        if (rotation.value !== 0) runOnJS(triggerSnapHaptic)();
        norm = 0;
      } else if (Math.abs(Math.abs(norm) - 90) < SNAP_ROTATION_THRESHOLD) {
        norm = norm > 0 ? 90 : -90;
        if (rotation.value !== norm) runOnJS(triggerSnapHaptic)();
      } else if (Math.abs(Math.abs(norm) - 180) < SNAP_ROTATION_THRESHOLD) {
        norm = 180;
        if (rotation.value !== 180) runOnJS(triggerSnapHaptic)();
      }

      rotation.value = norm;
    })
    .onFinalize((event, success) => {
      'worklet';
      activeGesturesCount.value = Math.max(0, activeGesturesCount.value - 1);
      if (activeGesturesCount.value === 0) {
        isDragging.value = false;
        liftScale.value = withSpring(1.0, { damping: 15, stiffness: 220 });
      }
      if (success) {
        runOnJS(onUpdate)({
          rotation: rotation.value,
        });
      }
    });

  // Tap to toggle quick action toolbar or bring to front
  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(hapticFeedback.light)();
    runOnJS(onBringToFront)();
    runOnJS(toggleToolbar)();
    if (onSelect) runOnJS(onSelect)();
  });

  // Long press for immediate toolbar reveal
  const longPressGesture = Gesture.LongPress()
    .minDuration(320)
    .onEnd(() => {
      'worklet';
      runOnJS(hapticFeedback.heavy)();
      runOnJS(openToolbar)();
    });

  // Compose all gestures simultaneously
  const composedGestures = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    rotateGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value * liftScale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
    zIndex: isDragging.value ? 999 : boardSticker.zIndex,
  }));

  const border = sticker.borderStyle;

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View style={[styles.stickerContainer, animatedStyle]}>
        {/* Quick Context Action Floating Pill Toolbar */}
        {showToolbar && (
          <View style={styles.floatingToolbar} pointerEvents="box-none">
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                onBringToFront();
                setShowToolbar(false);
              }}
              style={styles.toolbarBtn}
              hitSlop={6}
            >
              <ArrowUpToLine size={13} color="#FFFFFF" />
            </Pressable>

            {onSendToBack && (
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  onSendToBack();
                  setShowToolbar(false);
                }}
                style={styles.toolbarBtn}
                hitSlop={6}
              >
                <ArrowDownToLine size={13} color="#FFFFFF" />
              </Pressable>
            )}

            {onDuplicate && (
              <Pressable
                onPress={() => {
                  hapticFeedback.medium();
                  onDuplicate();
                  setShowToolbar(false);
                }}
                style={styles.toolbarBtn}
                hitSlop={6}
              >
                <Copy size={13} color="#FFFFFF" />
              </Pressable>
            )}

            {onInspect && (
              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  onInspect();
                  setShowToolbar(false);
                }}
                style={styles.toolbarBtn}
                hitSlop={6}
              >
                <Eye size={13} color="#F59E0B" />
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                hapticFeedback.warning();
                onDelete();
              }}
              style={[styles.toolbarBtn, { backgroundColor: '#EF4444' }]}
              hitSlop={6}
            >
              <Trash2 size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Die-cut Frame with Transparent Background */}
        <View
          style={[
            styles.dieCutFrame,
            {
              borderWidth: border.width ? Math.max(border.width * 0.7, 3) : 0,
              borderColor: border.color,
              backgroundColor: 'transparent',
            },
            border.shadow ? shadows.sticker : {},
            showToolbar && styles.selectedHalo,
          ]}
        >
          <Image
            source={{ uri: sticker.imageUri }}
            style={styles.stickerImage}
            contentFit="contain"
            priority="high"
          />

          {/* Layered Sticker Accessories */}
          <StickerAccessoryLayer
            accessories={sticker.accessories}
            containerSize={STICKER_BASE_SIZE}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// Pure React.memo comparator for zero-jank 120 FPS performance on heavy freeboards
export const BoardStickerItem = React.memo(
  BoardStickerItemComponent,
  (prev, next) =>
    prev.boardSticker.id === next.boardSticker.id &&
    prev.boardSticker.x === next.boardSticker.x &&
    prev.boardSticker.y === next.boardSticker.y &&
    prev.boardSticker.scale === next.boardSticker.scale &&
    prev.boardSticker.rotation === next.boardSticker.rotation &&
    prev.boardSticker.zIndex === next.boardSticker.zIndex &&
    prev.isSelected === next.isSelected &&
    prev.sticker.id === next.sticker.id &&
    prev.sticker.imageUri === next.sticker.imageUri &&
    prev.sticker.borderStyle === next.sticker.borderStyle &&
    prev.sticker.accessories === next.sticker.accessories
);

const styles = StyleSheet.create({
  stickerContainer: {
    position: 'absolute',
    width: STICKER_BASE_SIZE,
    height: STICKER_BASE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieCutFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stickerImage: {
    width: '94%',
    height: '94%',
  },
  selectedHalo: {
    borderColor: '#D97706',
    borderWidth: 2.5,
    borderStyle: 'dashed',
  },
  floatingToolbar: {
    position: 'absolute',
    top: -42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1917',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 7,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  toolbarBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#292524',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
