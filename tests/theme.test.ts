import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lightColors, darkColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { shadows } from '../src/theme/shadows';

describe('Design System & Anti-Slop Audit Tests', () => {
  it('strictly enforces no Inter font or AI generated fonts', () => {
    for (const [key, style] of Object.entries(typography)) {
      const family = (style.fontFamily || '').toLowerCase();
      assert.ok(
        !family.includes('inter'),
        `Typography token "${key}" must not use Inter font (Anti-slop rule)`
      );
      assert.ok(
        !family.includes('ai-'),
        `Typography token "${key}" must not use AI generated fonts`
      );
    }
  });

  it('strictly enforces warm natural animal palette without pink/purple gradients', () => {
    const forbiddenPatterns = ['#ff00ff', '#800080', '#e0b0ff', 'purple', 'magenta'];

    for (const [colorName, hex] of Object.entries({ ...lightColors, ...darkColors })) {
      if (typeof hex === 'string') {
        const lower = hex.toLowerCase();
        for (const pattern of forbiddenPatterns) {
          assert.ok(
            !lower.includes(pattern),
            `Color token "${colorName}" (${hex}) must not use purple or magenta tones`
          );
        }
      }
    }

    // Must have warm amber, terracotta, and cream
    assert.equal(lightColors.primary, '#D97706'); // Warm Amber
    assert.equal(lightColors.secondary, '#C2410C'); // Terracotta
    assert.equal(lightColors.background, '#FAF8F5'); // Warm Cream
  });

  it('provides tactile elevation shadows for stickers and floating elements', () => {
    assert.ok(shadows.soft);
    assert.ok(shadows.card);
    assert.ok(shadows.sticker);
    assert.ok(shadows.stickerFloating);
  });

  it('strictly enforces no regular emojis in all source code (Anti-slop rule)', () => {
    const fs = require('node:fs');
    const path = require('node:path');

    const scanDirectory = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(scanDirectory(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const srcDir = path.resolve(__dirname, '../src');
    const files = scanDirectory(srcDir);
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

    const violations: string[] = [];
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line: string, idx: number) => {
        if (emojiRegex.test(line)) {
          violations.push(`${path.basename(filePath)}:${idx + 1} -> ${line.trim()}`);
        }
      });
    }

    assert.equal(
      violations.length,
      0,
      `Found forbidden emojis in source code:\n${violations.join('\n')}`
    );
  });
});
