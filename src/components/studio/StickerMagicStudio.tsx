import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { AnimalType, Sticker, StickerBorderStyle, StickerAccessory, StickerAccessoryType, BrushPoint } from '../../types';
import {
  processAnimalBackgroundRemoval,
  BackgroundRemovalProgress,
} from '../../services/backgroundRemoval';
import { ProcessingScan } from './ProcessingScan';
import { PeelingSticker } from './PeelingSticker';
import { BrushRefineCanvas } from './BrushRefineCanvas';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  PawIcon,
  SparklesIcon,
  CrownIcon,
  SunglassesIcon,
  FishboneIcon,
  AngelHaloIcon,
  HeartStickerIcon,
  RibbonBowIcon,
} from '../common/PawIcons';
import {
  X,
  Sliders,
  Paintbrush,
  Check,
  Plus,
  Share2,
  Heart,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const BORDER_COLORS = ['#FFFFFF', '#FEF3C7', '#D1FAE5', '#FFEDD5', '#292524'];
const BORDER_WIDTHS = [0, 4, 6, 10, 14];

const ACCESSORY_PRESETS: { type: StickerAccessoryType; label: string; defaultX: number; defaultY: number }[] = [
  { type: 'crown', label: 'Crown', defaultX: 50, defaultY: 16 },
  { type: 'halo', label: 'Halo', defaultX: 50, defaultY: 10 },
  { type: 'sunglasses', label: 'Glasses', defaultX: 50, defaultY: 40 },
  { type: 'fishbone', label: 'Fishbone', defaultX: 26, defaultY: 65 },
  { type: 'heart', label: 'Heart', defaultX: 74, defaultY: 26 },
  { type: 'bow', label: 'Bow', defaultX: 50, defaultY: 76 },
  { type: 'sparkles', label: 'Sparkles', defaultX: 76, defaultY: 60 },
];

const STICKER_EFFECTS: { id: StickerBorderStyle['effect']; label: string }[] = [
  { id: 'clean', label: 'Classic Die-Cut' },
  { id: 'holo', label: 'Holographic' },
  { id: 'sparkles', label: 'Glitter Shimmer' },
  { id: 'vintage', label: 'Vintage Stamp' },
];

const ANIMAL_TYPES: { id: AnimalType; label: string }[] = [
  { id: 'cat', label: 'Cat' },
  { id: 'dog', label: 'Dog' },
  { id: 'bunny', label: 'Bunny' },
  { id: 'bird', label: 'Bird' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'other', label: 'Other' },
];

const PRESET_TAGS = ['Chonky', 'Friendly', 'Sleepy', 'Playful', 'Fluffy', 'Stray Hero', 'Purr Machine'];

const STATUS_OPTIONS: { id: NonNullable<Sticker['rescueStatus']>; label: string }[] = [
  { id: 'community_resident', label: 'Community Resident' },
  { id: 'friendly_stray', label: 'Friendly Stray' },
  { id: 'beloved_pet', label: 'Beloved Pet' },
  { id: 'rescued', label: 'Rescued Hero' },
  { id: 'needs_treat', label: 'Needs Treats' },
];

export const StickerMagicStudio: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    capturedPhotoUri,
    setCapturedPhotoUri,
    addSticker,
    addStickerToBoard,
    activeBoardId,
    setActiveTab,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  // Processing state
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState<BackgroundRemovalProgress>({
    step: 'scanning',
    percentage: 15,
    message: 'Analyzing fur contours & pet silhouette...',
  });
  const [cutoutUri, setCutoutUri] = useState<string>('');

  // Sticker Styling State
  const [borderStyle, setBorderStyle] = useState<StickerBorderStyle>({
    width: 6,
    color: '#FFFFFF',
    shadow: true,
    glow: true,
    effect: 'clean',
  });

  // Stickers-on-stickers Accessories State
  const [accessories, setAccessories] = useState<StickerAccessory[]>([]);

  // Brush Refinement Points State
  const [brushPoints, setBrushPoints] = useState<BrushPoint[]>([]);

  // Pet Details State
  const [name, setName] = useState('');
  const [animalType, setAnimalType] = useState<AnimalType>('cat');
  const [breed, setBreed] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Friendly']);
  const [status, setStatus] = useState<Sticker['rescueStatus']>('community_resident');

  // Brush refinement modal
  const [showBrushModal, setShowBrushModal] = useState(false);


  useEffect(() => {
    if (!capturedPhotoUri) return;

    let isMounted = true;
    setIsProcessing(true);

    processAnimalBackgroundRemoval(
      capturedPhotoUri,
      (p) => {
        if (isMounted) setProgress(p);
      },
      borderStyle
    )
      .then((res) => {
        if (isMounted) {
          setCutoutUri(res.stickerUri);
          setIsProcessing(false);
          hapticFeedback.peelComplete();
        }
      })
      .catch((err) => {
        console.warn('Subject segmentation error:', err);
        if (isMounted) {
          setCutoutUri(capturedPhotoUri);
          setIsProcessing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [capturedPhotoUri]);

  if (!capturedPhotoUri) return null;

  const handleToggleTag = (tag: string) => {
    hapticFeedback.selection();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleToggleAccessory = (preset: typeof ACCESSORY_PRESETS[0]) => {
    hapticFeedback.selection();
    setAccessories((prev) => {
      const exists = prev.find((a) => a.type === preset.type);
      if (exists) {
        return prev.filter((a) => a.type !== preset.type);
      }
      return [
        ...prev,
        {
          id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: preset.type,
          xPercent: preset.defaultX,
          yPercent: preset.defaultY,
          scale: 1.0,
          rotation: 0,
        },
      ];
    });
  };

  const handleSaveSticker = (placeOnBoard = false) => {
    hapticFeedback.heavy();
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      name: name.trim() || 'Stray Friend',
      animalType,
      breed: breed.trim() || undefined,
      notes: notes.trim() || undefined,
      personality: selectedTags.join(' • '),
      tags: selectedTags,
      isFavorite: true,
      imageUri: cutoutUri || capturedPhotoUri,
      originalUri: capturedPhotoUri,
      borderStyle,
      location: {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.03,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.03,
        neighborhood: 'Sunset & Market',
        city: 'San Francisco',
        addressName: 'Sighted near garden alley',
      },
      createdAt: Date.now(),
      rescueStatus: status,
      accessories: accessories.length > 0 ? accessories : undefined,
      brushPoints: brushPoints.length > 0 ? brushPoints : undefined,
    };

    addSticker(newSticker);

    if (placeOnBoard && activeBoardId) {
      addStickerToBoard(activeBoardId, newSticker.id);
      setActiveTab('board');
    } else {
      setActiveTab('stickers');
    }

    setCapturedPhotoUri(null);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#0C0A09' : '#FAF8F5',
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            setCapturedPhotoUri(null);
          }}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <X size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.titleBox}>
          <Text style={[typography.headingSmall, { color: colors.textPrimary }]}>
            Sticker Magic Studio
          </Text>
          <Text style={[typography.caption, { color: colors.primary }]}>
            {isProcessing ? 'Segmenting Animal...' : 'Die-Cut Ready'}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowBrushModal(true)}
          style={[styles.closeBtn, isProcessing && { opacity: 0.3 }]}
          disabled={isProcessing}
          hitSlop={8}
        >
          <Paintbrush size={19} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 32, 50) }}
      >
        {/* Stage 1: Animated Scanning Beam vs Stage 2: Peeling Sticker */}
        {isProcessing ? (
          <ProcessingScan progress={progress} />
        ) : (
          <View>
            <PeelingSticker
              imageUri={cutoutUri || capturedPhotoUri}
              borderStyle={borderStyle}
              accessories={accessories}
            />
            <Text style={[typography.caption, styles.tapHint, { color: colors.textMuted }]}>
              Tap sticker to re-peel with specular sheen
            </Text>
          </View>
        )}


        {!isProcessing && (
          <View style={styles.controlsSection}>
            {/* Border Width Control */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Sticker Die-Cut Border
              </Text>
              <View style={styles.choiceRow}>
                {BORDER_WIDTHS.map((bw) => (
                  <Pressable
                    key={bw}
                    onPress={() => {
                      hapticFeedback.selection();
                      setBorderStyle((prev) => ({ ...prev, width: bw }));
                    }}
                    style={[
                      styles.choicePill,
                      borderStyle.width === bw && {
                        backgroundColor: colors.primaryMuted,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: borderStyle.width === bw ? colors.primary : colors.textSecondary,
                          fontWeight: borderStyle.width === bw ? '700' : '500',
                        },
                      ]}
                    >
                      {bw === 0 ? 'No Rim' : `${bw}px`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Border Color Swatches */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Border Accent Color
              </Text>
              <View style={styles.swatchRow}>
                {BORDER_COLORS.map((col) => (
                  <Pressable
                    key={col}
                    onPress={() => {
                      hapticFeedback.selection();
                      setBorderStyle((prev) => ({ ...prev, color: col }));
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: col },
                      borderStyle.color === col && {
                        borderWidth: 3,
                        borderColor: colors.primary,
                        transform: [{ scale: 1.15 }],
                      },
                      shadows.soft,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Animal Category Chips */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Animal Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {ANIMAL_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    onPress={() => {
                      hapticFeedback.selection();
                      setAnimalType(type.id);
                    }}
                    style={[
                      styles.animalChip,
                      animalType === type.id && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.button,
                        {
                          color: animalType === type.id ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Pet Name & Moniker */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Animal Name or Moniker
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Barnaby the Ginger Tabby"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Breed or Appearance Details */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Breed or Distinguishing Marks
              </Text>
              <TextInput
                value={breed}
                onChangeText={setBreed}
                placeholder="e.g. Tuxedo Cat, Fluffy Tail, Calico"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Sighting Story & Memory Notes */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Sighting Story & Memory
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Purring warmly near the bakery flower pots..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                style={[
                  styles.inputMultiline,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* Personality Tags */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Personality & Sighting Traits
              </Text>
              <View style={styles.tagsWrap}>
                {PRESET_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => handleToggleTag(tag)}
                      style={[
                        styles.tagBadge,
                        isSelected && {
                          backgroundColor: colors.secondaryMuted,
                          borderColor: colors.secondary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? colors.secondary : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Stickers-on-stickers Accessories */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Layer Accessories (Stickers-on-Stickers)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {ACCESSORY_PRESETS.map((acc) => {
                  const isEquipped = accessories.some((a) => a.type === acc.type);
                  return (
                    <Pressable
                      key={acc.type}
                      onPress={() => handleToggleAccessory(acc)}
                      style={[
                        styles.accessoryChip,
                        isEquipped && {
                          backgroundColor: colors.primaryMuted,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isEquipped ? colors.primary : colors.textSecondary,
                            fontWeight: isEquipped ? '700' : '500',
                          },
                        ]}
                      >
                        {acc.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Community & Rescue Status */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Community & Rescue Status
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {STATUS_OPTIONS.map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      hapticFeedback.selection();
                      setStatus(st.id);
                    }}
                    style={[
                      styles.accessoryChip,
                      status === st.id && {
                        backgroundColor: colors.accentMuted,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: status === st.id ? colors.accent : colors.textSecondary,
                          fontWeight: status === st.id ? '700' : '500',
                        },
                      ]}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Sticker Finish Effects */}
            <View style={styles.controlBlock}>
              <Text style={[typography.headingSmall, styles.blockLabel, { color: colors.textPrimary }]}>
                Sticker Finish & Sheen
              </Text>
              <View style={styles.choiceRow}>
                {STICKER_EFFECTS.map((eff) => (
                  <Pressable
                    key={eff.id}
                    onPress={() => {
                      hapticFeedback.selection();
                      setBorderStyle((prev) => ({ ...prev, effect: eff.id }));
                    }}
                    style={[
                      styles.choicePill,
                      borderStyle.effect === eff.id && {
                        backgroundColor: colors.secondaryMuted,
                        borderColor: colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: borderStyle.effect === eff.id ? colors.secondary : colors.textSecondary,
                          fontWeight: borderStyle.effect === eff.id ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {eff.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Final Action CTAs */}
            <View style={styles.actionButtons}>
              <Button
                title="Place on Board"
                variant="primary"
                size="lg"
                onPress={() => handleSaveSticker(true)}
                icon={<Plus size={18} color="#FFFFFF" />}
              />
              <Button
                title="Save to Sticker Pack"
                variant="secondary"
                size="md"
                onPress={() => handleSaveSticker(false)}
                icon={<Heart size={16} color={colors.primary} />}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Manual Brush Refinement Modal */}
      <Modal visible={showBrushModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF' },
              shadows.popover,
            ]}
          >
            <BrushRefineCanvas
              imageUri={cutoutUri || capturedPhotoUri}
              initialPoints={brushPoints}
              onApply={(refined, pts) => {
                setCutoutUri(refined);
                setBrushPoints(pts);
                setShowBrushModal(false);
              }}
              onCancel={() => setShowBrushModal(false)}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120, 113, 108, 0.12)',
  },
  titleBox: {
    alignItems: 'center',
  },
  tapHint: {
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  controlsSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  controlBlock: {
    marginBottom: 20,
  },
  blockLabel: {
    marginBottom: 10,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choicePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E2DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E7E2DA',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  animalChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E2DA',
    marginRight: 8,
  },
  accessoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E2DA',
    marginRight: 8,
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E2DA',
  },
  actionButtons: {
    gap: 12,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 28,
    padding: 16,
  },
});
