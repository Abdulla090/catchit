import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  processAnimalBackgroundRemoval,
  BackgroundRemovalProgress,
} from '../src/services/backgroundRemoval';

describe('Animal Background Removal Service Tests', () => {
  it('processes animal image and triggers progressive callback steps', async () => {
    const progressHistory: BackgroundRemovalProgress[] = [];
    const samplePhotoUri = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba';

    const result = await processAnimalBackgroundRemoval(
      samplePhotoUri,
      (p) => {
        progressHistory.push(p);
      },
      {
        width: 6,
        color: '#FFFFFF',
        shadow: true,
        glow: true,
      }
    );

    // Verify progress progression
    assert.ok(progressHistory.length >= 4, 'Should record multiple progress steps');
    assert.equal(progressHistory[0].step, 'scanning');
    assert.equal(progressHistory[progressHistory.length - 1].step, 'done');
    assert.equal(progressHistory[progressHistory.length - 1].percentage, 100);

    // Verify result payload
    assert.ok(result.stickerUri, 'Should return valid sticker URI');
    assert.equal(result.originalUri, samplePhotoUri);
    assert.ok(result.durationMs > 0);
    assert.ok(result.confidenceScore >= 0.9);
    assert.ok(
      ['native_apple_vision', 'native_android_mlkit', 'smart_contour_engine'].includes(
        result.methodUsed
      )
    );
  });
});
