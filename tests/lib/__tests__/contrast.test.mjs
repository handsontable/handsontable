import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  composite,
  contrastRatio,
  dominantColor,
  floorRatio,
  focusFindings,
  indicatorChange,
  isDrawn,
  obscuredFindings,
  partContrast,
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
  assert.deepEqual(indicatorChange(before, image(10, 10, WHITE)),
    { changed: 0, ratio: 1, replacedColor: null, replaced: null, color: null, adjacent: null, adjacentRatio: 1, area: 0 });
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

test('a ring around a filled control is measured against the margin around the control, not against its fill', () => {
  const fill = [37, 99, 235];
  const button = [];
  const ring = [];

  // A 48 by 28 button, captured with a 6 px margin: its fill is the most common color of the capture.
  for (let y = 6; y < 34; y++) {
    for (let x = 6; x < 54; x++) {
      button.push([x, y, fill]);
    }
  }
  // An outline in the button's own color, 2 px off its edge.
  for (let x = 3; x < 57; x++) {
    ring.push([x, 3, fill], [x, 36, fill]);
  }
  for (let y = 4; y < 36; y++) {
    ring.push([3, y, fill], [56, y, fill]);
  }

  const before = image(60, 40, WHITE, button);
  const after = image(60, 40, WHITE, [...button, ...ring]);

  assert.deepEqual(indicatorChange(before, after).adjacent, fill, 'without a margin, the most common unchanged pixel is the fill');
  assert.deepEqual(indicatorChange(before, after, 6).adjacent, WHITE, 'with one, it is what lies around the control');
  assert.equal(Math.round(indicatorChange(before, after, 6).adjacentRatio * 100) / 100, 5.17);
  assert.deepEqual(focusFindings({ selector: 'button', step: 's', change: indicatorChange(before, after, 6) }), []);
});

test('a highlight judged against what it replaced reports the pixel and the color behind its ratio', () => {
  const before = [];
  const after = [];

  // Row 0 was black and turns dark gray; row 5 was white and turns light gray. Against what each
  // replaced, the light gray is the stronger change; against the white around them, the dark gray is.
  for (let x = 0; x < 10; x++) {
    before.push([x, 0, BLACK]);
    after.push([x, 0, [60, 60, 60]], [x, 5, [180, 180, 180]]);
  }

  const change = indicatorChange(image(10, 10, WHITE, before), image(10, 10, WHITE, after));
  const [finding] = focusFindings({ selector: 'td', step: 's', change, against: 'before' });

  assert.equal(finding.kind, 'focus-indicator-contrast');
  assert.equal(finding.measured.color, 'rgb(180, 180, 180)');
  assert.equal(finding.measured.against, 'rgb(255, 255, 255)');
  assert.equal(finding.measured.ratio, floorRatio(contrastRatio([180, 180, 180], WHITE)), 'the ratio is the one between the two colors the finding names');
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
    .map(item => [item.measured.ratio, item.reason.includes('2.99:1')]), [[2.99, true]],
  'a ratio just under 3:1 fails, and is shown rounded down, so it never reads as 3:1');
  assert.deepEqual(focusFindings({ selector: 'td', step, change: { changed: 40, ratio: 4.1, color: [75, 123, 236], area: 40 } }), []);
});

test('component findings: a part that identifies a control or its state needs 3:1 against what is next to it', () => {
  assert.deepEqual(componentFindings({ kind: 'icon-contrast', selector: 'span.changeType', ratio: 2.4, foreground: [170, 170, 170], background: WHITE })
    .map(item => [item.kind, item.criteria, item.severity, item.measured.ratio, item.measured.foreground]),
  [['icon-contrast', ['1.4.11'], 'serious', 2.4, 'rgb(170, 170, 170)']]);
  assert.deepEqual(componentFindings({ kind: 'gridline-contrast', selector: 'td', ratio: 1.2, foreground: [230, 230, 230], background: WHITE, severity: 'moderate' })
    .map(item => item.severity), ['moderate']);
  assert.deepEqual(componentFindings({ kind: 'icon-contrast', selector: 'x', ratio: 3.01, foreground: BLACK, background: WHITE }), []);
  assert.deepEqual(componentFindings({ kind: 'icon-contrast', selector: 'x', ratio: 2.996, foreground: [149, 149, 149], background: WHITE })
    .map(item => [item.measured.ratio, item.reason.includes('2.99:1')]), [[2.99, true]]);
  assert.equal(floorRatio(2.3), 2.3, 'a ratio with two decimals keeps them');
});

test('a part is measured from the pixels inside its box: text in the margin beside an icon never stands in for it', () => {
  // A 6 by 6 icon at (3, 3) with one faint pixel, and a black pixel of header text in the margin beside it.
  const icon = image(12, 12, WHITE, [[5, 5, [235, 235, 235]], [1, 6, BLACK]]);
  const part = partContrast(icon, { x: 3, y: 3, width: 6, height: 6 });

  assert.deepEqual(part.color, [235, 235, 235]);
  assert.deepEqual(part.background, WHITE);
  assert.ok(part.ratio < 1.2);
  assert.equal(Math.round(strongestPixel(icon, dominantColor(icon)).ratio), 21, 'the whole capture would have read the text');
});

test('a checkbox is measured as a box against the cell around it and, checked, as a mark against its own fill', () => {
  const cell = [34, 34, 34];
  const paint = (fill, tick) => {
    const pixels = [];

    // A 16 px box at (3, 3) in a 22 px capture, with a two-pixel tick in its middle.
    for (let y = 3; y < 19; y++) {
      for (let x = 3; x < 19; x++) {
        pixels.push([x, y, fill]);
      }
    }
    pixels.push([10, 10, tick], [11, 11, tick]);

    return image(22, 22, cell, pixels);
  };
  const box = { x: 3, y: 3, width: 16, height: 16 };
  const faintBox = partContrast(paint([60, 60, 60], WHITE), box, { band: 2, mark: true });

  assert.deepEqual(faintBox.background, cell, 'the box is judged against the cell, although its fill is the most common color');
  assert.deepEqual(faintBox.color, [60, 60, 60]);
  assert.ok(faintBox.ratio < 1.5);

  const faintMark = partContrast(paint([37, 99, 235], [60, 110, 240]), box, { band: 2, mark: true });

  assert.deepEqual(faintMark.background, [37, 99, 235], 'the mark is judged against the fill');
  assert.deepEqual(faintMark.color, [60, 110, 240]);
  assert.ok(faintMark.ratio < 1.5);

  const unchecked = partContrast(image(22, 22, WHITE, [[3, 3, [118, 118, 118]], [4, 3, [118, 118, 118]]]), box, { band: 2 });

  assert.equal(Math.round(unchecked.ratio * 100) / 100, 4.54, 'an unchecked box is its edge against the cell');
});

test('a focused element covered at every sampled point is obscured (2.4.11); a partly covered one is not', () => {
  assert.deepEqual(obscuredFindings({ selector: 'td', step: 'PageDown', visible: 0, points: 25 })
    .map(item => [item.kind, item.criteria, item.severity]), [['focus-obscured', ['2.4.11'], 'serious']]);
  assert.deepEqual(obscuredFindings({ selector: 'td', step: 'PageDown', visible: 3, points: 25 }), []);
});

test('a focused element with no sampled point inside the window is off screen, not obscured', () => {
  assert.deepEqual(obscuredFindings({ selector: 'td', step: 'PageDown', visible: 0, points: 0 })
    .map(item => [item.kind, item.criteria, item.severity]), [['focus-off-screen', ['2.4.7'], 'serious']]);
});

test('the check\'s findings are valid evidence', () => {
  const findings = [
    ...focusFindings({ selector: 'td', step: 's', change: { changed: 0, ratio: 1, color: null, area: 0 } }),
    ...componentFindings({ kind: 'icon-contrast', selector: 'x', ratio: 1.5, foreground: [200, 200, 200], background: WHITE }),
    ...obscuredFindings({ selector: 'td', step: 's', visible: 0, points: 25 }),
  ];

  assert.deepEqual(validatePart({ schema: EVIDENCE_SCHEMA, target: { page: 'grid', theme: 'main' }, durationMs: 1, findings }), []);
});
