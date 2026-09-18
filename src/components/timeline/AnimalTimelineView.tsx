import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  Dimensions,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { lightColors, darkColors } from '../../theme/colors';
import { typography, shadows } from '../../theme';
import { Sticker, AnimalType, TimelineViewMode } from '../../types';
import { Header } from '../common/Header';
import { Badge } from '../common/Badge';
import { StickerAccessoryLayer } from '../common/StickerAccessoryLayer';
import { exportStickerPack } from '../../services/stickerPackExport';
import {
  PawIcon,
  SparklesIcon,
  CatHeadIcon,
  DogHeadIcon,
  BunnyHeadIcon,
  StickerPackIcon,
} from '../common/PawIcons';
import {
  Search,
  Heart,
  Share2,
  Calendar,
  MapPin,
  Camera,
  Layers,
  LayoutGrid,
  Clock,
  Award,
  Plus,
  X,
} from 'lucide-react-native';
import { hapticFeedback } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 40 - 14) / 2;

// --- Subcomponents with React.memo for 120 FPS List Performance ---

interface GridCardProps {
  item: Sticker;
  isDarkMode: boolean;
  colors: typeof lightColors;
  onPress: () => void;
  onAddToBoard: () => void;
}

const StickerGridCard = React.memo<GridCardProps>(
  ({ item, isDarkMode, colors, onPress, onAddToBoard }) => {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
            borderColor: colors.borderSubtle,
          },
          shadows.card,
        ]}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <Badge
            label={item.animalType.toUpperCase()}
            variant={item.animalType === 'cat' ? 'amber' : item.animalType === 'dog' ? 'clay' : 'sage'}
          />
          {item.isFavorite && (
            <Heart size={14} color={colors.secondary} fill={colors.secondary} />
          )}
        </View>

        {/* Die-Cut Thumbnail with Accessories */}
        <View style={styles.imageBox}>
          <View
            style={[
              styles.stickerRim,
              {
                borderWidth: item.borderStyle.width ? 3 : 0,
                borderColor: item.borderStyle.color,
                backgroundColor: 'transparent',
              },
              shadows.soft,
            ]}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.stickerImg}
              contentFit="contain"
              priority="normal"
            />
            <StickerAccessoryLayer
              accessories={item.accessories}
              containerSize={(GRID_ITEM_SIZE - 24) * 0.9}
            />
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={[typography.headingSmall, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {item.location.addressName || item.breed || 'Neighborhood Pet'}
          </Text>
        </View>
      </Pressable>
    );
  }
);

interface TimelineCardProps {
  item: Sticker;
  isLast: boolean;
  isDarkMode: boolean;
  colors: typeof lightColors;
  onPress: () => void;
  onAddToBoard: () => void;
}

const TimelineStoryCard = React.memo<TimelineCardProps>(
  ({ item, isLast, isDarkMode, colors, onPress, onAddToBoard }) => {
    return (
      <View style={styles.timelineItemWrapper}>
        {/* Connector Col */}
        <View style={styles.timelineConnectorCol}>
          <View style={[styles.timelineNode, { backgroundColor: colors.primary }]} />
          {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
        </View>

        {/* Story Card */}
        <Pressable
          onPress={onPress}
          style={[
            styles.timelineCard,
            {
              backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
              borderColor: colors.borderSubtle,
            },
            shadows.card,
          ]}
        >
          <View style={styles.timelineCardLeft}>
            <View
              style={[
                styles.timelineStickerBox,
                {
                  borderWidth: item.borderStyle.width ? 2.5 : 0,
                  borderColor: item.borderStyle.color,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <Image source={{ uri: item.imageUri }} style={styles.timelineStickerImg} contentFit="contain" />
              <StickerAccessoryLayer accessories={item.accessories} containerSize={74} />
            </View>
          </View>

          <View style={styles.timelineCardRight}>
            <View style={styles.timelineCardTop}>
              <Text style={[typography.headingSmall, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Badge
                label={item.animalType.toUpperCase()}
                variant={item.animalType === 'cat' ? 'amber' : 'clay'}
              />
            </View>

            <View style={styles.locationMetaRow}>
              <MapPin size={12} color={colors.secondary} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 3 }]} numberOfLines={1}>
                {item.location.addressName || item.location.neighborhood || 'Local Sighting'}
              </Text>
            </View>

            {item.notes && (
              <Text style={[typography.bodySmall, styles.notesQuote, { color: colors.textSecondary }]} numberOfLines={2}>
                "{item.notes}"
              </Text>
            )}

            <View style={styles.timelineActionRow}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Pressable
                onPress={onAddToBoard}
                style={[styles.addBtnMini, { backgroundColor: colors.primaryMuted }]}
                hitSlop={6}
              >
                <Plus size={13} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>Board</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </View>
    );
  }
);

export const AnimalTimelineView: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    activeTab,
    stickers,
    setSelectedSticker,
    addStickerToBoard,
    activeBoardId,
    setActiveTab,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | AnimalType | 'favorites' | 'strays'>('all');
  const [viewMode, setViewMode] = useState<TimelineViewMode>(
    activeTab === 'timeline' ? 'timeline' : 'grid'
  );

  // Synchronize viewMode with navigation activeTab
  useEffect(() => {
    if (activeTab === 'timeline') {
      setViewMode('timeline');
    } else if (activeTab === 'stickers') {
      setViewMode('grid');
    }
  }, [activeTab]);

  const filtered = useMemo(() => {
    return stickers.filter((s) => {
      if (activeCategory === 'favorites' && !s.isFavorite) return false;
      if (activeCategory === 'strays' && s.rescueStatus !== 'friendly_stray' && s.rescueStatus !== 'rescued') {
        return false;
      }
      if (
        activeCategory !== 'all' &&
        activeCategory !== 'favorites' &&
        activeCategory !== 'strays' &&
        s.animalType !== activeCategory
      ) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchBreed = s.breed?.toLowerCase().includes(q);
        const matchTags = s.tags.some((t) => t.toLowerCase().includes(q));
        const matchNotes = s.notes?.toLowerCase().includes(q);
        if (!matchName && !matchBreed && !matchTags && !matchNotes) return false;
      }
      return true;
    });
  }, [stickers, activeCategory, search]);

  // Group stickers by date for Timeline mode
  const groupedTimeline = useMemo(() => {
    const now = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;

    const groups: { [key: string]: Sticker[] } = {
      'Recent Sightings (Past 48h)': [],
      'This Week': [],
      'Earlier Adventures': [],
    };

    filtered.forEach((s) => {
      const diffDays = (now - s.createdAt) / dayMs;
      if (diffDays <= 2) {
        groups['Recent Sightings (Past 48h)'].push(s);
      } else if (diffDays <= 7) {
        groups['This Week'].push(s);
      } else {
        groups['Earlier Adventures'].push(s);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filtered]);

  // Full Sticker Pack Export using native file-system & sharing service
  const handleExportStickerPack = async () => {
    hapticFeedback.medium();
    await exportStickerPack(stickers, 'PawCut Community Sticker Pack');
  };

  const handleAddToActiveBoard = useCallback(
    (stickerId: string) => {
      hapticFeedback.medium();
      if (activeBoardId) {
        addStickerToBoard(activeBoardId, stickerId);
        setActiveTab('board');
      }
    },
    [activeBoardId, addStickerToBoard, setActiveTab]
  );

  const handleSelectSticker = useCallback(
    (item: Sticker) => {
      hapticFeedback.light();
      setSelectedSticker(item);
    },
    [setSelectedSticker]
  );

  const CATEGORIES: { id: 'all' | AnimalType | 'favorites' | 'strays'; label: string }[] = [
    { id: 'all', label: 'All Friends' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'cat', label: 'Cats' },
    { id: 'dog', label: 'Dogs' },
    { id: 'bunny', label: 'Bunnies' },
    { id: 'strays', label: 'Strays & Rescues' },
  ];

  // Render Grid Mode with 120 FPS virtualization
  const renderGridView = () => (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 14 }}
      contentContainerStyle={[
        styles.gridContent,
        { paddingBottom: Math.max(insets.bottom + 95, 115) },
      ]}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={6}
      windowSize={5}
      initialNumToRender={6}
      renderItem={({ item }) => (
        <StickerGridCard
          item={item}
          isDarkMode={isDarkMode}
          colors={colors}
          onPress={() => handleSelectSticker(item)}
          onAddToBoard={() => handleAddToActiveBoard(item.id)}
        />
      )}
      ListEmptyComponent={renderEmptyView}
    />
  );

  // Render Chronological Timeline Feed Mode
  const renderTimelineView = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.timelineContent,
        { paddingBottom: Math.max(insets.bottom + 95, 115) },
      ]}
    >
      {groupedTimeline.length === 0 ? (
        renderEmptyView()
      ) : (
        groupedTimeline.map(([groupTitle, items]) => (
          <View key={groupTitle} style={styles.timelineGroup}>
            <View style={styles.timelineHeaderRow}>
              <Clock size={16} color={colors.primary} />
              <Text style={[typography.headingSmall, styles.groupTitle, { color: colors.textPrimary }]}>
                {groupTitle}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {items.length} {items.length === 1 ? 'sighting' : 'sightings'}
              </Text>
            </View>

            {items.map((item, idx) => (
              <TimelineStoryCard
                key={item.id}
                item={item}
                isLast={idx === items.length - 1}
                isDarkMode={isDarkMode}
                colors={colors}
                onPress={() => handleSelectSticker(item)}
                onAddToBoard={() => handleAddToActiveBoard(item.id)}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );

  // Render Collections & Streak Mode
  const renderCalendarView = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const packs = [
      {
        id: 'pack-1',
        title: 'Mission Cats Squad',
        desc: 'Community cats spotted along Valencia and sunlit alleys',
        count: stickers.filter((s) => s.animalType === 'cat').length,
        total: 6,
      },
      {
        id: 'pack-2',
        title: 'Park Patrol Dogs',
        desc: 'Playful hounds and rescue pups of the neighborhood greens',
        count: stickers.filter((s) => s.animalType === 'dog').length,
        total: 5,
      },
      {
        id: 'pack-3',
        title: 'Sweet Strays & Rescues',
        desc: 'Special companions looking for forever homes and treats',
        count: stickers.filter((s) => s.isFavorite || s.rescueStatus === 'friendly_stray').length,
        total: 8,
      },
    ];

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.calendarContent,
          { paddingBottom: Math.max(insets.bottom + 95, 115) },
        ]}
      >
        {/* Weekly Sighting Streak Card */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
              borderColor: colors.borderSubtle,
            },
            shadows.card,
          ]}
        >
          <View style={styles.calendarCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Calendar size={17} color={colors.primary} />
              <Text style={[typography.headingSmall, { color: colors.textPrimary }]}>
                Weekly Sighting Streak
              </Text>
            </View>
            <Badge label={`${stickers.length} Spottings`} variant="amber" />
          </View>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
            Capture a stray or neighborhood pet daily to complete your community sticker pack!
          </Text>

          <View style={styles.weekStrip}>
            {days.map((d, i) => {
              const active = i % 2 === 0 || i === 4;
              return (
                <View key={d} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayDot,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceMuted,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {active && <PawIcon size={16} color="#FFFFFF" />}
                  </View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                    {d}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Themed Sighting Collections / Packs */}
        <View style={styles.packsSection}>
          <View style={styles.packsHeaderRow}>
            <Text style={[typography.headingSmall, { color: colors.textPrimary }]}>
              Sticker Packs & Sets
            </Text>
            <Pressable onPress={handleExportStickerPack} hitSlop={6}>
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                Export All
              </Text>
            </Pressable>
          </View>

          {packs.map((pk) => {
            const pct = Math.min(Math.round((pk.count / pk.total) * 100), 100);
            return (
              <View
                key={pk.id}
                style={[
                  styles.packCard,
                  {
                    backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                  shadows.card,
                ]}
              >
                <View style={styles.packTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.headingSmall, { color: colors.textPrimary }]}>
                      {pk.title}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                      {pk.desc}
                    </Text>
                  </View>
                  <View style={[styles.packBadge, { backgroundColor: colors.primaryMuted }]}>
                    <Award size={16} color={colors.primary} />
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${pct}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 8 }]}>
                    {pk.count}/{pk.total}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderEmptyView = () => (
    <View style={styles.emptyView}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: isDarkMode ? colors.surfaceElevated : colors.primaryMuted },
        ]}
      >
        <PawIcon size={38} color={colors.primary} />
      </View>
      <Text style={[typography.headingSmall, { color: colors.textPrimary, marginTop: 14 }]}>
        {search ? 'No matches found' : activeCategory === 'favorites' ? 'No favorites yet' : 'No stickers in this collection'}
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          { color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginHorizontal: 28 },
        ]}
      >
        {search
          ? `No animal friends match "${search}". Try checking the spelling or clear search.`
          : activeCategory === 'favorites'
          ? 'Tap the heart icon on any animal sticker to add them to your favorites list!'
          : 'Snap neighborhood pets or strays with the PawCut camera to grow your pack.'}
      </Text>
      {search && (
        <Pressable
          onPress={() => setSearch('')}
          style={[styles.clearSearchBtn, { backgroundColor: colors.primaryMuted }]}
        >
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            Clear Search Filter
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#0C0A09' : '#FAF8F5' },
      ]}
    >
      <Header
        title="PawCut Timeline"
        subtitle={`${filtered.length} stickers collected in total`}
        rightAction={
          <Pressable
            onPress={handleExportStickerPack}
            style={[
              styles.exportBtn,
              {
                backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                borderColor: colors.borderSubtle,
              },
              shadows.soft,
            ]}
            hitSlop={6}
          >
            <Share2 size={16} color={colors.primary} />
          </Pressable>
        }
      />

      {/* Segmented Mode: Grid | Timeline | Collections */}
      <View style={styles.segmentedRow}>
        <View
          style={[
            styles.segmentedContainer,
            {
              backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceMuted,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setViewMode('grid');
            }}
            style={[styles.segmentedTab, viewMode === 'grid' && { backgroundColor: colors.primary }]}
          >
            <LayoutGrid size={15} color={viewMode === 'grid' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                typography.caption,
                {
                  color: viewMode === 'grid' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: viewMode === 'grid' ? '700' : '500',
                  marginLeft: 4,
                },
              ]}
            >
              Grid
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setViewMode('timeline');
            }}
            style={[styles.segmentedTab, viewMode === 'timeline' && { backgroundColor: colors.primary }]}
          >
            <Clock size={15} color={viewMode === 'timeline' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                typography.caption,
                {
                  color: viewMode === 'timeline' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: viewMode === 'timeline' ? '700' : '500',
                  marginLeft: 4,
                },
              ]}
            >
              Timeline
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setViewMode('calendar');
            }}
            style={[styles.segmentedTab, viewMode === 'calendar' && { backgroundColor: colors.primary }]}
          >
            <Calendar size={15} color={viewMode === 'calendar' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                typography.caption,
                {
                  color: viewMode === 'calendar' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: viewMode === 'calendar' ? '700' : '500',
                  marginLeft: 4,
                },
              ]}
            >
              Collections
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search Bar & Category Scroll */}
      {viewMode !== 'calendar' && (
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surface,
                borderColor: colors.borderSubtle,
              },
              shadows.soft,
            ]}
          >
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by pet name, breed, or tag..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={6}>
                <X size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setActiveCategory(c.id);
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: activeCategory === c.id
                      ? colors.primary
                      : isDarkMode
                      ? colors.surfaceElevated
                      : colors.surface,
                    borderColor: activeCategory === c.id ? colors.primary : colors.border,
                  },
                  shadows.soft,
                ]}
                hitSlop={6}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: activeCategory === c.id ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: activeCategory === c.id ? '700' : '500',
                    },
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active Mode View Rendering */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'timeline' && renderTimelineView()}
      {viewMode === 'calendar' && renderCalendarView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  segmentedRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 3,
    borderWidth: 1,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 15,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  card: {
    width: GRID_ITEM_SIZE,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  imageBox: {
    width: GRID_ITEM_SIZE - 24,
    height: GRID_ITEM_SIZE - 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  stickerRim: {
    width: '90%',
    height: '90%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stickerImg: {
    width: '92%',
    height: '92%',
  },
  cardFooter: {
    width: '100%',
    marginTop: 8,
  },
  timelineContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  timelineGroup: {
    marginBottom: 20,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  groupTitle: {
    flex: 1,
  },
  timelineItemWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineConnectorCol: {
    width: 22,
    alignItems: 'center',
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    marginLeft: 6,
  },
  timelineCardLeft: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStickerBox: {
    width: 74,
    height: 74,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timelineStickerImg: {
    width: '90%',
    height: '90%',
  },
  timelineCardRight: {
    flex: 1,
    marginLeft: 12,
  },
  timelineCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notesQuote: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  timelineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  addBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calendarContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 18,
  },
  calendarCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  calendarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  dayCol: {
    alignItems: 'center',
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packsSection: {
    gap: 12,
  },
  packsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  packCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  packTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  packBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});
