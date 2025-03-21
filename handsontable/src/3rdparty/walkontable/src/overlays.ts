import {
  getScrollableElement,
  getScrollbarWidth,
} from '../../../helpers/dom/element';
import { requestAnimationFrame } from '../../../helpers/feature';
import { arrayEach } from '../../../helpers/array';
import { isKey } from '../../../helpers/unicode';
import { isChrome } from '../../../helpers/browser';
import { warn } from '../../../helpers/console';
import {
  InlineStartOverlay,
  TopOverlay,
  TopInlineStartCornerOverlay,
  BottomOverlay,
  BottomInlineStartCornerOverlay,
  Overlay
} from './overlay';
import { DomBindings, EventManager, FacadeGetter, Settings } from './types';
import Table from './table';

/**
 * @class Overlays
 */
class Overlays {
  /**
   * Walkontable instance's reference.
   *
   * @protected
   * @type {Walkontable}
   */
  wot: any;

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
  topOverlay: TopOverlay | null = null;

  /**
   * Refer to the BottomOverlay instance.
   *
   * @protected
   * @type {BottomOverlay}
   */
  bottomOverlay: BottomOverlay | null = null;

  /**
   * Refer to the InlineStartOverlay instance.
   *
   * @protected
   * @type {InlineStartOverlay}
   */
  inlineStartOverlay: InlineStartOverlay | null = null;

  /**
   * Refer to the TopInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {TopInlineStartCornerOverlay}
   */
  topInlineStartCornerOverlay: TopInlineStartCornerOverlay | null = null;

  /**
   * Refer to the BottomInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {BottomInlineStartCornerOverlay}
   */
  bottomInlineStartCornerOverlay: BottomInlineStartCornerOverlay | null = null;

  /**
   * Browser line height for the purposes of scrolling speed.
   *
   * @type {number}
   */
  browserLineHeight: number | undefined = undefined;

  /**
   * The walkontable settings.
   *
   * @protected
   * @type {Settings}
   */
  wtSettings: Settings;

  /**
   * DOM bindings for the overlays.
   * 
   * @protected
   * @type {DomBindings}
   */
  domBindings: DomBindings;

  /**
   * The main table instance.
   * 
   * @protected
   * @type {Table}
   */
  wtTable: Table;

  /**
   * The event manager instance.
   * 
   * @protected
   * @type {EventManager}
   */
  eventManager: EventManager;

  /**
   * The facade getter function.
   * 
   * @protected
   * @type {FacadeGetter}
   */
  facadeGetter: FacadeGetter;

  /**
   * Indicates whether the rendering state has changed for one of the overlays.
   *
   * @type {boolean}
   */
  #hasRenderingStateChanged = false;

  /**
   * Flag for vertical scrolling in progress
   * 
   * @type {boolean}
   */
  verticalScrolling = false;

  /**
   * Flag for horizontal scrolling in progress
   * 
   * @type {boolean}
   */
  horizontalScrolling = false;

  /**
   * The scrollable element reference
   * 
   * @type {HTMLElement | Window}
   */
  scrollableElement: HTMLElement | Window;

  /**
   * The resize observer for tracking size changes.
   * 
   * @protected
   * @type {ResizeObserver}
   */
  resizeObserver: ResizeObserver = new ResizeObserver((entries) => {
    // When the main scrollable element changes its size, update overlays position
    if (entries.length) {
      // Warn: ResizeObserver loop completed with undelivered notifications.
      // This happens in Chrome and causes an infinite loop with many overlays.
      // ResizeObserver doesn't work with detached elements (elements not in the DOM).
      // We catch it here to prevent the infinite loop.
      try {
        this.refreshAll();
      } catch (ex) {
        warn(ex.message);
      }
    }
  });

  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Dom bindings.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {EventManager} eventManager The event manager instance.
   * @param {Table} wtTable The table.
   */
  constructor(
    wotInstance: any, 
    facadeGetter: FacadeGetter, 
    domBindings: DomBindings, 
    wtSettings: Settings, 
    eventManager: EventManager, 
    wtTable: Table
  ) {
    this.wot = wotInstance;
    this.facadeGetter = facadeGetter;
    this.domBindings = domBindings;
    this.wtSettings = wtSettings;
    this.eventManager = eventManager;
    this.wtTable = wtTable;

    const { rootDocument } = this.domBindings;
    
    // Set up the scrollable element
    const isOverflowHidden = getComputedStyle(wtTable.holder.parentNode as HTMLElement)
      .getPropertyValue('overflow') === 'hidden';
    
    this.scrollableElement = isOverflowHidden ? 
      wtTable.holder : 
      getScrollableElement(wtTable.TABLE);

    this.initBrowserLineHeight();
    this.initOverlays();
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
    const overlays = [...this.#overlays];

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
    const args = [this.wot, this.facadeGetter, this.wtSettings, this.domBindings];

    // todo refactoring: IOC, collection or factories.
    // TODO refactoring, conceive about using generic collection of overlays.
    this.topOverlay = new TopOverlay(...args);
    this.bottomOverlay = new BottomOverlay(...args);
    this.inlineStartOverlay = new InlineStartOverlay(...args);

    // TODO discuss, the controversial here would be removing the lazy creation mechanism for corners.
    // TODO cond. Has no any visual impact. They're initially hidden in same way like left, top, and bottom overlays.
    this.topInlineStartCornerOverlay = new TopInlineStartCornerOverlay(...args,
      this.topOverlay, this.inlineStartOverlay);
    this.bottomInlineStartCornerOverlay = new BottomInlineStartCornerOverlay(...args,
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

    if (this.verticalScrolling) {
      this.inlineStartOverlay.onScroll(); // todo the inlineStartOverlay.onScroll() fires hook. Why is it needed there, not in any another place?
    }

    if (this.horizontalScrolling) {
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

    this.eventManager.addEventListener(rootDocument.documentElement, 'keydown', event => this.onKeyDown(event));
    this.eventManager.addEventListener(rootDocument.documentElement, 'keyup', () => this.onKeyUp());
    this.eventManager.addEventListener(rootDocument, 'visibilitychange', () => this.onKeyUp());
    this.eventManager.addEventListener(
      topOverlayScrollableElement,
      'scroll',
      event => this.onTableScroll(event),
      { passive: true }
    );

    if (topOverlayScrollableElement !== inlineStartOverlayScrollableElement) {
      this.eventManager.addEventListener(
        inlineStartOverlayScrollableElement,
        'scroll',
        event => this.onTableScroll(event),
        { passive: true }
      );
    }

    const isHighPixelRatio = rootWindow.devicePixelRatio && rootWindow.devicePixelRatio > 1;
    const isScrollOnWindow = this.scrollableElement === rootWindow;
    const preventWheel = this.wtSettings.getSetting('preventWheel');
    const wheelEventOptions = { passive: isScrollOnWindow };

    if (preventWheel || isHighPixelRatio || !isChrome()) {
      this.eventManager.addEventListener(
        this.wtTable.wtRootElement,
        'wheel',
        event => this.onCloneWheel(event, preventWheel),
        wheelEventOptions
      );
    }

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
        event => this.onCloneWheel(event, preventWheel),
        wheelEventOptions
      );
    });

    let resizeTimeout;

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
  onTableScroll(event) {
    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.
    const rootWindow = this.domBindings.rootWindow;
    const masterHorizontal = this.inlineStartOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    if (this.keyPressed) {
      if ((masterVertical !== rootWindow && target !== rootWindow && !event.target.contains(masterVertical)) ||
          (masterHorizontal !== rootWindow && target !== rootWindow && !event.target.contains(masterHorizontal))) {
        return;
      }
    }

    this.syncScrollPositions(event);
  }

  /**
   * Wheel listener for cloned overlays.
   *
   * @param {Event} event The mouse event object.
   * @param {boolean} preventDefault If `true`, the `preventDefault` will be called on event object.
   */
  onCloneWheel(event, preventDefault) {
    const { rootWindow } = this.domBindings;

    // There was if statement which controlled flow of this function. It avoided the execution of the next lines
    // on mobile devices. It was changed. Broader description of this case is included within issue #4856.

    const masterHorizontal = this.inlineStartOverlay.mainTableScrollableElement;
    const masterVertical = this.topOverlay.mainTableScrollableElement;
    const target = event.target;

    // For key press, sync only master -> overlay position because while pressing Walkontable.render is triggered
    // by hot.refreshBorder
    const shouldNotWheelVertically = masterVertical !== rootWindow &&
      target !== rootWindow && !target.contains(masterVertical);
    const shouldNotWheelHorizontally = masterHorizontal !== rootWindow &&
      target !== rootWindow && !target.contains(masterHorizontal);

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
  onKeyDown(event) {
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
  translateMouseWheelToScroll(event) {
    let deltaY = isNaN(event.deltaY) ? (-1) * event.wheelDeltaY : event.deltaY;
    let deltaX = isNaN(event.deltaX) ? (-1) * event.wheelDeltaX : event.deltaX;

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
  scrollVertically(delta) {
    const previousScroll = this.scrollableElement.scrollTop;

    this.scrollableElement.scrollTop += delta;

    return previousScroll !== this.scrollableElement.scrollTop;
  }

  /**
   * Scrolls main scrollable element horizontally.
   *
   * @param {number} delta Relative value to scroll.
   * @returns {boolean}
   */
  scrollHorizontally(delta) {
    const previousScroll = this.scrollableElement.scrollLeft;

    this.scrollableElement.scrollLeft += delta;

    return previousScroll !== this.scrollableElement.scrollLeft;
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

    const { rootWindow } = this.domBindings;
    const topHolder = this.topOverlay.clone.wtTable.holder; // todo rethink
    const leftHolder = this.inlineStartOverlay.clone.wtTable.holder; // todo rethink

    const [scrollLeft, scrollTop] = [this.scrollableElement.scrollLeft, this.scrollableElement.scrollTop];

    this.horizontalScrolling = (topHolder.scrollLeft !== scrollLeft || this.lastScrollX !== rootWindow.scrollX);
    this.verticalScrolling = (leftHolder.scrollTop !== scrollTop || this.lastScrollY !== rootWindow.scrollY);
    this.lastScrollX = rootWindow.scrollX;
    this.lastScrollY = rootWindow.scrollY;

    if (this.horizontalScrolling) {
      topHolder.scrollLeft = scrollLeft;

      const bottomHolder = this.bottomOverlay.needFullRender ? this.bottomOverlay.clone.wtTable.holder : null; // todo rethink

      if (bottomHolder) {
        bottomHolder.scrollLeft = scrollLeft;
      }
    }

    if (this.verticalScrolling) {
      leftHolder.scrollTop = scrollTop;
    }

    this.refreshAll();
  }

  /**
   * Synchronize overlay scrollbars with the master scrollbar.
   */
  syncScrollWithMaster() {
    if (!this.#hasRenderingStateChanged) {
      return;
    }

    const master = this.topOverlay.mainTableScrollableElement;
    const { scrollLeft, scrollTop } = master;

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

    if (rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode).getPropertyValue('overflow') === 'hidden') {
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
    this.resizeObserver.disconnect();
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
    const wasSpreaderSizeUpdated = this.updateLastSpreaderSize();

    if (wasSpreaderSizeUpdated) {
      this.adjustElementsSize();
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
    const totalColumns = this.wtSettings.getSetting('totalColumns');
    const totalRows = this.wtSettings.getSetting('totalRows');
    const headerRowSize = wtViewport.getRowHeaderWidth();
    const headerColumnSize = wtViewport.getColumnHeaderHeight();
    const proposedHiderHeight = headerColumnSize + this.topOverlay.sumCellSizes(0, totalRows) + 1;
    const proposedHiderWidth = headerRowSize + this.inlineStartOverlay.sumCellSizes(0, totalColumns);
    const hiderElement = wtTable.hider;
    const hiderStyle = hiderElement.style;
    const isScrolledBeyondHiderHeight = () => {
      return isWindowScrolled ?
        false :
        (this.scrollableElement.scrollTop > Math.max(0, proposedHiderHeight - wtTable.holder.clientHeight));
    };
    const isScrolledBeyondHiderWidth = () => {
      return isWindowScrolled ?
        false :
        (this.scrollableElement.scrollLeft > Math.max(0, proposedHiderWidth - wtTable.holder.clientWidth));
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
  expandHiderVerticallyBy(heightDelta) {
    const { wtTable } = this;

    wtTable.hider.style.height = `${parseInt(wtTable.hider.style.height, 10) + heightDelta}px`;
  }

  /**
   * Expand the hider horizontally element by the provided delta value.
   *
   * @param {number} widthDelta The delta value to expand the hider element by.
   */
  expandHiderHorizontallyBy(widthDelta) {
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
  }

  /**
   * Get the parent overlay of the provided element.
   *
   * @param {HTMLElement} element An element to process.
   * @returns {object|null}
   */
  getParentOverlay(element) {
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
}

export default Overlays;
