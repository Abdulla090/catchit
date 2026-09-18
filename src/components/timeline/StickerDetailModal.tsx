import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Alert,
  Share,
  TextInput,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { Sticker, Board } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StickerAccessoryLayer } from '../common/StickerAccessoryLayer';
import { SparkleStarIcon, CheckSealIcon } from '../common/PawIcons';
import {
  X,
  Heart,
  Share2,
  Download,
  Trash2,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Edit3,
  Check,
} from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const DETAIL_IMAGE_SIZE = Math.min(width * 0.65, 260);

export const StickerDetailModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    selectedSticker,
    setSelectedSticker,
    toggleFavorite,
    deleteSticker,
    updateSticker,
    addStickerToBoard,
    boards,
    activeBoardId,
    setActiveTab,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  if (!selectedSticker) return null;

  const handleShare = async () => {
    hapticFeedback.light();
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(selectedSticker.imageUri);
      } else {
        await Share.share({
          message: `Check out ${selectedSticker.name} - a cute ${selectedSticker.breed || selectedSticker.animalType} sticker on PawCut!`,
          url: selectedSticker.imageUri,
        });
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleSaveToGallery = async () => {
    hapticFeedback.medium();
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        let localUri = selectedSticker.imageUri;

        // Remote HTTP/HTTPS URIs must be downloaded locally before saving to MediaLibrary
        if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
          try {
            const FileSystem = require('expo-file-system/legacy');
            const ext = localUri.includes('.png') ? 'png' : 'jpg';
            const targetPath = `${FileSystem.cacheDirectory || ''}sticker-${selectedSticker.id}-${Date.now()}.${ext}`;
            const downloadResult = await FileSystem.downloadAsync(localUri, targetPath);
            localUri = downloadResult.uri;
          } catch (dlErr) {
            console.warn('Sticker image download failed:', dlErr);
          }
        }

        await MediaLibrary.saveToLibraryAsync(localUri);
        hapticFeedback.peelComplete();
        Alert.alert('Saved to Camera Roll!', `${selectedSticker.name} is now saved in your photo library.`);
      } else {
        Alert.alert('Permission needed', 'Please allow photo library access to export stickers.');
      }
    } catch (err) {
      console.warn('Save to library error:', err);
      Alert.alert('Save Failed', 'Could not save sticker to photo library.');
    }
  };

  const handleDelete = () => {
    hapticFeedback.warning();
    Alert.alert(
      `Delete ${selectedSticker.name}?`,
      'This will remove the sticker from your collection and all boards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSticker(selectedSticker.id);
            setSelectedSticker(null);
          },
        },
      ]
    );
  };

  const handlePlaceOnBoard = () => {
    hapticFeedback.medium();
    if (boards.length > 1) {
      setShowBoardPicker(true);
    } else if (activeBoardId) {
      addStickerToBoard(activeBoardId, selectedSticker.id);
      setSelectedSticker(null);
      setActiveTab('board');
    }
  };

  const handleConfirmBoardSelection = (boardId: string) => {
    hapticFeedback.medium();
    addStickerToBoard(boardId, selectedSticker.id);
    setShowBoardPicker(false);
    setSelectedSticker(null);
    setActiveTab('board');
  };

  const handleSaveNotes = () => {
    hapticFeedback.light();
    updateSticker(selectedSticker.id, { notes: notesText.trim() });
    setIsEditingNotes(false);
  };

  const formattedDate = new Date(selectedSticker.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isHolo = selectedSticker.borderStyle.effect === 'holo';
  const isSparkles = selectedSticker.borderStyle.effect === 'sparkles';
  const isVintage = selectedSticker.borderStyle.effect === 'vintage';

  return (
    <Modal visible={!!selectedSticker} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom + 20, 32),
            },
            shadows.popover,
          ]}
        >
          {/* Top Row */}
          <View style={styles.topRow}>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                toggleFavorite(selectedSticker.id);
              }}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Heart
                size={22}
                color={selectedSticker.isFavorite ? colors.secondary : colors.textSecondary}
                fill={selectedSticker.isFavorite ? colors.secondary : 'none'}
              />
            </Pressable>

            <View style={styles.topPillBadge}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                {selectedSticker.rescueStatus ? selectedSticker.rescueStatus.replace('_', ' ').toUpperCase() : 'COMMUNITY PET'}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setSelectedSticker(null);
              }}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Centered High-Res Sticker Preview */}
          <View style={styles.previewArea}>
            <View
              style={[
                styles.dieCutPreview,
                {
                  borderWidth: selectedSticker.borderStyle.width || 0,
                  borderColor: selectedSticker.borderStyle.color,
                  backgroundColor: 'transparent',
                  borderStyle: isVintage ? 'dashed' : 'solid',
                },
                shadows.stickerFloating,
              ]}
            >
              <Image
                source={{ uri: selectedSticker.imageUri }}
                style={styles.stickerImage}
                contentFit="contain"
                priority="high"
              />

              {/* Layered Sticker Accessories */}
              <StickerAccessoryLayer
                accessories={selectedSticker.accessories}
                containerSize={DETAIL_IMAGE_SIZE}
              />

              {/* Sparkle Particles if Sparkle effect is active */}
              {isSparkles && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <View style={[styles.sparkleItem, { top: '15%', left: '16%' }]}>
                    <SparkleStarIcon size={16} color="#F59E0B" />
                  </View>
                  <View style={[styles.sparkleItem, { top: '24%', right: '16%' }]}>
                    <SparkleStarIcon size={18} color="#FEF3C7" />
                  </View>
                  <View style={[styles.sparkleItem, { bottom: '22%', left: '20%' }]}>
                    <SparkleStarIcon size={14} color="#D97706" />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Name & Details */}
          <View style={styles.infoSection}>
            <Text style={[typography.displayMedium, { color: colors.textPrimary, textAlign: 'center' }]}>
              {selectedSticker.name}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={14} color={colors.primary} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                  {formattedDate}
                </Text>
              </View>

              {selectedSticker.location.addressName && (
                <View style={styles.metaItem}>
                  <MapPin size={14} color={colors.secondary} />
                  <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
                    {selectedSticker.location.neighborhood || selectedSticker.location.addressName}
                  </Text>
                </View>
              )}
            </View>

            {/* Badges */}
            <View style={styles.badgeWrap}>
              <Badge
                label={selectedSticker.animalType.toUpperCase()}
                variant={selectedSticker.animalType === 'cat' ? 'amber' : 'clay'}
              />
              {selectedSticker.breed && (
                <Badge label={selectedSticker.breed} variant="neutral" />
              )}
              {selectedSticker.tags.map((t) => (
                <Badge key={t} label={t} variant="sage" />
              ))}
            </View>

            {/* Sighting Notes (View / Edit) */}
            {isEditingNotes ? (
              <View style={styles.editNotesBox}>
                <TextInput
                  value={notesText}
                  onChangeText={setNotesText}
                  placeholder="Add your sighting story or memory..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  multiline
                  autoFocus
                />
                <Button
                  title="Save Note"
                  variant="primary"
                  size="sm"
                  onPress={handleSaveNotes}
                  icon={<Check size={14} color="#FFFFFF" />}
                  style={{ alignSelf: 'flex-end', marginTop: 6 }}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setNotesText(selectedSticker.notes || '');
                  setIsEditingNotes(true);
                }}
                style={styles.notesContainer}
                hitSlop={6}
              >
                <Text style={[typography.bodySmall, styles.notesText, { color: colors.textSecondary }]}>
                  {selectedSticker.notes ? `"${selectedSticker.notes}"` : 'Tap to add sighting notes...'}
                </Text>
                <Edit3 size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
              </Pressable>
            )}
          </View>

          {/* Action CTAs */}
          <View style={styles.ctaRow}>
            <Button
              title="Place on Board"
              variant="primary"
              size="md"
              onPress={handlePlaceOnBoard}
              icon={<Layers size={18} color="#FFFFFF" />}
              style={{ flex: 1.5 }}
            />
            <Pressable
              onPress={handleShare}
              style={[
                styles.actionSquare,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={8}
            >
              <Share2 size={19} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={handleSaveToGallery}
              style={[
                styles.actionSquare,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={8}
            >
              <Download size={19} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[
                styles.actionSquare,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={8}
            >
              <Trash2 size={19} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Board Selector Modal (when user has multiple boards) */}
      <Modal visible={showBoardPicker} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.pickerCard,
              { backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF' },
              shadows.popover,
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
                Choose Board
              </Text>
              <Pressable onPress={() => setShowBoardPicker(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
              Select which themed board you want to place {selectedSticker.name} onto:
            </Text>

            <ScrollView style={{ maxHeight: 240 }}>
              {boards.map((b) => (
                <Pressable
                  key={b.id}
                  onPress={() => handleConfirmBoardSelection(b.id)}
                  style={[
                    styles.boardChoicePill,
                    {
                      backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                      borderColor: b.id === activeBoardId ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View>
                    <Text style={[typography.button, { color: colors.textPrimary }]}>{b.title}</Text>
                    <Text style={[typography.caption, { color: colors.textMuted }]}>
                      {b.stickers.length} stickers • {b.pattern}
                    </Text>
                  </View>
                  <Layers size={18} color={b.id === activeBoardId ? colors.primary : colors.textSecondary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topPillBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  dieCutPreview: {
    width: DETAIL_IMAGE_SIZE,
    height: DETAIL_IMAGE_SIZE,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stickerImage: {
    width: '92%',
    height: '92%',
  },
  sparkleItem: {
    position: 'absolute',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  infoSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  notesText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  editNotesBox: {
    width: '100%',
    marginTop: 6,
  },
  notesInput: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  actionSquare: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    borderRadius: 24,
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boardChoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
});
