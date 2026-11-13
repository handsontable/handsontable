import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { A11Y_PAGES } from '../../a11y/pages.mjs';

/**
 * A catalog page that shows what a license key leaves out names a preset of `fixtures/licenseTiers.ts`
 * (`licensePreset`), because `pages.mjs` cannot build a key. The preset file is TypeScript, so this reads
 * its keys from the source: a preset renamed or removed there would leave the page without its key, and
 * the scan would read a grid with no license bar.
 */
const SOURCE = readFileSync(new URL('../../fixtures/licenseTiers.ts', import.meta.url), 'utf8');
const BLOCK = SOURCE.slice(SOURCE.indexOf('export const LICENSE_PRESETS = {'), SOURCE.indexOf('} as const satisfies'));
const PRESETS = [...BLOCK.matchAll(/^ {2}'([a-z-]+)': \{/gm)].map(match => match[1]);

test('every licensePreset of the accessibility catalog is a preset of fixtures/licenseTiers.ts', () => {
  const pages = A11Y_PAGES.filter(page => page.licensePreset !== undefined);

  assert.ok(PRESETS.includes('tier-base'), 'the preset names are read from the source');
  assert.ok(pages.some(page => page.id === 'license-missing-features'), 'the license page names a preset');

  for (const page of pages) {
    assert.ok(PRESETS.includes(page.licensePreset), `${page.id} names the preset ${page.licensePreset}`);
  }
});
