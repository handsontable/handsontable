import type { WalkontableInstance } from '../types';
import type { EngineContext } from '../wire';
import type Settings from '../settings';
import type Table from '../table/baseTable';
import type { Overlay } from './regions/_base';
import type EventManager from '../../../../eventManager';
import { debounce } from '../../../../helpers/function';
import { arrayEach } from '../../../../helpers/array';
import {
  InlineStartOverlay,
  TopOverlay,
  TopInlineStartCornerOverlay,
  BottomOverlay,
  BottomInlineStartCornerOverlay,
} from './index';
import { createOverlayDeps } from './regions/_base';
import { StickyScrollStrategy, createStickyScrollStrategyDeps } from './strategies/stickyScrollStrategy';
import { ResizeMonitor, createResizeMonitorDeps } from './resizeMonitor';
import { ScrollbarVisibility, createScrollbarVisibilityDeps } from './scrollbarVisibility';
import {
  BAND_SWALLOWED_EVENTS,
  canGrabScrollbar,
  isPointInScrollbarBand,
  axisScrollbarClearance,
  syncScrollbarTrackBands,
  type ScrollbarBandsOpen,
} from './scrollbarClearance';
import { SpreaderSize, createSpreaderSizeDeps } from './spreaderSize';
import { ScrollSync, createScrollSyncDeps } from './scroll/scrollSync';
import { NativeScrollInput, createNativeScrollInputDeps } from './scroll/nativeScrollInput';
import {
  adjustColumnHeaderHeights,
  syncOversizedColumnHeadersWithFrozenOverlays,
} from '../axisSizing/oversizedRows';

/**
 * Assembles the Overlays module's dependencies from the engine composition context. Overlays is the
 * sub-composition point for the individual overlays, so it carries `makeOverlayDeps` — a factory that
 * mints a fresh overlay dependency set (via `createOverlayDeps`) for each overlay it builds.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The Overlays dependency set.
 */
export function createOverlaysDeps(ctx: EngineContext) {
  return {
    wot: ctx.wot,
    wtSettings: ctx.wtSettings,
    rootDocument: ctx.rootDocument,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    eventManager: ctx.makeEventManager(),
    wtTable: ctx.getWtTable(),
    makeOverlayDeps: () => createOverlayDeps(ctx),
    // Sub-composition for the sticky-scroll strategy: mirrors `makeOverlayDeps`, but also needs the
    // owning Overlays instance (for `refreshAll`/`applyToDOM`/`scrollableElement`/`eventManager`).
    makeStickyScrollDeps: (overlays: Overlays) => createStickyScrollStrategyDeps(ctx, overlays),
    makeResizeMonitorDeps: () => createResizeMonitorDeps(ctx),
    makeScrollbarVisibilityDeps: () => createScrollbarVisibilityDeps(ctx),
    makeSpreaderSizeDeps: (overlays: Overlays) => createSpreaderSizeDeps(ctx, overlays),
    makeScrollSyncDeps: (overlays: Overlays, stickyScroll: StickyScrollStrategy) =>
      createScrollSyncDeps(ctx, overlays, stickyScroll),
    makeNativeScrollInputDeps: (overlays: Overlays, stickyScroll: StickyScrollStrategy, resizeMonitor: ResizeMonitor) =>
      createNativeScrollInputDeps(ctx, overlays, stickyScroll, resizeMonitor),
  };
}

/**
 * The Overlays module dependencies, inferred from `createOverlaysDeps`.
 */
export type OverlaysDeps = ReturnType<typeof createOverlaysDeps>;

/**
 * @class Overlays
 */
class Overlays {
  /**
   * The Overlays module dependencies (holds the DOM roots and the overlay-deps factory).
   *
   * @type {OverlaysDeps}
   */
  #deps: OverlaysDeps;

  /**
   * Reference to the master table instance.
   *
   * @protected
   * @type {MasterTable}
   */
  declare wtTable: Table;

  /**
   * The walkontable event manager instance.
   *
   * @protected
   * @type {EventManager}
   */
  declare eventManager: EventManager;

  /**
   * The width of the scrollbar.
   *
   * @protected
   * @type {number}
   */
  scrollbarSize: number = 0;

  /**
   * Flag indicating whether the overlay has been destroyed.
   *
   * @protected
   * @type {boolean}
   */
  destroyed: boolean = false;

  /**
   * `true` while the in-progress master draw was entered as a fast/scroll draw (`draw(true)`), and
   * `false` for a full render (`draw(false)`, e.g. a `forceFullRender` from `hot.render()`). Set once
   * per master draw before the cells are rendered, and read by the draw cycle (master and its clones,
   * which reach it through the clone source) to gate the column-header render skip. It exists because
   * the `verticalScrolling`/`horizontalScrolling` flags can still be set when an `afterScroll` hook
   * synchronously triggers a `forceFullRender`, and a full render must always rebuild the headers.
   *
   * @type {boolean}
   */
  isScrollDrivenDraw: boolean = false;

  /**
   * Binds the native DOM input listeners (scroll, wheel, key, resize) and translates them into the
   * engine's scroll actions. Extracted as a separate class to isolate the native-input lifecycle
   * from the overlay coordinator; the coordinator keeps a thin public `registerListeners` delegate.
   *
   * @type {NativeScrollInput}
   */
  #nativeScrollInput!: NativeScrollInput;

  /**
   * Owns the master hider/spreader sizing math. Extracted as a separate class to isolate the sizing
   * lifecycle from the overlay coordinator; the coordinator keeps thin public delegates.
   *
   * @type {SpreaderSize}
   */
  #spreaderSize!: SpreaderSize;

  /**
   * Owns the shared scroll state and the master<->clone scroll synchronization. Extracted as a
   * separate class to isolate the scroll-position lifecycle from the overlay coordinator; the
   * coordinator keeps thin public delegates and get/set accessors for the state it and the tests use.
   *
   * @type {ScrollSync}
   */
  #scrollSync!: ScrollSync;

  /**
   * Flag indicating whether the table is being scrolled vertically.
   *
   * @returns {boolean}
   */
  get verticalScrolling() {
    return this.#scrollSync.verticalScrolling;
  }

  /**
   * @param {boolean} value Whether the table is being scrolled vertically.
   */
  set verticalScrolling(value: boolean) {
    this.#scrollSync.verticalScrolling = value;
  }

  /**
   * Flag indicating whether the table is being scrolled horizontally.
   *
   * @returns {boolean}
   */
  get horizontalScrolling() {
    return this.#scrollSync.horizontalScrolling;
  }

  /**
   * @param {boolean} value Whether the table is being scrolled horizontally.
   */
  set horizontalScrolling(value: boolean) {
    this.#scrollSync.horizontalScrolling = value;
  }

  /**
   * The element that scrolls the table (the trimming container or the window).
   *
   * @returns {HTMLElement | Window}
   */
  get scrollableElement() {
    return this.#scrollSync.scrollableElement;
  }

  /**
   * Walkontable instance's reference.
   *
   * @protected
   * @type {Walkontable}
   */
  declare wot: WalkontableInstance;

  /**
   * An array of the all overlays.
   *
   * @type {Overlay[]}
   */
  #overlays: Overlay[] = [];

  /**
   * Refer to the TopOverlay instance.
   *
   * @protected
   * @type {TopOverlay}
   */
  declare topOverlay: Overlay;

  /**
   * Refer to the BottomOverlay instance.
   *
   * @protected
   * @type {BottomOverlay}
   */
  declare bottomOverlay: Overlay;

  /**
   * Refer to the InlineStartOverlay or instance.
   *
   * @protected
   * @type {InlineStartOverlay}
   */
  declare inlineStartOverlay: Overlay;

  /**
   * Refer to the TopInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {TopInlineStartCornerOverlay}
   */
  declare topInlineStartCornerOverlay: Overlay;

  /**
   * Refer to the BottomInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {BottomInlineStartCornerOverlay}
   */
  declare bottomInlineStartCornerOverlay: Overlay;

  /**
   * The walkontable settings.
   *
   * @protected
   * @type {Settings}
   */
  declare wtSettings: Settings;

  /**
   * Debounced `updateLastSpreaderSize` / `adjustElementsSize` used during scroll so rapid
   * `refresh` calls do not repeat layout work every frame.
   *
   * @type {Function}
   */
  #postponedAdjustElementsSize = debounce(this.#adjustElementsSizeIfNeeded.bind(this), 200);

  /**
   * Strategy that manages the sticky-scroll optimization during native
   * scrollbar drag. Extracted as a separate class to isolate the sticky
   * positioning lifecycle from the overlay coordinator.
   *
   * @type {StickyScrollStrategy}
   */
  #stickyScroll!: StickyScrollStrategy;

  /**
   * Watches the Walkontable wrapper's parent element for size changes (with an endless-loop guard)
   * and fires the `onContainerElementResize` setting. Extracted as a separate class to isolate the
   * ResizeObserver lifecycle from the overlay coordinator.
   *
   * @type {ResizeMonitor}
   */
  #resizeMonitor!: ResizeMonitor;

  /**
   * Tracks whether an overlay scrollbar is on screen, so the clearance strip the frozen overlays leave
   * for it opens with it and closes again when it fades (#10370).
   */
  #scrollbarVisibility!: ScrollbarVisibility;

  /**
   * The band sizes currently drawn, so a press landing in one can be swallowed (#10370).
   */
  #bandSizes = { bottom: 0, inlineEnd: 0 };

  /**
   * @param {OverlaysDeps} deps The Overlays module dependencies.
   */
  constructor(deps: OverlaysDeps) {
    this.#deps = deps;
    this.wot = deps.wot;
    this.wtSettings = deps.wtSettings;
    this.wtTable = deps.wtTable;
    const { rootDocument } = deps;

    // legacy support
    this.eventManager = deps.eventManager;

    // TODO refactoring: probably invalid place to this logic
    this.scrollbarSize = this.#deps.geometryReader.getScrollbarWidth(rootDocument);

    // Built here (not as field initializers) so `eventManager` is set and each collaborator can be
    // wired via the composition context. ScrollSync is built after the sticky strategy because it
    // drives sticky activation on scroll; it owns the scrollable element and the scroll state.
    this.#stickyScroll = new StickyScrollStrategy(this.#deps.makeStickyScrollDeps(this));
    this.#resizeMonitor = new ResizeMonitor(this.#deps.makeResizeMonitorDeps());
    // Re-applies the clearance when the scrollbar comes or goes. Only clip-path and a filler's
    // visibility change, so this costs paint, never layout.
    this.#scrollbarVisibility = new ScrollbarVisibility(
      this.#deps.makeScrollbarVisibilityDeps(),
      () => this.#refreshScrollbarClearance()
    );
    this.#spreaderSize = new SpreaderSize(this.#deps.makeSpreaderSizeDeps(this));
    this.#scrollSync = new ScrollSync(this.#deps.makeScrollSyncDeps(this, this.#stickyScroll));
    this.#nativeScrollInput = new NativeScrollInput(
      this.#deps.makeNativeScrollInputDeps(this, this.#stickyScroll, this.#resizeMonitor)
    );

    this.initOverlays();
    this.#scrollSync.cacheScrollCallbackPositions();

    this.destroyed = false;

    this.registerListeners();
  }

  /**
   * Get the list of references to all overlays.
   *
   * @param {boolean} [includeMaster = false] If set to `true`, the list will contain the master table as the last
   * element.
   * @returns {(TopOverlay|TopInlineStartCornerOverlay|InlineStartOverlay|BottomOverlay|BottomInlineStartCornerOverlay)[]}
   */
  getOverlays(includeMaster = false) {
    const overlays: Array<Overlay | Table> = [...this.#overlays];

    if (includeMaster) {
      overlays.push(this.wtTable);
    }

    return overlays;
  }

  /**
   * Prepare overlays based on user settings.
   *
   * @private
   */
  initOverlays() {
    // Each overlay gets a fresh dependency set from the shared factory (all fields are stable refs,
    // so the objects are independent but equivalent).
    const makeDeps = this.#deps.makeOverlayDeps;

    // TODO refactoring, conceive about using generic collection of overlays.
    this.topOverlay = new TopOverlay(makeDeps());
    this.bottomOverlay = new BottomOverlay(makeDeps());
    this.inlineStartOverlay = new InlineStartOverlay(makeDeps());

    // TODO discuss, the controversial here would be removing the lazy creation mechanism for corners.
    // TODO cond. Has no any visual impact. They're initially hidden in same way like left, top, and bottom overlays.
    this.topInlineStartCornerOverlay = new TopInlineStartCornerOverlay(makeDeps(),
      this.topOverlay, this.inlineStartOverlay);
    this.bottomInlineStartCornerOverlay = new BottomInlineStartCornerOverlay(makeDeps(),
      this.bottomOverlay, this.inlineStartOverlay);

    this.#overlays = [
      this.topOverlay,
      this.bottomOverlay,
      this.inlineStartOverlay,
      this.topInlineStartCornerOverlay,
      this.bottomInlineStartCornerOverlay,
    ];
  }

  /**
   * Pre-applies the header-border classes (`innerBorderTop` / `innerBorderInlineStart`) before
   * the cell render, so the post-render `resetFixedPosition` toggle is a no-op and the nested
   * `wot.draw(true)` re-render is skipped. Called from the master draw on the single-pass gated path,
   * before `beginDrawLayout`. Mirrors the overlay set used by the post-render position pass.
   */
  prepareHeaderBorders() {
    this.topOverlay.prepareHeaderBorders();

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.prepareHeaderBorders();
    }

    this.inlineStartOverlay.prepareHeaderBorders();
  }

  /**
   * Runs logic for the overlays before the table is drawn.
   */
  beforeDraw() {
    this.#scrollSync.setRenderingStateChanged(this.#overlays.reduce((acc, overlay) => {
      return overlay.hasRenderingStateChanged() || acc;
    }, false));

    this.#overlays.forEach(overlay => overlay.updateStateOfRendering('before'));
  }

  /**
   * Runs logic for the overlays after the table is drawn.
   */
  afterDraw() {
    this.syncScrollWithMaster();
    this.#overlays.forEach((overlay) => {
      const hasRenderingStateChanged = overlay.hasRenderingStateChanged();

      overlay.updateStateOfRendering('after');

      if (hasRenderingStateChanged && !overlay.needFullRender) {
        overlay.reset();
      }
    });
  }

  /**
   * Refresh and redraw table.
   */
  refreshAll() {
    if (!this.wot.drawn) {
      return;
    }
    if (!this.wtTable.holder.parentNode) {
      // Walkontable was detached from DOM, but this handler was not removed
      this.destroy();

      return;
    }
    this.wot.draw(true);

    this.#scrollSync.fireScrollCallbacksAndReset();
  }

  /**
   * Register all necessary event listeners.
   */
  registerListeners() {
    this.#nativeScrollInput.registerListeners();

    // An overlay scrollbar comes on screen when the pointer nears it, so the strip it needs has to be
    // driven by pointer position. Passive, and the handler reads no DOM - the scrollport rect it
    // compares against is cached and only re-read on scroll or resize.
    this.eventManager.addEventListener(this.#deps.rootWindow as unknown as HTMLElement, 'pointermove', ((
      event: PointerEvent
    ) => {
      this.#scrollbarVisibility.notifyPointerMoved(
        event.clientX, event.clientY, this.wtSettings.getSetting<boolean>('rtlMode')
      );
    }) as EventListener, { passive: true });

    // Nothing can hold a band open once the pointer is gone. Releasing a pin needs a move that says
    // "no longer near", and once the pointer leaves the window no more moves arrive - so without this
    // the strip stayed painted for as long as the page was open.
    this.eventManager.addEventListener(
      this.#deps.rootDocument.documentElement,
      'pointerleave',
      (() => this.#scrollbarVisibility.notifyPointerLeft()) as EventListener,
      { passive: true }
    );

    // The cached scrollport rect is in viewport coordinates, so scrolling the PAGE moves the grid
    // without any of the grid's own scroll offsets changing. Left alone, a pointer beside the real
    // scrollbar then read as "not near" and the band closed under a drawn thumb, or one sitting
    // mid-grid fell inside the stale edge zone and pinned it open. Only drops the cache; no reads.
    this.eventManager.addEventListener(
      this.#deps.rootWindow as unknown as HTMLElement,
      'scroll',
      (() => this.#scrollbarVisibility.notifyResized()) as EventListener,
      { passive: true, capture: true }
    );

    // A press inside an open band must do nothing: no selection, no deselect, no menu. It has to be
    // caught by coordinate on the way down - the band element is not hit-tested (the browser answers a
    // point in there with the scroll container), so nothing on the band itself would ever fire.
    BAND_SWALLOWED_EVENTS.forEach((eventName) => {
      this.eventManager.addEventListener(
        this.wtTable.holder,
        eventName,
        ((event: MouseEvent) => this.#swallowBandPress(event)) as EventListener,
        { capture: true }
      );
    });
  }

  /**
   * Stops a pointer event that landed inside an open scrollbar band (#10370).
   *
   * @param {MouseEvent} event The pointer event on its way down to the grid.
   */
  #swallowBandPress(event: MouseEvent) {
    const { bottom, inlineEnd } = this.#bandSizes;

    if (bottom === 0 && inlineEnd === 0) {
      return;
    }

    const rect = this.#deps.geometryReader.getBoundingClientRect(this.wtTable.holder);

    const rtl = this.wtSettings.getSetting<boolean>('rtlMode');

    if (isPointInScrollbarBand(rect, bottom, inlineEnd, rtl, event.clientX, event.clientY)) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  /**
   * Whether an overlay scrollbar is currently on screen, and so whether the frozen overlays should be
   * leaving a clearance strip for it (#10370).
   *
   * @returns {ScrollbarBandsOpen}
   */
  isScrollbarVisible(): ScrollbarBandsOpen {
    // The clip and the band switch on the same flag, so the two can never disagree - either half-
    // switched state is visible (a seam down the strip, or a column header cut short). See
    // `ScrollbarVisibility`.
    const visible = this.#scrollbarVisibility.visible;

    return { bottom: visible.horizontal, inlineEnd: visible.vertical };
  }

  /**
   * Reports a scroll to the scrollbar-visibility tracker: scrolling is what puts an overlay scrollbar
   * on screen, alongside the pointer nearing it.
   */
  notifyScrolledForScrollbarVisibility(): void {
    // Nothing downstream can produce a band on a classic-scrollbar system, so a scroll there should not
    // flip state, schedule a timer per axis and run two no-op refresh passes. `getScrollbarWidth`
    // caches after its first call, so this costs a lookup on a path that fires on every scroll.
    if (this.#deps.geometryReader.getScrollbarWidth(this.#deps.rootDocument) !== 0) {
      return;
    }

    this.#scrollbarVisibility.notifyScrolled();
  }

  /**
   * Scrolls main scrollable element vertically.
   *
   * @param {number} delta Relative value to scroll.
   * @returns {boolean}
   */
  scrollVertically(delta: number) {
    if (!(this.scrollableElement instanceof HTMLElement)) {
      return false;
    }

    const el = this.scrollableElement;
    const previousScroll = el.scrollTop;

    el.scrollTop += delta;

    return previousScroll !== el.scrollTop;
  }

  /**
   * Scrolls main scrollable element horizontally.
   *
   * @param {number} delta Relative value to scroll.
   * @returns {boolean}
   */
  scrollHorizontally(delta: number) {
    if (!(this.scrollableElement instanceof HTMLElement)) {
      return false;
    }

    const el = this.scrollableElement;
    const previousScroll = el.scrollLeft;

    el.scrollLeft += delta;

    return previousScroll !== el.scrollLeft;
  }

  /**
   * Synchronize scroll position between master table and overlay table.
   *
   * @private
   */
  syncScrollPositions() {
    this.#scrollSync.syncScrollPositions();
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar.
   */
  syncScrollWithMaster() {
    this.#scrollSync.syncScrollWithMaster();
  }

  /**
   * Update the main scrollable elements for all the overlays.
   */
  updateMainScrollableElements() {
    this.#scrollSync.updateMainScrollableElements();
  }

  /**
   *
   */
  destroy() {
    this.#postponedAdjustElementsSize.cancel();
    this.#resizeMonitor.destroy();
    this.#scrollbarVisibility.destroy();
    this.#stickyScroll.destroy();
    this.eventManager.destroy();
    // todo, probably all below `destroy` calls has no sense. To analyze
    this.topOverlay.destroy();

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.destroy();
    }
    this.inlineStartOverlay.destroy();

    if (this.topInlineStartCornerOverlay) {
      this.topInlineStartCornerOverlay.destroy();
    }

    if (this.bottomInlineStartCornerOverlay && this.bottomInlineStartCornerOverlay.clone) {
      this.bottomInlineStartCornerOverlay.destroy();
    }

    this.destroyed = true;
  }

  /**
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  refresh(fastDraw = false) {
    // `isScrollDrivenDraw` guards both decisions below: the scroll-direction flags can still be set
    // during a `forceFullRender` (an `afterScroll` hook may trigger `hot.render()` before the flags are
    // reset), and a full render enters as `draw(false)` (so `isScrollDrivenDraw` is `false`), which must
    // fully re-render and size the overlays rather than treat this as a scroll.
    const isScrollTriggered = this.isScrollDrivenDraw &&
      (this.verticalScrolling || this.horizontalScrolling);
    // On a pure vertical scroll the bottom overlay (and its inline-start corner) render the same fixed
    // rows over the same visible columns, so their DOM is unchanged - a full re-render is wasted work and
    // forces an expensive style/layout/paint of the clone subtree on every scroll frame. Reposition them
    // (fast draw) instead. Any horizontal scroll changes the visible columns, and a non-scroll redraw
    // (data, settings, resize) is not scroll-driven, so those paths still trigger a full re-render.
    const bottomFastDraw = fastDraw ||
      (this.isScrollDrivenDraw && this.verticalScrolling && !this.horizontalScrolling);

    if (isScrollTriggered) {
      this.#postponedAdjustElementsSize();
    } else {
      this.#adjustElementsSizeIfNeeded();
    }

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.refresh(bottomFastDraw);
    }

    this.inlineStartOverlay.refresh(fastDraw);
    this.topOverlay.refresh(fastDraw);

    if (this.topInlineStartCornerOverlay) {
      this.topInlineStartCornerOverlay.refresh(fastDraw);
    }

    if (this.bottomInlineStartCornerOverlay && this.bottomInlineStartCornerOverlay.clone) {
      this.bottomInlineStartCornerOverlay.refresh(bottomFastDraw);
    }
  }

  /**
   * Update the last cached spreader size with the current size.
   *
   * @returns {boolean} `true` if the lastSpreaderSize cache was updated, `false` otherwise.
   */
  updateLastSpreaderSize() {
    return this.#spreaderSize.updateLastSpreaderSize();
  }

  /**
   * Re-applies the column-header heights to the master and every header-bearing overlay after the
   * Handsontable-side render-size probe has measured content-driven header heights. The probe runs
   * after the draw completes (once the DOM is final), so the overlays first render at the provided
   * height and are corrected here to match the master - a synchronous, hook-free reconcile that
   * replaces the old mid-draw `markOversizedColumnHeaders` measurement. The frozen-overlay sync runs
   * last so a wrapped header inside the frozen region still wins, and the sizes are flushed to the DOM.
   */
  refreshColumnHeaderHeights() {
    const headerBearingTables = [
      this.wot.wtTable,
      this.topOverlay.clone?.wtTable,
      this.inlineStartOverlay.clone?.wtTable,
      this.topInlineStartCornerOverlay?.clone?.wtTable,
    ];

    headerBearingTables.forEach((table) => {
      if (table) {
        adjustColumnHeaderHeights(table);
      }
    });
    syncOversizedColumnHeadersWithFrozenOverlays(this.wot.wtTable);
    this.adjustElementsSize();
  }

  /**
   * Adjust overlays elements size and master table size.
   */
  adjustElementsSize() {
    this.#spreaderSize.adjustElementsSize();
    // The scrollport may have just moved or changed size, so the rect the pointer is compared against
    // has to be re-read on next use. Dropping a field, no measurement.
    this.#scrollbarVisibility.notifyResized();
    this.#syncScrollbarTrackBands();
  }

  /**
   * Re-applies the clearance after the scrollbar appears or fades, and nothing else (#10370).
   *
   * Opening and closing the band is a paint change - a `clip-path` and an opacity - so it must not drag
   * a full `adjustElementsSize` behind it: that walks every column, resizes three overlays, and (being
   * an extra pass no other input triggers) changes what the render-offset specs count.
   */
  #refreshScrollbarClearance() {
    const visible = this.#scrollbarVisibility.visible;
    const open = { bottom: visible.horizontal, inlineEnd: visible.vertical };

    // The bands have to come and go on this signal, not wait for the next draw - a scroll may not
    // trigger one, and the scrollbar is already on screen by then.
    this.#syncScrollbarTrackBands();

    this.#overlays.forEach((overlay) => {
      overlay.refreshScrollbarClearance?.(open);
    });
  }

  /**
   * Draws the band each overlay scrollbar is painted in, across the whole scrollport (#10370).
   *
   * Owned here rather than per overlay: the band has to span the master too, or the frozen part reads as
   * an opaque patch next to a transparent gap. Skipped entirely unless the grid is in the
   * overlay-scrollbar regime, so a classic-scrollbar grid pays nothing - not even the two reads.
   */
  #syncScrollbarTrackBands() {
    const { geometryReader, rootDocument } = this.#deps;
    const wtViewport = this.wot.wtViewport;
    const holder = this.wtTable.holder;
    // Only when the holder is the scroller. With page-level scrolling the scrollbar belongs to the
    // window, nowhere near this holder, so a band in here would carve a strip out of nothing.
    // Also off on a touch-only device: nothing there can grab a thumb, and the band would swallow the
    // press that becomes a tap - see `canGrabScrollbar`.
    const holderScrolls = this.scrollableElement === holder
      && canGrabScrollbar(this.#deps.rootWindow);
    const scrollbarWidth = geometryReader.getScrollbarWidth(rootDocument);
    // Only where an overlay is actually clipped out of the strip. The band exists to fill in for the
    // frozen content that stops short of the scrollbar; along an edge no overlay reaches, there is
    // nothing to fill in for, and drawing one paints a grey strip over live cells and swallows the
    // presses there - which is what a grid with no frozen rows or columns used to get.
    const covers = (edge: 'bottom' | 'inlineEnd') =>
      this.#overlays.some(overlay => overlay.coversScrollbarEdge?.(edge));
    const bottom = holderScrolls && covers('bottom')
      ? axisScrollbarClearance(
        geometryReader, holder, scrollbarWidth, wtViewport.hasHorizontalScroll(), 'horizontal'
      ) : 0;
    const inlineEnd = holderScrolls && covers('inlineEnd')
      ? axisScrollbarClearance(
        geometryReader, holder, scrollbarWidth, wtViewport.hasVerticalScroll(), 'vertical'
      ) : 0;

    const visible = this.#scrollbarVisibility.visible;
    const open = { bottom: visible.horizontal, inlineEnd: visible.vertical };

    // Only an open band can swallow a press; a closed edge is ordinary grid again.
    this.#bandSizes = {
      bottom: open.bottom ? bottom : 0,
      inlineEnd: open.inlineEnd ? inlineEnd : 0,
    };

    if (bottom === 0 && inlineEnd === 0) {
      syncScrollbarTrackBands(
        holder,
        { bottom: 0, inlineEnd: 0, scrollportWidth: 0, scrollportHeight: 0 },
        { bottom: false, inlineEnd: false }
      );

      return;
    }

    syncScrollbarTrackBands(holder, {
      bottom,
      inlineEnd,
      scrollportWidth: geometryReader.clientWidth(holder),
      scrollportHeight: geometryReader.clientHeight(holder),
    }, open);
  }

  /**
   * Expand the hider vertically element by the provided delta value.
   *
   * @param {number} heightDelta The delta value to expand the hider element by.
   */
  expandHiderVerticallyBy(heightDelta: number) {
    this.#spreaderSize.expandHiderVerticallyBy(heightDelta);
  }

  /**
   * Expand the hider horizontally element by the provided delta value.
   *
   * @param {number} widthDelta The delta value to expand the hider element by.
   */
  expandHiderHorizontallyBy(widthDelta: number) {
    this.#spreaderSize.expandHiderHorizontallyBy(widthDelta);
  }

  /**
   *
   */
  applyToDOM() {
    if (!this.wtTable.isVisible()) {
      return;
    }

    this.topOverlay.applyToDOM();

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.applyToDOM();
    }

    this.inlineStartOverlay.applyToDOM();
    this.#stickyScroll.syncOffsets();
  }

  /**
   * Get the parent overlay of the provided element.
   *
   * @param {HTMLElement} element An element to process.
   * @returns {WalkontableInstance|null}
   */
  getParentOverlay(element: HTMLElement): WalkontableInstance | null {
    if (!element) {
      return null;
    }

    const overlays = [
      this.topOverlay,
      this.inlineStartOverlay,
      this.bottomOverlay,
      this.topInlineStartCornerOverlay,
      this.bottomInlineStartCornerOverlay
    ];
    let result = null;

    arrayEach(overlays, (overlay) => {
      if (!overlay) {
        return;
      }

      if (overlay.clone && overlay.clone.wtTable.TABLE.contains(element)) { // todo demeter
        result = overlay.clone;
      }
    });

    return result;
  }

  /**
   * Synchronize the class names between the main overlay table and the tables on the other overlays.
   *
   */
  syncOverlayTableClassNames() {
    const masterTable = this.wtTable.TABLE;
    const overlays = [
      this.topOverlay,
      this.inlineStartOverlay,
      this.bottomOverlay,
      this.topInlineStartCornerOverlay,
      this.bottomInlineStartCornerOverlay
    ];

    arrayEach(overlays, (elem) => {
      if (!elem) {
        return;
      }

      if (elem.clone) {
        elem.clone.wtTable.TABLE.className = masterTable.className; // todo demeter
      }
    });
  }

  /**
   * Adjust the elements size if needed.
   */
  #adjustElementsSizeIfNeeded() {
    if (this.destroyed) {
      return;
    }

    const wasSpreaderSizeUpdated = this.updateLastSpreaderSize();

    if (wasSpreaderSizeUpdated) {
      this.adjustElementsSize();
    }
  }
}

export default Overlays;
