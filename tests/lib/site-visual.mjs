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
import { NON_TEXT_RATIO, floorRatio } from './contrast.mjs';
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
 * @returns {object[]} The findings.
 */
export function pageReflowFindings({ condition, viewport, offenders }) {
  const { criteria, label } = CONDITIONS[condition];

  if (!criteria.includes('1.4.10') || viewport.scrollWidth <= viewport.width + TOLERANCE) {
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
    reason: `Neither the control's edge (${floorRatio(boundary.ratio)}:1) nor its fill (${floorRatio(fill.ratio)}:1) stands 3:1 from the page around it, so it is hard to tell where to type`,
  }];
}

/**
 * The 1.4.1 finding of a state forced colors leaves invisible: the element in its state (the current page, a
 * selected tab) and a sibling of the same kind without it differ in some property without forced colors and in
 * none of `STATE_SIGNATURE` with them.
 *
 * @param {object} input The measurement.
 * @param {string} input.selector The element.
 * @param {string} input.state The state (`aria-current="page"`).
 * @param {{normal: Record<string, string>, forced: Record<string, string>}} input.element Its signature without and with forced colors.
 * @param {{normal: Record<string, string>, forced: Record<string, string>}} input.sibling The sibling's.
 * @returns {object[]} The findings.
 */
export function stateLostFindings({ selector, state, element, sibling }) {
  const differs = (a, b) => STATE_SIGNATURE.filter(property => (a[property] ?? '') !== (b[property] ?? ''));

  if (differs(element.normal, sibling.normal).length === 0 || differs(element.forced, sibling.forced).length > 0) {
    return [];
  }

  return [{
    kind: 'state-lost-in-forced-colors', criteria: ['1.4.1'], severity: 'moderate', selector, step: state,
    measured: { normally: differs(element.normal, sibling.normal).join(' ').slice(0, 120) },
    reason: `In forced colors, the element ${state} looks the same as one without it: the state shows only in colors forced colors replaces`,
  }];
}
