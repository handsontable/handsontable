import { isKey } from '../../../../helpers/unicode';
import { eventTargetEl } from '../../../../helpers/dom/element';
import { requestAnimationFrame } from '../../../../helpers/feature';
import type { EngineContext } from '../wire';
import type { default as Overlays } from '../overlay/overlays';
import type { StickyScrollStrategy } from '../overlay/strategies/stickyScrollStrategy';
import type { ResizeMonitor } from '../overlay/resizeMonitor';

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

/**
 * Assembles the NativeScrollInput's dependencies. The overlays are resolved off the owning
 * coordinator (its own fields set by `initOverlays`), and the sticky-scroll strategy + resize monitor
 * are passed as the already-built instances so their listener hooks can be re-registered from here.
 * ScrollSync's `syncScrollPositions` and the coordinator's scrollable element are reached via
 * callbacks, so this module type-imports Overlays/StickyScrollStrategy/ResizeMonitor only.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @param {Overlays} overlays The owning Overlays coordinator.
 * @param {StickyScrollStrategy} stickyScroll The overlays' sticky-scroll strategy.
 * @param {ResizeMonitor} resizeMonitor The overlays' container-resize monitor.
 * @returns {object} The NativeScrollInput dependency set.
 */
export function createNativeScrollInputDeps(
  ctx: EngineContext,
  overlays: Overlays,
  stickyScroll: StickyScrollStrategy,
  resizeMonitor: ResizeMonitor
) {
  return {
    wtSettings: ctx.wtSettings,
    rootDocument: ctx.rootDocument,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    wtTable: ctx.getWtTable(),
    eventManager: overlays.eventManager,
    getTopOverlay: () => overlays.topOverlay,
    getInlineStartOverlay: () => overlays.inlineStartOverlay,
    getCloneableOverlays: () => [
      overlays.topOverlay,
      overlays.bottomOverlay,
      overlays.inlineStartOverlay,
      overlays.topInlineStartCornerOverlay,
      overlays.bottomInlineStartCornerOverlay,
    ],
    getScrollableElement: () => overlays.scrollableElement,
    syncScrollPositions: () => overlays.syncScrollPositions(),
    scrollVertically: (delta: number) => overlays.scrollVertically(delta),
    scrollHorizontally: (delta: number) => overlays.scrollHorizontally(delta),
    registerStickyScrollListeners: () => stickyScroll.registerListeners(),
    resetResizeCount: () => resizeMonitor.resetResizeCount(),
    observeResize: () => resizeMonitor.observe(),
  };
}

/**
 * The NativeScrollInput dependencies, inferred from `createNativeScrollInputDeps`.
 */
export type NativeScrollInputDeps = ReturnType<typeof createNativeScrollInputDeps>;

/**
 * Binds the native DOM input listeners (scroll, wheel, keydown/keyup, window resize) and translates
 * them into the engine's scroll actions: a scroll event syncs the master/clone positions, a wheel
 * event over a clone is turned into a scroll of the master scrollable element, and arrow-key presses
 * flip a flag so a keyboard-driven render only syncs master -> overlay.
 *
 * Extracted from the Overlays coordinator so the native-input lifecycle is self-contained; the
 * coordinator keeps a thin public `registerListeners` delegate because ScrollSync re-registers the
 * listeners when the scrollable element changes.
 *
 * @class NativeScrollInput
 */
export class NativeScrollInput {
  /**
   * The NativeScrollInput dependencies.
   *
   * @type {NativeScrollInputDeps}
   */
  readonly #deps: NativeScrollInputDeps;

  /**
   * Whether an arrow key is currently pressed.
   *
   * @type {boolean}
   */
  #keyPressed = false;

  /**
   * The browser's line height, used to convert line-based wheel deltas into pixels.
   *
   * @type {number}
   */
  #browserLineHeight: number;

  /**
   * @param {NativeScrollInputDeps} deps The NativeScrollInput dependencies.
   */
  constructor(deps: NativeScrollInputDeps) {
    this.#deps = deps;
    this.#browserLineHeight = this.#computeBrowserLineHeight();
  }

  /**
   * Register all necessary event listeners.
   */
  registerListeners() {
    const { rootDocument, rootWindow, wtTable, wtSettings, eventManager } = this.#deps;
    const topOverlay = this.#deps.getTopOverlay();
    const inlineStartOverlay = this.#deps.getInlineStartOverlay();
    const { mainTableScrollableElement: topOverlayScrollableElement } = topOverlay;
    const { mainTableScrollableElement: inlineStartOverlayScrollableElement } = inlineStartOverlay;

    eventManager.addEventListener(rootDocument.documentElement, 'keydown',
      (event: KeyboardEvent) => this.#onKeyDown(event));
    eventManager.addEventListener(rootDocument.documentElement, 'keyup', () => this.#onKeyUp());
    eventManager.addEventListener(rootDocument, 'visibilitychange', () => this.#onKeyUp());

    this.#deps.registerStickyScrollListeners();
    eventManager.addEventListener(
      topOverlayScrollableElement,
      'scroll',
      (event: Event) => this.#onTableScroll(event),
      { passive: true }
    );

    if (topOverlayScrollableElement !== inlineStartOverlayScrollableElement) {
      eventManager.addEventListener(
        inlineStartOverlayScrollableElement,
        'scroll',
        (event: Event) => this.#onTableScroll(event),
        { passive: true }
      );
    }

    const isScrollOnWindow = this.#deps.getScrollableElement() === rootWindow;
    const preventWheel = wtSettings.getSetting<boolean>('preventWheel');
    const wheelEventOptions = { passive: isScrollOnWindow };

    eventManager.addEventListener(
      wtTable.wtRootElement,
      'wheel',
      (event: WheelEvent) => this.#onCloneWheel(event, preventWheel),
      wheelEventOptions
    );

    this.#deps.getCloneableOverlays().forEach((overlay) => {
      if (!overlay.clone) {
        return;
      }

      eventManager.addEventListener(
        overlay.clone.wtTable.holder,
        'wheel',
        (event: WheelEvent) => this.#onCloneWheel(event, preventWheel),
        wheelEventOptions
      );
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;

    eventManager.addEventListener(rootWindow, 'resize', () => {
      requestAnimationFrame(() => {
        clearTimeout(resizeTimeout);
        wtSettings.getSetting('onWindowResize');

        resizeTimeout = setTimeout(() => {
          // Remove resizing the window from the ResizeObserver's endless-loop-blocking logic.
          this.#deps.resetResizeCount();
        }, 200);
      });
    });

    if (!isScrollOnWindow) {
      this.#deps.observeResize();
    }
  }

  /**
   * Scroll listener.
   *
   * @param {Event} event The mouse event object.
   */
  #onTableScroll(event: Event) {
    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.
    const { rootWindow } = this.#deps;
    const masterHorizontal = this.#deps.getInlineStartOverlay().mainTableScrollableElement;
    const masterVertical = this.#deps.getTopOverlay().mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    if (this.#keyPressed) {
      if ((masterVertical !== rootWindow && target !== rootWindow &&
           !(masterVertical instanceof HTMLElement && eventTargetEl(event)!.contains(masterVertical))) ||
          (masterHorizontal !== rootWindow && target !== rootWindow &&
           !(masterHorizontal instanceof HTMLElement && eventTargetEl(event)!.contains(masterHorizontal)))) {
        return;
      }
    }

    this.#deps.syncScrollPositions();
  }

  /**
   * Wheel listener for cloned overlays.
   *
   * @param {Event} event The mouse event object.
   * @param {boolean} preventDefault If `true`, the `preventDefault` will be called on event object.
   */
  #onCloneWheel(event: WheelEvent, preventDefault: boolean) {
    // Fix for Windows OS, where the ctrl key is used to zoom the page (issue #dev-2405).
    if (event.ctrlKey) {
      return;
    }

    const { rootWindow } = this.#deps;

    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

    const masterHorizontal = this.#deps.getInlineStartOverlay().mainTableScrollableElement;
    const masterVertical = this.#deps.getTopOverlay().mainTableScrollableElement;
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
      (this.#keyPressed && (shouldNotWheelVertically || shouldNotWheelHorizontally))
       ||
      this.#deps.getScrollableElement() === rootWindow
    ) {
      return;
    }

    const isScrollPossible = this.#translateMouseWheelToScroll(event);

    if (preventDefault || (this.#deps.getScrollableElement() !== rootWindow && isScrollPossible)) {
      event.preventDefault();
    }
  }

  /**
   * Key down listener.
   *
   * @param {KeyboardEvent} event The keyboard event object.
   */
  #onKeyDown(event: KeyboardEvent) {
    this.#keyPressed = isKey(event.keyCode, 'ARROW_UP|ARROW_RIGHT|ARROW_DOWN|ARROW_LEFT');
  }

  /**
   * Key up listener.
   */
  #onKeyUp() {
    this.#keyPressed = false;
  }

  /**
   * Translate wheel event into scroll event and sync scroll overlays position.
   *
   * @param {WheelEvent} event The mouse event object.
   * @returns {boolean}
   */
  #translateMouseWheelToScroll(event: WheelEvent) {
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
      deltaX += deltaX * this.#browserLineHeight;
      deltaY += deltaY * this.#browserLineHeight;
    }

    const isScrollVerticallyPossible = this.#deps.scrollVertically(deltaY);
    const isScrollHorizontallyPossible = this.#deps.scrollHorizontally(deltaX);

    return isScrollVerticallyPossible || isScrollHorizontallyPossible;
  }

  /**
   * Retrieve the browser line height, used to convert line-based wheel deltas into pixels.
   *
   * @returns {number}
   */
  #computeBrowserLineHeight(): number {
    const { rootDocument, geometryReader } = this.#deps;
    const computedStyle = geometryReader.getComputedStyle(rootDocument.body);
    /**
     * Sometimes `line-height` might be set to 'normal'. In that case, a default `font-size` should be multiplied by roughly 1.2.
     * Https://developer.mozilla.org/pl/docs/Web/CSS/line-height#Values.
     */
    const lineHeight = parseInt(computedStyle.lineHeight, 10);
    const lineHeightFalback = parseInt(computedStyle.fontSize, 10) * 1.2;

    return lineHeight || lineHeightFalback;
  }
}
