import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { SOCIAL_IMAGE, socialImageHead } from '../social-image.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '../../..');

/**
 * Returns the meta entries keyed by their `property` or `name`.
 *
 * @returns {Map<string, string>}
 */
function metaByKey() {
  return new Map(socialImageHead().map(({ attrs }) => [attrs.property ?? attrs.name, attrs.content]));
}

test('the head entries name the image with an absolute URL for Open Graph and X', () => {
  const meta = metaByKey();

  assert.equal(meta.get('og:image'), 'https://handsontable.com/docs/handsontable-docs-cover.png');
  assert.equal(meta.get('twitter:image'), meta.get('og:image'));
  assert.equal(meta.get('og:image:width'), String(SOCIAL_IMAGE.width));
  assert.equal(meta.get('og:image:height'), String(SOCIAL_IMAGE.height));
  assert.ok(meta.get('og:image:alt'));
  assert.equal(meta.get('twitter:image:alt'), meta.get('og:image:alt'));
  assert.ok(SOCIAL_IMAGE.url.endsWith(`/docs/${SOCIAL_IMAGE.file}`));
});

test('the declared size matches the PNG in docs/public', () => {
  const png = readFileSync(resolve(docsRoot, 'public', SOCIAL_IMAGE.file));

  // PNG signature, then the IHDR chunk: width and height are big-endian at bytes 16 and 20.
  assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG');
  assert.equal(png.subarray(12, 16).toString('latin1'), 'IHDR');
  assert.equal(png.readUInt32BE(16), SOCIAL_IMAGE.width);
  assert.equal(png.readUInt32BE(20), SOCIAL_IMAGE.height);
});

test('the docs config puts the social image entries in the Starlight head', () => {
  const config = readFileSync(resolve(docsRoot, 'astro.config.mjs'), 'utf8');

  assert.match(config, /^import \{ socialImageHead \} from '\.\/src\/lib\/social-image\.mjs';$/m);
  assert.match(config, /^\s*\.\.\.socialImageHead\(\),$/m);
});
