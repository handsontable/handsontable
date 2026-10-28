/**
 * Zoom, reflow, text spacing and hover content: the pure half.
 *
 * `a11y/checks/reflow.spec.ts` loads each page under three conditions (`CONDITIONS`) and measures the
 * boxes of the surfaces around the grid: menus, the editors' lists, dialogs, notifications, the bars, the
 * comment editor, the overlays. The grid body is exempt: a data grid may scroll in two dimensions. It also
 * hovers a commented cell (1.4.13) and turns the viewport between portrait and landscape (1.3.4). What
 * counts as lost content is decided here. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

export const REFLOW_CHECK = 'reflow';
export const REFLOW_CRITERIA = ['1.3.4', '1.4.4', '1.4.10', '1.4.12', '1.4.13'];
/**
 * The conditions a page is measured under. `reflow-320` is 1.4.10's 320 CSS px, the width of a
 * 1280 px window at 400% zoom (256 px tall, the height the criterion gives content that scrolls
 * sideways); `zoom-200` is 1.4.4's 200%; `text-spacing` is 1.4.12's override (line height 1.5, paragraph
 * spacing 2, letter spacing 0.12 and word spacing 0.16, all times the font size), on a desktop window.
 */
export const CONDITIONS = Object.freeze({
  'reflow-320': { criteria: ['1.4.10'], viewport: { width: 320, height: 256 }, label: '320 CSS px wide (400% of 1280 by 1024)' },
  'zoom-200': { criteria: ['1.4.4'], viewport: { width: 640, height: 512 }, label: '200% zoom (640 by 512 CSS px)' },
  'text-spacing': { criteria: ['1.4.12'], viewport: { width: 1280, height: 720 }, label: 'the WCAG text-spacing override' },
});
/**
 * The text-spacing override 1.4.12 names, as one stylesheet, the way the W3C bookmarklet applies it.
 */
export const TEXT_SPACING_CSS = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }'
  + ' p { margin-bottom: 2em !important; }';
const CLIPPING = new Set(['hidden', 'clip']);
// A pixel of rounding between a box and its content is not a clip.
const TOLERANCE = 1;
// Two controls overlapping by less than this many square pixels share an antialiased edge, not a box.
const OVERLAP = 4;
// A box this many pixels square or smaller is screen-reader-only (the announcer's live regions,
// `utils/a11yAnnouncer.ts`, are 1 by 1 px with overflow hidden): its text is read out, never drawn.
const SCREEN_READER_ONLY = 1;

/**
 * Tells apart the items of one measurement that share a name: the second and later item with a name
 * get an ordinal (`div.htMenu (2)`), in the order the page lists them. A finding's id keys on its
 * selector (`findingId()` in `lib/a11y-evidence.mjs`), and the spec names an element by its tag, its
 * first class and its label, so the context menu and its submenu, or two pager buttons with one label,
 * would otherwise give two findings one id.
 *
 * @param {Array<{selector: string}>} items The surfaces, the controls, or the clipping containers of one measurement.
 * @returns {Array<{selector: string}>} Copies of the items, each with a name no earlier item has.
 */
export function nameApart(items) {
  const seen = new Map();

  return items.map((item) => {
    const count = (seen.get(item.selector) ?? 0) + 1;

    seen.set(item.selector, count);

    return count === 1 ? { ...item } : { ...item, selector: `${item.selector} (${count})` };
  });
}

/**
 * The text a clipping container cuts off: a container whose overflow is `hidden` or `clip` on an axis
 * and whose content is larger than its box on that axis. Cut off with an ellipsis it is truncated
 * (`moderate`: the text is shortened, not gone); cut off without one it is clipped (`serious`). A
 * screen-reader-only box (`SCREEN_READER_ONLY`) shows no text, so it cuts none off.
 *
 * @param {object} input The measurement.
 * @param {string} input.condition The condition (`CONDITIONS`).
 * @param {object[]} input.boxes The containers holding text: selector, surface, text, overflowX, overflowY,
 *   ellipsis, scrollWidth, clientWidth, scrollHeight, clientHeight.
 * @returns {object[]} The findings.
 */
export function clippingFindings({ condition, boxes }) {
  const { criteria, label } = CONDITIONS[condition];
  const findings = [];

  for (const box of boxes) {
    if (box.clientWidth <= SCREEN_READER_ONLY && box.clientHeight <= SCREEN_READER_ONLY) {
      continue;
    }

    const hiddenX = CLIPPING.has(box.overflowX) ? box.scrollWidth - box.clientWidth : 0;
    const hiddenY = CLIPPING.has(box.overflowY) ? box.scrollHeight - box.clientHeight : 0;
    const axis = hiddenX >= hiddenY ? 'x' : 'y';
    const hidden = Math.max(hiddenX, hiddenY);

    if (hidden <= TOLERANCE) {
      continue;
    }

    const truncated = box.ellipsis && axis === 'x';

    findings.push({
      kind: truncated ? 'text-truncated' : 'text-clipped',
      criteria,
      severity: truncated ? 'moderate' : 'serious',
      selector: box.selector,
      step: label,
      measured: { hidden, axis, surface: box.surface, text: String(box.text ?? '').trim().slice(0, 60) },
      reason: truncated
        ? `The ${box.surface} shortens its text with an ellipsis, so part of it cannot be read`
        : `The ${box.surface} cuts ${hidden} px of its text off`,
    });
  }

  return findings;
}

/**
 * The surfaces the viewport cuts off. A surface positioned against the viewport (`fixed`) that reaches
 * past it cannot be scrolled to (`outside-viewport`). Any other surface is placed in the page's own
 * coordinates (its box plus the scroll offset), and scrolling reaches from the page's origin to its
 * scroll size and no further: a part before the origin (a menu flipped above or left of the page) or
 * past the scroll size is out of reach too. Within reach, a surface past the viewport's right edge needs
 * a sideways scroll (`needs-horizontal-scroll`), the second scroll direction 1.4.10 does not allow
 * outside a data table; it is a finding at 320 px only, because 1.4.4 and 1.4.12 ask for no loss of
 * content and a sideways scroll loses none. Past the bottom edge a surface is a vertical scroll away,
 * which is allowed.
 *
 * @param {object} input The measurement.
 * @param {string} input.condition The condition.
 * @param {{width: number, height: number, scrollX?: number, scrollY?: number, scrollWidth: number, scrollHeight: number}} input.viewport
 *   The viewport, the page's scroll offset and its scroll size.
 * @param {Array<{selector: string, surface: string, left: number, right: number, top: number, bottom: number, fixed: boolean}>} input.surfaces The surfaces.
 * @returns {object[]} The findings.
 */
export function viewportFindings({ condition, viewport, surfaces }) {
  const { criteria, label } = CONDITIONS[condition];
  const findings = [];
  const [scrollX, scrollY] = [viewport.scrollX ?? 0, viewport.scrollY ?? 0];
  const scrollsSideways = viewport.scrollWidth > viewport.width + TOLERANCE;
  const unreachable = (surface, beyond) => ({
    kind: 'outside-viewport', criteria, severity: 'serious', selector: surface.selector, step: label,
    measured: { beyond: Math.round(beyond), surface: surface.surface },
    reason: `The ${surface.surface} reaches past the viewport, where the page cannot scroll to it`,
  });

  for (const surface of surfaces) {
    if (surface.fixed) {
      const beyond = Math.max(0, surface.right - viewport.width, -surface.left, surface.bottom - viewport.height, -surface.top);

      if (beyond > TOLERANCE) {
        findings.push(unreachable(surface, beyond));
      }
      continue;
    }

    const [left, right, top, bottom] = [surface.left + scrollX, surface.right + scrollX, surface.top + scrollY, surface.bottom + scrollY];
    const outOfReach = Math.max(0, -left, -top, right - viewport.scrollWidth, bottom - viewport.scrollHeight);
    const beyondRight = right - viewport.width;

    if (outOfReach > TOLERANCE) {
      findings.push(unreachable(surface, outOfReach));
    } else if (beyondRight > TOLERANCE && scrollsSideways && criteria.includes('1.4.10')) {
      findings.push({
        kind: 'needs-horizontal-scroll', criteria, severity: 'serious', selector: surface.selector, step: label,
        measured: { beyond: Math.round(beyondRight), surface: surface.surface },
        reason: `The ${surface.surface} reaches past the viewport's right edge, so reading it needs a second scroll direction`,
      });
    }
  }

  return findings;
}

/**
 * Controls drawn over each other: two controls whose boxes share an area, one not inside the other, both
 * in a popup or both outside one. Text spacing and zoom push labels into their neighbors.
 *
 * @param {object} input The measurement.
 * @param {string} input.condition The condition.
 * @param {Array<{id: number, selector: string, left: number, top: number, right: number, bottom: number, within: number[], popup?: boolean}>} input.controls
 *   The controls, each with its id, the ids of the controls it sits inside, and whether it is in a popup.
 * @returns {object[]} The findings.
 */
export function overlapFindings({ condition, controls }) {
  const { criteria, label } = CONDITIONS[condition];
  const findings = [];

  for (let first = 0; first < controls.length; first++) {
    for (let second = first + 1; second < controls.length; second++) {
      const [a, b] = [controls[first], controls[second]];

      // A control inside the other is not drawn over it, and a popup lies over what is under it by design
      // (Escape closes it), so only two controls on the same layer can hide each other.
      if (a.within.includes(b.id) || b.within.includes(a.id) || Boolean(a.popup) !== Boolean(b.popup)) {
        continue;
      }

      const area = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

      if (area > OVERLAP) {
        // Both controls name the finding, so one control over two neighbors is two findings with two ids.
        findings.push({
          kind: 'controls-overlap', criteria, severity: 'serious', selector: `${a.selector} × ${b.selector}`, step: label,
          measured: { area: Math.round(area) },
          reason: 'Two controls are drawn over each other, so one hides part of the other',
        });
      }
    }
  }

  return findings;
}

/**
 * The findings of content that appears on hover (1.4.13): it must be dismissible without moving the
 * pointer or the focus, hoverable (the pointer can move onto it), and persistent (it stays until the
 * hover ends, it is dismissed, or it no longer applies). Content that never appeared is advisory: the
 * setup did not reach the state, which is a problem with the check.
 *
 * @param {object} input What the spec saw.
 * @param {string} input.selector The content.
 * @param {boolean} input.appeared Whether it appeared.
 * @param {boolean} [input.dismissible] Whether Escape hid it.
 * @param {boolean} [input.hoverable] Whether it stayed while the pointer moved onto it.
 * @param {boolean} [input.persistent] Whether it stayed while the pointer rested on it for ten seconds.
 * @returns {object[]} The findings.
 */
export function hoverFindings({ selector, appeared, dismissible, hoverable, persistent }) {
  const finding = (kind, reason) => ({ kind, criteria: ['1.4.13'], severity: 'serious', selector, step: 'hover a commented cell', reason });

  if (!appeared) {
    return [{ ...finding('hover-content-did-not-appear', 'The comment did not appear on hover, so 1.4.13 was not measured'), severity: 'advisory' }];
  }

  return [
    ...(dismissible ? [] : [finding('hover-content-not-dismissible', 'Escape does not hide the content that appeared on hover')]),
    ...(hoverable ? [] : [finding('hover-content-not-hoverable', 'The content disappears when the pointer moves onto it')]),
    ...(persistent ? [] : [finding('hover-content-not-persistent', 'The content disappears on its own while the pointer rests on it')]),
  ];
}

/**
 * The finding of a grid that shows in one orientation and not the other (1.3.4): its root has no area
 * in the viewport of that orientation.
 *
 * @param {{portrait: {width: number, height: number}, landscape: {width: number, height: number}}} sizes The root's box in each.
 * @returns {object[]} The findings.
 */
export function orientationFindings(sizes) {
  return Object.entries(sizes)
    .filter(([, size]) => size.width * size.height === 0)
    .map(([orientation]) => ({
      kind: 'orientation-locked', criteria: ['1.3.4'], severity: 'serious', step: orientation,
      measured: { orientation },
      reason: `The grid does not show in ${orientation} orientation`,
    }));
}
