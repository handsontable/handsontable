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
 * Reads the horizontal scroll offset of the element that scrolls an axis. Scroll positions are cheap
 * reads and are taken directly (see `walkontable-dev`). Signed, so an RTL holder keeps its negative
 * `scrollLeft` when it is mirrored onto the clones.
 *
 * The element test is `isHTMLElement`, not `instanceof`: a grid whose DOM is in an iframe driven from
 * the parent realm holds nodes built by another realm's constructor, and `instanceof HTMLElement`
 * is false for every one of them. The window offset comes from the injected `rootWindow` for the
 * same reason — `instanceof Window` misses a cross-realm window just as surely, and a helper that
 * fell through to `0` reported "not scrolling" on every frame, so the clones never followed.
 *
 * @param {HTMLElement | Window} element The scrolling element or the window.
 * @param {Window} rootWindow The grid's own window.
 * @returns {number}
 */
function readScrollLeft(element: HTMLElement | Window, rootWindow: Window): number {
  return isHTMLElement(element) ? element.scrollLeft : rootWindow.scrollX;
}

/**
 * Reads the vertical scroll offset of the element that scrolls an axis. Cross-realm safe, for the
 * reasons given on `readScrollLeft`.
 *
 * @param {HTMLElement | Window} element The scrolling element or the window.
 * @param {Window} rootWindow The grid's own window.
 * @returns {number}
 */
function readScrollTop(element: HTMLElement | Window, rootWindow: Window): number {
  return isHTMLElement(element) ? element.scrollTop : rootWindow.scrollY;
}

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
   * Whether `#scrollableElement` was resolved while the table generated no boxes, which makes it an
   * answer taken against nothing.
   *
   * Cleared by the first resolution pass that settles it, and also by a pass that gives up because the
   * answer stopped changing – the two helpers behind it can disagree permanently. Covers the scrolling
   * element only; the sizes measured in that state are tracked separately, by
   * `#sizesMeasuredBeforeLayoutSettled`.
   *
   * @type {boolean}
   */
  #isScrollableElementProvisional = false;

  /**
   * The scrolling element the last non-settling resolution pass computed, so a pass that computes the
   * same answer again can stop retrying.
   *
   * @type {HTMLElement | Window | null}
   */
  #lastProvisionalScrollableElement: HTMLElement | Window | null = null;

  /**
   * The axis owners (`Overlay#trimmingContainer` of the top and inline-start overlays) the scrolling
   * elements and listeners were last bound against, or `null` before the first full draw recorded
   * them. See `resyncScrollableElementsWithOwners`.
   *
   * @type {{ vertical: HTMLElement | Window, horizontal: HTMLElement | Window } | null}
   */
  #boundOwners: { vertical: HTMLElement | Window, horizontal: HTMLElement | Window } | null = null;

  /**
   * Whether the sizes measured before the layout settled still have to be dropped, which the next
   * draw does on its way in. Stays set until a draw has rendered the cell band and re-measured them
   * (`confirmSizesRemeasured`), so a draw whose `skipRender` hook cancels the render cannot spend it.
   *
   * @type {boolean}
   */
  #sizesMeasuredBeforeLayoutSettled = false;

  /**
   * Whether a drop has run and is still waiting for a draw to re-measure what it invalidated. The
   * mark above is spent only while this is set, so a draw that renders the cells without having
   * dropped anything cannot spend it – which is what an entry-fast draw that `createCalculators`
   * escalates to a full render does: it passed the reset gate as a scroll draw and the render gate
   * as a full one.
   *
   * @type {boolean}
   */
  #sizesAwaitingRemeasure = false;

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
    this.#scrollableElement = this.#takeScrollableElement();
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
   * Whether the scrollable element was resolved against a table that had no layout at that moment,
   * so the answer is provisional and has to be retaken once the table is rendered.
   *
   * @returns {boolean}
   */
  get isScrollableElementProvisional() {
    return this.#isScrollableElementProvisional;
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
    const topHolder = topOverlay.clone?.wtTable.holder; // todo rethink
    const leftHolder = inlineStartOverlay.clone?.wtTable.holder; // todo rethink

    // Each axis is read off the element that scrolls it, which the overlay pinned against that axis
    // holds: the window when it owns the axis, the master holder otherwise. Reading both off one
    // element missed the window's vertical scroll whenever the holder owned the horizontal axis
    // (`preventOverflow: 'horizontal'`, or a definite `width` with no sized `height`), so the
    // vertical scroll callbacks never fired on a page scroll.
    const scrollX = readScrollLeft(inlineStartOverlay.mainTableScrollableElement, this.#deps.rootWindow);
    const scrollY = readScrollTop(topOverlay.mainTableScrollableElement, this.#deps.rootWindow);

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

    // Cross-realm safe, like the readers above: this guard used to return early for an iframe's
    // holder, which skipped the clone sync for the instance's whole life.
    if (!isHTMLElement(masterScrollable)) {
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
   * Drops the sizes measured before the layout settled, if `resolveProvisionalLayout()` found any.
   *
   * Called from `Overlays#beforeDraw`, so the draw that follows re-measures the row heights it just
   * invalidated and resizes the elements from the results. Doing it the other way round – dropping
   * the sizes and then asking for a redraw – leaves the row heights dropped for good whenever that
   * redraw renders no cells.
   *
   * "Sizes" is the engine's own record of them: the oversized-row heights and the column-width
   * prefix sum. A rebuilt width cache re-asks `wtTable.getColumnWidth`, so it re-enters
   * `modifyColWidth` and `AutoColumnSize` answers from its own map – a width that plugin measured
   * while the table had no layout is not dropped by this and outlives the settle. That gap is the
   * narrow-container `AutoColumnSize` follow-up, filed separately.
   *
   * The mark is not spent here, because a draw that got this far can still render nothing: a
   * `beforeDraw` hook that sets `skipRender` (NestedRows does this, and so can any user hook) cancels
   * the cell render, and then `markOversizedRows` never runs to take the heights again. It is spent
   * by `confirmSizesRemeasured()`, from the `afterDraw` of a draw that did render the band. The drop
   * is idempotent, so repeating it on the next draw costs one invalidation.
   */
  resetSizesMeasuredBeforeLayoutSettled() {
    if (!this.#sizesMeasuredBeforeLayoutSettled) {
      return;
    }

    this.#sizesAwaitingRemeasure = true;

    const wtViewport = this.#deps.getWtViewport();

    wtViewport.resetAllOversizedRows();
    wtViewport.invalidateColumnWidthCache();
  }

  /**
   * Spends the mark left by `resolveProvisionalLayout()`, once a draw has rendered the cell band and
   * therefore re-measured the sizes that `resetSizesMeasuredBeforeLayoutSettled()` dropped on its way
   * in. Called from `Overlays#afterDraw`.
   *
   * A draw that rendered the cells without having dropped anything spends nothing: the two gates read
   * different values of the same fast/full question (the reset gate reads it at draw entry, the render
   * gate after `createCalculators` could downgrade it), so an escalated scroll draw satisfies the
   * second without ever passing the first.
   */
  confirmSizesRemeasured() {
    if (!this.#sizesAwaitingRemeasure) {
      return;
    }

    this.#sizesAwaitingRemeasure = false;
    this.#sizesMeasuredBeforeLayoutSettled = false;
  }

  /**
   * Settles the layout decisions and measurements of a table that was constructed while it had no
   * layout – most often a light-DOM child of a shadow host whose `<slot>` renders later, or a subtree
   * assembled before it was appended to the document. Such a table reads every ancestor style as an
   * empty declaration and measures every size against nothing, so two things are wrong at once:
   * the scrollable element resolves to the window, and the row heights and column widths describe a
   * layout the table never had.
   *
   * Runs from the `afterDraw` of a full draw, so the overlays have already refreshed their trimming
   * containers and the holder has its final overflow; in `beforeDraw`, and on a fast draw that never
   * aligned the overlays at all, both are still stale and the scrollable element would settle on the
   * window again. While the answer is still the window even though an element
   * trims the table, the layout has not settled yet and the pass is retried on the next draw – but
   * only while the answer keeps changing. `getTrimmingContainer` counts `overflow: hidden` and
   * `getScrollableElement` does not, so the two can disagree permanently, and a table in an iframe
   * driven from the parent realm does exactly that: `MasterTable#alignOverlaysWithTrimmingContainer`
   * misses it with a realm-bound `instanceof` and leaves the holder `overflow: visible`. Retrying
   * such a table forever would rebind every listener on every draw.
   *
   * Once it does settle, the sizes measured before it are marked for dropping, which the next draw
   * does on its way in (`resetSizesMeasuredBeforeLayoutSettled`). Left in place they survive until
   * something else redraws the grid, which is what made it fill short of its container and look like
   * it needed a click to finish loading (DEV-2515).
   */
  resolveProvisionalLayout() {
    if (!this.#isScrollableElementProvisional ||
        !this.#deps.geometryReader.isRendered(this.#deps.wtTable.wtRootElement)) {
      return;
    }

    const { rootWindow } = this.#deps;
    const scrollableElement = this.#computeScrollableElement();
    const settles = scrollableElement !== rootWindow ||
      this.#deps.getTopOverlay().trimmingContainer === rootWindow;

    if (!settles) {
      // The answer is checked before anything is rebound, so a pass that cannot settle costs one
      // style read. Retry only while the answer keeps changing: a repeated answer is what a
      // permanent disagreement between the two helpers looks like, and rebinding the listeners on
      // every draw would drop every in-flight scroll event for the instance's life.
      this.#isScrollableElementProvisional = scrollableElement !== this.#lastProvisionalScrollableElement;
      this.#lastProvisionalScrollableElement = scrollableElement;

      return;
    }

    this.updateMainScrollableElements();

    // The sizes are not dropped here. Dropping them after a draw leaves them dropped: the follow-up
    // is a redraw request, and a draw that re-renders nothing never re-runs `markOversizedRows`, so
    // the row heights this pass invalidated would never be taken again. The next draw drops them on
    // its way in instead, so reset, re-measure and resize run in the order the draw cycle documents.
    this.#sizesMeasuredBeforeLayoutSettled = true;

    // No redraw is requested from here. The flag stays set until a draw consumes it, and settling
    // means the root element went from no layout to a layout, which is a size change the grid already
    // observes and redraws for. Forcing a draw from this frame instead measures a DOM whose column
    // widths have not settled: it records row heights for rows that leave the band on the next draw,
    // and those records survive – measured as 6 rendered rows and 56px of dead space where 9 rows
    // belong.
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

    this.#scrollableElement = this.#takeScrollableElement();

    this.#deps.registerListeners();
    this.#rememberBoundOwners();
  }

  /**
   * Re-picks the scrolling elements when an axis owner has moved since the listeners were bound.
   *
   * The overlays refresh their owners on every full draw (`adjustElementsSize`), but the scrolling
   * elements and the listeners bound to them are refreshed only by `updateMainScrollableElements()`,
   * which core calls on a `height` change. An owner can move without that call: a `width` that
   * becomes definite hands the horizontal axis from the window to the root, and a `height` removed
   * from the page's CSS hands the vertical axis back to the window. Left as they were, the listeners
   * would watch an element that no longer scrolls the table.
   *
   * Keyed on the owners' identity, and on nothing that is re-derived: a cross-realm owner can
   * disagree with the scrolling element for the instance's life (see `AGENTS.md`), and comparing the
   * two directly would rebind every listener on every draw. A provisional answer is left to
   * `resolveProvisionalLayout`, which settles it with the sizes it has to drop.
   */
  resyncScrollableElementsWithOwners() {
    if (this.#isScrollableElementProvisional) {
      return;
    }

    const topOwner = this.#deps.getTopOverlay().trimmingContainer;
    const inlineStartOwner = this.#deps.getInlineStartOverlay().trimmingContainer;

    if (this.#boundOwners === null) {
      // The overlays did not exist when this instance was built, so the first full draw records the
      // owners the constructor-time answers were taken against.
      this.#boundOwners = { vertical: topOwner, horizontal: inlineStartOwner };

      return;
    }

    if (this.#boundOwners.vertical === topOwner && this.#boundOwners.horizontal === inlineStartOwner) {
      return;
    }

    this.updateMainScrollableElements();
  }

  /**
   * Records the axis owners the scrolling elements and listeners were last resolved against.
   */
  #rememberBoundOwners() {
    this.#boundOwners = {
      vertical: this.#deps.getTopOverlay().trimmingContainer,
      horizontal: this.#deps.getInlineStartOverlay().trimmingContainer,
    };
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
   * Resolves the scrolling element and records whether the answer is provisional.
   *
   * A table outside the layout resolves every ancestor style to an empty declaration, which reads as
   * "no ancestor clips or scrolls" and hands the whole grid to the window. A provisional answer is
   * retaken on the next draw that finds the table rendered (see `Overlays#afterDraw`).
   *
   * Re-arming the flag starts a fresh series of retries, so the answer an earlier series gave up on
   * is forgotten with it: `updateMainScrollableElements()` is public and `updateSettings` calls it
   * whenever `height` moves to or from `''`, so a grid that already gave up while it was outside the
   * layout would otherwise match its own stale answer on the first retry and give up again at once.
   *
   * @returns {HTMLElement | Window}
   */
  #takeScrollableElement(): HTMLElement | Window {
    const { wtTable, geometryReader } = this.#deps;

    this.#isScrollableElementProvisional = !geometryReader.isRendered(wtTable.wtRootElement);
    this.#lastProvisionalScrollableElement = null;

    return this.#computeScrollableElement();
  }

  /**
   * Computes the element that scrolls the table: the master holder when the trimming container clips
   * overflow, otherwise the nearest scrollable ancestor of the master TABLE.
   *
   * Answers the question and nothing else. Whether the answer is provisional is recorded by the
   * callers, which is also where a provisional answer is acted on.
   *
   * @returns {HTMLElement | Window}
   */
  #computeScrollableElement(): HTMLElement | Window {
    const { wtTable, geometryReader } = this.#deps;
    const tableParentNode = wtTable.wtRootElement.parentNode;

    // Use nodeType === 1 instead of instanceof Element so the check works across realms (iframes).
    // Falls back to getScrollableElement when there is no element parent (null or detached).
    //
    // Read per axis: the holder is the shared scrolling element as soon as the parent traps EITHER
    // axis. A root that clips only the horizontal axis computes its `overflow` shorthand to
    // `"clip visible"`, which a shorthand comparison misses; the overlays then own their axes
    // separately (`Overlay#trimmingContainer`), and this single answer stays the holder so the wheel
    // translation, the sticky scroll and the scrollbar bands keep treating the grid as one that
    // scrolls inside its box.
    const isOverflowClip = tableParentNode !== null
      && tableParentNode.nodeType === 1
      && (() => {
        const style = geometryReader.getComputedStyle(tableParentNode as Element);
        const traps = (value: string) => value === 'hidden' || value === 'clip';

        return traps(style.getPropertyValue('overflow-x')) || traps(style.getPropertyValue('overflow-y'));
      })();

    return isOverflowClip ? wtTable.holder : getScrollableElement(wtTable.TABLE);
  }
}
