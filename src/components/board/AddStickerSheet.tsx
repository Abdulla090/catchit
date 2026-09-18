import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { Sticker } from '../../types';
import { X, Sparkles } from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';
import { StickerAccessoryLayer } from '../common/StickerAccessoryLayer';

interface AddStickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (stickerId: string) => void;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 24) / 3;

export const AddStickerSheet: React.FC<AddStickerSheetProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  const insets = useSafeAreaInsets();
  const { stickers, isDarkMode } = useAppStore();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDarkMode ? '#1C1917' : '#FFFFFF',
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
            shadows.popover,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={[typography.headingMedium, { color: colors.textPrimary, marginLeft: 8 }]}>
                Drop a Sticker
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticFeedback.light();
                onClose();
              }}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: 16 }]}>
            Tap any sticker to place it onto your active canvas
          </Text>

          {/* Grid of Available Stickers */}
          <FlatList
            data={stickers}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  hapticFeedback.medium();
                  onSelectSticker(item.id);
                  onClose();
                }}
                style={[
                  styles.stickerCard,
                  {
                    backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={{ width: '78%', height: '78%', position: 'relative' }}>
                  <Image
                    source={{ uri: item.imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                  <StickerAccessoryLayer
                    accessories={item.accessories}
                    containerSize={ITEM_SIZE * 0.78}
                  />
                </View>

                <Text
                  style={[
                    typography.caption,
                    styles.stickerName,
                    { color: colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyView}>
                <Text style={[typography.bodyMedium, { color: colors.textMuted }]}>
                  No stickers captured yet. Tap the PawCut camera to snap one!
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    maxHeight: '65%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE + 24,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  stickerThumb: {
    width: '78%',
    height: '78%',
  },
  stickerName: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
  },
  emptyView: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
