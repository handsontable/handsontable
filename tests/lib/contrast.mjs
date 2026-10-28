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
// A part whose strongest pixel stands less than this from its background draws nothing there. The focus
// contrast check skips a grid line this faint (a theme that leaves the line out), never a part of a
// component: it skips a part the browser does not paint, and a painted part this faint is the worst failure.
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
 * The contrast of a part of a component captured with a margin around it, read from the pixels inside
 * its box only, so text beside an icon that reaches into the margin never stands in for it. The row of
 * pixels just outside the box, which antialiasing shares between the part and what is next to it,
 * counts as neither.
 *
 * - An icon (no `band`): its strongest pixel against the capture's most common color, the header or
 *   the button fill it sits on.
 * - A control with an edge (`band`, a checkbox): the strongest pixel of its outer band of that many
 *   pixels (its border or its fill) against the margin's most common color, so a checked box's fill is
 *   judged against the cell around it; with `mark`, also the strongest pixel inside the band (the check
 *   mark) against the box's own fill. The weaker of the two is the result: each identifies the control
 *   or its state.
 *
 * @param {{width: number, height: number, data: number[]}} image The capture, RGBA.
 * @param {{x: number, y: number, width: number, height: number}} box The part's box in the capture, in whole pixels.
 * @param {{band?: number, mark?: boolean}} [options] How the part is drawn.
 * @returns {{color: number[], ratio: number, background: number[]}} The part's pixel, its contrast, and the color it was measured against.
 */
export function partContrast(image, box, { band, mark = false } = {}) {
  const around = { data: [] };
  const edge = { data: [] };
  const inside = { data: [] };

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4;
      const pixel = [image.data[index], image.data[index + 1], image.data[index + 2], 255];
      // How many pixels in from the box's edge: 0 is its outermost row, -1 the shared row outside it.
      const depth = Math.min(x - box.x, box.x + box.width - 1 - x, y - box.y, box.y + box.height - 1 - y);

      if (depth < -1) {
        around.data.push(...pixel);
      } else if (depth >= 0 && (band === undefined || depth < band)) {
        edge.data.push(...pixel);
      } else if (depth >= 0) {
        inside.data.push(...pixel);
      }
    }
  }

  const backdrop = dominantColor(image);

  if (edge.data.length === 0) {
    return { color: backdrop, ratio: 1, background: backdrop };
  }
  if (band === undefined) {
    return { ...strongestPixel(edge, backdrop), background: backdrop };
  }

  const background = around.data.length > 0 ? dominantColor(around) : backdrop;
  const outer = { ...strongestPixel(edge, background), background };

  if (!mark || inside.data.length === 0) {
    return outer;
  }

  const fill = dominantColor(inside);
  const check = { ...strongestPixel(inside, fill), background: fill };

  return check.ratio < outer.ratio ? check : outer;
}

/**
 * What changed between a capture before the focus arrived and one after: the pixels that moved by more
 * than the noise floor. Two measures of the indicator, each the 90th percentile of the changed pixels
 * (the indicator's solid core rather than its antialiased edge): `ratio`, each changed pixel against
 * itself before the change (that pixel is `replacedColor`, what it replaced `replaced`), and
 * `adjacentRatio`, against the colors next to the indicator after it appeared (that pixel is `color`,
 * the colors `adjacent`, the most common pixel that did not change). 1.4.11 asks for the second: a ring
 * drawn over a grid line is judged against the cell beside it, not against the line it covers. With a
 * `margin`, `adjacent` is read from the unchanged pixels of the capture's outer band of that width, the
 * margin around the element: a control with a fill of its own fills most of its capture, and a ring
 * around it is judged against what lies around the control, not against the fill.
 *
 * @param {{width?: number, height?: number, data: number[]}} before The capture before.
 * @param {{width?: number, height?: number, data: number[]}} after The capture after, the same size.
 * @param {number} [margin] The width of the margin around the element, in pixels; 0 reads the whole capture.
 * @returns {{changed: number, ratio: number, replacedColor: number[]|null, replaced: number[]|null, color: number[]|null, adjacent: number[]|null, adjacentRatio: number, area: number}} The change.
 */
export function indicatorChange(before, after, margin = 0) {
  const changes = [];
  const unchanged = { data: [] };
  const around = { data: [] };
  const width = after.width ?? before.width;
  const height = after.height ?? before.height;

  for (let index = 0; index < before.data.length; index += 4) {
    const old = [before.data[index], before.data[index + 1], before.data[index + 2]];
    const current = [after.data[index], after.data[index + 1], after.data[index + 2]];

    if (current.some((channel, position) => Math.abs(channel - old[position]) > NOISE)) {
      changes.push({ color: current, replaced: old, ratio: contrastRatio(current, old) });
    } else {
      unchanged.data.push(...current, 255);
      if (margin > 0) {
        const x = (index / 4) % width;
        const y = Math.floor(index / 4 / width);

        if (x < margin || y < margin || x >= width - margin || y >= height - margin) {
          around.data.push(...current, 255);
        }
      }
    }
  }
  if (changes.length === 0) {
    return { changed: 0, ratio: 1, replacedColor: null, replaced: null, color: null, adjacent: null, adjacentRatio: 1, area: 0 };
  }

  const percentile = list => list[Math.min(list.length - 1, Math.floor(list.length * 0.9))];
  const core = percentile([...changes].sort((a, b) => a.ratio - b.ratio));
  let adjacent = null;

  if (around.data.length > 0) {
    adjacent = dominantColor(around);
  } else if (unchanged.data.length > 0) {
    adjacent = dominantColor(unchanged);
  }

  const againstAdjacent = adjacent
    ? percentile(changes.map(item => ({ color: item.color, ratio: contrastRatio(item.color, adjacent) })).sort((a, b) => a.ratio - b.ratio))
    : core;

  return {
    changed: changes.length, ratio: core.ratio, replacedColor: core.color, replaced: core.replaced,
    color: againstAdjacent.color, adjacent, adjacentRatio: againstAdjacent.ratio, area: changes.length,
  };
}

/**
 * The findings of a focus indicator: no visible change when the focus arrived (2.4.7), or a change
 * under 3:1 against the colors next to it, or against what it replaced for a highlight that repaints
 * the element (1.4.11, and 2.4.7 because a faint indicator is barely visible). The finding names the
 * two colors its ratio is between.
 *
 * @param {object} input The measurement.
 * @param {string} input.selector What took the focus.
 * @param {string} input.step How the focus got there.
 * @param {{changed: number, ratio: number, color: number[]|null, adjacent?: number[]|null, adjacentRatio?: number, replacedColor?: number[]|null, replaced?: number[]|null}} input.change What `indicatorChange()` returned.
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
  const adjacent = against === 'adjacent' && change.adjacentRatio !== undefined;
  const ratio = adjacent ? change.adjacentRatio : change.ratio;
  const color = adjacent ? change.color : (change.replacedColor ?? change.color);
  let background = 'what it replaced';

  if (adjacent && change.adjacent) {
    background = rgb(change.adjacent);
  } else if (!adjacent && change.replaced) {
    background = rgb(change.replaced);
  }

  if (ratio < NON_TEXT_RATIO) {
    return [{
      kind: 'focus-indicator-contrast', criteria: ['1.4.11', '2.4.7'], severity: 'serious', selector, step,
      measured: { ratio: floorRatio(ratio), color: rgb(color), against: background, changed: change.changed },
      reason: `The focus indicator stands ${floorRatio(ratio)}:1 from ${adjacent ? 'the colors next to it' : 'what it replaced'}, under the 3:1 a focus indicator needs`,
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
    measured: { ratio: floorRatio(ratio), foreground: rgb(foreground), background: rgb(background) },
    reason: reason ?? `The part stands ${floorRatio(ratio)}:1 from what is next to it, under the 3:1 that identifies a component or its state`,
  }];
}

/**
 * The finding of a focused element that nothing of it shows: every sampled point of its box inside
 * the window is under another element (2.4.11). A partly covered element passes 2.4.11; the count is
 * kept for 2.4.12. A point outside the window is not covered by anything, so it is not sampled. An
 * element with no sampled point inside the window is off screen, or shows at most a sixth of itself at
 * the window's edge (2.4.7).
 *
 * @param {object} input The measurement.
 * @param {string} input.selector The focused element.
 * @param {string} input.step How the focus got there.
 * @param {number} input.visible The sampled points where the element is on top.
 * @param {number} input.points The points sampled, the ones inside the window.
 * @returns {object[]} The findings.
 */
export function obscuredFindings({ selector, step, visible, points }) {
  if (points === 0) {
    return [{
      kind: 'focus-off-screen', criteria: ['2.4.7'], severity: 'serious', selector, step,
      measured: { visible, points },
      reason: 'No sampled point of the focused element is inside the window: it is off screen, or at most a sixth of it shows at the window\'s edge',
    }];
  }
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
 * The name of a measured element that no element measured before it in the same target has: its label,
 * or its label with an ordinal (`button.ht-button "Action" (2)`). A finding's id keys on its element, so
 * two controls with one label (a notification's two "Action" buttons) would give two findings one id,
 * and they would read as one finding in a diff between runs.
 *
 * @param {string} label The element's label.
 * @param {string[]} taken The names of the elements measured before it.
 * @returns {string} The name.
 */
export function distinctName(label, taken) {
  let name = label;

  for (let ordinal = 2; taken.includes(name); ordinal++) {
    name = `${label} (${ordinal})`;
  }

  return name;
}

/**
 * A ratio to two decimals, rounded down, as a finding shows it: WCAG compares the ratio unrounded, so
 * 2.996:1 fails 3:1 and must never read as 3. The epsilon keeps a ratio such as 2.3, which floats as
 * 229.99999999999997 hundredths, at 2.3.
 *
 * @param {number} ratio The ratio.
 * @returns {number} The ratio, rounded down to two decimals.
 */
export function floorRatio(ratio) {
  return Math.floor(ratio * 100 + 1e-9) / 100;
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
