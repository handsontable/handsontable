import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  composite,
  contrastRatio,
  dominantColor,
  focusFindings,
  indicatorChange,
  isDrawn,
  obscuredFindings,
  relativeLuminance,
  strongestPixel,
  componentFindings,
} from '../contrast.mjs';
import { EVIDENCE_SCHEMA, validatePart } from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe", focus appearance and non-text contrast): the
// measurer behind 2.4.7, 2.4.11 and 1.4.11. The spec captures pixels and colors; the arithmetic and
// every verdict are here.

/**
 * An image of one color, with optional pixels painted over it.
 *
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {number[]} color The fill, `[r, g, b]`.
 * @param {Array<[number, number, number[]]>} [paint] Pixels to set: x, y, color.
 * @returns {{width: number, height: number, data: number[]}} The image, RGBA.
 */
function image(width, height, color, paint = []) {
  const data = [];

  for (let index = 0; index < width * height; index++) {
    data.push(color[0], color[1], color[2], 255);
  }
  for (const [x, y, [r, g, b]] of paint) {
    data.splice((y * width + x) * 4, 3, r, g, b);
  }

  return { width, height, data };
}

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

test('relative luminance and contrast follow WCAG 2.2 (sRGB, 0.04045 threshold)', () => {
  assert.equal(relativeLuminance(WHITE), 1);
  assert.equal(relativeLuminance(BLACK), 0);
  assert.equal(contrastRatio(WHITE, BLACK), 21);
  assert.equal(contrastRatio(BLACK, WHITE), 21, 'the order does not matter');
  assert.equal(Math.round(contrastRatio([118, 118, 118], WHITE) * 100) / 100, 4.54, '#767676 on white is the classic 4.54:1');
  assert.ok(contrastRatio([149, 149, 149], WHITE) < 3, '#959595 on white is 2.996:1, under 3:1 although it rounds to 3.00');
  assert.ok(contrastRatio([148, 148, 148], WHITE) >= 3, '#949494 on white clears 3:1');
});

test('a translucent color composites over its background before it is measured', () => {
  assert.deepEqual(composite([0, 0, 0, 0.5], WHITE), [128, 128, 128]);
  assert.deepEqual(composite([10, 20, 30, 1], WHITE), [10, 20, 30]);
  assert.deepEqual(composite([10, 20, 30, 0], WHITE), WHITE);
});

test('the dominant color of an image is its background; the strongest pixel against it is the icon', () => {
  const icon = image(8, 8, [240, 240, 240], [[3, 3, [90, 90, 90]], [4, 3, [120, 120, 120]], [3, 4, [200, 200, 200]]]);

  assert.deepEqual(dominantColor(icon), [240, 240, 240]);
  assert.deepEqual(strongestPixel(icon, [240, 240, 240]).color, [90, 90, 90]);
  assert.equal(Math.round(strongestPixel(icon, [240, 240, 240]).ratio * 100) / 100, 6.05);
});

test('the focus indicator is what changed between the two captures, measured against what was there', () => {
  const before = image(10, 10, WHITE);
  const ring = [];

  for (let x = 2; x < 8; x++) {
    ring.push([x, 2, [75, 123, 236]], [x, 7, [75, 123, 236]]);
  }

  const after = image(10, 10, WHITE, ring);
  const change = indicatorChange(before, after);

  assert.equal(change.changed, 12);
  assert.equal(Math.round(change.ratio * 100) / 100, 3.93);
  assert.deepEqual(change.color, [75, 123, 236]);
  assert.deepEqual(change.adjacent, WHITE, 'the colors next to the indicator: the dominant pixels that did not change');
  assert.equal(Math.round(change.adjacentRatio * 100) / 100, 3.93);
  assert.deepEqual(indicatorChange(before, image(10, 10, WHITE)), { changed: 0, ratio: 1, color: null, adjacent: null, adjacentRatio: 1, area: 0 });
  assert.equal(indicatorChange(before, image(10, 10, WHITE, [[0, 0, [252, 252, 252]]])).changed, 0,
    'a difference under the noise floor is not a change');
});

test('a ring drawn over a grid line is measured against the cell next to it, not against the line it covers', () => {
  const line = [];
  const ring = [];

  for (let x = 0; x < 10; x++) {
    line.push([x, 5, [204, 204, 204]]);
    ring.push([x, 5, [82, 146, 247]]);
  }

  const change = indicatorChange(image(10, 10, WHITE, line), image(10, 10, WHITE, ring));

  assert.equal(Math.round(change.ratio * 100) / 100, 1.92, 'against the grey line it replaced');
  assert.equal(Math.round(change.adjacentRatio * 100) / 100, 3.08, 'against the white cell beside it');
  assert.deepEqual(focusFindings({ selector: 'td', step: 's', change }), [], '1.4.11 compares an indicator with its adjacent colors');
  assert.deepEqual(focusFindings({ selector: 'td', step: 's', change, against: 'before' }).map(item => item.kind), ['focus-indicator-contrast'],
    'a state that repaints the element itself (a menu item\'s highlight) is compared with what it replaced');
});

test('a part with no pixel standing out from its background is not drawn, and has nothing to measure', () => {
  assert.equal(isDrawn({ ratio: 1 }), false);
  assert.equal(isDrawn({ ratio: 1.04 }), false);
  assert.equal(isDrawn({ ratio: 1.3 }), true);
});

test('focus findings: no visible change is a 2.4.7 failure, a change under 3:1 a 1.4.11 one', () => {
  const step = 'ArrowRight to (1, 2)';

  assert.deepEqual(focusFindings({ selector: 'td', step, change: { changed: 0, ratio: 1, color: null, area: 0 } })
    .map(item => [item.kind, item.criteria, item.severity]), [['focus-not-visible', ['2.4.7'], 'serious']]);
  assert.deepEqual(focusFindings({ selector: 'td', step, change: { changed: 40, ratio: 2.1, color: [180, 200, 255], area: 40 } })
    .map(item => [item.kind, item.criteria, item.severity, item.measured.ratio]), [['focus-indicator-contrast', ['1.4.11', '2.4.7'], 'serious', 2.1]],
  'without an adjacent ratio the change itself is the measure');
  assert.deepEqual(focusFindings({ selector: 'td', step, change: { changed: 40, ratio: 2.996, color: [149, 149, 149], area: 40 } })
    .map(item => item.measured.ratio), [3], 'a ratio just under 3:1 fails even where it rounds to 3.00');
  assert.deepEqual(focusFindings({ selector: 'td', step, change: { changed: 40, ratio: 4.1, color: [75, 123, 236], area: 40 } }), []);
});

test('component findings: a part that identifies a control or its state needs 3:1 against what is next to it', () => {
  assert.deepEqual(componentFindings({ kind: 'icon-contrast', selector: 'span.changeType', ratio: 2.4, foreground: [170, 170, 170], background: WHITE })
    .map(item => [item.kind, item.criteria, item.severity, item.measured.ratio, item.measured.foreground]),
  [['icon-contrast', ['1.4.11'], 'serious', 2.4, 'rgb(170, 170, 170)']]);
  assert.deepEqual(componentFindings({ kind: 'gridline-contrast', selector: 'td', ratio: 1.2, foreground: [230, 230, 230], background: WHITE, severity: 'moderate' })
    .map(item => item.severity), ['moderate']);
  assert.deepEqual(componentFindings({ kind: 'icon-contrast', selector: 'x', ratio: 3.01, foreground: BLACK, background: WHITE }), []);
});

test('a focused element covered at every sampled point is obscured (2.4.11); a partly covered one is not', () => {
  assert.deepEqual(obscuredFindings({ selector: 'td', step: 'PageDown', visible: 0, points: 25 })
    .map(item => [item.kind, item.criteria, item.severity]), [['focus-obscured', ['2.4.11'], 'serious']]);
  assert.deepEqual(obscuredFindings({ selector: 'td', step: 'PageDown', visible: 3, points: 25 }), []);
});

test('the check\'s findings are valid evidence', () => {
  const findings = [
    ...focusFindings({ selector: 'td', step: 's', change: { changed: 0, ratio: 1, color: null, area: 0 } }),
    ...componentFindings({ kind: 'icon-contrast', selector: 'x', ratio: 1.5, foreground: [200, 200, 200], background: WHITE }),
    ...obscuredFindings({ selector: 'td', step: 's', visible: 0, points: 25 }),
  ];

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main' }, durationMs: 1, findings }), []);
});
