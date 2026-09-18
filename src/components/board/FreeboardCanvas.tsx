import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Share,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Pattern, Rect, Line } from 'react-native-svg';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { BoardStickerItem } from './BoardStickerItem';
import { BoardSwitcher } from './BoardSwitcher';
import { AddStickerSheet } from './AddStickerSheet';
import { PawIcon, StickerPackIcon } from '../common/PawIcons';
import { Button } from '../common/Button';
import { Header } from '../common/Header';
import {
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Camera,
  Layers,
  Palette,
  X,
  Check,
  MoreVertical,
  Copy,
  Edit3,
} from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';
import { BoardPattern, BoardSticker } from '../../types';

const { width } = Dimensions.get('window');

const PATTERNS: { id: BoardPattern; label: string; bgLight: string; bgDark: string }[] = [
  { id: 'dots', label: 'Warm Dots', bgLight: '#FAF8F5', bgDark: '#0C0A09' },
  { id: 'cork', label: 'Corkboard', bgLight: '#F4EFEA', bgDark: '#1A1816' },
  { id: 'grid', label: 'Graph Paper', bgLight: '#F8F6F2', bgDark: '#121110' },
  { id: 'notebook', label: 'Notebook', bgLight: '#FFFDF9', bgDark: '#141312' },
  { id: 'clean', label: 'Minimalist', bgLight: '#FAF8F5', bgDark: '#0C0A09' },
];

export const FreeboardCanvas: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    boards,
    stickers,
    activeBoardId,
    addStickerToBoard,
    updateBoardSticker,
    removeBoardSticker,
    duplicateBoardSticker,
    bringStickerToFront,
    sendStickerToBack,
    updateBoard,
    clearBoard,
    duplicateBoard,
    deleteBoard,
    setSelectedSticker,
    openOnboarding,
    setActiveTab,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [patternModalVisible, setPatternModalVisible] = useState(false);
  const [boardMenuVisible, setBoardMenuVisible] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');

  const currentBoard = boards.find((b) => b.id === activeBoardId) || boards[0] || {
    id: 'default',
    title: 'My Freeboard',
    theme: 'neighborhood',
    pattern: 'dots',
    backgroundColor: '#FAF8F5',
    stickers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const handleShareBoard = async () => {
    hapticFeedback.light();
    try {
      await Share.share({
        message: `Check out my "${currentBoard.title}" pet sticker board on PawCut! Featuring ${currentBoard.stickers.length} neighborhood companions.`,
      });
    } catch {
      // Ignored
    }
  };

  const handleClearBoard = () => {
    hapticFeedback.warning();
    Alert.alert(
      'Clear Board?',
      'Are you sure you want to remove all stickers from this board? Your stickers remain in your collection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearBoard(currentBoard.id);
          },
        },
      ]
    );
  };

  const handleDuplicateCurrentBoard = () => {
    hapticFeedback.medium();
    duplicateBoard(currentBoard.id);
    setBoardMenuVisible(false);
  };

  const handleDeleteCurrentBoard = () => {
    hapticFeedback.warning();
    Alert.alert(
      `Delete "${currentBoard.title}"?`,
      'Are you sure you want to delete this board? Any placed sticker arrangements on this board will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Board',
          style: 'destructive',
          onPress: () => {
            deleteBoard(currentBoard.id);
            setBoardMenuVisible(false);
          },
        },
      ]
    );
  };

  const handleStartRename = () => {
    setRenameText(currentBoard.title);
    setIsRenaming(true);
  };

  const handleSaveRename = () => {
    if (renameText.trim()) {
      hapticFeedback.light();
      updateBoard(currentBoard.id, { title: renameText.trim() });
    }
    setIsRenaming(false);
    setBoardMenuVisible(false);
  };

  // 120 FPS Worklet & Memoized Handler Callbacks
  const handleUpdateSticker = useCallback(
    (boardStickerId: string, updates: Partial<BoardSticker>) => {
      updateBoardSticker(currentBoard.id, boardStickerId, updates);
    },
    [currentBoard.id, updateBoardSticker]
  );

  const handleBringToFront = useCallback(
    (boardStickerId: string) => {
      bringStickerToFront(currentBoard.id, boardStickerId);
    },
    [currentBoard.id, bringStickerToFront]
  );

  const handleSendToBack = useCallback(
    (boardStickerId: string) => {
      sendStickerToBack(currentBoard.id, boardStickerId);
    },
    [currentBoard.id, sendStickerToBack]
  );

  const handleDuplicate = useCallback(
    (boardStickerId: string) => {
      duplicateBoardSticker(currentBoard.id, boardStickerId);
    },
    [currentBoard.id, duplicateBoardSticker]
  );

  const handleDelete = useCallback(
    (boardStickerId: string) => {
      removeBoardSticker(currentBoard.id, boardStickerId);
    },
    [currentBoard.id, removeBoardSticker]
  );

  const handleInspect = useCallback(
    (stickerId: string) => {
      const found = stickers.find((s) => s.id === stickerId);
      if (found) setSelectedSticker(found);
    },
    [stickers, setSelectedSticker]
  );

  const handleSelectPattern = (pattern: BoardPattern) => {
    hapticFeedback.selection();
    const config = PATTERNS.find((p) => p.id === pattern);
    updateBoard(currentBoard.id, {
      pattern,
      backgroundColor: isDarkMode ? config?.bgDark : config?.bgLight,
    });
    setPatternModalVisible(false);
  };

  // Canvas Pattern Texture Renderer
  const renderPatternTexture = () => {
    const pattern = currentBoard.pattern || 'dots';

    if (pattern === 'dots') {
      return (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Pattern id="dot-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
            <Circle
              cx="14"
              cy="14"
              r="1.5"
              fill={isDarkMode ? 'rgba(255, 255, 255, 0.09)' : 'rgba(28, 25, 23, 0.08)'}
            />
          </Pattern>
          <Rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </Svg>
      );
    }

    if (pattern === 'grid') {
      return (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Pattern id="grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
            <Line
              x1="0"
              y1="32"
              x2="32"
              y2="32"
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(28, 25, 23, 0.06)'}
              strokeWidth="1"
            />
            <Line
              x1="32"
              y1="0"
              x2="32"
              y2="32"
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(28, 25, 23, 0.06)'}
              strokeWidth="1"
            />
          </Pattern>
          <Rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </Svg>
      );
    }

    if (pattern === 'notebook') {
      return (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Pattern id="notebook-pattern" width="100" height="28" patternUnits="userSpaceOnUse">
            <Line
              x1="0"
              y1="28"
              x2="100"
              y2="28"
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(217, 119, 6, 0.12)'}
              strokeWidth="1"
            />
          </Pattern>
          <Rect width="100%" height="100%" fill="url(#notebook-pattern)" />
          {/* Notebook Red Margin Line */}
          <Line
            x1="48"
            y1="0"
            x2="48"
            y2="100%"
            stroke="rgba(194, 65, 12, 0.22)"
            strokeWidth="1.5"
          />
        </Svg>
      );
    }

    if (pattern === 'cork') {
      return (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          <Pattern id="cork-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
            <Circle cx="8" cy="8" r="1.2" fill="rgba(180, 83, 9, 0.12)" />
            <Circle cx="24" cy="18" r="1.6" fill="rgba(120, 53, 15, 0.1)" />
            <Circle cx="12" cy="28" r="1.4" fill="rgba(180, 83, 9, 0.14)" />
          </Pattern>
          <Rect width="100%" height="100%" fill="url(#cork-pattern)" />
        </Svg>
      );
    }

    return null; // clean pattern
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? '#0C0A09'
            : currentBoard.backgroundColor || '#FAF8F5',
        },
      ]}
    >
      {/* Top Header */}
      <Header
        title="PawCut Boards"
        subtitle={`${currentBoard.title} • ${currentBoard.stickers.length} stickers`}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setPatternModalVisible(true);
              }}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Palette size={16} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                openOnboarding();
              }}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Sparkles size={16} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={handleShareBoard}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Share2 size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                setBoardMenuVisible(true);
              }}
              style={[
                styles.headerBtn,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <MoreVertical size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        }
      />

      {/* Board Switcher Pill Row */}
      <BoardSwitcher />

      {/* Freeform Canvas Area */}
      <View style={styles.canvasWrapper}>
        {/* Background Texture Renderer */}
        {renderPatternTexture()}

        {/* Empty State when no stickers on board */}
        {currentBoard.stickers.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyPawCircle,
                {
                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : colors.primaryMuted,
                },
              ]}
            >
              <PawIcon size={52} color={colors.primary} />
            </View>
            <Text style={[typography.headingMedium, styles.emptyTitle, { color: colors.textPrimary }]}>
              Empty Canvas
            </Text>
            <Text style={[typography.bodyMedium, styles.emptySub, { color: colors.textSecondary }]}>
              Drag, rotate, and layer cute animal stickers here to create your neighborhood story!
            </Text>
            <View style={styles.emptyButtonRow}>
              <Button
                title="Add Sticker"
                variant="primary"
                size="md"
                onPress={() => setAddSheetVisible(true)}
                icon={<Plus size={18} color="#FFFFFF" />}
              />
              <Button
                title="Snap a Pet"
                variant="secondary"
                size="md"
                onPress={() => setActiveTab('camera')}
                icon={<Camera size={18} color={colors.primary} />}
              />
            </View>
          </View>
        ) : (
          // Render All Placed Board Stickers with 120 FPS Worklet & Memoization
          currentBoard.stickers.map((bs) => {
            const stickerObj = stickers.find((s) => s.id === bs.stickerId);
            if (!stickerObj) return null;

            return (
              <BoardStickerItem
                key={bs.id}
                boardSticker={bs}
                sticker={stickerObj}
                onUpdate={(updates) => handleUpdateSticker(bs.id, updates)}
                onBringToFront={() => handleBringToFront(bs.id)}
                onSendToBack={() => handleSendToBack(bs.id)}
                onDuplicate={() => handleDuplicate(bs.id)}
                onDelete={() => handleDelete(bs.id)}
                onInspect={() => handleInspect(stickerObj.id)}
              />
            );
          })
        )}

        {/* Floating Quick Action Buttons on Canvas */}
        <View style={[styles.floatingBar, { bottom: Math.max(insets.bottom + 85, 95) }]}>
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              setAddSheetVisible(true);
            }}
            style={[
              styles.floatingAddBtn,
              { backgroundColor: colors.primary },
              shadows.sticker,
            ]}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>

          {currentBoard.stickers.length > 0 && (
            <Pressable
              onPress={handleClearBoard}
              style={[
                styles.floatingActionBtn,
                {
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                  borderColor: colors.borderSubtle,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Trash2 size={17} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Add Sticker Sheet Drawer */}
      <AddStickerSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onSelectSticker={(stickerId) => {
          const rx = 90 + (Math.random() - 0.5) * 80;
          const ry = 170 + (Math.random() - 0.5) * 80;
          addStickerToBoard(currentBoard.id, stickerId, rx, ry);
        }}
      />

      {/* Canvas Pattern Switcher Modal */}
      <Modal visible={patternModalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF' },
              shadows.popover,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
                Canvas Texture
              </Text>
              <Pressable onPress={() => setPatternModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.patternGrid}>
              {PATTERNS.map((p) => {
                const isSelected = (currentBoard.pattern || 'dots') === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSelectPattern(p.id)}
                    style={[
                      styles.patternOption,
                      {
                        backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                      isSelected && { borderWidth: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        typography.button,
                        { color: isSelected ? colors.primary : colors.textPrimary },
                      ]}
                    >
                      {p.label}
                    </Text>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Board Options & Management Modal */}
      <Modal visible={boardMenuVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF' },
              shadows.popover,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
                Board Settings
              </Text>
              <Pressable
                onPress={() => {
                  setIsRenaming(false);
                  setBoardMenuVisible(false);
                }}
                hitSlop={8}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {isRenaming ? (
              <View style={{ marginVertical: 12 }}>
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
                  Rename Board Title
                </Text>
                <TextInput
                  value={renameText}
                  onChangeText={setRenameText}
                  placeholder="Enter board title"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.renameInput,
                    {
                      backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => setIsRenaming(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save Title"
                    variant="primary"
                    size="sm"
                    onPress={handleSaveRename}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.boardOptionsList}>
                <Pressable
                  onPress={handleStartRename}
                  style={[styles.boardOptionRow, { borderColor: colors.borderSubtle }]}
                  hitSlop={6}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Edit3 size={17} color={colors.primary} />
                    <Text style={[typography.button, { color: colors.textPrimary }]}>
                      Rename Board
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                    {currentBoard.title}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDuplicateCurrentBoard}
                  style={[styles.boardOptionRow, { borderColor: colors.borderSubtle }]}
                  hitSlop={6}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Copy size={17} color={colors.primary} />
                    <Text style={[typography.button, { color: colors.textPrimary }]}>
                      Duplicate Board
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    Clone stickers
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setBoardMenuVisible(false);
                    setPatternModalVisible(true);
                  }}
                  style={[styles.boardOptionRow, { borderColor: colors.borderSubtle }]}
                  hitSlop={6}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Palette size={17} color={colors.primary} />
                    <Text style={[typography.button, { color: colors.textPrimary }]}>
                      Canvas Texture
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {currentBoard.pattern || 'dots'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setBoardMenuVisible(false);
                    handleClearBoard();
                  }}
                  style={[styles.boardOptionRow, { borderColor: colors.borderSubtle }]}
                  hitSlop={6}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Trash2 size={17} color={colors.textMuted} />
                    <Text style={[typography.button, { color: colors.textSecondary }]}>
                      Clear All Stickers
                    </Text>
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted }]}>
                    {currentBoard.stickers.length} items
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDeleteCurrentBoard}
                  style={[
                    styles.boardOptionRow,
                    { borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
                  ]}
                  hitSlop={6}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Trash2 size={17} color="#EF4444" />
                    <Text style={[typography.button, { color: '#EF4444' }]}>
                      Delete Board
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 60,
  },
  emptyPawCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySub: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingBar: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    gap: 12,
    zIndex: 90,
  },
  floatingAddBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  modalCard: {
    borderRadius: 26,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  patternGrid: {
    gap: 10,
  },
  patternOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  renameInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  boardOptionsList: {
    gap: 8,
    marginVertical: 4,
  },
  boardOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
});
