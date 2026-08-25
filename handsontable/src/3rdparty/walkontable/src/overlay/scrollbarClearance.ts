import type { GeometryReader } from '../domMeasure/geometryReader';
import { hasClass } from '../../../../helpers/dom/element';
import {
  OVERLAY_SCROLLBAR_CLEARANCE,
  OVERLAY_SCROLLBAR_FILLER_CLASS,
  OVERLAY_SCROLLBAR_FILLER_HOST_CLASS,
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
 * Pointer events swallowed for a press inside a scrollbar band, so it neither moves the selection nor
 * opens a menu. Wheel is deliberately absent: scrolling over the band must keep working.
 *
 * `mouseup` is absent too, and must stay that way. A drag that began on a cell can legitimately end
 * inside the band - auto-scrolling during a drag-select is the common case - and stopping that release
 * strands every document-level drag-end handler: the selection never finishes, an autofill never
 * applies, and drag-to-scroll keeps running. Swallowing the press is enough on its own, because a
 * gesture that starts here never begins a drag in the first place.
 *
 * Stopped by coordinate rather than by target, because the band is not the only thing drawn in that
 * strip. It sits inside the master holder and therefore *under* the frozen clones, so a press over the
 * part of the strip a clone still spans targets the clone; only the segment over the master targets the
 * band. One coordinate test covers the whole strip, where a target test would have to be repeated on
 * every clone.
 *
 * (An earlier version of this note claimed the band is never hit-tested and that a listener on it could
 * not fire. That is wrong - measured: `elementFromPoint` in the middle of the band returns the filler,
 * and a press there reaches the holder with `target` set to it. The band does take pointer events, and
 * `styles/base/_base.scss` says so and depends on it.)
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
 * Whether this overlay's grid owns the scrollbars a clearance strip would be kept clear for.
 *
 * Two conditions, and both are about the grid rather than the axis: the holder has to be the scrollport
 * (under window trimming the scrollbars belong to the window, nowhere near these overlays), and some
 * pointer has to be able to reach a thumb (see `canGrabScrollbar`).
 *
 * One function because all four overlays have to answer it the same way. They did not: the frozen
 * bottom rows required the holder to be the scrollport, the frozen top rows and columns accepted any
 * `preventOverflow` grid, and the bottom corner asked neither. Where those disagreed the band was left
 * half-covered - the corner clipped out of a strip the frozen rows beside it still painted into, which
 * reads as a notch along the bottom edge (#10370).
 *
 * @param {HTMLElement | Window} trimmingContainer The overlay's trimming container.
 * @param {Window} rootWindow The window the grid lives in.
 * @returns {boolean}
 */
export function holderOwnsScrollbars(
  trimmingContainer: HTMLElement | Window,
  rootWindow: Window
): boolean {
  return trimmingContainer !== rootWindow && canGrabScrollbar(rootWindow);
}

/**
 * The clearance one axis needs, reading the holder's gutter only when it could change the answer.
 *
 * An overlay ("floating") scrollbar is painted over the content and reserves no space for it, so the
 * browser never shrinks the master holder and the measured width is 0. A frozen overlay sized to the
 * full holder then covers it, hiding the scrollbar and swallowing the press (#10370). That is not keyed
 * to an engine: the clones are *siblings* of the master, not its contents, so they cover it wherever
 * the scrollbar takes no layout space - Firefox everywhere, Chrome and Safari on macOS while "Show
 * scroll bars" is "Automatically", Chrome on Windows 11 and on GTK. A measured 0 is the whole
 * condition, and it is what switches the clearance off again on a classic-scrollbar system.
 *
 * `reservedScrollbarSpace` forces a layout read per call, and there are five call sites across the
 * coordinator and the region files, on the draw path. Passing it as an argument evaluated it every
 * time, including on classic-scrollbar systems where the cheap `scrollbarWidth` test already settles
 * the question - so the reads happened precisely where the answer was known in advance. Ordering the
 * checks by cost keeps a classic-scrollbar grid paying nothing but a cached lookup.
 *
 * @param {GeometryReader} geometryReader The geometry reader.
 * @param {HTMLElement} holder The master overlay's holder.
 * @param {number} scrollbarWidth The measured scrollbar width, from `getScrollbarWidth()` (cached).
 * @param {boolean} axisScrolls Whether the axis this overlay would cover actually scrolls.
 * @param {'vertical' | 'horizontal'} axis Which scrollbar's gutter settles it.
 * @returns {number} The strip to keep clear, in pixels, or 0 when none is needed.
 */
export function axisScrollbarClearance(
  geometryReader: GeometryReader,
  holder: HTMLElement,
  scrollbarWidth: number,
  axisScrolls: boolean,
  axis: 'vertical' | 'horizontal'
): number {
  // Both cheap: a boolean, and a value `getScrollbarWidth` caches after its first call. A nonzero
  // width means a space-taking scrollbar, which the browser has already reserved room for.
  if (!axisScrolls || scrollbarWidth !== 0) {
    return 0;
  }

  // Only now the DOM. The probe above describes the ENGINE; this describes THIS scroller, and where
  // the two disagree the strip would land beside a scrollbar that already has a gutter - two
  // scrollbars in one grid (#10370).
  if (reservedScrollbarSpace(geometryReader, holder, axis) > 0) {
    return 0;
  }

  return OVERLAY_SCROLLBAR_CLEARANCE;
}

/**
 * The extent an overlay may occupy alongside the master's scrollbar, on either axis.
 *
 * The scroller's own inner size is the authority: it already excludes whatever gutter this particular
 * holder gives up, at the browser's sub-pixel accuracy. The probed width is only a fallback for when
 * the holder cannot be measured at all - a detached or hidden grid reports 0. The two disagree exactly
 * where the defect lives, because the probe describes the engine and not this element, and trusting it
 * left the overlay running underneath a real scrollbar (#10370).
 *
 * Axis-neutral on purpose: this is the same rule `inlineStartOverlay` applies to heights for #12632,
 * and keeping two copies meant a fix to one silently missed the other.
 *
 * @param {number} workspaceExtent The size the overlay would take with no scrollbar in the way.
 * @param {number} masterClientExtent The master holder's inner size on this axis, or 0 when unmeasurable.
 * @param {number} probedScrollbarWidth The engine-wide scrollbar width, from `getScrollbarWidth()`.
 * @returns {number}
 */
export function overlayExtentBesideScrollbar(
  workspaceExtent: number,
  masterClientExtent: number,
  probedScrollbarWidth: number
): number {
  if (masterClientExtent > 0) {
    return masterClientExtent;
  }

  // Clamped: a narrow workspace can otherwise subtract its way past zero, and a negative extent is
  // never a meaningful answer.
  return Math.max(0, workspaceExtent - probedScrollbarWidth);
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

  // No band open: no clip at all, rather than a zero-sided `inset(0px)`. The two are equivalent only
  // for the overlays that already carry `overflow: hidden` - and the two CORNER clones do not (see the
  // rule list in `styles/base/_base.scss`), so on a corner the zero-sided form is a live clip to the
  // border box that nothing else imposes. Anything a corner cell paints past its own edge - the
  // autofill handle's overhang, the header highlight's `-1px` inset - is cut off by it, on every draw
  // of a floating-scrollbar grid, whether or not a scrollbar is showing.
  if (openBottom <= 0 && openInlineEnd <= 0) {
    return '';
  }

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

  if (!wanted.length) {
    // Nothing to draw: either this is not the overlay-scrollbar regime at all (classic scrollbars, or
    // neither axis scrolls), or it is and every band is closed.
    //
    // A closed band is dropped outright rather than faded, because the clone's clip reopens on the same
    // signal: a band still fading behind an unclipped clone is drawn only over the master's segment of
    // the strip, and holding the clip closed to cover the fade instead shows the master's cell where
    // the frozen content belongs, so a column header looks cut short. Going in the same frame is the
    // only state that shows neither.
    removeFillers(masterHolder);

    return;
  }

  renderFillers(ensureFillerHost(masterHolder), wanted);
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

    if (hasClass(child, OVERLAY_SCROLLBAR_FILLER_HOST_CLASS)) {
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
 * Draws the grid's scrollbar bands, one per edge, replacing whatever was drawn before.
 *
 * @param {HTMLElement} host The filler host inside the master holder.
 * @param {FillerRect[]} rects The rectangles to cover.
 */
function renderFillers(host: HTMLElement, rects: FillerRect[]): void {
  host.querySelectorAll(`.${OVERLAY_SCROLLBAR_FILLER_CLASS}`).forEach((node) => {
    if (!rects.some(rect => node.getAttribute('data-ht-clearance-edge') === rect.edge)) {
      node.remove();
    }
  });

  rects.forEach((rect) => {
    let filler = host
      .querySelector(`[data-ht-clearance-edge="${rect.edge}"]`) as HTMLElement | null;

    if (!filler) {
      filler = host.ownerDocument.createElement('div');
      filler.className = OVERLAY_SCROLLBAR_FILLER_CLASS;
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
 * Removes this holder's own band host, if it has one.
 *
 * @param {HTMLElement} masterHolder The master overlay's holder.
 */
function removeFillers(masterHolder: HTMLElement): void {
  findFillerHost(masterHolder)?.remove();
}

/**
 * The last `clip-path` written to each overlay root, so a redundant write can be skipped without
 * reading the element back - see `applyOverlayScrollbarClearance`.
 */
const lastClipPaths: WeakMap<HTMLElement, string> = new WeakMap();

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
  // Clip rather than resize: no measured box changes, so nothing the viewport reads moves. Written
  // only when it actually differs - this runs on every draw and on every scrollbar fade, and a
  // redundant style write is still a style write.
  //
  // Compared against what was last written rather than against the element, because the browser does
  // not hand back what it was given: `inset(0px 0px 12px 0px)` reads as `inset(0px 0px 12px)`
  // (measured, and Chromium and Firefox agree). Since one of left/right is always 0, that shorthand
  // collapse fires for every overlay that publishes only a bottom strip - so reading the element back
  // made the guard always false and rewrote the property on every draw.
  const clipPath = clearanceClipPath(strips, open);

  if (lastClipPaths.get(overlayRoot) !== clipPath) {
    lastClipPaths.set(overlayRoot, clipPath);
    overlayRoot.style.clipPath = clipPath;
  }
}
