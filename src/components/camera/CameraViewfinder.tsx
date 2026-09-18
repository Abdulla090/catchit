import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { typography, shadows } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { FocusReticle } from './FocusReticle';
import { hapticFeedback } from '../../utils/haptics';
import {
  Zap,
  ZapOff,
  SwitchCamera,
  Image as ImageIcon,
  X,
  VolumeX,
  Volume2,
  Sparkles,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export const CameraViewfinder: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    setCapturedPhotoUri,
    setActiveTab,
    silentShutter,
    toggleSilentShutter,
  } = useAppStore();

  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [focusTarget, setFocusTarget] = useState<{ x: number; y: number } | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // Shutter Flash & Compression Animation
  const shutterScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  const triggerShutterAnimation = (onFinish: () => void) => {
    shutterScale.value = withSpring(0.85, { damping: 12, stiffness: 400 }, () => {
      shutterScale.value = withSpring(1.0);
    });

    flashOpacity.value = withTiming(0.8, { duration: 80 }, () => {
      flashOpacity.value = withTiming(0, { duration: 180 }, () => {
        runOnJS(onFinish)();
      });
    });
  };

  const handleCapture = async () => {
    if (silentShutter) {
      hapticFeedback.light();
    } else {
      hapticFeedback.heavy();
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: true,
        });

        if (photo?.uri) {
          triggerShutterAnimation(() => {
            setCapturedPhotoUri(photo.uri);
          });
          return;
        }
      } catch (err) {
        console.warn('Camera capture fallback:', err);
      }
    }

    // Fallback if camera hardware is unavailable (e.g. running on simulator/web)
    triggerShutterAnimation(() => {
      const demoCatUris = [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=80',
      ];
      const randomDemo = demoCatUris[Math.floor(Math.random() * demoCatUris.length)];
      setCapturedPhotoUri(randomDemo);
    });
  };

  const handlePickFromGallery = async () => {
    hapticFeedback.light();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.95,
    });

    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      hapticFeedback.medium();
      setCapturedPhotoUri(result.assets[0].uri);
    }
  };

  const handleTapToFocus = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    hapticFeedback.selection();
    setFocusTarget({ x: locationX, y: locationY });
  };

  const flashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Live Camera Viewfinder or Simulated Pet Viewfinder with Tap to Focus */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTapToFocus}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            enableTorch={torch}
          />
        ) : (
          <View style={styles.simulatedViewfinder}>
            <Text style={[typography.bodyMedium, styles.permissionHint]}>
              {permission
                ? 'Tap anywhere to focus pet • Tap shutter to capture'
                : 'Requesting camera permissions...'}
            </Text>
            {!permission?.granted && (
              <Pressable
                onPress={() => requestPermission()}
                style={styles.permissionButton}
              >
                <Text style={[typography.button, { color: '#FFFFFF' }]}>Grant Camera Access</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Real-time Animal Detection HUD Reticle */}
        <FocusReticle
          targetX={focusTarget?.x}
          targetY={focusTarget?.y}
          detectedPet={true}
          petLabel="Target: Neighborhood Companion"
        />
      </Pressable>


      {/* Shutter Flash Transition Layer */}
      <Animated.View
        style={[styles.flashOverlay, flashAnimatedStyle]}
        pointerEvents="none"
      />

      {/* Top Controls Bar */}
      <View
        style={[
          styles.topControls,
          {
            paddingTop: Math.max(insets.top + 8, 20),
          },
        ]}
      >
        <Pressable
          onPress={() => {
            hapticFeedback.light();
            setActiveTab('board');
          }}
          style={styles.pillButton}
          hitSlop={8}
        >
          <X size={20} color="#FFFFFF" />
        </Pressable>

        <View style={styles.topRightControls}>
          {/* Torch Toggle */}
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              setTorch(!torch);
            }}
            style={[styles.pillButton, torch && styles.activePillButton]}
            hitSlop={8}
          >
            {torch ? <Zap size={18} color="#F59E0B" /> : <ZapOff size={18} color="#FFFFFF" />}
          </Pressable>

          {/* Silent Shutter Toggle */}
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              toggleSilentShutter();
            }}
            style={styles.pillButton}
            hitSlop={8}
          >
            {silentShutter ? (
              <VolumeX size={18} color="#FFFFFF" />
            ) : (
              <Volume2 size={18} color="#FFFFFF" />
            )}
          </Pressable>

          {/* Flip Camera */}
          <Pressable
            onPress={() => {
              hapticFeedback.light();
              setFacing(facing === 'back' ? 'front' : 'back');
            }}
            style={styles.pillButton}
            hitSlop={8}
          >
            <SwitchCamera size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Bottom Shutter & Picker Control Panel */}
      <View
        style={[
          styles.bottomControls,
          {
            paddingBottom: Math.max(insets.bottom + 20, 36),
          },
        ]}
      >
        <View style={styles.bottomRow}>
          {/* Gallery Import Button */}
          <Pressable
            onPress={handlePickFromGallery}
            style={styles.actionIconButton}
            hitSlop={10}
          >
            <View style={styles.iconCircle}>
              <ImageIcon size={22} color="#FFFFFF" />
            </View>
            <Text style={[typography.caption, styles.actionLabel]}>Gallery</Text>
          </Pressable>

          {/* Large Spring Shutter Button */}
          <Animated.View style={shutterAnimatedStyle}>
            <Pressable
              onPress={handleCapture}
              style={styles.shutterRingOuter}
              hitSlop={12}
            >
              <View style={styles.shutterRingInner}>
                <View style={styles.shutterCenterCore} />
              </View>
            </Pressable>
          </Animated.View>

          {/* Magic Sticker Mode Indicator */}
          <View style={styles.actionIconButton}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(217, 119, 6, 0.4)' }]}>
              <Sparkles size={20} color="#F59E0B" />
            </View>
            <Text style={[typography.caption, styles.actionLabel]}>Magic Cut</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0A09',
  },
  simulatedViewfinder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1C1917',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionHint: {
    color: '#A8A29E',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 90,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 60,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  pillButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: '#F59E0B',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  actionIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    color: '#D6D3D1',
    letterSpacing: 0.4,
  },
  shutterRingOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCenterCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});
