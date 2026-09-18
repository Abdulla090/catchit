import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useAppStore } from '../src/store/useAppStore';
import { Sticker } from '../src/types';

describe('PawCut Store & Sticker Architecture Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { stickers, boards } = useAppStore.getState();
    useAppStore.setState({
      activeTab: 'board',
      capturedPhotoUri: null,
      selectedSticker: null,
    });
  });

  it('initializes with sample stickers and themed boards', () => {
    const state = useAppStore.getState();
    assert.ok(state.stickers.length >= 4, 'Should contain starter stickers');
    assert.ok(state.boards.length >= 2, 'Should contain starter boards');

    const firstSticker = state.stickers[0];
    assert.ok(firstSticker.id);
    assert.ok(firstSticker.name);
    assert.ok(firstSticker.imageUri);
    assert.ok(firstSticker.borderStyle.width > 0);
  });

  it('adds a new animal sticker to the collection', () => {
    const initialCount = useAppStore.getState().stickers.length;

    const newPet: Sticker = {
      id: 'test-cat-101',
      name: 'Oliver the Stray',
      animalType: 'cat',
      breed: 'Tuxedo Cat',
      tags: ['Friendly', 'Playful'],
      isFavorite: true,
      imageUri: 'file:///local/cache/cutout-oliver.png',
      originalUri: 'file:///local/cache/photo-oliver.jpg',
      borderStyle: {
        width: 6,
        color: '#FFFFFF',
        shadow: true,
        glow: true,
      },
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        addressName: 'Valencia & 18th',
      },
      createdAt: Date.now(),
      rescueStatus: 'friendly_stray',
    };

    useAppStore.getState().addSticker(newPet);

    const state = useAppStore.getState();
    assert.equal(state.stickers.length, initialCount + 1);
    assert.equal(state.stickers[0].id, 'test-cat-101');
    assert.equal(state.stickers[0].name, 'Oliver the Stray');
  });

  it('creates and switches to a new freeboard', () => {
    const initialBoardCount = useAppStore.getState().boards.length;

    const newBoardId = useAppStore.getState().createBoard({
      title: 'Alley Explorers',
      theme: 'street',
      pattern: 'cork',
      backgroundColor: '#F4EFEA',
      description: 'Stray cats around the courtyard',
    });

    const state = useAppStore.getState();
    assert.equal(state.boards.length, initialBoardCount + 1);
    assert.equal(state.activeBoardId, newBoardId);

    const createdBoard = state.boards.find((b) => b.id === newBoardId);
    assert.ok(createdBoard);
    assert.equal(createdBoard?.title, 'Alley Explorers');
    assert.equal(createdBoard?.stickers.length, 0);
  });

  it('places, repositions, and brings stickers to front on a board', () => {
    const state = useAppStore.getState();
    const board = state.boards[0];
    const sticker = state.stickers[0];

    const initialStickerCount = board.stickers.length;

    useAppStore.getState().addStickerToBoard(board.id, sticker.id, 150, 220);

    const updatedState = useAppStore.getState();
    const updatedBoard = updatedState.boards.find((b) => b.id === board.id)!;
    assert.equal(updatedBoard.stickers.length, initialStickerCount + 1);

    const placedSticker = updatedBoard.stickers[updatedBoard.stickers.length - 1];
    assert.equal(placedSticker.x, 150);
    assert.equal(placedSticker.y, 220);

    // Reposition with physics update
    useAppStore.getState().updateBoardSticker(board.id, placedSticker.id, {
      x: 180,
      y: 260,
      scale: 1.25,
      rotation: 12,
    });

    const movedBoard = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    const movedSticker = movedBoard.stickers.find((s) => s.id === placedSticker.id)!;
    assert.equal(movedSticker.x, 180);
    assert.equal(movedSticker.y, 260);
    assert.equal(movedSticker.scale, 1.25);
    assert.equal(movedSticker.rotation, 12);

    // Bring to front
    const maxZBefore = Math.max(...movedBoard.stickers.map((s) => s.zIndex));
    useAppStore.getState().bringStickerToFront(board.id, placedSticker.id);

    const reorderedBoard = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    const frontSticker = reorderedBoard.stickers.find((s) => s.id === placedSticker.id)!;
    assert.ok(frontSticker.zIndex > maxZBefore);
  });

  it('cascades sticker deletion across all boards', () => {
    const testStickerId = 'cascade-test-id';
    useAppStore.getState().addSticker({
      id: testStickerId,
      name: 'Shadow',
      animalType: 'cat',
      tags: ['Quiet'],
      isFavorite: false,
      imageUri: 'file:///shadow.png',
      originalUri: 'file:///shadow.jpg',
      borderStyle: { width: 4, color: '#FFFFFF', shadow: true, glow: false },
      location: { latitude: 37, longitude: -122 },
      createdAt: Date.now(),
    });

    const boardId = useAppStore.getState().boards[0].id;
    useAppStore.getState().addStickerToBoard(boardId, testStickerId, 50, 50);

    const stateBefore = useAppStore.getState();
    assert.ok(stateBefore.stickers.some((s) => s.id === testStickerId));
    assert.ok(
      stateBefore.boards.find((b) => b.id === boardId)!.stickers.some((s) => s.stickerId === testStickerId)
    );

    // Delete sticker
    useAppStore.getState().deleteSticker(testStickerId);

    const stateAfter = useAppStore.getState();
    assert.ok(!stateAfter.stickers.some((s) => s.id === testStickerId));
    assert.ok(
      !stateAfter.boards.find((b) => b.id === boardId)!.stickers.some((s) => s.stickerId === testStickerId)
    );
  });

  it('toggles favorites and theme modes', () => {
    const state = useAppStore.getState();
    const firstSticker = state.stickers[0];
    const initialFav = firstSticker.isFavorite;

    useAppStore.getState().toggleFavorite(firstSticker.id);
    assert.equal(useAppStore.getState().stickers.find((s) => s.id === firstSticker.id)?.isFavorite, !initialFav);

    const initialDark = state.isDarkMode;
    useAppStore.getState().toggleDarkMode();
    assert.equal(useAppStore.getState().isDarkMode, !initialDark);
  });

  it('duplicates an existing sticker on a freeboard', () => {
    const board = useAppStore.getState().boards[0];
    const sticker = useAppStore.getState().stickers[0];
    useAppStore.getState().addStickerToBoard(board.id, sticker.id, 100, 100);

    const boardBefore = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    const placedItem = boardBefore.stickers[boardBefore.stickers.length - 1];

    useAppStore.getState().duplicateBoardSticker(board.id, placedItem.id);

    const boardAfter = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    assert.equal(boardAfter.stickers.length, boardBefore.stickers.length + 1);

    const duplicatedItem = boardAfter.stickers[boardAfter.stickers.length - 1];
    assert.equal(duplicatedItem.stickerId, placedItem.stickerId);
    assert.equal(duplicatedItem.x, placedItem.x + 28);
    assert.equal(duplicatedItem.y, placedItem.y + 28);
    assert.ok(duplicatedItem.zIndex > placedItem.zIndex);
  });

  it('supports accessories (stickers-on-stickers) and brush refinements', () => {
    const stickerWithAccessories: Sticker = {
      id: 'test-cat-crown',
      name: 'King Barnaby',
      animalType: 'cat',
      tags: ['Royalty'],
      isFavorite: true,
      imageUri: 'file:///barnaby.png',
      originalUri: 'file:///barnaby.jpg',
      borderStyle: { width: 6, color: '#FFFFFF', shadow: true, glow: true, effect: 'holo' },
      location: { latitude: 37.77, longitude: -122.42, neighborhood: 'Mission' },
      createdAt: Date.now(),
      accessories: [
        { id: 'acc-1', type: 'crown', xPercent: 50, yPercent: 16, scale: 1.0, rotation: 0 },
        { id: 'acc-2', type: 'sunglasses', xPercent: 50, yPercent: 40, scale: 1.0, rotation: 0 },
      ],
      brushPoints: [
        { x: 50, y: 50, mode: 'erase', radius: 14 },
        { x: 80, y: 80, mode: 'restore', radius: 10 },
      ],
    };

    useAppStore.getState().addSticker(stickerWithAccessories);

    const state = useAppStore.getState();
    const retrieved = state.stickers.find((s) => s.id === 'test-cat-crown');
    assert.ok(retrieved);
    assert.equal(retrieved?.accessories?.length, 2);
    assert.equal(retrieved?.accessories?.[0].type, 'crown');
    assert.equal(retrieved?.brushPoints?.length, 2);
    assert.equal(retrieved?.borderStyle.effect, 'holo');
  });

  it('manages first-time onboarding lifecycle', () => {
    useAppStore.setState({ hasCompletedOnboarding: false });
    assert.equal(useAppStore.getState().hasCompletedOnboarding, false);

    useAppStore.getState().completeOnboarding();
    assert.equal(useAppStore.getState().hasCompletedOnboarding, true);

    useAppStore.getState().openOnboarding();
    assert.equal(useAppStore.getState().hasCompletedOnboarding, false);
  });

  it('updates board properties such as canvas pattern and title', () => {
    const board = useAppStore.getState().boards[0];
    useAppStore.getState().updateBoard(board.id, {
      title: 'Updated Sunlit Alley',
      pattern: 'grid',
    });

    const updated = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    assert.equal(updated.title, 'Updated Sunlit Alley');
    assert.equal(updated.pattern, 'grid');
  });

  it('sends sticker to back with lowest z-index', () => {
    const board = useAppStore.getState().boards[0];
    const sticker = useAppStore.getState().stickers[0];
    useAppStore.getState().addStickerToBoard(board.id, sticker.id, 50, 50);

    const boardWithStickers = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    const targetItem = boardWithStickers.stickers[boardWithStickers.stickers.length - 1];

    useAppStore.getState().sendStickerToBack(board.id, targetItem.id);

    const reorderedBoard = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    const backItem = reorderedBoard.stickers.find((s) => s.id === targetItem.id)!;
    const otherMinZ = Math.min(
      ...reorderedBoard.stickers.filter((s) => s.id !== targetItem.id).map((s) => s.zIndex)
    );
    assert.ok(backItem.zIndex <= otherMinZ);
  });

  it('clears all stickers from a board cleanly', () => {
    const board = useAppStore.getState().boards[0];
    const sticker = useAppStore.getState().stickers[0];
    useAppStore.getState().addStickerToBoard(board.id, sticker.id, 50, 50);

    useAppStore.getState().clearBoard(board.id);

    const clearedBoard = useAppStore.getState().boards.find((b) => b.id === board.id)!;
    assert.equal(clearedBoard.stickers.length, 0);
  });

  it('duplicates an entire freeboard with cloned stickers and unique IDs', () => {
    const board = useAppStore.getState().boards[0];
    const sticker = useAppStore.getState().stickers[0];
    useAppStore.getState().addStickerToBoard(board.id, sticker.id, 50, 50);

    const initialCount = useAppStore.getState().boards.length;
    const newBoardId = useAppStore.getState().duplicateBoard(board.id);

    const state = useAppStore.getState();
    assert.equal(state.boards.length, initialCount + 1);
    assert.equal(state.activeBoardId, newBoardId);

    const cloned = state.boards.find((b) => b.id === newBoardId)!;
    assert.ok(cloned.title.includes('(Copy)'));
    assert.equal(cloned.stickers.length, useAppStore.getState().boards.find((b) => b.id === board.id)!.stickers.length);
  });

  it('prevents zero-board crash by auto-seeding a clean starter board when the last board is deleted', () => {
    // Delete all existing boards one by one
    const boardIds = useAppStore.getState().boards.map((b) => b.id);
    for (const id of boardIds) {
      useAppStore.getState().deleteBoard(id);
    }

    const state = useAppStore.getState();
    assert.ok(state.boards.length >= 1, 'Should never allow 0 boards');
    assert.ok(state.activeBoardId, 'activeBoardId must point to a valid board');
    const active = state.boards.find((b) => b.id === state.activeBoardId);
    assert.ok(active, 'Active board must exist in boards list');
    assert.ok(active.title, 'Board must have a title');
    assert.ok(Array.isArray(active.stickers), 'Stickers array must exist');
  });

  it('guarantees strictly descending z-index layering when multiple stickers are sent to back', () => {
    const board = useAppStore.getState().boards[0];
    const s1 = useAppStore.getState().stickers[0];
    const s2 = useAppStore.getState().stickers[1];
    const s3 = useAppStore.getState().stickers[2];

    useAppStore.getState().addStickerToBoard(board.id, s1.id, 10, 10);
    useAppStore.getState().addStickerToBoard(board.id, s2.id, 20, 20);
    useAppStore.getState().addStickerToBoard(board.id, s3.id, 30, 30);

    const b = useAppStore.getState().boards.find((item) => item.id === board.id)!;
    const item1 = b.stickers[b.stickers.length - 3];
    const item2 = b.stickers[b.stickers.length - 2];
    const item3 = b.stickers[b.stickers.length - 1];

    // Send item1 to back
    useAppStore.getState().sendStickerToBack(board.id, item1.id);
    // Send item2 to back after item1
    useAppStore.getState().sendStickerToBack(board.id, item2.id);

    const updatedB = useAppStore.getState().boards.find((item) => item.id === board.id)!;
    const z1 = updatedB.stickers.find((s) => s.id === item1.id)!.zIndex;
    const z2 = updatedB.stickers.find((s) => s.id === item2.id)!.zIndex;

    // item2 was sent to back AFTER item1, so item2 must have a strictly lower z-index than item1
    assert.ok(z2 < z1, `item2 zIndex (${z2}) must be strictly less than item1 zIndex (${z1})`);
  });

  it('correctly decrements from true minimum z-index even when all initial stickers have high z-indices', () => {
    const boardId = useAppStore.getState().createBoard({
      title: 'High Z Test',
      theme: 'neighborhood',
      pattern: 'dots',
      backgroundColor: '#FAF8F5',
      description: 'Test board',
    });
    const s1 = useAppStore.getState().stickers[0];
    const s2 = useAppStore.getState().stickers[1];

    useAppStore.getState().addStickerToBoard(boardId, s1.id, 10, 10);
    useAppStore.getState().addStickerToBoard(boardId, s2.id, 20, 20);

    const b = useAppStore.getState().boards.find((item) => item.id === boardId)!;
    const item1 = b.stickers[0];
    const item2 = b.stickers[1];

    // Manually set high z-indices [10, 20]
    useAppStore.getState().updateBoardSticker(boardId, item1.id, { zIndex: 10 });
    useAppStore.getState().updateBoardSticker(boardId, item2.id, { zIndex: 20 });

    // Send item2 to back: expected new z-index is 10 - 1 = 9 (NOT 1 - 1 = 0!)
    useAppStore.getState().sendStickerToBack(boardId, item2.id);

    const updatedB = useAppStore.getState().boards.find((item) => item.id === boardId)!;
    const z2 = updatedB.stickers.find((s) => s.id === item2.id)!.zIndex;
    assert.equal(z2, 9, `Expected zIndex 9, but got ${z2}`);
  });

  it('accurately persists breed and sighting story notes on user-created stickers', () => {
    const testSticker: Sticker = {
      id: 'custom-notes-cat',
      name: 'Barnaby',
      animalType: 'cat',
      breed: 'Tuxedo Cat',
      notes: 'Sleeping gently by the bakery flower pots',
      tags: ['Friendly', 'Sleepy'],
      isFavorite: true,
      imageUri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba',
      originalUri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba',
      borderStyle: { width: 6, color: '#FFFFFF', shadow: true, glow: true },
      location: { latitude: 37.77, longitude: -122.41, neighborhood: 'Mission' },
      createdAt: Date.now(),
    };

    useAppStore.getState().addSticker(testSticker);
    const retrieved = useAppStore.getState().stickers.find((s) => s.id === 'custom-notes-cat');
    assert.ok(retrieved);
    assert.equal(retrieved?.breed, 'Tuxedo Cat');
    assert.equal(retrieved?.notes, 'Sleeping gently by the bakery flower pots');
  });
});

