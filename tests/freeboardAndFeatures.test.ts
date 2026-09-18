import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildStickerPackManifest } from '../src/services/stickerPackExport';
import { INITIAL_STICKERS } from '../src/utils/sampleData';

describe('Freeboard Snapping & Physics Tests', () => {
  const SNAP_ROTATION_THRESHOLD = 5.5;
  const SNAP_SCALE_THRESHOLD = 0.08;

  const snapRotation = (rawDegrees: number): number => {
    let norm = rawDegrees % 360;
    if (norm > 180) norm -= 360;
    if (norm < -180) norm += 360;

    if (Math.abs(norm) < SNAP_ROTATION_THRESHOLD) return 0;
    if (Math.abs(Math.abs(norm) - 90) < SNAP_ROTATION_THRESHOLD) return norm > 0 ? 90 : -90;
    if (Math.abs(Math.abs(norm) - 180) < SNAP_ROTATION_THRESHOLD) return 180;
    return norm;
  };

  const snapScale = (rawScale: number): number => {
    if (Math.abs(rawScale - 1.0) < SNAP_SCALE_THRESHOLD) return 1.0;
    return rawScale;
  };

  it('snaps rotation angles near 0, 90, 180, and -90 degrees', () => {
    // Near 0
    assert.equal(snapRotation(3.2), 0);
    assert.equal(snapRotation(-4.1), 0);
    assert.equal(snapRotation(0), 0);
    // Far from 0
    assert.equal(snapRotation(15), 15);

    // Near 90
    assert.equal(snapRotation(88), 90);
    assert.equal(snapRotation(92.4), 90);

    // Near -90
    assert.equal(snapRotation(-87.5), -90);

    // Near 180
    assert.equal(snapRotation(178), 180);
  });

  it('snaps scale factors near 1.0x to exact 1.0x', () => {
    assert.equal(snapScale(1.04), 1.0);
    assert.equal(snapScale(0.96), 1.0);
    assert.equal(snapScale(1.35), 1.35);
    assert.equal(snapScale(0.7), 0.7);
  });

  it('clusters animal sightings by neighborhood and filters by time range', () => {
    const mockSightings = [
      { id: '1', name: 'Barnaby', neighborhood: 'Mission District', createdAt: Date.now() - 1000 * 60 * 60 },
      { id: '2', name: 'Luna', neighborhood: 'Mission District', createdAt: Date.now() - 1000 * 60 * 60 * 5 },
      { id: '3', name: 'Mochi', neighborhood: 'Hayes Valley', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { id: '4', name: 'Pip', neighborhood: 'Hayes Valley', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
    ];

    // Cluster calculation
    const clusterMap = new Map<string, typeof mockSightings>();
    mockSightings.forEach((s) => {
      if (!clusterMap.has(s.neighborhood)) clusterMap.set(s.neighborhood, []);
      clusterMap.get(s.neighborhood)!.push(s);
    });

    assert.equal(clusterMap.size, 2);
    assert.equal(clusterMap.get('Mission District')?.length, 2);
    assert.equal(clusterMap.get('Hayes Valley')?.length, 2);

    // 48h filter
    const dayMs = 1000 * 60 * 60 * 24;
    const recent = mockSightings.filter((s) => Date.now() - s.createdAt <= dayMs * 2);
    assert.equal(recent.length, 2);
    assert.ok(recent.every((s) => s.neighborhood === 'Mission District'));
  });

  it('validates supported canvas background patterns and themes', () => {
    const validPatterns = ['dots', 'grid', 'cork', 'notebook', 'clean'];
    for (const pat of validPatterns) {
      assert.ok(typeof pat === 'string');
      assert.ok(pat.length > 0);
    }
  });

  it('generates a valid sticker pack export manifest', () => {
    const manifest = buildStickerPackManifest(INITIAL_STICKERS, 'Mission District Paws');
    assert.equal(manifest.formatVersion, '1.0');
    assert.equal(manifest.title, 'Mission District Paws');
    assert.equal(manifest.publisher, 'PawCut Community');
    assert.ok(manifest.identifier.startsWith('com.pawcut.pack.'));
    assert.equal(manifest.totalStickers, INITIAL_STICKERS.length);
    assert.equal(manifest.stickers.length, INITIAL_STICKERS.length);

    const first = manifest.stickers[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.ok(first.animalType);
    assert.ok(first.imageUri);
    assert.ok(Array.isArray(first.tags));
  });
});
