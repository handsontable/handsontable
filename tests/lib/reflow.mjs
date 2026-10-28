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

/**
 * The text a clipping container cuts off: a container whose overflow is `hidden` or `clip` on an axis
 * and whose content is larger than its box on that axis. Cut off with an ellipsis it is truncated
 * (`moderate`: the text is shortened, not gone); cut off without one it is clipped (`serious`).
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
 * past it cannot be scrolled to (`outside-viewport`). Any other surface past the viewport's right edge
 * makes the page scroll sideways (`needs-horizontal-scroll`, a second scroll direction 1.4.10 does not
 * allow outside a data table), or is out of reach when the page cannot scroll there; past the bottom
 * edge it is a vertical scroll away, which is allowed, unless the page cannot scroll there either.
 *
 * @param {object} input The measurement.
 * @param {string} input.condition The condition.
 * @param {{width: number, height: number, scrollWidth: number, scrollHeight: number}} input.viewport The viewport and the page's scroll size.
 * @param {Array<{selector: string, surface: string, left: number, right: number, top: number, bottom: number, fixed: boolean}>} input.surfaces The surfaces.
 * @returns {object[]} The findings.
 */
export function viewportFindings({ condition, viewport, surfaces }) {
  const { criteria, label } = CONDITIONS[condition];
  const findings = [];
  const scrollsSideways = viewport.scrollWidth > viewport.width + TOLERANCE;
  const scrollsDown = viewport.scrollHeight > viewport.height + TOLERANCE;
  const unreachable = (surface, beyond) => ({
    kind: 'outside-viewport', criteria, severity: 'serious', selector: surface.selector, step: label,
    measured: { beyond: Math.round(beyond), surface: surface.surface },
    reason: `The ${surface.surface} reaches past the viewport, where the page cannot scroll to it`,
  });

  for (const surface of surfaces) {
    const beyondX = Math.max(0, surface.right - viewport.width, -surface.left);
    const beyondY = Math.max(0, surface.bottom - viewport.height, -surface.top);

    if (surface.fixed) {
      if (Math.max(beyondX, beyondY) > TOLERANCE) {
        findings.push(unreachable(surface, Math.max(beyondX, beyondY)));
      }
    } else if (beyondX > TOLERANCE && scrollsSideways) {
      findings.push({
        kind: 'needs-horizontal-scroll', criteria, severity: 'serious', selector: surface.selector, step: label,
        measured: { beyond: Math.round(beyondX), surface: surface.surface },
        reason: `The ${surface.surface} is wider than the viewport, so reading it needs a second scroll direction`,
      });
    } else if (beyondX > TOLERANCE || (beyondY > TOLERANCE && !scrollsDown)) {
      findings.push(unreachable(surface, Math.max(beyondX, scrollsDown ? 0 : beyondY)));
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
        findings.push({
          kind: 'controls-overlap', criteria, severity: 'serious', selector: a.selector, step: label,
          measured: { with: b.selector, area: Math.round(area) },
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
