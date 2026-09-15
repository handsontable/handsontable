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
  // `li::after` starts `bullet-size + bullet-margin` below the item's top, so a
  // one-line item in a tight list only keeps its connector while the padding
  // outweighs that inset. Upstream's `1px` collapses the line here, because this
  // site overrides `--sl-line-height`.
  // Comments in this block quote CSS declarations, so read the code only.
  const declarationsOnly = pageCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const liRule = declarationsOnly.match(/\.sl-steps\s*>\s*li\s*\{[^}]*\}/)[0];
  const paddingBottom = liRule.match(/padding-bottom:\s*([\d.]+)(px|rem)/);

  assert.ok(paddingBottom, '.sl-steps > li must set padding-bottom');
  assert.equal(paddingBottom[2], 'rem', 'a px padding is too small to hold the connector open');
  assert.ok(
    Number(paddingBottom[1]) >= 0.5,
    `padding-bottom is ${paddingBottom[0]}; below ~0.5rem a one-line step loses its connector`
  );

  // The line must stop at the last bullet rather than dangle past it.
  assert.match(pageCss, /\.sl-steps\s*>\s*li:last-child::after\s*\{[^}]*content:\s*none/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li:last-child\s*\{[^}]*padding-bottom:\s*0/);
  assert.match(pageCss, /\.sl-steps\s*>\s*li::after\s*\{[^}]*background-color:\s*var\(--sl-color-hairline-light\)/);
});
