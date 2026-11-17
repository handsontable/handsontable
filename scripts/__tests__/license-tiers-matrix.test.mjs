import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * The license key guide holds a feature-to-tier matrix that `generate:feature-manifest` writes from the feature
 * manifest sources in `handsontable/src`. The core unit suite checks it too, but CI runs that suite only for a change
 * the scope router sends to it, and a pull request that edits only the docs page is not one. This test runs on every
 * pull request, so a hand edit inside the generated block fails here.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGE_DIR = join(ROOT, 'handsontable');
const {
  LICENSE_GUIDE_FILE,
  findStaleOutputs,
  loadSources,
} = createRequire(import.meta.url)(join(PACKAGE_DIR, 'scripts/utils/feature-manifest.js'));

test('the tier matrix in the license key guide matches the feature manifest sources', () => {
  const sources = loadSources(PACKAGE_DIR);
  const stale = findStaleOutputs(sources);

  // Without `docs/` the generator leaves the guide out, and this test would pass on nothing.
  assert.equal(sources.hasDocs, true, 'the checkout holds the docs directory');
  assert.equal(typeof sources.licenseGuideText, 'string', `${LICENSE_GUIDE_FILE} exists`);

  assert.ok(!stale.includes(LICENSE_GUIDE_FILE),
    `${LICENSE_GUIDE_FILE} is stale. Edit the manifest sources instead of the block between the license-tiers ` +
    'markers, then run `npm run generate:feature-manifest --prefix handsontable`.');
});
