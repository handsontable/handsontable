/**
 * Focus appearance and non-text contrast: the pure half.
 *
 * `a11y/checks/focus-contrast.spec.ts` captures the pixels of a small area of the page (a cell before
 * and after it takes the focus, an icon, a checkbox) and the colors the page resolves; the arithmetic
 * and every verdict are here. WCAG 2.2's relative luminance and contrast ratio, on sRGB pixels: the
 * themes mix colors with transparency, so a computed style is not the color a user sees, and a pixel
 * is. The criteria: 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum) and 1.4.11 Non-text
 * Contrast. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export const FOCUS_CHECK = 'focus-contrast';
export const FOCUS_CRITERIA = ['1.4.11', '2.4.7', '2.4.11'];
// 1.4.11's ratio for a part of a component, a state and a focus indicator.
export const NON_TEXT_RATIO = 3;
// A channel that moved by this much or less between two captures is antialiasing or compression, not a change.
const NOISE = 8;
// A part whose strongest pixel stands less than this from its background draws nothing there (an arrow
// under an open editor, a grid line a theme leaves out): there is nothing to measure.
const DRAWN = 1.05;

/**
 * The relative luminance of an sRGB color, as WCAG 2.2 defines it.
 *
 * @param {number[]} color `[r, g, b]`, 0 to 255.
 * @returns {number} The luminance, 0 to 1.
 */
export function relativeLuminance([r, g, b]) {
  const channel = (value) => {
    const unit = value / 255;

    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * The contrast ratio of two colors, the lighter over the darker.
 *
 * @param {number[]} a A color.
 * @param {number[]} b Another.
 * @returns {number} The ratio, 1 to 21.
 */
export function contrastRatio(a, b) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);

  return (light + 0.05) / (dark + 0.05);
}

/**
 * A translucent color over an opaque one, as the browser paints it.
 *
 * @param {number[]} color `[r, g, b, a]`, the alpha 0 to 1.
 * @param {number[]} background `[r, g, b]`.
 * @returns {number[]} The painted color, `[r, g, b]`.
 */
export function composite([r, g, b, a = 1], background) {
  return [r, g, b].map((channel, index) => Math.round(channel * a + background[index] * (1 - a)));
}

/**
 * The color of the most pixels of an image: its background, for an icon or a checkbox captured with a
 * margin around it.
 *
 * @param {{data: number[]}} image The image, RGBA.
 * @returns {number[]} The color.
 */
export function dominantColor(image) {
  const counts = new Map();
  let best = null;

  for (let index = 0; index < image.data.length; index += 4) {
    const key = `${image.data[index]},${image.data[index + 1]},${image.data[index + 2]}`;
    const count = (counts.get(key) ?? 0) + 1;

    counts.set(key, count);
    if (!best || count > counts.get(best)) {
      best = key;
    }
  }

  return best.split(',').map(Number);
}

/**
 * The pixel with the most contrast against a background, and that contrast: the drawn part of an
 * icon or of a checkbox's box, wherever antialiasing softened its edges.
 *
 * @param {{data: number[]}} image The image, RGBA.
 * @param {number[]} background The background.
 * @returns {{color: number[], ratio: number}} The pixel.
 */
export function strongestPixel(image, background) {
  let best = { color: background, ratio: 1 };

  for (let index = 0; index < image.data.length; index += 4) {
    const color = [image.data[index], image.data[index + 1], image.data[index + 2]];
    const ratio = contrastRatio(color, background);

    if (ratio > best.ratio) {
      best = { color, ratio };
    }
  }

  return best;
}

/**
 * Whether a part draws anything: its strongest pixel stands out from its background.
 *
 * @param {{ratio: number}} part What `strongestPixel()` returned.
 * @returns {boolean} Whether something is drawn.
 */
export function isDrawn(part) {
  return part.ratio >= DRAWN;
}

/**
 * What changed between a capture before the focus arrived and one after: the pixels that moved by more
 * than the noise floor. Two measures of the indicator, each the 90th percentile of the changed pixels
 * (the indicator's solid core rather than its antialiased edge): `ratio`, each changed pixel against
 * itself before the change, and `adjacentRatio`, against the colors next to the indicator after it
 * appeared (`adjacent`, the most common pixel that did not change). 1.4.11 asks for the second: a ring
 * drawn over a grid line is judged against the cell beside it, not against the line it covers.
 *
 * @param {{data: number[]}} before The capture before.
 * @param {{data: number[]}} after The capture after, the same size.
 * @returns {{changed: number, ratio: number, color: number[]|null, adjacent: number[]|null, adjacentRatio: number, area: number}} The change.
 */
export function indicatorChange(before, after) {
  const changes = [];
  const unchanged = { data: [] };

  for (let index = 0; index < before.data.length; index += 4) {
    const old = [before.data[index], before.data[index + 1], before.data[index + 2]];
    const current = [after.data[index], after.data[index + 1], after.data[index + 2]];

    if (current.some((channel, position) => Math.abs(channel - old[position]) > NOISE)) {
      changes.push({ color: current, ratio: contrastRatio(current, old) });
    } else {
      unchanged.data.push(...current, 255);
    }
  }
  if (changes.length === 0) {
    return { changed: 0, ratio: 1, color: null, adjacent: null, adjacentRatio: 1, area: 0 };
  }

  const percentile = list => list[Math.min(list.length - 1, Math.floor(list.length * 0.9))];
  const core = percentile([...changes].sort((a, b) => a.ratio - b.ratio));
  const adjacent = unchanged.data.length > 0 ? dominantColor(unchanged) : null;
  const againstAdjacent = adjacent
    ? percentile(changes.map(item => ({ color: item.color, ratio: contrastRatio(item.color, adjacent) })).sort((a, b) => a.ratio - b.ratio))
    : core;

  return { changed: changes.length, ratio: core.ratio, color: againstAdjacent.color, adjacent, adjacentRatio: againstAdjacent.ratio, area: changes.length };
}

/**
 * The findings of a focus indicator: no visible change when the focus arrived (2.4.7), or a change
 * whose contrast against what was there is under 3:1 (1.4.11, and 2.4.7 because a faint indicator is
 * barely visible).
 *
 * @param {object} input The measurement.
 * @param {string} input.selector What took the focus.
 * @param {string} input.step How the focus got there.
 * @param {{changed: number, ratio: number, color: number[]|null, adjacentRatio?: number}} input.change What `indicatorChange()` returned.
 * @param {'adjacent'|'before'} [input.against] What the indicator is judged against: the colors next to it (a ring, an
 *   outline), or what it replaced (a state that repaints the element itself, such as a menu item's highlight).
 * @returns {object[]} The findings.
 */
export function focusFindings({ selector, step, change, against = 'adjacent' }) {
  if (change.changed === 0) {
    return [{
      kind: 'focus-not-visible', criteria: ['2.4.7'], severity: 'serious', selector, step,
      measured: { changed: 0 },
      reason: 'Nothing on screen changed when the element took the keyboard focus',
    }];
  }
  const ratio = against === 'adjacent' && change.adjacentRatio !== undefined ? change.adjacentRatio : change.ratio;

  if (ratio < NON_TEXT_RATIO) {
    return [{
      kind: 'focus-indicator-contrast', criteria: ['1.4.11', '2.4.7'], severity: 'serious', selector, step,
      measured: { ratio: round(ratio), color: rgb(change.color), against: against === 'adjacent' && change.adjacent ? rgb(change.adjacent) : 'what it replaced', changed: change.changed },
      reason: `The focus indicator stands ${round(ratio)}:1 from ${against === 'adjacent' ? 'the colors next to it' : 'what it replaced'}, under the 3:1 a focus indicator needs`,
    }];
  }

  return [];
}

/**
 * The finding of a part of a component that identifies it or its state (an icon, a checkbox's box, a
 * selection outline, a grid line): under 3:1 against what is next to it (1.4.11).
 *
 * @param {object} input The measurement.
 * @param {string} input.kind The finding's kind (`icon-contrast`, `checkbox-contrast`).
 * @param {string} input.selector The element.
 * @param {number} input.ratio The contrast.
 * @param {number[]} input.foreground The part's color.
 * @param {number[]} input.background What is next to it.
 * @param {string} [input.severity] The severity; `serious` unless the part only helps.
 * @param {string} [input.step] How the state was reached.
 * @param {string} [input.reason] Why the part matters.
 * @returns {object[]} The findings.
 */
export function componentFindings({ kind, selector, ratio, foreground, background, severity = 'serious', step, reason }) {
  if (ratio >= NON_TEXT_RATIO) {
    return [];
  }

  return [{
    kind, criteria: ['1.4.11'], severity, selector, ...(step ? { step } : {}),
    measured: { ratio: round(ratio), foreground: rgb(foreground), background: rgb(background) },
    reason: reason ?? `The part stands ${round(ratio)}:1 from what is next to it, under the 3:1 that identifies a component or its state`,
  }];
}

/**
 * The finding of a focused element that nothing of it shows: every sampled point of its box is under
 * another element (2.4.11). A partly covered element passes 2.4.11; the count is kept for 2.4.12.
 *
 * @param {object} input The measurement.
 * @param {string} input.selector The focused element.
 * @param {string} input.step How the focus got there.
 * @param {number} input.visible The sampled points where the element is on top.
 * @param {number} input.points The points sampled.
 * @returns {object[]} The findings.
 */
export function obscuredFindings({ selector, step, visible, points }) {
  if (visible > 0) {
    return [];
  }

  return [{
    kind: 'focus-obscured', criteria: ['2.4.11'], severity: 'serious', selector, step,
    measured: { visible, points },
    reason: 'The focused element is entirely hidden by other content the page draws over it',
  }];
}

/**
 * A ratio to two decimals.
 *
 * @param {number} ratio The ratio.
 * @returns {number} The rounded ratio.
 */
function round(ratio) {
  return Math.round(ratio * 100) / 100;
}

/**
 * A color as CSS text.
 *
 * @param {number[]|null} color The color.
 * @returns {string} The text.
 */
function rgb(color) {
  return color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : 'none';
}
