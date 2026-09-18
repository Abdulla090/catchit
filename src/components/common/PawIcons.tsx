import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const PawIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Main Pad */}
    <Path
      d="M12 10.5C9.5 10.5 7.5 12.5 7.5 15.2C7.5 18 9.5 20.2 12 20.2C14.5 20.2 16.5 18 16.5 15.2C16.5 12.5 14.5 10.5 12 10.5Z"
      fill={color}
    />
    {/* Toe 1 (Left) */}
    <Circle cx="5.8" cy="11.5" r="2.2" fill={color} />
    {/* Toe 2 (Mid-Left) */}
    <Circle cx="9.2" cy="7.2" r="2.4" fill={color} />
    {/* Toe 3 (Mid-Right) */}
    <Circle cx="14.8" cy="7.2" r="2.4" fill={color} />
    {/* Toe 4 (Right) */}
    <Circle cx="18.2" cy="11.5" r="2.2" fill={color} />
  </Svg>
);

export const CatHeadIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5Z" />
    {/* Left Ear */}
    <Path d="M5.5 10.5L3.5 4.5L9.5 6.5" />
    {/* Right Ear */}
    <Path d="M18.5 10.5L20.5 4.5L14.5 6.5" />
    {/* Whiskers Left */}
    <Path d="M2.5 12.5L6.5 13" />
    <Path d="M2.5 15L6.5 14.5" />
    {/* Whiskers Right */}
    <Path d="M21.5 12.5L17.5 13" />
    <Path d="M21.5 15L17.5 14.5" />
    {/* Nose */}
    <Path d="M11 14L12 15L13 14" />
  </Svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <Path d="M20 3v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M22 5h-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const PeelStickerIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <Path d="M12 22.08V12" />
  </Svg>
);

export const AnimalPinIcon: React.FC<IconProps> = ({ size = 28, color = '#D97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
      fill={color}
    />
    <Circle cx="12" cy="8.5" r="3.2" fill="#FFFFFF" />
    <Circle cx="10" cy="5.8" r="0.8" fill="#FFFFFF" />
    <Circle cx="14" cy="5.8" r="0.8" fill="#FFFFFF" />
  </Svg>
);

export const CrownIcon: React.FC<IconProps> = ({ size = 24, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M2 19h20v2H2zM2 5l4 7 6-8 6 8 4-7v12H2V5z" />
    <Circle cx="2" cy="4" r="1.5" fill="#FEF3C7" />
    <Circle cx="12" cy="3" r="1.5" fill="#FEF3C7" />
    <Circle cx="22" cy="4" r="1.5" fill="#FEF3C7" />
  </Svg>
);

export const SunglassesIcon: React.FC<IconProps> = ({ size = 24, color = '#1C1917' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    {/* Left Rim */}
    <Path d="M2 9h8c.6 0 1 .4 1 1v4c0 2.2-1.8 4-4 4H5c-1.7 0-3-1.3-3-3V9z" />
    {/* Right Rim */}
    <Path d="M13 9h8c.6 0 1 .4 1 1v4c0 1.7-1.3 3-3 3h-2c-2.2 0-4-1.8-4-4V9z" />
    {/* Bridge */}
    <Path d="M10 11h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const FishboneIcon: React.FC<IconProps> = ({ size = 24, color = '#C2410C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    {/* Spine */}
    <Path d="M2 12h17" />
    {/* Head */}
    <Path d="M19 8l4 4-4 4" fill={color} />
    {/* Tail */}
    <Path d="M2 8l3 4-3 4" fill={color} />
    {/* Ribs */}
    <Path d="M7 8l2 8" />
    <Path d="M11 8l2 8" />
    <Path d="M15 8l2 8" />
  </Svg>
);

export const AngelHaloIcon: React.FC<IconProps> = ({ size = 24, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4c-5 0-9 1.3-9 3s4 3 9 3 9-1.3 9-3-4-3-9-3z"
      stroke={color}
      strokeWidth="2.5"
    />
  </Svg>
);

export const HeartStickerIcon: React.FC<IconProps> = ({ size = 24, color = '#EA580C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </Svg>
);

export const RibbonBowIcon: React.FC<IconProps> = ({ size = 24, color = '#059669' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M10 12L3 7v10l7-5z" />
    <Path d="M14 12l7-5v10l-7-5z" />
    <Path d="M10 14l-3 7" stroke={color} strokeWidth="2" />
    <Path d="M14 14l3 7" stroke={color} strokeWidth="2" />
  </Svg>
);

export const DogHeadIcon: React.FC<IconProps> = ({ size = 24, color = '#C2410C', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {/* Head Outline */}
    <Path d="M12 4C8 4 5 7 5 11C5 15.5 8 19 12 19C16 19 19 15.5 19 11C19 7 16 4 12 4Z" />
    {/* Floppy Left Ear */}
    <Path d="M6 7C3.5 8.5 2 12 2.5 15C3 16.5 4.5 17 5.5 15.5L6 11" fill={color} fillOpacity={0.15} />
    {/* Floppy Right Ear */}
    <Path d="M18 7C20.5 8.5 22 12 21.5 15C21 16.5 19.5 17 18.5 15.5L18 11" fill={color} fillOpacity={0.15} />
    {/* Eyes */}
    <Circle cx="9" cy="10.5" r="1.2" fill={color} />
    <Circle cx="15" cy="10.5" r="1.2" fill={color} />
    {/* Snout & Nose */}
    <Path d="M10 14.5C10.8 14 13.2 14 14 14.5" />
    <Path d="M11 13.2H13L12 14.5L11 13.2Z" fill={color} />
    <Path d="M12 14.5V16" />
  </Svg>
);

export const BunnyHeadIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {/* Head */}
    <Path d="M12 10C8.7 10 6 12.7 6 16C6 19.3 8.7 21 12 21C15.3 21 18 19.3 18 16C18 12.7 15.3 10 12 10Z" />
    {/* Left Tall Ear */}
    <Path d="M8 11C7 8 7 3 9 2C11 3 10.5 7 10 11" fill={color} fillOpacity={0.15} />
    {/* Right Tall Ear */}
    <Path d="M16 11C17 8 17 3 15 2C13 3 13.5 7 14 11" fill={color} fillOpacity={0.15} />
    {/* Whiskers */}
    <Path d="M4 16L7 16.5" />
    <Path d="M4 18L7 17.5" />
    <Path d="M20 16L17 16.5" />
    <Path d="M20 18L17 17.5" />
    {/* Nose */}
    <Path d="M11.5 17L12 17.6L12.5 17" fill={color} />
  </Svg>
);

export const StickerPackIcon: React.FC<IconProps> = ({ size = 24, color = '#D97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="3" width="16" height="18" rx="3" />
    <Path d="M4 8H20" />
    <Circle cx="8" cy="14" r="2" fill={color} fillOpacity={0.4} />
    <Path d="M13 13L16 16" />
    <Path d="M16 13L13 16" />
  </Svg>
);

export const SparkleStarIcon: React.FC<IconProps> = ({ size = 20, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 1.5L14.4 8.6L21.5 11L14.4 13.4L12 20.5L9.6 13.4L2.5 11L9.6 8.6L12 1.5Z" />
  </Svg>
);

export const CompassReticleIcon: React.FC<IconProps> = ({ size = 24, color = '#F59E0B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <Circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    <Circle cx="12" cy="12" r="3" fill={color} fillOpacity={0.2} />
    <Path d="M12 2V5" strokeLinecap="round" />
    <Path d="M12 19V22" strokeLinecap="round" />
    <Path d="M2 12H5" strokeLinecap="round" />
    <Path d="M19 12H22" strokeLinecap="round" />
  </Svg>
);

export const CheckSealIcon: React.FC<IconProps> = ({ size = 24, color = '#059669' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 1L14.7 3.5L18.3 3.1L19.8 6.4L23.1 7.9L22.7 11.5L24 14.8L21.5 17.5L21.9 21.1L18.6 22.6L17.1 25.9L13.5 25.5L10.8 28L8.1 25.5L4.5 25.9L3 22.6L-0.3 21.1L0.1 17.5L-1.4 14.8L-0.1 11.5L-0.5 7.9L2.8 6.4L4.3 3.1L7.9 3.5L10.6 1L12 1Z" transform="scale(0.8) translate(3, 1)" />
    <Path d="M9 12L11 14L15 10" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);


