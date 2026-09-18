import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { BoardTheme, BoardPattern } from '../../types';
import { Button } from '../common/Button';
import { Plus, X, Layers } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

export const BoardSwitcher: React.FC = () => {
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<BoardTheme>('neighborhood');
  const [selectedPattern, setSelectedPattern] = useState<BoardPattern>('dots');

  const THEMES: { id: BoardTheme; label: string }[] = [
    { id: 'neighborhood', label: 'Neighborhood' },
    { id: 'pets', label: 'My Pets' },
    { id: 'street', label: 'Street Friends' },
    { id: 'rescue', label: 'Rescue Stories' },
  ];

  const PATTERNS: { id: BoardPattern; label: string }[] = [
    { id: 'dots', label: 'Warm Dots' },
    { id: 'cork', label: 'Corkboard' },
    { id: 'grid', label: 'Graph Paper' },
    { id: 'clean', label: 'Minimalist' },
  ];

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    hapticFeedback.medium();
    createBoard({
      title: newTitle.trim(),
      theme: selectedTheme,
      pattern: selectedPattern,
      backgroundColor: selectedPattern === 'cork' ? '#F4EFEA' : '#FAF8F5',
      description: `Collection created on ${new Date().toLocaleDateString()}`,
    });
    setNewTitle('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {boards.map((b) => {
          const isActive = b.id === activeBoardId;
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                hapticFeedback.light();
                setActiveBoardId(b.id);
              }}
              style={[
                styles.boardPill,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : isDarkMode
                    ? colors.surfaceElevated
                    : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
                shadows.soft,
              ]}
              hitSlop={6}
            >
              <Text
                style={[
                  typography.button,
                  {
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {b.title}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.25)'
                      : colors.surfaceMuted,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: isActive ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {b.stickers.length}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Create New Board Button */}
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            setModalVisible(true);
          }}
          style={[
            styles.addBoardPill,
            {
              borderColor: colors.primary,
              backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : colors.primaryMuted,
            },
          ]}
          hitSlop={6}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={[typography.button, { color: colors.primary, marginLeft: 4 }]}>
            New Board
          </Text>
        </Pressable>
      </ScrollView>

      {/* Create Board Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF',
              },
              shadows.popover,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.headingMedium, { color: colors.textPrimary }]}>
                Create Themed Board
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 16, marginBottom: 6 }]}>
              Board Title
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Sunny Alley Friends"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              autoFocus
            />

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 14, marginBottom: 8 }]}>
              Theme Category
            </Text>
            <View style={styles.themeGrid}>
              {THEMES.map((th) => (
                <Pressable
                  key={th.id}
                  onPress={() => {
                    hapticFeedback.selection();
                    setSelectedTheme(th.id);
                  }}
                  style={[
                    styles.themeBtn,
                    selectedTheme === th.id && {
                      backgroundColor: colors.primaryMuted,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selectedTheme === th.id ? colors.primary : colors.textSecondary,
                        fontWeight: selectedTheme === th.id ? '700' : '500',
                      },
                    ]}
                  >
                    {th.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 14, marginBottom: 8 }]}>
              Canvas Texture
            </Text>
            <View style={styles.themeGrid}>
              {PATTERNS.map((pt) => (
                <Pressable
                  key={pt.id}
                  onPress={() => {
                    hapticFeedback.selection();
                    setSelectedPattern(pt.id);
                  }}
                  style={[
                    styles.themeBtn,
                    selectedPattern === pt.id && {
                      backgroundColor: colors.secondaryMuted,
                      borderColor: colors.secondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selectedPattern === pt.id ? colors.secondary : colors.textSecondary,
                        fontWeight: selectedPattern === pt.id ? '700' : '500',
                      },
                    ]}
                  >
                    {pt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Create Board"
                variant="primary"
                onPress={handleCreate}
                disabled={!newTitle.trim()}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    zIndex: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  boardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addBoardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 26,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E2DA',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});
