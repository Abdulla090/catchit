import { Alert } from 'react-native';

export async function saveStickerToGallery(imageUri: string, stickerName = 'sticker'): Promise<boolean> {
  try {
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = imageUri;
      a.download = `${stickerName.replace(/\s+/g, '_') || 'sticker'}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Alert.alert('Download Started', `${stickerName} is downloading.`);
      return true;
    }
  } catch (err) {
    console.warn('Web download error:', err);
    Alert.alert('Download Failed', 'Could not download sticker image.');
  }
  return false;
}
