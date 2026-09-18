import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StickerAccessory } from '../../types';
import {
  CrownIcon,
  SunglassesIcon,
  FishboneIcon,
  AngelHaloIcon,
  HeartStickerIcon,
  RibbonBowIcon,
  SparklesIcon,
} from './PawIcons';

interface StickerAccessoryLayerProps {
  accessories?: StickerAccessory[];
  containerSize: number;
}

export const StickerAccessoryLayer: React.FC<StickerAccessoryLayerProps> = ({
  accessories,
  containerSize,
}) => {
  if (!accessories || accessories.length === 0) return null;

  const renderAccessoryIcon = (type: StickerAccessory['type'], iconSize: number) => {
    switch (type) {
      case 'crown':
        return <CrownIcon size={iconSize} color="#F59E0B" />;
      case 'halo':
        return <AngelHaloIcon size={iconSize} color="#F59E0B" />;
      case 'sunglasses':
        return <SunglassesIcon size={iconSize} color="#1C1917" />;
      case 'fishbone':
        return <FishboneIcon size={iconSize} color="#C2410C" />;
      case 'heart':
        return <HeartStickerIcon size={iconSize} color="#EA580C" />;
      case 'bow':
        return <RibbonBowIcon size={iconSize} color="#059669" />;
      case 'sparkles':
        return <SparklesIcon size={iconSize} color="#F59E0B" />;
      default:
        return null;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {accessories.map((acc) => {
        const iconSize = Math.max(containerSize * 0.26 * acc.scale, 24);
        const left = (acc.xPercent / 100) * containerSize - iconSize / 2;
        const top = (acc.yPercent / 100) * containerSize - iconSize / 2;

        return (
          <View
            key={acc.id}
            style={[
              styles.accessoryItem,
              {
                left,
                top,
                width: iconSize,
                height: iconSize,
                transform: [{ rotate: `${acc.rotation}deg` }],
              },
            ]}
          >
            {renderAccessoryIcon(acc.type, iconSize)}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  accessoryItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
