import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageCss = readFileSync(join(__dirname, '../../styles/layout/page.css'), 'utf8');

test('generated step lists have global marker and guide styles', () => {
  assert.match(pageCss, /(?:^|\n)\.sl-steps\s*\{[^}]*margin-top:\s*2rem/);
  assert.match(pageCss, /\.sl-steps\s*\{[^}]*counter-reset:\s*steps-counter/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li\s*\{[^}]*counter-increment:\s*steps-counter/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li\s*>\s*\*\s*\+\s*\*\s*\{[^}]*margin-top:\s*var\(--sl-content-gap-y\)/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li::before\s*\{[^}]*content:\s*counter\(steps-counter\)/);
  // `li::after` is anchored to the padding box, so anything larger runs the
  // hairline connector past the item's content. Upstream Starlight's value.
  assert.match(pageCss, /\.sl-steps\s*>\s*li\s*\{[^}]*padding-bottom:\s*1px/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li::after\s*\{[^}]*background-color:\s*var\(--sl-color-hairline-light\)/);
});
