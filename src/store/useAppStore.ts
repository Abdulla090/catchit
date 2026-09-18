import { create } from 'zustand';
import { Sticker, Board, BoardSticker, ActiveTab, FilterState } from '../types';
import { INITIAL_STICKERS, INITIAL_BOARDS } from '../utils/sampleData';

interface AppStoreState {
  // Navigation & Screen States
  activeTab: ActiveTab;
  capturedPhotoUri: string | null;
  selectedSticker: Sticker | null;
  hasCompletedOnboarding: boolean;

  // Data Collections
  stickers: Sticker[];
  boards: Board[];
  activeBoardId: string;

  // Search & Filtering
  filter: FilterState;

  // Preferences
  isDarkMode: boolean;
  silentShutter: boolean;
  hapticsEnabled: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setCapturedPhotoUri: (uri: string | null) => void;
  setSelectedSticker: (sticker: Sticker | null) => void;
  completeOnboarding: () => void;

  // Sticker Actions
  addSticker: (sticker: Sticker) => void;
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  deleteSticker: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // Board Actions
  setActiveBoardId: (id: string) => void;
  createBoard: (board: Pick<Board, 'title' | 'theme' | 'pattern' | 'backgroundColor' | 'description'>) => string;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  clearBoard: (boardId: string) => void;
  duplicateBoard: (boardId: string) => string;
  addStickerToBoard: (boardId: string, stickerId: string, x?: number, y?: number) => void;
  updateBoardSticker: (boardId: string, boardStickerId: string, updates: Partial<BoardSticker>) => void;
  removeBoardSticker: (boardId: string, boardStickerId: string) => void;
  bringStickerToFront: (boardId: string, boardStickerId: string) => void;
  sendStickerToBack: (boardId: string, boardStickerId: string) => void;
  duplicateBoardSticker: (boardId: string, boardStickerId: string) => void;
  openOnboarding: () => void;

  // Filter Actions
  setFilter: (updates: Partial<FilterState>) => void;
  resetFilter: () => void;

  // Settings Actions
  toggleDarkMode: () => void;
  toggleSilentShutter: () => void;
  toggleHaptics: () => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  activeTab: 'board',
  capturedPhotoUri: null,
  selectedSticker: null,
  hasCompletedOnboarding: false,

  stickers: INITIAL_STICKERS,
  boards: INITIAL_BOARDS,
  activeBoardId: INITIAL_BOARDS[0].id,

  filter: {
    category: 'all',
    searchQuery: '',
    timeRange: 'all',
  },

  isDarkMode: false,
  silentShutter: true,
  hapticsEnabled: true,

  setActiveTab: (activeTab) => set({ activeTab }),
  setCapturedPhotoUri: (capturedPhotoUri) => set({ capturedPhotoUri }),
  setSelectedSticker: (selectedSticker) => set({ selectedSticker }),
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),

  addSticker: (newSticker) =>
    set((state) => ({
      stickers: [newSticker, ...state.stickers],
    })),

  updateSticker: (id, updates) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  deleteSticker: (id) =>
    set((state) => ({
      stickers: state.stickers.filter((s) => s.id !== id),
      boards: state.boards.map((b) => ({
        ...b,
        stickers: b.stickers.filter((bs) => bs.stickerId !== id),
      })),
    })),

  toggleFavorite: (id) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)),
    })),

  setActiveBoardId: (activeBoardId) => set({ activeBoardId }),

  createBoard: ({ title, theme, pattern, backgroundColor, description }) => {
    const newId = `board-${Date.now()}`;
    const newBoard: Board = {
      id: newId,
      title,
      theme,
      pattern,
      backgroundColor,
      description,
      stickers: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      boards: [...state.boards, newBoard],
      activeBoardId: newId,
    }));
    return newId;
  },

  updateBoard: (id, updates) =>
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: Date.now() } : b
      ),
    })),

  deleteBoard: (id) =>
    set((state) => {
      let remaining = state.boards.filter((b) => b.id !== id);
      if (remaining.length === 0) {
        // Prevent fatal crash if all boards are deleted: ensure a default board always exists
        remaining = [
          {
            id: `board-${Date.now()}`,
            title: 'My Freeboard',
            theme: 'neighborhood',
            pattern: 'dots',
            backgroundColor: '#FAF8F5',
            description: 'A clean canvas for your neighborhood sticker adventures',
            stickers: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      }
      const fallbackId = remaining.some((b) => b.id === state.activeBoardId)
        ? state.activeBoardId
        : remaining[0].id;
      return {
        boards: remaining,
        activeBoardId: fallbackId,
      };
    }),

  clearBoard: (boardId) =>
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              stickers: [],
              updatedAt: Date.now(),
            }
          : b
      ),
    })),

  duplicateBoard: (boardId) => {
    const state = get();
    const source = state.boards.find((b) => b.id === boardId);
    if (!source) return '';
    const newId = `board-${Date.now()}`;
    const newBoard: Board = {
      ...source,
      id: newId,
      title: `${source.title} (Copy)`,
      stickers: source.stickers.map((s) => ({
        ...s,
        id: `bs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({
      boards: [...s.boards, newBoard],
      activeBoardId: newId,
    }));
    return newId;
  },

  addStickerToBoard: (boardId, stickerId, x = 140, y = 200) =>
    set((state) => {
      const targetBoard = state.boards.find((b) => b.id === boardId);
      if (!targetBoard) return state;

      const highestZ = targetBoard.stickers.reduce((max, s) => Math.max(max, s.zIndex), 0);
      const newBoardSticker: BoardSticker = {
        id: `bs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        stickerId,
        x,
        y,
        scale: 1.0,
        rotation: (Math.random() - 0.5) * 16, // subtle organic tilt
        zIndex: highestZ + 1,
      };

      return {
        boards: state.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                stickers: [...b.stickers, newBoardSticker],
                updatedAt: Date.now(),
              }
            : b
        ),
      };
    }),

  updateBoardSticker: (boardId, boardStickerId, updates) =>
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              stickers: b.stickers.map((bs) => (bs.id === boardStickerId ? { ...bs, ...updates } : bs)),
              updatedAt: Date.now(),
            }
          : b
      ),
    })),

  removeBoardSticker: (boardId, boardStickerId) =>
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              stickers: b.stickers.filter((bs) => bs.id !== boardStickerId),
              updatedAt: Date.now(),
            }
          : b
      ),
    })),

  bringStickerToFront: (boardId, boardStickerId) =>
    set((state) => {
      const targetBoard = state.boards.find((b) => b.id === boardId);
      if (!targetBoard) return state;

      const highestZ = targetBoard.stickers.reduce((max, s) => Math.max(max, s.zIndex), 0);
      return {
        boards: state.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                stickers: b.stickers.map((bs) =>
                  bs.id === boardStickerId ? { ...bs, zIndex: highestZ + 1 } : bs
                ),
                updatedAt: Date.now(),
              }
            : b
        ),
      };
    }),

  sendStickerToBack: (boardId, boardStickerId) =>
    set((state) => {
      const targetBoard = state.boards.find((b) => b.id === boardId);
      if (!targetBoard) return state;

      const lowestZ = targetBoard.stickers.reduce(
        (min, s) => Math.min(min, s.zIndex),
        targetBoard.stickers[0]?.zIndex ?? 0
      );
      return {
        boards: state.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                stickers: b.stickers.map((bs) =>
                  bs.id === boardStickerId ? { ...bs, zIndex: lowestZ - 1 } : bs
                ),
                updatedAt: Date.now(),
              }
            : b
        ),
      };
    }),

  duplicateBoardSticker: (boardId, boardStickerId) =>
    set((state) => {
      const targetBoard = state.boards.find((b) => b.id === boardId);
      if (!targetBoard) return state;

      const source = targetBoard.stickers.find((s) => s.id === boardStickerId);
      if (!source) return state;

      const highestZ = targetBoard.stickers.reduce((max, s) => Math.max(max, s.zIndex), 0);
      const duplicate: BoardSticker = {
        ...source,
        id: `bs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        x: source.x + 28,
        y: source.y + 28,
        zIndex: highestZ + 1,
      };

      return {
        boards: state.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                stickers: [...b.stickers, duplicate],
                updatedAt: Date.now(),
              }
            : b
        ),
      };
    }),

  openOnboarding: () => set({ hasCompletedOnboarding: false }),

  setFilter: (updates) =>
    set((state) => ({
      filter: { ...state.filter, ...updates },
    })),

  resetFilter: () =>
    set({
      filter: { category: 'all', searchQuery: '', timeRange: 'all' },
    }),

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSilentShutter: () => set((state) => ({ silentShutter: !state.silentShutter })),
  toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
}));
