/**
 * What the site checks judge from boxes, pixels and computed styles, beside the product checks' own judges
 * (`lib/contrast.mjs`, `lib/reflow.mjs`, `lib/motion.mjs`), which the site specs reuse for the focus indicator,
 * clipped text, overlapping controls and motion. The pure half.
 *
 * - 1.4.10: a page that scrolls sideways at 320 CSS px. A scroll container that scrolls its own content (a code
 *   block, a wide table, an embedded grid) is the two-dimensional content the criterion exempts, so only what
 *   pushes the page itself wider counts.
 * - 1.3.4: the main content missing in one orientation.
 * - 1.4.11: a text field or a select whose boundary and fill both stand under 3:1 from the page around it.
 * - 1.4.1 in forced colors: an element whose state (the current page, a selected tab, a pressed button) shows
 *   only in colors that forced colors replaces, so its state and a sibling's look the same. Moderate: the state
 *   still reaches a screen reader (it is an ARIA state), and its place often says it too (a breadcrumb's last item).
 *
 * Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe". No I/O in here.
 */
import { NON_TEXT_RATIO, contrastRatio, dominantColor, floorRatio, strongestPixel } from './contrast.mjs';
import { CONDITIONS } from './reflow.mjs';

// A pixel of rounding between the page and the viewport is not a scroll.
const TOLERANCE = 1;
/**
 * The computed style properties that can show a state without color alone, and the colors forced colors keeps
 * apart (system colors stand for roles: `Highlight` for a selection, `LinkText` for a link). A state whose
 * signature equals its sibling's is invisible in forced colors.
 */
export const STATE_SIGNATURE = ['background-color', 'color', 'border-top-color', 'border-top-width', 'border-left-color',
  'border-left-width', 'border-bottom-color', 'border-bottom-width', 'outline-style', 'outline-color', 'font-weight',
  'text-decoration-line', 'box-shadow'];

/**
 * The finding of a page that scrolls sideways at 320 CSS px (1.4.10): the page is wider than the viewport,
 * and the widest element that pushes it past the edge is named, with the next two.
 *
 * @param {object} input The measurement.
 * @param {string} input.condition The condition (`CONDITIONS` of `lib/reflow.mjs`); only `reflow-320` judges a sideways scroll.
 * @param {{width: number, scrollWidth: number}} input.viewport The viewport and the page's scroll width.
 * @param {Array<{selector: string, right: number}>} input.offenders The outermost elements that reach past the
 *   viewport's right edge outside every scroll container, widest first.
 * @param {number} [input.exempt] How many elements past the edge are content 1.4.10 exempts (a data table, preformatted
 *   code): a page they alone push wider passes, and one that scrolls with neither is named by `html`.
 * @returns {object[]} The findings.
 */
export function pageReflowFindings({ condition, viewport, offenders, exempt = 0 }) {
  const { criteria, label } = CONDITIONS[condition];

  if (!criteria.includes('1.4.10') || viewport.scrollWidth <= viewport.width + TOLERANCE || (offenders.length === 0 && exempt > 0)) {
    return [];
  }

  const widest = offenders[0];

  return [{
    kind: 'page-scrolls-sideways', criteria, severity: 'serious', selector: widest?.selector ?? 'html', step: label,
    measured: {
      scrollWidth: Math.round(viewport.scrollWidth), width: viewport.width,
      offenders: offenders.slice(0, 3).map(item => item.selector).join(' | ').slice(0, 200),
    },
    reason: `The page is ${Math.round(viewport.scrollWidth - viewport.width)} px wider than the viewport, so reading it needs a second scroll direction`,
  }];
}

/**
 * The finding of a page whose main content shows in one orientation and not the other (1.3.4).
 *
 * @param {Record<'portrait'|'landscape', {width: number, height: number}>} sizes The main content's box in each.
 * @returns {object[]} The findings.
 */
export function orientationFindings(sizes) {
  return Object.entries(sizes)
    .filter(([, size]) => size.width * size.height === 0)
    .map(([orientation]) => ({
      kind: 'orientation-locked', criteria: ['1.3.4'], severity: 'serious', selector: 'main', step: orientation,
      measured: { orientation },
      reason: `The main content does not show in ${orientation} orientation`,
    }));
}

/**
 * Whether a focus stop's shape names a form field (an input, a text area or a select), whose boundary 1.4.11
 * measures. The kind is read from the stop's own part, the last one: an element with no class or role of its own
 * is named inside a classed ancestor (`label.option-label input`), so a match at the start of the shape alone
 * missed exactly the plain fields.
 *
 * @param {string} shape The stop's shape, as the harness reads it.
 * @returns {boolean} The verdict.
 */
export function isFieldShape(shape) {
  return /(?:^|\s)(?:input|textarea|select)(?=[.[]|$)/.test(shape);
}

// The roles Chromium's tree gives a field a visitor types into or picks from.
const FIELD_ROLES = new Set(['textbox', 'searchbox', 'combobox', 'listbox', 'spinbutton']);

/**
 * Whether a focus stop is a field whose own box 1.4.11 measures (`boundaryFindings()`): a field's shape
 * (`isFieldShape()`, read without a round trip, so it picks the stops worth asking about) that the accessibility tree
 * gives a field's role. A checkbox, a radio button, a switch or a range is an input too, but a styled one often draws
 * nothing in its own box (opacity 0, `appearance: none`, visually hidden) and shows a sibling instead, so its box
 * would read as a field with no edge.
 *
 * @param {{shape: string, role: string}} stop The stop's shape, and its role as the accessibility tree gives it.
 * @returns {boolean} The verdict.
 */
export function isFieldStop({ shape, role }) {
  return isFieldShape(shape) && FIELD_ROLES.has(role);
}

/**
 * How far an outline reaches past its element's box: its offset plus its width, when it shows. An inset outline
 * (a negative offset) reaches no further than the box, and one with no style or no width reaches nothing.
 *
 * @param {{style: string, width: number, offset: number}} outline The computed outline.
 * @returns {number} The reach, in CSS pixels.
 */
export function outlineReach({ style, width, offset }) {
  if (style === 'none' || style === 'hidden' || !(width > 0)) {
    return 0;
  }

  return Math.max(0, offset + width);
}

/**
 * How far a box shadow reaches past its element's box: for each outer layer, its spread, its blur and the larger of
 * its offsets; the furthest layer counts. An inset layer draws inside the box. A ring drawn with a shadow (a 2 px
 * gap and a 4 px ring, `0 0 0 2px white, 0 0 0 6px blue`) ends 6 px out, past the margin of the capture.
 *
 * @param {string} shadow The computed `box-shadow` (`none`, or layers as Chromium serializes them: the color first,
 *   then the lengths).
 * @returns {number} The reach, in CSS pixels.
 */
export function shadowReach(shadow) {
  if (!shadow || shadow === 'none') {
    return 0;
  }

  // Layers split on the commas outside parentheses (`rgb(0, 0, 0)` keeps its own).
  return Math.max(0, ...shadow.split(/,(?![^(]*\))/).map((layer) => {
    if (/\binset\b/.test(layer)) {
      return 0;
    }

    const lengths = (layer.replace(/[a-z]+\([^)]*\)/gi, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat);
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths;

    return Math.max(0, Math.max(Math.abs(x), Math.abs(y)) + blur + spread);
  }));
}

/**
 * The area a focus indicator paints, to capture before and after the focus arrives: the element's box grown by its
 * own ring's reach (its outline, `outlineReach()`, or its shadow, `shadowReach()`), and the box of each other ring
 * the focus drew, grown by that ring's reach: an ancestor's (a card ringed through `:has()` or `:focus-within`) or
 * the element's own pseudo-element's (a link's overlay stretched over its card). A ring 4 px off its element (an
 * offset of 4 px and a width of 2 px) lies past the margin, so a capture of the box alone saw nothing change.
 *
 * @param {{box: {x: number, y: number, width: number, height: number}, outline: {style: string, width: number, offset: number}, shadow?: string}} element
 *   The focused element: its box, its outline and its shadow while focused.
 * @param {Array<{box: {x: number, y: number, width: number, height: number}, outline: {style: string, width: number, offset: number}, shadow?: string}>} [rings]
 *   The other rings the focus drew (`changedRings()`), read while focused.
 * @returns {{x: number, y: number, width: number, height: number}} The area, in page pixels.
 */
export function focusExtent(element, rings = []) {
  const reach = ({ box, outline, shadow }) => {
    const by = Math.max(outlineReach(outline), shadowReach(shadow));

    return { left: box.x - by, top: box.y - by, right: box.x + box.width + by, bottom: box.y + box.height + by };
  };
  const parts = [element, ...rings].map(reach);
  const left = Math.min(...parts.map(part => part.left));
  const top = Math.min(...parts.map(part => part.top));

  return {
    x: left,
    y: top,
    width: Math.max(...parts.map(part => part.right)) - left,
    height: Math.max(...parts.map(part => part.bottom)) - top,
  };
}

/**
 * The rings the focus drew around a control on something other than the control itself: the ancestors and
 * pseudo-elements whose ring differs between the focused read and the read at rest. A part counts only when its
 * focused read draws a ring (an outline that shows, or a box shadow) that the read at rest does not draw the same,
 * and its box did not move: a text color a wrapper takes through `:focus-within` draws no ring, and a box that
 * appears or moves with the focus is a popup the focus opened, not the indicator. Both are left out, so neither
 * pulls a whole wrapper into the capture, where its change would pass a control that draws nothing of its own.
 *
 * @param {Array<{box: {x: number, y: number, width: number, height: number}, outline: {style: string, width: number, offset: number, color?: string}, shadow?: string}|null>} focused
 *   Each part read while the control had the focus (`null`: the part was not rendered then).
 * @param {Array<{box: {x: number, y: number, width: number, height: number}, outline: {style: string, width: number, offset: number, color?: string}, shadow?: string}|null>} rest
 *   The same parts read at rest, in the same order.
 * @returns {Array<{box: {x: number, y: number, width: number, height: number}, outline: {style: string, width: number, offset: number}, shadow?: string}>} The rings, as read while focused.
 */
export function changedRings(focused, rest) {
  const ring = (part) => {
    const shows = part.outline.style !== 'none' && part.outline.style !== 'hidden' && part.outline.width > 0;
    const outline = shows ? `${part.outline.style} ${part.outline.width} ${part.outline.offset} ${part.outline.color ?? ''}` : 'none';

    return `${outline} | ${part.shadow && part.shadow !== 'none' ? part.shadow : 'none'}`;
  };
  const draws = part => ring(part) !== 'none | none';
  const sameBox = (one, other) => ['x', 'y', 'width', 'height'].every(key => Math.abs(one.box[key] - other.box[key]) < 1);

  return focused.flatMap((part, index) => {
    const before = rest[index];

    if (!part || !draws(part) || (before && (ring(before) === ring(part) || !sameBox(part, before)))) {
      return [];
    }

    return [part];
  });
}

/**
 * The box of an absolutely placed `::before` or `::after`, which the DOM does not give: its containing block's
 * padding box offset by the pseudo-element's resolved `left` and `top`, at its resolved size. A fixed one is placed
 * in the viewport. Known limits: a containing block made by a transform, a filter or `contain` (the nearest
 * positioned element is taken instead), a scrolled containing block, and a transform on the pseudo-element itself.
 *
 * @param {{x: number, y: number, clientLeft: number, clientTop: number}|null} block The containing block's border box
 *   corner and its border widths, or `null` for a fixed pseudo-element (the viewport).
 * @param {{left: string, top: string, width: string, height: string}} style The pseudo-element's resolved values.
 * @returns {{x: number, y: number, width: number, height: number}} Its box, in page pixels.
 */
export function pseudoRingBox(block, style) {
  const origin = block ? { x: block.x + block.clientLeft, y: block.y + block.clientTop } : { x: 0, y: 0 };

  return {
    x: origin.x + (parseFloat(style.left) || 0),
    y: origin.y + (parseFloat(style.top) || 0),
    width: parseFloat(style.width) || 0,
    height: parseFloat(style.height) || 0,
  };
}

/**
 * An element's box placed in a capture of an area around it. A capture is clipped from the whole pixel at or before
 * the area's corner (`capture()` floors it), so the box is placed from that pixel. Placed from the area's own
 * corner, a box was read up to a pixel off whenever the corner fell between pixels, and a field's 1 px edge then lay
 * outside the band that measures it.
 *
 * @param {{x: number, y: number, width: number, height: number}} box The element's box, in page pixels.
 * @param {{x: number, y: number}} area The captured area's corner, in page pixels.
 * @returns {{x: number, y: number, width: number, height: number}} The box, in pixels from the capture's corner.
 */
export function boxInCapture(box, area) {
  return { x: box.x - Math.floor(area.x), y: box.y - Math.floor(area.y), width: box.width, height: box.height };
}

/**
 * A box grown to the whole pixels it touches, the pixels a capture holds of it.
 *
 * @param {{x: number, y: number, width: number, height: number}} box The box.
 * @returns {{x: number, y: number, width: number, height: number}} The box on whole pixels.
 */
export function pixelBox(box) {
  const x = Math.floor(box.x);
  const y = Math.floor(box.y);

  return { x, y, width: Math.ceil(box.x + box.width) - x, height: Math.ceil(box.y + box.height) - y };
}

/**
 * A control's edge (its outer two pixels' strongest pixel) and its fill (its inside's most common color), each
 * against the most common color of the page around it (the capture's pixels more than a pixel outside the box).
 *
 * @param {{width: number, height: number, data: number[]}} image The capture at rest, with the page around the
 *   control.
 * @param {{x: number, y: number, width: number, height: number}} box The control's box inside the capture
 *   (`boxInCapture()`).
 * @returns {{boundary: {color: number[], ratio: number}, fill: {color: number[], ratio: number}, around: number[]}} The boundary.
 */
export function boundaryOf(image, box) {
  const around = { data: [] };
  const edge = { data: [] };
  const inside = { data: [] };

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4;
      const pixel = [image.data[index], image.data[index + 1], image.data[index + 2], 255];
      const depth = Math.min(x - Math.round(box.x), Math.round(box.x + box.width) - 1 - x, y - Math.round(box.y),
        Math.round(box.y + box.height) - 1 - y);

      if (depth < -1) {
        around.data.push(...pixel);
      } else if (depth >= 0 && depth < 2) {
        edge.data.push(...pixel);
      } else if (depth >= 2) {
        inside.data.push(...pixel);
      }
    }
  }

  const background = around.data.length > 0 ? dominantColor(around) : dominantColor(image);
  const fill = inside.data.length > 0 ? dominantColor(inside) : background;

  return {
    boundary: edge.data.length > 0 ? strongestPixel(edge, background) : { color: background, ratio: 1 },
    fill: { color: fill, ratio: contrastRatio(fill, background) },
    around: background,
  };
}

/**
 * The 1.4.11 finding of a text field or a select that nothing sets apart from the page: its boundary and its fill
 * both stand under 3:1 from the color around it. A control set apart by either passes.
 *
 * @param {object} input The measurement.
 * @param {string} input.selector The control.
 * @param {{ratio: number, color: number[]}} input.boundary The strongest pixel of its edge against the color around it.
 * @param {{ratio: number, color: number[]}} input.fill Its fill against the color around it.
 * @param {number[]} input.around The color around it.
 * @returns {object[]} The findings.
 */
export function boundaryFindings({ selector, boundary, fill, around }) {
  if (boundary.ratio >= NON_TEXT_RATIO || fill.ratio >= NON_TEXT_RATIO) {
    return [];
  }

  return [{
    kind: 'control-boundary-contrast', criteria: ['1.4.11'], severity: 'serious', selector,
    measured: { boundary: floorRatio(boundary.ratio), fill: floorRatio(fill.ratio), around: `rgb(${around.slice(0, 3).join(', ')})` },
    reason: `Neither the control's edge (${floorRatio(boundary.ratio)}:1) nor its fill (${floorRatio(fill.ratio)}:1) stands 3:1 from the page around it, so it is hard to tell where the field is`,
  }];
}

/**
 * A style signature as it paints: a transparent background shows what is behind it (`behind`, read in the page),
 * a border color with no border width and an outline color with no outline show nothing. In forced colors Chromium
 * paints a background with Canvas but keeps its alpha, so a filled item reads `rgb(255, 255, 255)` and a transparent
 * sibling `rgba(255, 255, 255, 0)`: two strings, one look.
 *
 * @param {Record<string, string>} signature The computed values, with `behind` when the page read it.
 * @returns {Record<string, string>} The values as they paint.
 */
function painted(signature) {
  const result = { ...signature };

  if (alphaOf(result['background-color']) === 0) {
    result['background-color'] = signature.behind ?? 'transparent';
  }
  for (const side of ['top', 'left', 'bottom']) {
    if (Number.parseFloat(result[`border-${side}-width`] ?? '0') === 0) {
      result[`border-${side}-color`] = '';
      result[`border-${side}-width`] = '0px';
    }
  }
  if ((result['outline-style'] ?? 'none') === 'none') {
    result['outline-color'] = '';
  }

  return result;
}

/**
 * The alpha of a computed color (`rgb()`, `rgba()`, `transparent`); 1 when it gives none.
 *
 * @param {string|undefined} color The color.
 * @returns {number} The alpha.
 */
function alphaOf(color) {
  if (color === 'transparent') {
    return 0;
  }

  const parts = /^rgba?\(([^)]*)\)$/.exec(String(color ?? '').trim())?.[1].split(/[\s,/]+/).filter(Boolean) ?? [];

  return parts.length === 4 ? Number.parseFloat(parts[3]) : 1;
}

/**
 * The 1.4.1 finding of a state forced colors leaves invisible: the element in its state (the current page, a
 * selected tab) and a sibling of the same kind without it differ in some property without forced colors and in
 * none of `STATE_SIGNATURE` with them, each compared as it paints.
 *
 * @param {object} input The measurement.
 * @param {string} input.selector The element.
 * @param {string} input.state The state (`aria-current="page"`).
 * @param {{normal: Record<string, string>, forced: Record<string, string>}} input.element Its signature without and with forced colors,
 *   with `behind`: the background the nearest ancestor that paints one shows.
 * @param {{normal: Record<string, string>, forced: Record<string, string>}} input.sibling The sibling's.
 * @returns {object[]} The findings.
 */
export function stateLostFindings({ selector, state, element, sibling }) {
  const differs = (a, b) => {
    const [left, right] = [painted(a), painted(b)];

    return STATE_SIGNATURE.filter(property => (left[property] ?? '') !== (right[property] ?? ''));
  };

  if (differs(element.normal, sibling.normal).length === 0 || differs(element.forced, sibling.forced).length > 0) {
    return [];
  }

  return [{
    kind: 'state-lost-in-forced-colors', criteria: ['1.4.1'], severity: 'moderate', selector, step: state,
    measured: { normally: differs(element.normal, sibling.normal).join(' ').slice(0, 120) },
    reason: `In forced colors, the element ${state} looks the same as one without it: the state shows only in colors forced colors replaces`,
  }];
}
