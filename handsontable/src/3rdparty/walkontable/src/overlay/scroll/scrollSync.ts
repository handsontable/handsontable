import { getScrollableElement, isHTMLElement } from '../../../../../helpers/dom/element';
import type { EngineContext } from '../../wire';
import type { default as Overlays } from '../overlays';
import type { StickyScrollStrategy } from '../strategies/stickyScrollStrategy';

/**
 * Assembles the ScrollSync's dependencies. Most come from the engine composition context; the ones
 * that drive the owning Overlays coordinator (`refreshAll`/`registerListeners`/`eventManager`/the
 * `destroyed` flag) and the sticky-scroll strategy (`tryActivate`/`syncOffsets`) come from the
 * Overlays instance and its already-built `StickyScrollStrategy` — passed as callbacks so ScrollSync
 * never imports either at runtime (only as a type), keeping the scroll slice free of an overlay cycle.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @param {Overlays} overlays The owning Overlays coordinator.
 * @param {StickyScrollStrategy} stickyScroll The overlays' sticky-scroll strategy.
 * @returns {object} The ScrollSync dependency set.
 */
export function createScrollSyncDeps(ctx: EngineContext, overlays: Overlays, stickyScroll: StickyScrollStrategy) {
  return {
    wtSettings: ctx.wtSettings,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    wtTable: ctx.getWtTable(),
    getWtViewport: ctx.getWtViewport,
    // Resolve the overlays off the owning coordinator (its own fields set by `initOverlays`), not via
    // `ctx.getTopOverlay` (which reads `wot.wtOverlays`): `cacheScrollCallbackPositions` runs inside
    // the Overlays constructor, before `wot.wtOverlays` is assigned. Matches the original direct
    // `this.topOverlay` access.
    getTopOverlay: () => overlays.topOverlay,
    getInlineStartOverlay: () => overlays.inlineStartOverlay,
    getBottomOverlay: () => overlays.bottomOverlay,
    eventManager: overlays.eventManager,
    getDestroyed: () => overlays.destroyed,
    refreshAll: () => overlays.refreshAll(),
    registerListeners: () => overlays.registerListeners(),
    tryActivateStickyScroll: (verticalScrolling: boolean, horizontalScrolling: boolean) =>
      stickyScroll.tryActivate(verticalScrolling, horizontalScrolling),
    syncStickyScrollOffsets: () => stickyScroll.syncOffsets(),
  };
}

/**
 * The ScrollSync dependencies, inferred from `createScrollSyncDeps`.
 */
export type ScrollSyncDeps = ReturnType<typeof createScrollSyncDeps>;

/**
 * Owns the scroll state shared across the overlays and the master<->clone scroll synchronization:
 * which element scrolls the table (`scrollableElement`), the per-frame scroll-direction flags, the
 * last scroll offsets, and the callback-position cache that deduplicates the `onScroll*` hooks.
 *
 * It reacts to a scroll event by mirroring the master scroll position onto the overlay clone holders
 * (`syncScrollPositions`), pushes the master scroll position onto the clones after a rendering-state
 * change (`syncScrollWithMaster`), and recomputes the scrollable element + re-binds listeners when
 * the trimming container changes (`updateMainScrollableElements`).
 *
 * Extracted from the Overlays coordinator so the scroll-position lifecycle is self-contained; the
 * coordinator keeps thin public delegates and get/set accessors for the state that its own draw
 * participation and the whitebox tests rely on.
 *
 * @class ScrollSync
 */
export class ScrollSync {
  /**
   * The ScrollSync dependencies.
   *
   * @type {ScrollSyncDeps}
   */
  readonly #deps: ScrollSyncDeps;

  /**
   * The element that scrolls the table (the trimming container or the window).
   *
   * @type {HTMLElement | Window}
   */
  #scrollableElement: HTMLElement | Window;

  /**
   * Whether a vertical scroll happened in the current frame.
   *
   * @type {boolean}
   */
  #verticalScrolling = false;

  /**
   * Whether a horizontal scroll happened in the current frame.
   *
   * @type {boolean}
   */
  #horizontalScrolling = false;

  /**
   * The last synchronized horizontal scroll offset.
   *
   * @type {number}
   */
  #lastScrollX: number;

  /**
   * The last synchronized vertical scroll offset.
   *
   * @type {number}
   */
  #lastScrollY: number;

  /**
   * Whether any overlay's rendering state changed in the current draw (drives `syncScrollWithMaster`).
   *
   * @type {boolean}
   */
  #hasRenderingStateChanged = false;

  /**
   * Cached vertical scroll position used to deduplicate `onScrollVertically` callbacks.
   *
   * @type {number | null}
   */
  #lastVerticalScrollPositionForCallback: number | null = null;

  /**
   * Cached horizontal scroll position used to deduplicate `onScrollHorizontally` callbacks.
   *
   * @type {number | null}
   */
  #lastHorizontalScrollPositionForCallback: number | null = null;

  /**
   * @param {ScrollSyncDeps} deps The ScrollSync dependencies.
   */
  constructor(deps: ScrollSyncDeps) {
    this.#deps = deps;
    this.#scrollableElement = this.#computeScrollableElement();
    this.#lastScrollX = this.#deps.rootWindow.scrollX;
    this.#lastScrollY = this.#deps.rootWindow.scrollY;
  }

  /**
   * The element that scrolls the table.
   *
   * @returns {HTMLElement | Window}
   */
  get scrollableElement() {
    return this.#scrollableElement;
  }

  /**
   * Whether a vertical scroll happened in the current frame.
   *
   * @returns {boolean}
   */
  get verticalScrolling() {
    return this.#verticalScrolling;
  }

  /**
   * @param {boolean} value Whether a vertical scroll happened in the current frame.
   */
  set verticalScrolling(value: boolean) {
    this.#verticalScrolling = value;
  }

  /**
   * Whether a horizontal scroll happened in the current frame.
   *
   * @returns {boolean}
   */
  get horizontalScrolling() {
    return this.#horizontalScrolling;
  }

  /**
   * @param {boolean} value Whether a horizontal scroll happened in the current frame.
   */
  set horizontalScrolling(value: boolean) {
    this.#horizontalScrolling = value;
  }

  /**
   * Records whether any overlay's rendering state changed in the current draw. Set from the
   * coordinator's `beforeDraw`; consumed by `syncScrollWithMaster`.
   *
   * @param {boolean} value Whether any overlay's rendering state changed.
   */
  setRenderingStateChanged(value: boolean) {
    this.#hasRenderingStateChanged = value;
  }

  /**
   * Caches the initial vertical and horizontal scroll positions for callback deduplication.
   */
  cacheScrollCallbackPositions() {
    this.#lastVerticalScrollPositionForCallback = this.#deps.getTopOverlay().getScrollPosition();
    this.#lastHorizontalScrollPositionForCallback = this.#deps.getInlineStartOverlay().getScrollPosition();
  }

  /**
   * Synchronize scroll position between master table and overlay table.
   */
  syncScrollPositions() {
    if (this.#deps.getDestroyed()) {
      return;
    }

    const topOverlay = this.#deps.getTopOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const bottomOverlay = this.#deps.getBottomOverlay();
    const wtViewport = this.#deps.getWtViewport();
    const { wtSettings } = this.#deps;
    const scrollableElement = this.#scrollableElement;
    const topHolder = topOverlay.clone?.wtTable.holder; // todo rethink
    const leftHolder = inlineStartOverlay.clone?.wtTable.holder; // todo rethink
    const preventOverflow: boolean | string = wtSettings.getSetting('preventOverflow');

    let scrollX = scrollableElement instanceof HTMLElement
      ? scrollableElement.scrollLeft : 0;
    let scrollY = scrollableElement instanceof HTMLElement
      ? scrollableElement.scrollTop : 0;

    if (
      wtViewport.isHorizontallyScrollableByWindow()
      && ((typeof preventOverflow === 'boolean' && preventOverflow) || preventOverflow !== 'horizontal')
      && scrollableElement instanceof Window
    ) {
      scrollX = scrollableElement.scrollX;
    }

    if (
      wtViewport.isVerticallyScrollableByWindow()
      && ((typeof preventOverflow === 'boolean' && preventOverflow) || preventOverflow !== 'vertical')
      && scrollableElement instanceof Window
    ) {
      scrollY = scrollableElement.scrollY;
    }

    this.#horizontalScrolling = this.#lastScrollX !== scrollX;
    this.#verticalScrolling = this.#lastScrollY !== scrollY;
    this.#lastScrollX = scrollX;
    this.#lastScrollY = scrollY;

    this.#deps.tryActivateStickyScroll(this.#verticalScrolling, this.#horizontalScrolling);

    if (this.#horizontalScrolling) {
      if (isHTMLElement(topHolder)) {
        topHolder.scrollLeft = scrollX;
      }

      const bottomHolder = bottomOverlay.needFullRender ? bottomOverlay.clone?.wtTable.holder : null; // todo rethink

      if (bottomHolder) {
        bottomHolder.scrollLeft = scrollX;
      }
    }

    if (this.#verticalScrolling) {
      // In window-scroll mode the left overlay's row positions are driven by
      // spreader.style.top; the holder must not accumulate scroll offset.
      // Setting scrollTop to window.scrollY would be capped to the tiny
      // hider/holder size difference caused by fractional zoom rounding,
      // shifting the visible rows and misaligning them with the master table.
      if (isHTMLElement(leftHolder)) {
        if (wtViewport.isVerticallyScrollableByWindow()) {
          leftHolder.scrollTop = 0;
        } else {
          leftHolder.scrollTop = scrollY;
        }
      }
    }

    this.#deps.refreshAll();
    this.#deps.syncStickyScrollOffsets();
  }

  /**
   * Fires the `onScroll*` overlay hooks when the scroll position changed since they last fired, then
   * resets the per-frame scroll-direction flags. Called by the coordinator from `refreshAll`.
   */
  fireScrollCallbacksAndReset() {
    if (this.#verticalScrolling && this.#didVerticalScrollPositionChange()) {
      this.#deps.getInlineStartOverlay().onScroll(); // todo the inlineStartOverlay.onScroll() fires hook. Why is it needed there, not in any another place?
    }

    if (this.#horizontalScrolling && this.#didHorizontalScrollPositionChange()) {
      this.#deps.getTopOverlay().onScroll();
    }

    this.#verticalScrolling = false;
    this.#horizontalScrolling = false;
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar.
   */
  syncScrollWithMaster() {
    if (!this.#hasRenderingStateChanged) {
      return;
    }

    const topOverlay = this.#deps.getTopOverlay();
    const bottomOverlay = this.#deps.getBottomOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const masterScrollable = topOverlay.mainTableScrollableElement;

    if (!(masterScrollable instanceof HTMLElement)) {
      return;
    }

    const { scrollLeft, scrollTop } = masterScrollable;

    if (topOverlay.needFullRender && topOverlay.clone) {
      topOverlay.clone.wtTable.holder.scrollLeft = scrollLeft; // todo rethink, *overlay.setScroll*()
    }
    if (bottomOverlay.needFullRender && bottomOverlay.clone) {
      bottomOverlay.clone.wtTable.holder.scrollLeft = scrollLeft; // todo rethink, *overlay.setScroll*()
    }
    if (inlineStartOverlay.needFullRender && inlineStartOverlay.clone) {
      inlineStartOverlay.clone.wtTable.holder.scrollTop = scrollTop; // todo rethink, *overlay.setScroll*()
    }

    this.#hasRenderingStateChanged = false;
  }

  /**
   * Update the main scrollable elements for all the overlays.
   */
  updateMainScrollableElements() {
    this.#deps.eventManager.clearEvents(true);

    this.#deps.getInlineStartOverlay().updateMainScrollableElement();
    this.#deps.getTopOverlay().updateMainScrollableElement();

    if (this.#deps.getBottomOverlay().needFullRender) {
      this.#deps.getBottomOverlay().updateMainScrollableElement();
    }

    this.#scrollableElement = this.#computeScrollableElement();

    this.#deps.registerListeners();
  }

  /**
   * Checks whether the vertical scroll position has changed since the last `onScrollVertically`
   * callback and updates the cache. Returns `true` when the callback should fire.
   *
   * @returns {boolean}
   */
  #didVerticalScrollPositionChange() {
    const current = this.#deps.getTopOverlay().getScrollPosition();

    if (this.#lastVerticalScrollPositionForCallback === current) {
      return false;
    }

    this.#lastVerticalScrollPositionForCallback = current;

    return true;
  }

  /**
   * Checks whether the horizontal scroll position has changed since the last `onScrollHorizontally`
   * callback and updates the cache. Returns `true` when the callback should fire.
   *
   * @returns {boolean}
   */
  #didHorizontalScrollPositionChange() {
    const current = this.#deps.getInlineStartOverlay().getScrollPosition();

    if (this.#lastHorizontalScrollPositionForCallback === current) {
      return false;
    }

    this.#lastHorizontalScrollPositionForCallback = current;

    return true;
  }

  /**
   * Computes the element that scrolls the table: the master holder when the trimming container clips
   * overflow, otherwise the nearest scrollable ancestor of the master TABLE.
   *
   * @returns {HTMLElement | Window}
   */
  #computeScrollableElement(): HTMLElement | Window {
    const { wtTable, geometryReader } = this.#deps;
    const tableParentNode = wtTable.wtRootElement.parentNode;
    // Use nodeType === 1 instead of instanceof Element so the check works across realms (iframes).
    // Falls back to getScrollableElement when there is no element parent (null or detached).
    const isOverflowClip = tableParentNode !== null
      && tableParentNode.nodeType === 1
      && (() => {
        const overflow = geometryReader
          .getComputedStyle(tableParentNode as Element).getPropertyValue('overflow');

        return overflow === 'hidden' || overflow === 'clip';
      })();

    return isOverflowClip ? wtTable.holder : getScrollableElement(wtTable.TABLE);
  }
}
