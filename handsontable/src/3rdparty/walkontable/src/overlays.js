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
} from './overlay';

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
  wot = null;

  /**
   * An array of the all overlays.
   *
   * @type {Overlay[]}
   */
  #overlays = [];

  /**
   * Refer to the TopOverlay instance.
   *
   * @protected
   * @type {TopOverlay}
   */
  topOverlay = null;

  /**
   * Refer to the BottomOverlay instance.
   *
   * @protected
   * @type {BottomOverlay}
   */
  bottomOverlay = null;

  /**
   * Refer to the InlineStartOverlay or instance.
   *
   * @protected
   * @type {InlineStartOverlay}
   */
  inlineStartOverlay = null;

  /**
   * Refer to the TopInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {TopInlineStartCornerOverlay}
   */
  topInlineStartCornerOverlay = null;

  /**
   * Refer to the BottomInlineStartCornerOverlay instance.
   *
   * @protected
   * @type {BottomInlineStartCornerOverlay}
   */
  bottomInlineStartCornerOverlay = null;

  /**
   * Browser line height for purposes of translating mouse wheel.
   *
   * @private
   * @type {number}
   */
  browserLineHeight = undefined;

  /**
   * The walkontable settings.
   *
   * @protected
   * @type {Settings}
   */
  wtSettings = null;

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
  #containerDomResizeCountTimeout = null;

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

      if (this.#containerDomResizeCount === 100) {
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
  constructor(wotInstance, facadeGetter, domBindings, wtSettings, eventManager, wtTable) {
    this.wot = wotInstance;
    this.wtSettings = wtSettings;
    this.domBindings = domBindings;
    this.facadeGetter = facadeGetter;
    this.wtTable = wtTable;
    this.eventManager = eventManager;
    this.destroyed = false;

    const { rootWindow } = this.domBindings;
    const isOverflowHidden = rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode)
      .getPropertyValue('overflow') === 'hidden';

    this.scrollableElement = isOverflowHidden ? wtTable.holder : getScrollableElement(wtTable.TABLE);

    this.initOverlays();
    this.initBrowserLineHeight();
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
    const lineHeightFallback = parseInt(computedStyle.fontSize, 10) * 1.2;

    this.browserLineHeight = lineHeight || lineHeightFallback;
  }

  /**
   * Prepare overlays based on user settings.
   *
   * @private
   */
  initOverlays() {
    const args = [this.wot, this.facadeGetter, this.wtSettings, this.domBindings];

    this.topOverlay = new TopOverlay(...args);
    this.bottomOverlay = new BottomOverlay(...args);
    this.inlineStartOverlay = new InlineStartOverlay(...args);
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

  }

  /**
   * Runs logic for the overlays after the table is drawn.
   */
  afterDraw() {

  }

  /**
   * Refresh and redraw table.
   */
  draw(fastDraw) {
    arrayEach(this.#overlays, (overlay) => {
      overlay.adjustRootElementSize();
    });
  }

  /**
   * Register all necessary event listeners.
   */
  registerListeners() {
    const { rootWindow } = this.domBindings;
    const isHighPixelRatio = rootWindow.devicePixelRatio && rootWindow.devicePixelRatio > 1;
    const isScrollOnWindow = this.scrollableElement === rootWindow;
    const preventWheel = this.wtSettings.getSetting('preventWheel');
    const wheelEventOptions = { passive: isScrollOnWindow };

    this.eventManager.addEventListener(
      this.scrollableElement,
      'scroll',
      (event) => {
        this.wot.draw(true);
      },
      { passive: true }
    );

    if (preventWheel || isHighPixelRatio || !isChrome()) {
      this.eventManager.addEventListener(
        this.wtTable.wtRootElement,
        'wheel',
        event => this.onCloneWheel(event, preventWheel),
        wheelEventOptions
      );
    }

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
   * Wheel listener for cloned overlays.
   *
   * @param {Event} event The mouse event object.
   * @param {boolean} preventDefault If `true`, the `preventDefault` will be called on event object.
   */
  onCloneWheel(event, preventDefault) {
    const { rootWindow } = this.domBindings;
    const isScrollPossible = this.translateMouseWheelToScroll(event);

    if (preventDefault || (this.scrollableElement !== rootWindow && isScrollPossible)) {
      event.preventDefault();
    }
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

    hiderStyle.width = `${proposedHiderWidth}px`;
    hiderStyle.height = `${proposedHiderHeight}px`;

    const styleProperty = this.wtSettings.getSetting('rtlMode') ? 'right' : 'left';

    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      wtTable.spreader.style[styleProperty] = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else if (totalColumns === 0) {
      wtTable.spreader.style[styleProperty] = '0';

    } else {
      throw new Error('Incorrect value of the columnsRenderCalculator');
    }

    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      wtTable.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;

    } else if (totalRows === 0) {
      wtTable.spreader.style.top = '0';

    } else {
      throw new Error('Incorrect value of the rowsRenderCalculator');
    }
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
}

export default Overlays;
