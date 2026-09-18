import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { Sticker, AnimalType } from '../../types';
import { Header } from '../common/Header';
import { Badge } from '../common/Badge';
import { PawIcon } from '../common/PawIcons';
import { StickerAccessoryLayer } from '../common/StickerAccessoryLayer';
import {
  MapPin,
  Navigation,
  Heart,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 420;

// Memoized Pin Marker Component for 120 FPS Rendering
interface MapPinMarkerProps {
  sticker: Sticker;
  isCurrent: boolean;
  position: { left: number; top: number };
  colors: typeof lightColors;
  onPress: () => void;
}

const MapPinMarker = React.memo<MapPinMarkerProps>(
  ({ sticker, isCurrent, position, colors, onPress }) => {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.pinMarker,
          position,
          isCurrent && { transform: [{ scale: 1.25 }], zIndex: 99 },
        ]}
        hitSlop={8}
      >
        <View
          style={[
            styles.pinBadge,
            {
              borderColor: isCurrent ? colors.primary : '#FFFFFF',
              backgroundColor: isCurrent ? colors.primaryMuted : '#FFFFFF',
            },
            shadows.sticker,
          ]}
        >
          <Image
            source={{ uri: sticker.imageUri }}
            style={styles.pinImage}
            contentFit="contain"
            priority="normal"
          />
        </View>
        <View
          style={[
            styles.pinDot,
            { backgroundColor: isCurrent ? colors.primary : colors.secondary },
          ]}
        />
      </Pressable>
    );
  }
);

export const AnimalMapView: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    stickers,
    setSelectedSticker,
    addStickerToBoard,
    activeBoardId,
    setActiveTab,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  const [selectedType, setSelectedType] = useState<'all' | AnimalType | 'favorites'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [activePinSticker, setActivePinSticker] = useState<Sticker | null>(stickers[0] || null);

  // Filter by both animal type and sighting date
  const filteredStickers = useMemo(() => {
    const now = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;

    return stickers.filter((s) => {
      // Type filter
      if (selectedType === 'favorites' && !s.isFavorite) return false;
      if (selectedType !== 'all' && selectedType !== 'favorites' && s.animalType !== selectedType) {
        return false;
      }
      // Date filter
      if (selectedDateFilter === 'today') {
        if (now - s.createdAt > dayMs * 1.5) return false;
      } else if (selectedDateFilter === 'week') {
        if (now - s.createdAt > dayMs * 7) return false;
      }
      // Cluster filter
      if (selectedCluster && (s.location.neighborhood || 'Neighborhood') !== selectedCluster) {
        return false;
      }
      return true;
    });
  }, [stickers, selectedType, selectedDateFilter, selectedCluster]);

  // Group sightings into neighborhood clusters
  const clusters = useMemo(() => {
    const map = new Map<string, Sticker[]>();
    stickers.forEach((s) => {
      const n = s.location.neighborhood || 'Mission District';
      if (!map.has(n)) map.set(n, []);
      map.get(n)!.push(s);
    });
    return Array.from(map.entries()).map(([neighborhood, items]) => ({
      neighborhood,
      count: items.length,
      stickers: items,
    }));
  }, [stickers]);

  const TYPE_FILTERS: { id: 'all' | AnimalType | 'favorites'; label: string }[] = [
    { id: 'all', label: 'All Animals' },
    { id: 'cat', label: 'Cats' },
    { id: 'dog', label: 'Dogs' },
    { id: 'bunny', label: 'Bunnies' },
    { id: 'favorites', label: 'Favorites' },
  ];

  const DATE_FILTERS: { id: 'all' | 'today' | 'week'; label: string }[] = [
    { id: 'all', label: 'All Dates' },
    { id: 'week', label: 'This Week' },
    { id: 'today', label: 'Recent (48h)' },
  ];

  // Dynamic coordinates mapped around visual zones
  const getPinPosition = useCallback((index: number, total: number) => {
    const angle = (index / Math.max(total, 1)) * Math.PI * 1.5 + 0.4;
    const rX = width * 0.36;
    const rY = MAP_HEIGHT * 0.28;
    const centerX = width * 0.5;
    const centerY = MAP_HEIGHT * 0.45;

    return {
      left: Math.max(20, Math.min(centerX + Math.cos(angle) * rX - 22, width - 64)),
      top: Math.max(40, Math.min(centerY + Math.sin(angle) * rY - 22, MAP_HEIGHT - 70)),
    };
  }, []);

  // Sync activePinSticker with current filter results
  React.useEffect(() => {
    if (activePinSticker && !filteredStickers.some((s) => s.id === activePinSticker.id)) {
      setActivePinSticker(filteredStickers[0] || null);
    } else if (!activePinSticker && filteredStickers.length > 0) {
      setActivePinSticker(filteredStickers[0]);
    }
  }, [filteredStickers, activePinSticker]);

  const handleSelectPin = useCallback((stk: Sticker) => {
    hapticFeedback.light();
    setActivePinSticker(stk);
  }, []);

  const handleResetFilters = () => {
    hapticFeedback.light();
    setSelectedType('all');
    setSelectedDateFilter('all');
    setSelectedCluster(null);
  };

  const handleAddToBoardFromMap = () => {
    if (!activePinSticker) return;
    hapticFeedback.medium();
    if (activeBoardId) {
      addStickerToBoard(activeBoardId, activePinSticker.id);
      setActiveTab('board');
    }
  };

  const handleOpenDetailFromMap = () => {
    if (!activePinSticker) return;
    hapticFeedback.light();
    setSelectedSticker(activePinSticker);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#0C0A09' : '#FAF8F5',
        },
      ]}
    >
      <Header
        title="Sighting Map"
        subtitle={`${filteredStickers.length} animal friends mapped nearby`}
      />

      {/* Filter Row: Animal Types & Date Toggle */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => {
                hapticFeedback.selection();
                setSelectedType(f.id);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedType === f.id
                    ? colors.primary
                    : isDarkMode
                    ? colors.surfaceElevated
                    : colors.surface,
                  borderColor: selectedType === f.id ? colors.primary : colors.border,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: selectedType === f.id ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: selectedType === f.id ? '700' : '500',
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}

          {/* Date Filter Pills */}
          {DATE_FILTERS.map((df) => (
            <Pressable
              key={df.id}
              onPress={() => {
                hapticFeedback.selection();
                setSelectedDateFilter(df.id);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedDateFilter === df.id
                    ? colors.secondary
                    : isDarkMode
                    ? colors.surfaceElevated
                    : colors.surface,
                  borderColor: selectedDateFilter === df.id ? colors.secondary : colors.border,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: selectedDateFilter === df.id ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: selectedDateFilter === df.id ? '700' : '500',
                  },
                ]}
              >
                {df.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Neighborhood Clusters Bar */}
      <View style={styles.clusterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clusterScroll}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setSelectedCluster(null);
            }}
            style={[
              styles.clusterChip,
              selectedCluster === null && {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: selectedCluster === null ? colors.primary : colors.textMuted,
                  fontWeight: selectedCluster === null ? '700' : '500',
                },
              ]}
            >
              All Clusters ({stickers.length})
            </Text>
          </Pressable>

          {clusters.map((c) => {
            const isSelected = selectedCluster === c.neighborhood;
            return (
              <Pressable
                key={c.neighborhood}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedCluster(isSelected ? null : c.neighborhood);
                  if (c.stickers.length > 0) setActivePinSticker(c.stickers[0]);
                }}
                style={[
                  styles.clusterChip,
                  isSelected && {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {c.neighborhood} ({c.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Interactive Stylized Map View */}
      <View style={styles.mapCanvas}>
        {/* Background Stylized Map Grid & Roads (Memoized Static Vectors) */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Parks / Green Zones */}
          <Path
            d={`M0 60 Q ${width * 0.3} 120, ${width * 0.6} 80 T ${width} 140 V 220 H 0 Z`}
            fill={isDarkMode ? '#13211B' : '#ECFDF5'}
          />
          <Path
            d={`M 50 ${MAP_HEIGHT - 100} Q ${width * 0.4} ${MAP_HEIGHT - 60}, ${width} ${MAP_HEIGHT - 120} V ${MAP_HEIGHT} H 50 Z`}
            fill={isDarkMode ? '#1A1815' : '#F5EFEB'}
          />

          {/* Grid Roads */}
          <Line x1="0" y1="120" x2={width} y2="120" stroke={isDarkMode ? '#292524' : '#E7E2DA'} strokeWidth="12" />
          <Line x1="0" y1="260" x2={width} y2="260" stroke={isDarkMode ? '#292524' : '#E7E2DA'} strokeWidth="16" />
          <Line x1={width * 0.32} y1="0" x2={width * 0.32} y2={MAP_HEIGHT} stroke={isDarkMode ? '#292524' : '#E7E2DA'} strokeWidth="14" />
          <Line x1={width * 0.72} y1="0" x2={width * 0.72} y2={MAP_HEIGHT} stroke={isDarkMode ? '#292524' : '#E7E2DA'} strokeWidth="10" />

          {/* Sighting Area Radii */}
          <Circle cx={width * 0.5} cy={MAP_HEIGHT * 0.45} r="140" fill="none" stroke="rgba(217, 119, 6, 0.1)" strokeWidth="2" strokeDasharray="6 6" />
          <Circle cx={width * 0.5} cy={MAP_HEIGHT * 0.45} r="80" fill="none" stroke="rgba(217, 119, 6, 0.15)" strokeWidth="2" strokeDasharray="4 4" />
        </Svg>

        {/* Animal Markers Pins (Memoized for 120 FPS) */}
        {filteredStickers.map((stk, idx) => {
          const isCurrent = activePinSticker?.id === stk.id;
          const pos = getPinPosition(idx, filteredStickers.length);

          return (
            <MapPinMarker
              key={stk.id}
              sticker={stk}
              isCurrent={isCurrent}
              position={pos}
              colors={colors}
              onPress={() => handleSelectPin(stk)}
            />
          );
        })}

        {/* Empty Filter Notification */}
        {filteredStickers.length === 0 && (
          <View style={styles.emptyMapOverlay}>
            <View
              style={[
                styles.emptyMapBadge,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.borderSubtle,
                },
                shadows.popover,
              ]}
            >
              <Text style={[typography.headingSmall, { color: colors.textPrimary }]}>
                No Sighted Companions
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
                No mapped pets match this active filter.
              </Text>
              <Pressable
                onPress={handleResetFilters}
                style={[styles.resetFilterBtn, { backgroundColor: colors.primaryMuted }]}
                hitSlop={6}
              >
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  Reset All Filters
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Re-center Button */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            if (filteredStickers.length > 0) setActivePinSticker(filteredStickers[0]);
          }}
          style={[
            styles.recenterBtn,
            {
              backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
              borderColor: colors.borderSubtle,
            },
            shadows.soft,
          ]}
          hitSlop={8}
        >
          <Navigation size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* Selected Sighting Popover Bottom Card */}
      {activePinSticker && (
        <View style={styles.cardSection}>
          <View
            style={[
              styles.sightingCard,
              {
                backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                borderColor: colors.borderSubtle,
              },
              shadows.card,
            ]}
          >
            <Pressable onPress={handleOpenDetailFromMap} style={styles.cardImageFrame}>
              <Image
                source={{ uri: activePinSticker.imageUri }}
                style={styles.cardImage}
                contentFit="contain"
              />
              <StickerAccessoryLayer accessories={activePinSticker.accessories} containerSize={64} />
            </Pressable>

            <Pressable onPress={handleOpenDetailFromMap} style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={[typography.headingSmall, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activePinSticker.name}
                </Text>
                {activePinSticker.isFavorite && (
                  <Heart size={16} color={colors.secondary} fill={colors.secondary} />
                )}
              </View>

              <View style={styles.locationRow}>
                <MapPin size={13} color={colors.primary} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
                  {activePinSticker.location.addressName || activePinSticker.location.neighborhood || 'Neighborhood'}
                </Text>
              </View>

              <View style={styles.badgeRow}>
                <Badge
                  label={activePinSticker.animalType.toUpperCase()}
                  variant={activePinSticker.animalType === 'cat' ? 'amber' : 'clay'}
                />
                {activePinSticker.breed && (
                  <Badge label={activePinSticker.breed} variant="neutral" />
                )}
              </View>
            </Pressable>

            <View style={styles.cardActions}>
              <Pressable
                onPress={handleAddToBoardFromMap}
                style={[styles.addBtnSmall, { backgroundColor: colors.primary }]}
                hitSlop={6}
              >
                <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
              <Pressable
                onPress={handleOpenDetailFromMap}
                style={[
                  styles.addBtnSmall,
                  {
                    backgroundColor: isDarkMode ? colors.surfaceMuted : colors.surfaceMuted,
                    marginTop: 6,
                  },
                ]}
                hitSlop={6}
              >
                <ExternalLink size={14} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    paddingVertical: 6,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  clusterRow: {
    paddingVertical: 4,
  },
  clusterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  clusterChip: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E2DA',
  },
  mapCanvas: {
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  pinMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 54,
  },
  pinBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pinImage: {
    width: '90%',
    height: '90%',
  },
  pinDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 2,
  },
  recenterBtn: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  cardSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sightingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
  },
  cardImageFrame: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cardActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMapOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyMapBadge: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 320,
  },
  resetFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
  },
});
