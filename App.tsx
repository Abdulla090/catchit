import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from './src/store/useAppStore';
import { lightColors, darkColors } from './src/theme/colors';

// Views & Screens
import { CameraViewfinder } from './src/components/camera/CameraViewfinder';
import { StickerMagicStudio } from './src/components/studio/StickerMagicStudio';
import { FreeboardCanvas } from './src/components/board/FreeboardCanvas';
import { AnimalMapView } from './src/components/map/AnimalMapView';
import { AnimalTimelineView } from './src/components/timeline/AnimalTimelineView';
import { TabBar } from './src/components/common/TabBar';
import { OnboardingModal } from './src/components/onboarding/OnboardingModal';
import { StickerDetailModal } from './src/components/timeline/StickerDetailModal';

export default function App() {
  const {
    activeTab,
    capturedPhotoUri,
    isDarkMode,
  } = useAppStore();

  const colors = isDarkMode ? darkColors : lightColors;

  const renderActiveScreen = () => {
    // When a photo is captured, seamlessly transition into Sticker Magic Studio
    if (capturedPhotoUri) {
      return <StickerMagicStudio />;
    }

    switch (activeTab) {
      case 'camera':
        return <CameraViewfinder />;
      case 'board':
        return <FreeboardCanvas />;
      case 'timeline':
      case 'stickers':
        return <AnimalTimelineView />;
      case 'map':
        return <AnimalMapView />;
      default:
        return <FreeboardCanvas />;
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {renderActiveScreen()}

          {/* Floating Navigation Tab Bar (hidden when camera or studio is in full screen mode) */}
          {!capturedPhotoUri && activeTab !== 'camera' && <TabBar />}

          {/* Global Sticker Detail Inspection Modal */}
          <StickerDetailModal />

          {/* First-time Onboarding Walkthrough */}
          <OnboardingModal />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
