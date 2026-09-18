import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import { typography } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { Button } from '../common/Button';
import { Eraser, Paintbrush, Undo2, Check } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const { width } = Dimensions.get('window');
import { BrushPoint } from '../../types';

const CANVAS_SIZE = Math.min(width * 0.82, 320);

interface BrushRefineCanvasProps {
  imageUri: string;
  initialPoints?: BrushPoint[];
  onApply: (refinedUri: string, points: BrushPoint[]) => void;
  onCancel: () => void;
}

export const BrushRefineCanvas: React.FC<BrushRefineCanvasProps> = ({
  imageUri,
  initialPoints = [],
  onApply,
  onCancel,
}) => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const colors = isDarkMode ? darkColors : lightColors;

  const [mode, setMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState<number>(14);
  const [points, setPoints] = useState<BrushPoint[]>(initialPoints);

  const handleTouch = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    if (locationX >= 0 && locationX <= CANVAS_SIZE && locationY >= 0 && locationY <= CANVAS_SIZE) {
      setPoints((prev) => [
        ...prev,
        { x: locationX, y: locationY, mode, radius: brushSize },
      ]);
    }
  };

  const handleClear = () => {
    hapticFeedback.light();
    setPoints([]);
  };

  const handleUndo = () => {
    hapticFeedback.light();
    setPoints((prev) => prev.slice(0, Math.max(0, prev.length - 12)));
  };

  const handleSave = () => {
    hapticFeedback.medium();
    onApply(imageUri, points);
  };


  return (
    <View style={styles.container}>
      <Text style={[typography.headingSmall, { color: colors.textPrimary, marginBottom: 8 }]}>
        Refine Fur & Whisker Edge
      </Text>
      <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }]}>
        Swipe your finger over the sticker to {mode === 'erase' ? 'remove leftover background' : 'restore cut whiskers'}
      </Text>

      {/* Interactive Brush Drawing Canvas */}
      <View
        style={[
          styles.canvasFrame,
          {
            borderColor: colors.border,
            backgroundColor: isDarkMode ? '#1C1917' : '#FAF8F5',
          },
        ]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.petImage}
          contentFit="contain"
        />

        {/* Drawn Brush Marks Overlay */}
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={StyleSheet.absoluteFill} pointerEvents="none">
          {points.map((pt, idx) => (
            <Circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={pt.radius}
              fill={pt.mode === 'erase' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}
            />
          ))}
        </Svg>
      </View>

      {/* Mode Switcher */}
      <View style={styles.toolbar}>
        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setMode('erase');
          }}
          style={[
            styles.toolBtn,
            mode === 'erase' && { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
          ]}
        >
          <Eraser size={18} color={mode === 'erase' ? colors.primary : colors.textSecondary} />
          <Text
            style={[
              typography.caption,
              { color: mode === 'erase' ? colors.primary : colors.textSecondary, marginLeft: 6 },
            ]}
          >
            Erase Excess
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setMode('restore');
          }}
          style={[
            styles.toolBtn,
            mode === 'restore' && { backgroundColor: colors.accentMuted, borderColor: colors.accent },
          ]}
        >
          <Paintbrush size={18} color={mode === 'restore' ? colors.accent : colors.textSecondary} />
          <Text
            style={[
              typography.caption,
              { color: mode === 'restore' ? colors.accent : colors.textSecondary, marginLeft: 6 },
            ]}
          >
            Restore Fur
          </Text>
        </Pressable>

        <Pressable onPress={handleClear} style={styles.toolBtn} hitSlop={6}>
          <Undo2 size={16} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textMuted, marginLeft: 4 }]}>Reset</Text>
        </Pressable>
      </View>

      {/* Brush Size Selector */}
      <View style={styles.brushSizeRow}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Size:</Text>
        {[8, 14, 22].map((sz) => (
          <Pressable
            key={sz}
            onPress={() => {
              hapticFeedback.selection();
              setBrushSize(sz);
            }}
            style={[
              styles.sizeDot,
              { width: sz + 12, height: sz + 12, borderRadius: (sz + 12) / 2 },
              brushSize === sz && { borderColor: colors.primary, borderWidth: 2 },
            ]}
          >
            <View
              style={{
                width: sz,
                height: sz,
                borderRadius: sz / 2,
                backgroundColor: colors.primary,
              }}
            />
          </Pressable>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button title="Cancel" variant="ghost" size="sm" onPress={onCancel} style={{ flex: 1 }} />
        <Button title="Apply Mask" variant="primary" size="sm" onPress={handleSave} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  canvasFrame: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImage: {
    width: '90%',
    height: '90%',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  brushSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  sizeDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
});
