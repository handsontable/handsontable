import type { WalkontableInstance, DomBindings } from './types';
import type Settings from './settings';
import type Table from './table';

/**
 * Extends WheelEvent with legacy (non-standard) delta properties used by older browsers.
 */
interface WheelEventWithLegacyDelta extends WheelEvent {
  wheelDeltaY?: number;
  wheelDeltaX?: number;
}

/**
 * Type predicate that checks whether a WheelEvent carries the legacy
 * non-standard `wheelDeltaX`/`wheelDeltaY` properties emitted by older browsers.
 *
 * @param {WheelEvent} event The wheel event to test.
 * @returns {boolean}
 */
function isWheelEventWithLegacyDelta(event: WheelEvent): event is WheelEventWithLegacyDelta {
  return 'wheelDeltaY' in event || 'wheelDeltaX' in event;
}
import type { Overlay } from './overlay/_base';
import type EventManager from '../../../eventManager';
import {
  eventTargetEl,
  getScrollableElement,
  getScrollbarWidth,
  isHTMLElement,
} from '../../../helpers/dom/element';
import { requestAnimationFrame } from '../../../helpers/feature';
import { debounce } from '../../../helpers/function';
import { arrayEach } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import { warn } from '../../../helpers/console';
import {
  InlineStartOverlay,
  TopOverlay,
  TopInlineStartCornerOverlay,
  BottomOverlay,
  BottomInlineStartCornerOverlay,
} from './overlay';
import { StickyScrollStrategy } from './stickyScrollStrategy';

/**
 * @class Overlays
 */
class Overlays {
  /**
   * DOM bindings for the Walkontable instance.
   *
   * @protected
   * @type {object}
   */
  domBindings: DomBindings = null;

  /**
   * Function which returns proper facade.
   *
   * @protected
   * @type {Function}
   */
  facadeGetter: Function = null;

  /**
   * Reference to the master table instance.
   *
   * @protected
   * @type {MasterTable}
   */
  wtTable: Table = null;

  /**
   * Legacy support reference to the Walkontable instance.
   *
   * @protected
   * @type {Walkontable}
   */
  instance: WalkontableInstance = null;

  /**
   * The walkontable event manager instance.
   *
   * @protected
   * @type {EventManager}
   */
  eventManager: EventManager = null;

  /**
   * The width of the scrollbar.
   *
   * @protected
   * @type {number}
   */
  scrollbarSize: number = 0;

  /**
   * The main scrollable element.
   *
   * @protected
   * @type {HTMLElement|Window}
   */
  scrollableElement: HTMLElement | Window = null;

  /**
   * Flag indicating whether the overlay has been destroyed.
   *
   * @protected
   * @type {boolean}
   */
  destroyed: boolean = false;

  /**
   * Flag indicating whether a key is currently pressed.
   *
   * @protected
   * @type {boolean}
   */
  keyPressed: boolean = false;

  /**
   * The last cached spreader size.
   *
   * @protected
   * @type {object}
   */
  spreaderLastSize: { width: number | null; height: number | null } = { width: null, height: null };

  /**
   * Flag indicating whether the table is being scrolled vertically.
   *
   * @protected
   * @type {boolean}
   */
  verticalScrolling: boolean = false;

  /**
   * Flag indicating whether the table is being scrolled horizontally.
   *
   * @protected
   * @type {boolean}
   */
  horizontalScrolling: boolean = false;

  /**
   * The last horizontal scroll position.
   *
   * @protected
   * @type {number}
   */
  lastScrollX: number = 0;

  /**
   * The last vertical scroll position.
   *
   * @protected
   * @type {number}
   */
  lastScrollY: number = 0;

  /**
   * Walkontable instance's reference.
   *
   * @protected
   * @type {Walkontable}
   */
  wot: WalkontableInstance = null;

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
  topOverlay: Overlay = null;

  /**
   * Refer to the BottomOverlay instance.
   *
   * @protected
   * @type {BottomOverlay}
   */
  bottomOverlay: Overlay = null;

  /**
   * Refer to the InlineStartOverlay or instance.
   *
   * @protected
   * @type {InlineStartOverlay}
   */
  inlineStartOverlay: Overlay = null;

  /**
   * Refer to the TopInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {TopInlineStartCornerOverlay}
   */
  topInlineStartCornerOverlay: Overlay = null;

  /**
   * Refer to the BottomInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {BottomInlineStartCornerOverlay}
   */
  bottomInlineStartCornerOverlay: Overlay = null;

  /**
   * Browser line height for purposes of translating mouse wheel.
   *
   * @private
   * @type {number}
   */
  browserLineHeight: number = undefined;

  /**
   * The walkontable settings.
   *
   * @protected
   * @type {Settings}
   */
  wtSettings: Settings = null;

  /**
   * Indicates whether the rendering state has changed for one of the overlays.
   *
   * @type {boolean}
   */
  #hasRenderingStateChanged = false;

  /**
   * Cached vertical scroll position used to deduplicate `onScrollVertically` callbacks.
   * Tracks the value returned by `topOverlay.getScrollPosition()` at the time the callback
   * was last fired so that a second call with an unchanged position is suppressed.
   *
   * @type {number | null}
   */
  #lastVerticalScrollPositionForCallback: number | null = null;

  /**
   * Cached horizontal scroll position used to deduplicate `onScrollHorizontally` callbacks.
   * Tracks the value returned by `inlineStartOverlay.getScrollPosition()` at the time the
   * callback was last fired so that a second call with an unchanged position is suppressed.
   *
   * @type {number | null}
   */
  #lastHorizontalScrollPositionForCallback: number | null = null;

  /**
   * The amount of times the ResizeObserver callback was fired in direct succession.
   *
   * @type {number}
   */
  #containerDomResizeCount = 0;

  /**
   * The timeout ID for the ResizeObserver endless-loop-blocking logic.
   *
   * @type {number}
   */
  #containerDomResizeCountTimeout: ReturnType<typeof setTimeout> | null = null;

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
  #stickyScroll = new StickyScrollStrategy(this);

  /**
   * The instance of the ResizeObserver that observes the size of the Walkontable wrapper element.
   * In case of the size change detection the `onContainerElementResize` is fired.
   *
   * @private
   * @type {ResizeObserver}
   */
  resizeObserver = new ResizeObserver((entries) => {
    requestAnimationFrame(() => {
      if (!Array.isArray(entries) || !entries.length) {
        return;
      }

      this.#containerDomResizeCount += 1;

      if (this.#containerDomResizeCount === 300) {
        warn('The ResizeObserver callback was fired too many times in direct succession.' +
          '\nThis may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
          'with the `dvh` units) to a Handsontable container\'s parent. ' +
          '\nThe observer will be disconnected.');

        this.resizeObserver.disconnect();
      }

      // This logic is required to prevent an endless loop of the ResizeObserver callback.
      // https://github.com/handsontable/dev-handsontable/issues/1898#issuecomment-2154794817
      if (this.#containerDomResizeCountTimeout !== null) {
        clearTimeout(this.#containerDomResizeCountTimeout);
      }

      this.#containerDomResizeCountTimeout = setTimeout(() => {
        this.#containerDomResizeCount = 0;
      }, 100);

      this.wtSettings.getSetting('onContainerElementResize');
    });
  });

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @todo refactoring remove.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {EventManager} eventManager The walkontable event manager.
   * @param {MasterTable} wtTable The master table.
   */
  constructor(
    wotInstance: WalkontableInstance, facadeGetter: Function, domBindings: DomBindings,
    wtSettings: Settings, eventManager: EventManager, wtTable: Table) {
    this.wot = wotInstance;
    this.wtSettings = wtSettings;
    this.domBindings = domBindings;
    this.facadeGetter = facadeGetter;
    this.wtTable = wtTable;
    const { rootDocument, rootWindow } = this.domBindings;

    // legacy support
    this.instance = this.wot; // todo refactoring: move to facade
    this.eventManager = eventManager;

    // TODO refactoring: probably invalid place to this logic
    this.scrollbarSize = getScrollbarWidth(rootDocument);

    const rootElementParent = wtTable.wtRootElement.parentNode;
    // Use nodeType === 1 instead of instanceof Element so the check works across realms (iframes).
    // Falls back to getScrollableElement when there is no element parent (null or detached).
    const isOverflowClip = rootElementParent !== null
      && rootElementParent.nodeType === 1
      && (() => {
        const overflow = rootWindow
          .getComputedStyle(rootElementParent as Element).getPropertyValue('overflow');

        return overflow === 'hidden' || overflow === 'clip';
      })();

    this.scrollableElement = isOverflowClip ? wtTable.holder : getScrollableElement(wtTable.TABLE);

    this.initOverlays();
    this.#cacheScrollCallbackPositions();

    this.destroyed = false;
    this.keyPressed = false;
    this.spreaderLastSize = {
      width: null,
      height: null,
    };

    this.verticalScrolling = false;
    this.horizontalScrolling = false;

    this.initBrowserLineHeight();
    this.registerListeners();
    this.lastScrollX = rootWindow.scrollX;
    this.lastScrollY = rootWindow.scrollY;
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
   * Retrieve browser line height and apply its value to `browserLineHeight`.
   *
   * @private
   */
  initBrowserLineHeight() {
    const { rootWindow, rootDocument } = this.domBindings;
    const computedStyle = rootWindow.getComputedStyle(rootDocument.body);
    /**
     * Sometimes `line-height` might be set to 'normal'. In that case, a default `font-size` should be multiplied by roughly 1.2.
     * Https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values.
     */
    const lineHeight = parseInt(computedStyle.lineHeight, 10);
    const lineHeightFalback = parseInt(computedStyle.fontSize, 10) * 1.2;

    this.browserLineHeight = lineHeight || lineHeightFalback;
  }

  /**
   * Prepare overlays based on user settings.
   *
   * @private
   */
  initOverlays() {
    const args = [this.wot, this.facadeGetter, this.wtSettings, this.domBindings] as const;

    // todo refactoring: IOC, collection or factories.
    // TODO refactoring, conceive about using generic collection of overlays.
    this.topOverlay = new TopOverlay(args[0], args[1], args[2], args[3]);
    this.bottomOverlay = new BottomOverlay(args[0], args[1], args[2], args[3]);
    this.inlineStartOverlay = new InlineStartOverlay(args[0], args[1], args[2], args[3]);

    // TODO discuss, the controversial here would be removing the lazy creation mechanism for corners.
    // TODO cond. Has no any visual impact. They're initially hidden in same way like left, top, and bottom overlays.
    this.topInlineStartCornerOverlay = new TopInlineStartCornerOverlay(args[0], args[1], args[2], args[3],
      this.topOverlay, this.inlineStartOverlay);
    this.bottomInlineStartCornerOverlay = new BottomInlineStartCornerOverlay(args[0], args[1], args[2], args[3],
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
   * Runs logic for the overlays before the table is drawn.
   */
  beforeDraw() {
    this.#hasRenderingStateChanged = this.#overlays.reduce((acc, overlay) => {
      return overlay.hasRenderingStateChanged() || acc;
    }, false);

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

    if (this.verticalScrolling && this.#didVerticalScrollPositionChange()) {
      this.inlineStartOverlay.onScroll(); // todo the inlineStartOverlay.onScroll() fires hook. Why is it needed there, not in any another place?
    }

    if (this.horizontalScrolling && this.#didHorizontalScrollPositionChange()) {
      this.topOverlay.onScroll();
    }

    this.verticalScrolling = false;
    this.horizontalScrolling = false;
  }

  /**
   * Register all necessary event listeners.
   */
  registerListeners() {
    const { rootDocument, rootWindow } = this.domBindings;
    const { mainTableScrollableElement: topOverlayScrollableElement } = this.topOverlay;
    const { mainTableScrollableElement: inlineStartOverlayScrollableElement } = this.inlineStartOverlay;

    this.eventManager.addEventListener(rootDocument.documentElement, 'keydown',
      (event: KeyboardEvent) => this.onKeyDown(event));
    this.eventManager.addEventListener(rootDocument.documentElement, 'keyup', () => this.onKeyUp());
    this.eventManager.addEventListener(rootDocument, 'visibilitychange', () => this.onKeyUp());

    this.#stickyScroll.registerListeners();
    this.eventManager.addEventListener(
      topOverlayScrollableElement,
      'scroll',
      (event: Event) => this.onTableScroll(event),
      { passive: true }
    );

    if (topOverlayScrollableElement !== inlineStartOverlayScrollableElement) {
      this.eventManager.addEventListener(
        inlineStartOverlayScrollableElement,
        'scroll',
        (event: Event) => this.onTableScroll(event),
        { passive: true }
      );
    }

    const isScrollOnWindow = this.scrollableElement === rootWindow;
    const preventWheel = this.wtSettings.getSetting<boolean>('preventWheel');
    const wheelEventOptions = { passive: isScrollOnWindow };

    this.eventManager.addEventListener(
      this.wtTable.wtRootElement,
      'wheel',
      (event: WheelEvent) => this.onCloneWheel(event, preventWheel),
      wheelEventOptions
    );

    const overlays = [
      this.topOverlay,
      this.bottomOverlay,
      this.inlineStartOverlay,
      this.topInlineStartCornerOverlay,
      this.bottomInlineStartCornerOverlay,
    ];

    overlays.forEach((overlay) => {
      this.eventManager.addEventListener(
        overlay.clone.wtTable.holder,
        'wheel',
        (event: WheelEvent) => this.onCloneWheel(event, preventWheel),
        wheelEventOptions
      );
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;

    this.eventManager.addEventListener(rootWindow, 'resize', () => {
      requestAnimationFrame(() => {
        clearTimeout(resizeTimeout);
        this.wtSettings.getSetting('onWindowResize');

        resizeTimeout = setTimeout(() => {
          // Remove resizing the window from the ResizeObserver's endless-loop-blocking logic.
          this.#containerDomResizeCount = 0;
        }, 200);
      });
    });

    if (!isScrollOnWindow) {
      this.resizeObserver.observe(this.wtTable.wtRootElement.parentElement);
    }
  }

  /**
   * Scroll listener.
   *
   * @param {Event} event The mouse event object.
   */
  onTableScroll(event: Event) {
    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.
    const rootWindow = this.domBindings.rootWindow;
    const masterHorizontal = this.inlineStartOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    if (this.keyPressed) {
      if ((masterVertical !== rootWindow && target !== rootWindow &&
           !(masterVertical instanceof HTMLElement && eventTargetEl(event)!.contains(masterVertical))) ||
          (masterHorizontal !== rootWindow && target !== rootWindow &&
           !(masterHorizontal instanceof HTMLElement && eventTargetEl(event)!.contains(masterHorizontal)))) {
        return;
      }
    }

    this.syncScrollPositions();
  }

  /**
   * Wheel listener for cloned overlays.
   *
   * @param {Event} event The mouse event object.
   * @param {boolean} preventDefault If `true`, the `preventDefault` will be called on event object.
   */
  onCloneWheel(event: WheelEvent, preventDefault: boolean) {
    // Fix for Windows OS, where the ctrl key is used to zoom the page (issue #dev-2405).
    if (event.ctrlKey) {
      return;
    }

    const { rootWindow } = this.domBindings;

    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

    const masterHorizontal = this.inlineStartOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    const shouldNotWheelVertically = masterVertical !== rootWindow &&
      target !== rootWindow &&
      !(target instanceof Node && masterVertical instanceof HTMLElement && target.contains(masterVertical));
    const shouldNotWheelHorizontally = masterHorizontal !== rootWindow &&
      target !== rootWindow &&
      !(target instanceof Node && masterHorizontal instanceof HTMLElement && target.contains(masterHorizontal));

    if (
      (this.keyPressed && (shouldNotWheelVertically || shouldNotWheelHorizontally))
       ||
      this.scrollableElement === rootWindow
    ) {
      return;
    }

    const isScrollPossible = this.translateMouseWheelToScroll(event);

    if (preventDefault || (this.scrollableElement !== rootWindow && isScrollPossible)) {
      event.preventDefault();
    }
  }

  /**
   * Key down listener.
   *
   * @param {Event} event The keyboard event object.
   */
  onKeyDown(event: KeyboardEvent) {
    this.keyPressed = isKey(event.keyCode, 'ARROW_UP|ARROW_RIGHT|ARROW_DOWN|ARROW_LEFT');
  }

  /**
   * Key up listener.
   */
  onKeyUp() {
    this.keyPressed = false;
  }

  /**
   * Translate wheel event into scroll event and sync scroll overlays position.
   *
   * @private
   * @param {Event} event The mouse event object.
   * @returns {boolean}
   */
  translateMouseWheelToScroll(event: WheelEvent) {
    let deltaY: number;
    let deltaX: number;

    if (isWheelEventWithLegacyDelta(event)) {
      deltaY = isNaN(event.deltaY) ? (-1) * (event.wheelDeltaY ?? 0) : event.deltaY;
      deltaX = isNaN(event.deltaX) ? (-1) * (event.wheelDeltaX ?? 0) : event.deltaX;
    } else {
      deltaY = event.deltaY;
      deltaX = event.deltaX;
    }

    if (event.deltaMode === 1) {
      deltaX += deltaX * this.browserLineHeight;
      deltaY += deltaY * this.browserLineHeight;
    }

    const isScrollVerticallyPossible = this.scrollVertically(deltaY);
    const isScrollHorizontallyPossible = this.scrollHorizontally(deltaX);

    return isScrollVerticallyPossible || isScrollHorizontallyPossible;
  }

  /**
   * Scrolls main scrollable element horizontally.
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
    if (this.destroyed) {
      return;
    }

    const topHolder = this.topOverlay.clone.wtTable.holder; // todo rethink
    const leftHolder = this.inlineStartOverlay.clone.wtTable.holder; // todo rethink
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    let scrollX = this.scrollableElement instanceof HTMLElement ? this.scrollableElement.scrollLeft : 0;
    let scrollY = this.scrollableElement instanceof HTMLElement ? this.scrollableElement.scrollTop : 0;

    if (
      this.wot.wtViewport.isHorizontallyScrollableByWindow()
      && ((typeof preventOverflow === 'boolean' && preventOverflow) || preventOverflow !== 'horizontal')
      && this.scrollableElement instanceof Window
    ) {
      scrollX = this.scrollableElement.scrollX;
    }

    if (
      this.wot.wtViewport.isVerticallyScrollableByWindow()
      && ((typeof preventOverflow === 'boolean' && preventOverflow) || preventOverflow !== 'vertical')
      && this.scrollableElement instanceof Window
    ) {
      scrollY = this.scrollableElement.scrollY;
    }

    this.horizontalScrolling = this.lastScrollX !== scrollX;
    this.verticalScrolling = this.lastScrollY !== scrollY;
    this.lastScrollX = scrollX;
    this.lastScrollY = scrollY;

    this.#stickyScroll.tryActivate(this.verticalScrolling, this.horizontalScrolling);

    if (this.horizontalScrolling) {
      topHolder.scrollLeft = scrollX;

      const bottomHolder = this.bottomOverlay.needFullRender ? this.bottomOverlay.clone.wtTable.holder : null; // todo rethink

      if (bottomHolder) {
        bottomHolder.scrollLeft = scrollX;
      }
    }

    if (this.verticalScrolling) {
      // In window-scroll mode the left overlay's row positions are driven by
      // spreader.style.top; the holder must not accumulate scroll offset.
      // Setting scrollTop to window.scrollY would be capped to the tiny
      // hider/holder size difference caused by fractional zoom rounding,
      // shifting the visible rows and misaligning them with the master table.
      if (this.wot.wtViewport.isVerticallyScrollableByWindow()) {
        leftHolder.scrollTop = 0;
      } else {
        leftHolder.scrollTop = scrollY;
      }
    }

    this.refreshAll();
    this.#stickyScroll.syncOffsets();
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar.
   */
  syncScrollWithMaster() {
    if (!this.#hasRenderingStateChanged) {
      return;
    }

    const masterScrollable = this.topOverlay.mainTableScrollableElement;

    if (!(masterScrollable instanceof HTMLElement)) {
      return;
    }

    const { scrollLeft, scrollTop } = masterScrollable;

    if (this.topOverlay.needFullRender) {
      this.topOverlay.clone.wtTable.holder.scrollLeft = scrollLeft; // todo rethink, *overlay.setScroll*()
    }
    if (this.bottomOverlay.needFullRender) {
      this.bottomOverlay.clone.wtTable.holder.scrollLeft = scrollLeft; // todo rethink, *overlay.setScroll*()
    }
    if (this.inlineStartOverlay.needFullRender) {
      this.inlineStartOverlay.clone.wtTable.holder.scrollTop = scrollTop; // todo rethink, *overlay.setScroll*()
    }

    this.#hasRenderingStateChanged = false;
  }

  /**
   * Caches the initial vertical and horizontal scroll positions for callback deduplication.
   */
  #cacheScrollCallbackPositions() {
    this.#lastVerticalScrollPositionForCallback = this.topOverlay.getScrollPosition();
    this.#lastHorizontalScrollPositionForCallback = this.inlineStartOverlay.getScrollPosition();
  }

  /**
   * Checks whether the vertical scroll position has changed since the last `onScrollVertically`
   * callback and updates the cache. Returns `true` when the callback should fire.
   *
   * @returns {boolean}
   */
  #didVerticalScrollPositionChange() {
    const current = this.topOverlay.getScrollPosition();

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
    const current = this.inlineStartOverlay.getScrollPosition();

    if (this.#lastHorizontalScrollPositionForCallback === current) {
      return false;
    }

    this.#lastHorizontalScrollPositionForCallback = current;

    return true;
  }

  /**
   * Update the main scrollable elements for all the overlays.
   */
  updateMainScrollableElements() {
    this.eventManager.clearEvents(true);

    this.inlineStartOverlay.updateMainScrollableElement();
    this.topOverlay.updateMainScrollableElement();

    if (this.bottomOverlay.needFullRender) {
      this.bottomOverlay.updateMainScrollableElement();
    }
    const { wtTable } = this;
    const { rootWindow } = this.domBindings;
    const tableParentNode = wtTable.wtRootElement.parentNode;
    // Use nodeType === 1 instead of instanceof Element so the check works across realms (iframes).
    // Falls back to '' when there is no element parent (null or detached).
    const computedOverflow = tableParentNode !== null && tableParentNode.nodeType === 1
      ? rootWindow.getComputedStyle(tableParentNode as Element).getPropertyValue('overflow')
      : '';

    if (computedOverflow === 'hidden' || computedOverflow === 'clip') {
      this.scrollableElement = wtTable.holder;
    } else {
      this.scrollableElement = getScrollableElement(wtTable.TABLE);
    }

    this.registerListeners();
  }

  /**
   *
   */
  destroy() {
    this.#postponedAdjustElementsSize.cancel();

    if (this.#containerDomResizeCountTimeout !== null) {
      clearTimeout(this.#containerDomResizeCountTimeout);
      this.#containerDomResizeCountTimeout = null;
    }

    this.resizeObserver.disconnect();
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
    const isScrollTriggered = this.verticalScrolling || this.horizontalScrolling;

    if (isScrollTriggered) {
      this.#postponedAdjustElementsSize();
    } else {
      this.#adjustElementsSizeIfNeeded();
    }

    if (this.bottomOverlay.clone) {
      this.bottomOverlay.refresh(fastDraw);
    }

    this.inlineStartOverlay.refresh(fastDraw);
    this.topOverlay.refresh(fastDraw);

    if (this.topInlineStartCornerOverlay) {
      this.topInlineStartCornerOverlay.refresh(fastDraw);
    }

    if (this.bottomInlineStartCornerOverlay && this.bottomInlineStartCornerOverlay.clone) {
      this.bottomInlineStartCornerOverlay.refresh(fastDraw);
    }
  }

  /**
   * Update the last cached spreader size with the current size.
   *
   * @returns {boolean} `true` if the lastSpreaderSize cache was updated, `false` otherwise.
   */
  updateLastSpreaderSize() {
    const spreader = this.wtTable.spreader;
    const width = spreader.clientWidth;
    const height = spreader.clientHeight;
    const needsUpdating = width !== this.spreaderLastSize.width || height !== this.spreaderLastSize.height;

    if (needsUpdating) {
      this.spreaderLastSize.width = width;
      this.spreaderLastSize.height = height;
    }

    return needsUpdating;
  }

  /**
   * Adjust overlays elements size and master table size.
   */
  adjustElementsSize() {
    const { wtViewport } = this.wot;
    const { wtTable } = this;
    const { rootWindow } = this.domBindings;
    const isWindowScrolled = this.scrollableElement === rootWindow;
    const totalColumns = this.wtSettings.getSetting<number>('totalColumns');
    const totalRows = this.wtSettings.getSetting<number>('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    // The internal row height calculator contains a known issue that results in a 1px miscalculation.
    // Ideally, this should be addressed at the core level. However, resolving it is non-trivial,
    // as the flaw is embedded across multiple core modules and corresponding test cases.
    // This limitation does not affect when the external calculator is used (AutoRowSize), which
    // computes heights accurately, so no adjustment is required when using it.
    const hiderHeightComp = this.wtSettings.getSetting('externalRowCalculator') ? 0 : 1;
    const proposedHiderHeight = headerColumnSize + this.topOverlay.sumCellSizes(0, totalRows) + hiderHeightComp;
    const proposedHiderWidth = headerRowSize + this.inlineStartOverlay.sumCellSizes(0, totalColumns);
    const hiderElement = wtTable.hider;
    const hiderStyle = hiderElement.style;
    const isScrolledBeyondHiderHeight = () => {
      if (isWindowScrolled || !(this.scrollableElement instanceof HTMLElement)) {
        return false;
      }

      return this.scrollableElement.scrollTop >
        Math.max(0, proposedHiderHeight - wtTable.holder.clientHeight);
    };
    const isScrolledBeyondHiderWidth = () => {
      if (isWindowScrolled || !(this.scrollableElement instanceof HTMLElement)) {
        return false;
      }

      return this.scrollableElement.scrollLeft >
        Math.max(0, proposedHiderWidth - wtTable.holder.clientWidth);
    };
    const columnHeaderBorderCompensation = isScrolledBeyondHiderHeight() ? 1 : 0;
    const rowHeaderBorderCompensation = isScrolledBeyondHiderWidth() ? 1 : 0;

    // If the elements are being adjusted after scrolling the table from the very beginning to the very end,
    // we need to adjust the hider dimensions by the header border size. (https://github.com/handsontable/dev-handsontable/issues/1772)
    hiderStyle.width = `${proposedHiderWidth + rowHeaderBorderCompensation}px`;
    hiderStyle.height = `${proposedHiderHeight + columnHeaderBorderCompensation}px`;

    this.topOverlay.adjustElementsSize();
    this.inlineStartOverlay.adjustElementsSize();
    this.bottomOverlay.adjustElementsSize();
  }

  /**
   * Expand the hider vertically element by the provided delta value.
   *
   * @param {number} heightDelta The delta value to expand the hider element by.
   */
  expandHiderVerticallyBy(heightDelta: number) {
    const { wtTable } = this;

    wtTable.hider.style.height = `${parseInt(wtTable.hider.style.height, 10) + heightDelta}px`;
  }

  /**
   * Expand the hider horizontally element by the provided delta value.
   *
   * @param {number} widthDelta The delta value to expand the hider element by.
   */
  expandHiderHorizontallyBy(widthDelta: number) {
    const { wtTable } = this;

    wtTable.hider.style.width = `${parseInt(wtTable.hider.style.width, 10) + widthDelta}px`;
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

      elem.clone.wtTable.TABLE.className = masterTable.className; // todo demeter
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
