import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageCss = readFileSync(join(__dirname, '../../styles/layout/page.css'), 'utf8');

test('generated step lists have global marker and guide styles', () => {
  assert.match(pageCss, /\.sl-steps\s*\{[\s\S]*counter-reset:\s*steps-counter/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li\s*\{[\s\S]*counter-increment:\s*steps-counter/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li::before\s*\{[\s\S]*content:\s*counter\(steps-counter\)/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li::after\s*\{[\s\S]*background-color:\s*var\(--sl-color-hairline-light\)/);
});
