import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSentryRelease } from '../sentry-release.mjs';

test('names the release after the docs package and the Handsontable version on a production build', () => {
  assert.equal(resolveSentryRelease({ buildMode: 'production', version: '18.1.2' }), 'handsontable-docs@18.1.2');
});

test('sets no release outside a production build', () => {
  assert.equal(resolveSentryRelease({ buildMode: '', version: '18.1.2' }), null);
  assert.equal(resolveSentryRelease({ buildMode: 'preview', version: '18.1.2' }), null);
  assert.equal(resolveSentryRelease({ buildMode: undefined, version: '18.1.2' }), null);
});

test('sets no release when the version could not be read', () => {
  assert.equal(resolveSentryRelease({ buildMode: 'production', version: '' }), null);
  assert.equal(resolveSentryRelease({ buildMode: 'production', version: undefined }), null);
});
