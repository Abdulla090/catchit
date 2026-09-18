import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

export async function saveStickerToGallery(imageUri: string, stickerName = 'sticker'): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to export stickers.');
      return false;
    }

    let localUri = imageUri;
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      try {
        const ext = localUri.includes('.png') ? 'png' : 'jpg';
        const targetPath = `${FileSystem.cacheDirectory || ''}sticker-${Date.now()}.${ext}`;
        const downloadResult = await FileSystem.downloadAsync(localUri, targetPath);
        localUri = downloadResult.uri;
      } catch (dlErr) {
        console.warn('Sticker image download failed:', dlErr);
      }
    }

    await MediaLibrary.saveToLibraryAsync(localUri);
    Alert.alert('Saved to Camera Roll!', `${stickerName} is now saved in your photo library.`);
    return true;
  } catch (err) {
    console.warn('Save to library error:', err);
    Alert.alert('Save Failed', 'Could not save sticker to photo library.');
    return false;
  }
}
