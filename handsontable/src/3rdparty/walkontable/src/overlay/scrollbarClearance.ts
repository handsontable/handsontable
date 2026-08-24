import type { GeometryReader } from '../domMeasure/geometryReader';
import { addClass, removeClass } from '../../../../helpers/dom/element';
import {
  OVERLAY_SCROLLBAR_CLEARANCE,
  OVERLAY_SCROLLBAR_CLEARANCE_CLASS,
  OVERLAY_SCROLLBAR_FILLER_CLASS,
  OVERLAY_SCROLLBAR_FILLER_HOST_CLASS,
  OVERLAY_SCROLLBAR_FILLER_OPEN_CLASS,
} from './constants';

/**
 * Clearance strips an overlay root may leave beside or below its content.
 */
export interface OverlayScrollbarClearanceStrips {
  bottom?: number;
  inlineEnd?: number;
  /**
   * Which physical side the inline-end strip falls on. `inset()` takes physical sides only.
   */
  rtl?: boolean;
}

/**
 * Which bands are currently showing, per edge. A browser shows only the scrollbar for the axis being
 * scrolled, so the two edges open and close independently.
 */
export interface ScrollbarBandsOpen {
  bottom: boolean;
  inlineEnd: boolean;
}

/**
 * Identifies the bands drawn for the grid as a whole, as opposed to anything scoped to one overlay.
 */
const TRACK_OWNER = 'track';

/**
 * Pointer events swallowed for a press inside a scrollbar band, so it neither moves the selection nor
 * opens a menu. Wheel is deliberately absent: scrolling over the band must keep working.
 *
 * `mouseup` is absent too, and must stay that way. A drag that began on a cell can legitimately end
 * inside the band - auto-scrolling during a drag-select is the common case - and stopping that release
 * strands every document-level drag-end handler: the selection never finishes, an autofill never
 * applies, and drag-to-scroll keeps running. Swallowing the press is enough on its own, because a
 * gesture that starts here never begins a drag in the first place.
 *
 * Stopped by coordinate rather than by target. The band element itself is not hit-tested - the browser
 * answers a point inside the band with the scroll container, not with the band - so a listener on the
 * band would never fire (measured).
 */
export const BAND_SWALLOWED_EVENTS = [
  'pointerdown', 'mousedown', 'click', 'dblclick', 'contextmenu',
];

/**
 * Tells whether a viewport point falls inside one of the scrollbar bands.
 *
 * @param {DOMRect} scrollportRect The master scrollport's viewport rect.
 * @param {number} bottom The horizontal scrollbar's band height, in pixels.
 * @param {number} inlineEnd The vertical scrollbar's band width, in pixels.
 * @param {boolean} rtl Whether the grid runs right-to-left.
 * @param {number} clientX The point's viewport X.
 * @param {number} clientY The point's viewport Y.
 * @returns {boolean}
 */
export function isPointInScrollbarBand(
  scrollportRect: { top: number; right: number; bottom: number; left: number },
  bottom: number,
  inlineEnd: number,
  rtl: boolean,
  clientX: number,
  clientY: number
): boolean {
  const inside = clientX >= scrollportRect.left && clientX <= scrollportRect.right
    && clientY >= scrollportRect.top && clientY <= scrollportRect.bottom;

  if (!inside) {
    return false;
  }

  if (bottom > 0 && clientY >= scrollportRect.bottom - bottom) {
    return true;
  }

  if (inlineEnd > 0) {
    return rtl
      ? clientX <= scrollportRect.left + inlineEnd
      : clientX >= scrollportRect.right - inlineEnd;
  }

  return false;
}

/**
 * One band rectangle, in the master scrollport's coordinates.
 */
interface FillerRect {
  edge: string;
  blockStart: number;
  inlineStart: number;
  blockSize: number;
  inlineSize: number;
}

/**
 * Cached media queries, one per window. `matchMedia` allocates a new list object per call, and this is
 * asked on every draw; a `MediaQueryList` keeps its `matches` current on its own, so caching it costs
 * nothing in freshness - a mouse plugged into a tablet flips the answer without any listener here.
 */
const finePointerQueries: WeakMap<Window, MediaQueryList> = new WeakMap();

/**
 * Whether any pointing device on this machine could actually grab a scrollbar thumb.
 *
 * The clearance exists so a *pointer* can reach a scrollbar a frozen overlay would otherwise cover.
 * On a touch-only device there is nothing to reach: the scroll indicator is decorative, it is not
 * hit-testable, and scrolling is done by dragging the content. Reserving a strip there is all cost and
 * no benefit - and worse than neutral, because the band swallows the press that becomes a tap, so
 * "scroll, then tap a cell near the edge" stops working (#10370).
 *
 * `getScrollbarWidth()` cannot tell the two apart: a phone reports 0 for the same reason a floating
 * scrollbar does, so every condition downstream passes.
 *
 * `any-pointer: fine` is the question itself rather than a proxy for it - is *any* available pointer
 * precise enough to hit a thumb - so it keeps the clearance on a touchscreen laptop, which has a mouse
 * and needs it, and on a tablet with a trackpad attached, both of which a user-agent test gets wrong.
 * Where the query cannot be asked at all the answer is yes, leaving behavior unchanged.
 *
 * @param {Window} rootWindow The window the grid lives in.
 * @returns {boolean}
 */
export function canGrabScrollbar(rootWindow: Window): boolean {
  if (!rootWindow || typeof rootWindow.matchMedia !== 'function') {
    return true;
  }

  let query = finePointerQueries.get(rootWindow);

  if (!query) {
    query = rootWindow.matchMedia('(any-pointer: fine)');
    finePointerQueries.set(rootWindow, query);
  }

  return query.matches;
}

/**
 * An overlay ("floating") scrollbar is painted over the content and reserves no space for it, so the
 * browser never shrinks the master holder and `getScrollbarWidth()` reports 0. A frozen overlay sized
 * to the full holder then covers the scrollbar, hiding it and swallowing the press (#10370).
 *
 * This is deliberately not keyed to an engine or a platform. A browser paints its scrollbar above its
 * own scroll container's contents, but the overlay clones are *siblings* of the master, not its
 * contents, so they cover it in every engine that gives the scrollbar no layout space: Firefox
 * everywhere, Chrome and Safari on macOS while "Show scroll bars" is "Automatically", Chrome on
 * Windows 11 and on GTK. A measured 0 is the whole condition, and it is also what turns the clearance
 * off again the moment the user switches back to classic space-taking scrollbars.
 *
 * `scrollbarWidth` comes from a synthetic probe element, which answers "does this engine give scrollbars
 * layout space" but not "does *this* scroller". Those can disagree - a page that styles its scrollbars
 * (Handsontable sets `scrollbar-color`) can get a different rendering on the styled element than on a
 * bare probe - and when they do, the probe reports 0 while the holder has a real scrollbar in a real
 * gutter, so the strip is drawn beside it and the grid shows two scrollbars. `reservedSpace` is the
 * holder's own gutter, and it settles the question for the element that actually matters.
 *
 * @param {number} scrollbarWidth The measured scrollbar width, from `getScrollbarWidth()`.
 * @param {boolean} axisScrolls Whether the axis this overlay would cover actually scrolls.
 * @param {number} reservedSpace The space the master holder itself reserves on that axis, in pixels.
 * @returns {number} The strip to keep clear, in pixels, or 0 when none is needed.
 */
export function overlayScrollbarClearance(
  scrollbarWidth: number,
  axisScrolls: boolean,
  reservedSpace: number = 0
): number {
  if (!axisScrolls || scrollbarWidth !== 0 || reservedSpace > 0) {
    return 0;
  }

  return OVERLAY_SCROLLBAR_CLEARANCE;
}

/**
 * The space a scroller actually gives up to its own scrollbar on one axis, in pixels.
 *
 * Zero means the scrollbar is painted over the content and the clearance is needed; anything above zero
 * means the browser already carved out a gutter, the frozen overlays already stop short of it, and a
 * strip on top would be a second scrollbar.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} holder The master overlay's holder - the element that actually scrolls.
 * @param {'vertical' | 'horizontal'} axis Which scrollbar's gutter to measure.
 * @returns {number}
 */
export function reservedScrollbarSpace(
  geometryReader: GeometryReader,
  holder: HTMLElement,
  axis: 'vertical' | 'horizontal'
): number {
  if (!holder) {
    return 0;
  }

  // A vertical scrollbar eats width, a horizontal one eats height.
  const gutter = axis === 'vertical'
    ? geometryReader.offsetWidth(holder) - geometryReader.clientWidth(holder)
    : geometryReader.offsetHeight(holder) - geometryReader.clientHeight(holder);

  return Math.max(0, gutter);
}

/**
 * Marks (or unmarks) an overlay root as leaving a clearance strip.
 *
 * @param {HTMLElement} overlayRoot The overlay's root element.
 * @param {boolean} active Whether a clearance strip is being left.
 */
export function toggleScrollbarClearance(overlayRoot: HTMLElement, active: boolean): void {
  if (active) {
    addClass(overlayRoot, OVERLAY_SCROLLBAR_CLEARANCE_CLASS);
  } else {
    removeClass(overlayRoot, OVERLAY_SCROLLBAR_CLEARANCE_CLASS);
  }
}

/**
 * The width an overlay may occupy alongside the master's vertical scrollbar.
 *
 * The scroller's own `clientWidth` is the authority: it already excludes whatever gutter this
 * particular holder gives up, at the browser's sub-pixel accuracy. The probed width is only a fallback
 * for when the holder cannot be measured at all - a detached or hidden grid reports 0. The two
 * disagree exactly where the defect lives, because the probe describes the engine and not this
 * element, and trusting it left the overlay running underneath a real scrollbar (#10370).
 *
 * @param {number} workspaceWidth The width the overlay would take with no scrollbar in the way.
 * @param {number} masterClientWidth The master holder's inner width, or 0 when it cannot be measured.
 * @param {number} probedScrollbarWidth The engine-wide scrollbar width, from `getScrollbarWidth()`.
 * @returns {number}
 */
export function overlayWidthBesideScrollbar(
  workspaceWidth: number,
  masterClientWidth: number,
  probedScrollbarWidth: number
): number {
  if (masterClientWidth > 0) {
    return masterClientWidth;
  }

  // Clamped: a narrow workspace can otherwise subtract its way past zero, and a negative width is
  // never a meaningful answer.
  return Math.max(0, workspaceWidth - probedScrollbarWidth);
}

/**
 * Builds the `clip-path` that keeps an overlay out of the bands the scrollbars are drawn in.
 *
 * Clipping, rather than resizing, is what makes this free of side effects: every box the viewport
 * calculations measure keeps its size, the clone simply stops painting in the band, and a clipped
 * region is not hit-tested either - so the press lands on the master's scrollbar underneath.
 *
 * While the scrollbar is hidden the same `inset()` is emitted with zeroed sides rather than dropped, so
 * the property only ever changes value and never switches to and from `none`.
 *
 * @param {OverlayScrollbarClearanceStrips} strips The bands to keep clear, in pixels.
 * @param {ScrollbarBandsOpen} open Which bands are currently showing.
 * @returns {string} An `inset()` value, or '' when this overlay never needs clipping.
 */
export function clearanceClipPath(
  strips: OverlayScrollbarClearanceStrips,
  open: ScrollbarBandsOpen = { bottom: true, inlineEnd: true }
): string {
  const bottom = strips.bottom ?? 0;
  const inlineEnd = strips.inlineEnd ?? 0;

  if (bottom <= 0 && inlineEnd <= 0) {
    return '';
  }

  // Per axis: a browser shows only the scrollbar for the axis being scrolled, so clipping the other
  // edge would carve out a band with nothing drawn in it.
  const openBottom = open.bottom ? bottom : 0;
  const openInlineEnd = open.inlineEnd ? inlineEnd : 0;
  const right = strips.rtl ? 0 : openInlineEnd;
  const left = strips.rtl ? openInlineEnd : 0;

  return `inset(0px ${right}px ${openBottom}px ${left}px)`;
}

/**
 * Draws the scrollbar track bands inside the master holder, so the whole strip the scrollbar sits in
 * reads as one band across the grid (#10370).
 *
 * Covering only the frozen overlays' own strips left the rest of the band transparent, showing the
 * master's cells beside an opaque patch - so the band has to span the full scrollport, master included.
 * These live inside the master holder for the same reason the per-overlay patches did: the browser
 * paints a scroll container's scrollbar above that container's contents, so a band in here is drawn
 * under the thumb while one stacked above the holder would hide it.
 *
 * @param {HTMLElement} masterHolder The master overlay's holder.
 * @param {object} bands The band sizes and the scrollport they span.
 * @param {number} bands.bottom The horizontal scrollbar's band height, in pixels.
 * @param {number} bands.inlineEnd The vertical scrollbar's band width, in pixels.
 * @param {number} bands.scrollportWidth The scrollport's width, in pixels.
 * @param {number} bands.scrollportHeight The scrollport's height, in pixels.
 * @param {ScrollbarBandsOpen} open Which bands are currently showing.
 */
export function syncScrollbarTrackBands(
  masterHolder: HTMLElement,
  bands: { bottom: number; inlineEnd: number; scrollportWidth: number; scrollportHeight: number },
  open: ScrollbarBandsOpen
): void {
  const { scrollportWidth, scrollportHeight } = bands;
  // Whether this grid is in the overlay-scrollbar regime at all, judged before the open state is
  // applied - otherwise a pair of closed bands looks identical to "no bands needed", and the fade-out
  // below is never reached.
  const inRegime = (bands.bottom > 0 && scrollportWidth > 0)
    || (bands.inlineEnd > 0 && scrollportHeight > 0);
  // Only the axis being scrolled gets a track, so the other edge stays ordinary grid.
  const bottom = open.bottom ? bands.bottom : 0;
  const inlineEnd = open.inlineEnd ? bands.inlineEnd : 0;
  const wanted: FillerRect[] = [];

  if (bottom > 0 && scrollportWidth > 0) {
    wanted.push({
      edge: 'bottom',
      blockStart: Math.max(0, scrollportHeight - bottom),
      inlineStart: 0,
      blockSize: bottom,
      inlineSize: scrollportWidth,
    });
  }

  if (inlineEnd > 0 && scrollportHeight > 0) {
    wanted.push({
      edge: 'inline-end',
      blockStart: 0,
      // Logical, so RTL puts the band on the other side without a branch here.
      inlineStart: Math.max(0, scrollportWidth - inlineEnd),
      blockSize: scrollportHeight,
      inlineSize: inlineEnd,
    });
  }

  if (!inRegime) {
    // Classic scrollbars, or neither axis scrolls: nothing here needs a band at all.
    removeFillers(masterHolder, TRACK_OWNER);

    return;
  }

  if (!wanted.length) {
    // In the regime, but every band is closed. Dropped outright rather than faded: the clone's clip
    // reopens on the same signal, and a band still fading behind an unclipped clone is only drawn over
    // the master's segment of the strip - or, if the clip were held back to cover the fade, the strip
    // would show the master's cell where the frozen content belongs and a column header would look cut
    // short. Removing it in the same frame is the only state that shows neither.
    removeFillers(masterHolder, TRACK_OWNER);

    return;
  }

  const host = ensureFillerHost(masterHolder);

  renderFillers(host, TRACK_OWNER, wanted);

  host.classList.add(OVERLAY_SCROLLBAR_FILLER_OPEN_CLASS);
}

/**
 * Finds a holder's own filler host, looking at its direct children only.
 *
 * A subtree search reaches into nested grids. A grid rendered inside a cell - a `HotTable` in a custom
 * renderer - puts its whole DOM, holder included, inside the outer grid's master holder, so
 * `querySelector` from the outer holder finds the INNER grid's host first. The outer grid would then
 * delete the inner grid's bands as if they were its own, or adopt its host and size outer-scrollport
 * fillers into a small nested grid.
 *
 * The host is always inserted as a direct child of the holder it belongs to, so this cannot miss its
 * own and cannot reach anyone else's.
 *
 * @param {HTMLElement} masterHolder The master overlay's holder.
 * @returns {HTMLElement | null}
 */
function findFillerHost(masterHolder: HTMLElement): HTMLElement | null {
  const { children } = masterHolder;

  for (let i = 0; i < children.length; i += 1) {
    const child = children[i] as HTMLElement;

    if (child.classList?.contains(OVERLAY_SCROLLBAR_FILLER_HOST_CLASS)) {
      return child;
    }
  }

  return null;
}

/**
 * Returns the master holder's filler host, creating it on first use.
 *
 * @param {HTMLElement} masterHolder The master overlay's holder.
 * @returns {HTMLElement}
 */
function ensureFillerHost(masterHolder: HTMLElement): HTMLElement {
  const existing = findFillerHost(masterHolder);

  if (existing) {
    return existing;
  }

  const host = masterHolder.ownerDocument.createElement('div');

  host.className = OVERLAY_SCROLLBAR_FILLER_HOST_CLASS;

  // First child, so the sticky box can stay pinned to the scrollport on both axes.
  masterHolder.insertBefore(host, masterHolder.firstChild);

  return host;
}

/**
 * Draws the fillers for one overlay, replacing whatever that overlay published before.
 *
 * @param {HTMLElement} host The filler host inside the master holder.
 * @param {string} key Identifies the publishing overlay.
 * @param {FillerRect[]} rects The rectangles to cover.
 */
function renderFillers(host: HTMLElement, key: string, rects: FillerRect[]): void {
  const own = host.querySelectorAll(`[data-ht-clearance-owner="${key}"]`);

  own.forEach((node) => {
    if (!rects.some(rect => node.getAttribute('data-ht-clearance-edge') === rect.edge)) {
      node.remove();
    }
  });

  rects.forEach((rect) => {
    let filler = host
      .querySelector(`[data-ht-clearance-owner="${key}"][data-ht-clearance-edge="${rect.edge}"]`) as
      HTMLElement | null;

    if (!filler) {
      filler = host.ownerDocument.createElement('div');
      filler.className = OVERLAY_SCROLLBAR_FILLER_CLASS;
      filler.setAttribute('data-ht-clearance-owner', key);
      filler.setAttribute('data-ht-clearance-edge', rect.edge);
      host.appendChild(filler);
    }

    // Logical offsets, so the fillers follow the grid's direction without a separate RTL branch.
    filler.style.insetBlockStart = `${rect.blockStart}px`;
    filler.style.insetInlineStart = `${rect.inlineStart}px`;
    filler.style.blockSize = `${rect.blockSize}px`;
    filler.style.inlineSize = `${rect.inlineSize}px`;
  });
}

/**
 * Removes one owner's bands, and the host once it holds nothing.
 *
 * @param {HTMLElement} masterHolder The master overlay's holder.
 * @param {string} owner The owner key whose bands should go.
 */
function removeFillers(masterHolder: HTMLElement, owner: string): void {
  const host = findFillerHost(masterHolder);

  if (!host) {
    return;
  }

  host.querySelectorAll(`[data-ht-clearance-owner="${owner}"]`).forEach(node => node.remove());

  if (!host.children.length) {
    host.remove();
  }
}

/**
 * Keeps an overlay clone out of the bands the scrollbars are drawn in (#10370).
 *
 * Only the clone's own clipping happens here. The band's background is drawn once for the whole grid by
 * `syncScrollbarTrackBands`, so the strip reads as one track rather than an opaque patch under the
 * frozen cells beside a transparent gap over the master.
 *
 * @param {HTMLElement} overlayRoot The overlay's root element.
 * @param {OverlayScrollbarClearanceStrips} strips The bands to keep clear, in pixels.
 * @param {ScrollbarBandsOpen} open Which bands are currently showing.
 */
export function applyOverlayScrollbarClearance(
  overlayRoot: HTMLElement,
  strips: OverlayScrollbarClearanceStrips,
  open: ScrollbarBandsOpen = { bottom: true, inlineEnd: true }
): void {
  const bottom = strips.bottom ?? 0;
  const inlineEnd = strips.inlineEnd ?? 0;

  // The class marks the regime, not the open state - it carries the transition, which has to be in
  // place before the shape changes or the first open would jump.
  toggleScrollbarClearance(overlayRoot, bottom > 0 || inlineEnd > 0);

  // Clip rather than resize: no measured box changes, so nothing the viewport reads moves. Written
  // only when it actually differs - this runs on every draw and on every scrollbar fade, and a
  // redundant style write is still a style write.
  const clipPath = clearanceClipPath(strips, open);

  if (overlayRoot.style.clipPath !== clipPath) {
    overlayRoot.style.clipPath = clipPath;
  }
}
