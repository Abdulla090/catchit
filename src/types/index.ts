export type AnimalType = 'cat' | 'dog' | 'bird' | 'bunny' | 'squirrel' | 'wildlife' | 'other';

export type StickerAccessoryType = 'crown' | 'halo' | 'sunglasses' | 'fishbone' | 'heart' | 'sparkles' | 'bow';

export interface StickerAccessory {
  id: string;
  type: StickerAccessoryType;
  xPercent: number; // relative to sticker frame (0-100)
  yPercent: number; // relative to sticker frame (0-100)
  scale: number;
  rotation: number;
}

export interface BrushPoint {
  x: number;
  y: number;
  mode: 'erase' | 'restore';
  radius: number;
}

export interface StickerBorderStyle {
  width: number;
  color: string;
  shadow: boolean;
  glow: boolean;
  glowColor?: string;
  effect?: 'clean' | 'holo' | 'sparkles' | 'vintage';
}

export interface StickerLocation {
  latitude: number;
  longitude: number;
  neighborhood?: string;
  city?: string;
  addressName?: string;
}

export interface Sticker {
  id: string;
  name: string;
  animalType: AnimalType;
  breed?: string;
  personality?: string;
  tags: string[];
  isFavorite: boolean;
  imageUri: string;      // Transparent cutout sticker
  originalUri: string;   // Full original photo
  borderStyle: StickerBorderStyle;
  location: StickerLocation;
  createdAt: number;
  notes?: string;
  rescueStatus?: 'friendly_stray' | 'community_resident' | 'beloved_pet' | 'rescued' | 'needs_treat';
  accessories?: StickerAccessory[];
  brushPoints?: BrushPoint[];
}

export type BoardTheme = 'neighborhood' | 'pets' | 'street' | 'rescue' | 'custom';
export type BoardPattern = 'dots' | 'grid' | 'cork' | 'notebook' | 'clean';

export interface BoardSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface Board {
  id: string;
  title: string;
  theme: BoardTheme;
  description?: string;
  pattern: BoardPattern;
  backgroundColor: string;
  stickers: BoardSticker[];
  createdAt: number;
  updatedAt: number;
}

export type ActiveTab = 'camera' | 'board' | 'timeline' | 'map' | 'stickers';
export type TimelineViewMode = 'grid' | 'timeline' | 'calendar';

export interface FilterState {
  category: 'all' | AnimalType | 'favorites' | 'strays';
  searchQuery: string;
  timeRange: 'all' | 'today' | 'week' | 'month';
}

