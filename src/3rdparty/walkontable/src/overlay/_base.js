import {
  getScrollableElement,
  getBoundingClientRect,
  getComputedStyle,
} from './../../../../helpers/dom/element';
import { warn } from './../../../../helpers/console';
import EventManager from './../../../../eventManager';
import Clone from '../core/clone';

const registeredOverlays = {};

/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling.
 *
 * @class Overlay
 */
class Overlay {
  /**
   * @type {string}
   */
  static get CLONE_TOP() {
    return 'top';
  }

  /**
   * @type {string}
   */
  static get CLONE_BOTTOM() {
    return 'bottom';
  }

  /**
   * @type {string}
   */
  static get CLONE_LEFT() {
    return 'left';
  }

  /**
   * @type {string}
   */
  static get CLONE_TOP_LEFT_CORNER() {
    return 'top_left_corner';
  }

  /**
   * @type {string}
   */
  static get CLONE_BOTTOM_LEFT_CORNER() {
    return 'bottom_left_corner';
  }

  /**
   * List of all availables clone types.
   *
   * @type {Array}
   */
  static get CLONE_TYPES() {
    return [
      Overlay.CLONE_TOP,
      Overlay.CLONE_BOTTOM,
      Overlay.CLONE_LEFT,
      Overlay.CLONE_TOP_LEFT_CORNER,
      Overlay.CLONE_BOTTOM_LEFT_CORNER,
    ];
  }

  /**
   * Register overlay class.
   *
   * @param {string} type Overlay type, one of the CLONE_TYPES value.
   * @param {Overlay} overlayClass Overlay class extended from base overlay class {@link Overlay}.
   */
  static registerOverlay(type, overlayClass) {
    if (Overlay.CLONE_TYPES.indexOf(type) === -1) {
      throw new Error(`Unsupported overlay (${type}).`);
    }
    registeredOverlays[type] = overlayClass;
  }

  /**
   * Create new instance of overlay type.
   *
   * @param {string} type Overlay type, one of the CLONE_TYPES value.
   * @param {Walkontable} wot The Walkontable instance.
   * @returns {Overlay}
   */
  static createOverlay(type, wot) {
    return new registeredOverlays[type](wot);
  }

  /**
   * Check if specified overlay was registered.
   *
   * @param {string} type Overlay type, one of the CLONE_TYPES value.
   * @returns {boolean}
   */
  static hasOverlay(type) {
    return registeredOverlays[type] !== void 0;
  }

  /**
   @param {Walkontable} wotInstance The Walkontable instance.
   */
  constructor(wotInstance) {
    this.master = wotInstance;
    this.type = '';
    this.mainTableScrollableElement = null;
    this.areElementSizesAdjusted = false;
  }

  /**
   * Update internal state of object with an information about the need of full rendering of the overlay.
   */
  updateStateOfRendering() {
    const oldNeedFullRender = this.needFullRender;

    this.needFullRender = this.shouldBeRendered();

    if (oldNeedFullRender && !this.needFullRender) {
      this.resetElementsSize();
    }
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    return true;
  }

  /**
   * Update the main scrollable element.
   */
  updateMainScrollableElement() {
    const { master } = this;

    if (getComputedStyle(master.wtTable.wtRootElement.parentNode, master.rootWindow).getPropertyValue('overflow') === 'hidden') {
      this.mainTableScrollableElement = master.wtTable.holder;
    } else {
      this.mainTableScrollableElement = getScrollableElement(master.wtTable.TABLE);
    }
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element.
   * NOTE: The element needs to be a child of the overlay in order for the method to work correctly.
   *
   * @param {HTMLElement} element The cell element to calculate the position for.
   * @param {number} rowIndex Visual row index.
   * @param {number} columnIndex Visual column index.
   * @returns {{top: number, left: number}|undefined}
   */
  getRelativeCellPosition(element, rowIndex, columnIndex) {
    if (this.clone.wtTable.holder.contains(element) === false) {
      warn(`The provided element is not a child of the ${this.type} overlay`);

      return;
    }
    const windowScroll = this.mainTableScrollableElement === this.master.rootWindow;
    const fixedColumn = columnIndex < this.master.getSetting('fixedColumnsLeft');
    const fixedRowTop = rowIndex < this.master.getSetting('fixedRowsTop');
    const fixedRowBottom = rowIndex >= this.master.getSetting('totalRows') - this.master.getSetting('fixedRowsBottom');
    const spreaderOffset = {
      left: this.clone.wtTable.spreader.offsetLeft,
      top: this.clone.wtTable.spreader.offsetTop
    };
    const elementOffset = {
      left: element.offsetLeft,
      top: element.offsetTop
    };
    let offsetObject = null;

    if (windowScroll) {
      offsetObject = this.getRelativeCellPositionWithinWindow(fixedRowTop, fixedColumn, elementOffset, spreaderOffset);

    } else {
      offsetObject = this.getRelativeCellPositionWithinHolder(fixedRowTop, fixedRowBottom, fixedColumn, elementOffset, spreaderOffset);
    }

    return offsetObject;
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element within a table with window
   * as a scrollable element.
   *
   * @private
   * @param {boolean} onFixedRowTop `true` if the coordinates point to a place within the top fixed rows.
   * @param {boolean} onFixedColumn `true` if the coordinates point to a place within the fixed columns.
   * @param {number} elementOffset Offset position of the cell element.
   * @param {number} spreaderOffset Offset position of the spreader element.
   * @returns {{top: number, left: number}}
   */
  getRelativeCellPositionWithinWindow(onFixedRowTop, onFixedColumn, elementOffset, spreaderOffset) {
    const absoluteRootElementPosition = getBoundingClientRect(this.master.wtTable.wtRootElement);
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = spreaderOffset.left;

    } else {
      horizontalOffset = absoluteRootElementPosition.left <= 0 ? (-1) * absoluteRootElementPosition.left : 0;
    }

    if (onFixedRowTop) {
      const absoluteOverlayPosition = getBoundingClientRect(this.clone.wtTable.TABLE);

      verticalOffset = absoluteOverlayPosition.top - absoluteRootElementPosition.top;

    } else {
      verticalOffset = spreaderOffset.top;
    }

    return {
      left: elementOffset.left + horizontalOffset,
      top: elementOffset.top + verticalOffset
    };
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element within a table with window
   * as a scrollable element.
   *
   * @private
   * @param {boolean} onFixedRowTop `true` if the coordinates point to a place within the top fixed rows.
   * @param {boolean} onFixedRowBottom `true` if the coordinates point to a place within the bottom fixed rows.
   * @param {boolean} onFixedColumn `true` if the coordinates point to a place within the fixed columns.
   * @param {number} elementOffset Offset position of the cell element.
   * @param {number} spreaderOffset Offset position of the spreader element.
   * @returns {{top: number, left: number}}
   */
  getRelativeCellPositionWithinHolder(onFixedRowTop, onFixedRowBottom, onFixedColumn, elementOffset, spreaderOffset) {
    const tableScrollPosition = {
      horizontal: this.clone.overlay.master.wtOverlays.leftOverlay.getScrollPosition(),
      vertical: this.clone.overlay.master.wtOverlays.topOverlay.getScrollPosition()
    };
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = tableScrollPosition.horizontal - spreaderOffset.left;
    }

    if (onFixedRowBottom) {
      const absoluteRootElementPosition = getBoundingClientRect(this.master.wtTable.wtRootElement);
      const absoluteOverlayPosition = getBoundingClientRect(this.clone.wtTable.TABLE);
      verticalOffset = (absoluteOverlayPosition.top * (-1)) + absoluteRootElementPosition.top;

    } else if (!onFixedRowTop) {
      verticalOffset = tableScrollPosition.vertical - spreaderOffset.top;
    }

    return {
      left: elementOffset.left - horizontalOffset,
      top: elementOffset.top - verticalOffset,
    };
  }

  /**
   * Make a clone of table for overlay.
   *
   * @param {string} direction Can be `Overlay.CLONE_TOP`, `Overlay.CLONE_LEFT`,
   *                           `Overlay.CLONE_TOP_LEFT_CORNER`.
   * @returns {Walkontable}
   */
  makeClone(direction) {
    if (Overlay.CLONE_TYPES.indexOf(direction) === -1) {
      throw new Error(`Clone type "${direction}" is not supported.`);
    }
    const { master } = this;
    const overlayRootElement = master.rootDocument.createElement('DIV');
    const clonedTable = master.rootDocument.createElement('TABLE');

    overlayRootElement.className = `ht_clone_${direction} handsontable`;
    overlayRootElement.style.position = 'absolute';
    overlayRootElement.style.top = 0;
    overlayRootElement.style.left = 0;
    overlayRootElement.style.overflow = 'visible';

    clonedTable.className = master.wtTable.TABLE.className;
    overlayRootElement.appendChild(clonedTable);

    this.type = direction;
    master.wtTable.wtRootElement.parentNode.appendChild(overlayRootElement);

    const preventOverflow = master.getSetting('preventOverflow');

    if (preventOverflow === true ||
      preventOverflow === 'horizontal' && this.type === Overlay.CLONE_TOP ||
      preventOverflow === 'vertical' && this.type === Overlay.CLONE_LEFT) {
      this.mainTableScrollableElement = master.rootWindow;

    } else if (getComputedStyle(master.wtTable.wtRootElement.parentNode, master.rootWindow).getPropertyValue('overflow') === 'hidden') {
      this.mainTableScrollableElement = master.wtTable.holder;
    } else {
      this.mainTableScrollableElement = getScrollableElement(master.wtTable.TABLE);
    }

    return new Clone({
      overlay: this,
      createTableFn: this.createTable,
      table: clonedTable,
    });
  }

  /**
   * Redraws the content of the overlay's clone instance of Walkontable, including the cells, selections and borders.
   * Does not change the size nor the position of the overlay root element.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  redrawClone(fastDraw = false) {
    this.adjustElementsPosition();

    if (this.needFullRender) {
      this.clone.drawClone(fastDraw);
    }
  }

  /**
   * Reset overlay root element's width and height to initial values.
   */
  resetElementsSize() {
    const { clone } = this;

    clone.wtTable.holder.style.width = '';
    clone.wtTable.holder.style.height = '';
    clone.wtTable.hider.style.width = '';
    clone.wtTable.hider.style.height = '';
    clone.wtTable.wtRootElement.style.width = '';
    clone.wtTable.wtRootElement.style.height = '';
  }

  /**
   * Destroy overlay instance.
   */
  destroy() {
    (new EventManager(this.clone)).destroy();
  }
}

export default Overlay;
