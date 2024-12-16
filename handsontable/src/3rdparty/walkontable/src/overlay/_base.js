import {
  getScrollableElement,
  getTrimmingContainer,
  getScrollbarWidth,
  setAttribute,
} from '../../../../helpers/dom/element';
import { defineGetter } from '../../../../helpers/object';
import { warn } from '../../../../helpers/console';
import {
  CLONE_TYPES,
  CLONE_CLASS_NAMES,
  CLONE_TOP,
  CLONE_INLINE_START,
} from './constants';
import Clone from '../core/clone';
import { A11Y_PRESENTATION } from '../../../../helpers/a11y';

/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling.
 *
 * @abstract
 * @class Overlay
 * @property {Walkontable} wot The Walkontable instance.
 */
export class Overlay {
  /**
   *  The Walkontable settings.
   *
   * @private
   * @type {Settings}
   */
  wtSettings = null;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {CLONE_TYPES_ENUM} type The overlay type name (clone name).
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance, facadeGetter, type, wtSettings, domBindings) {
    defineGetter(this, 'wot', wotInstance, {
      writable: false,
    });
    this.domBindings = domBindings;
    this.facadeGetter = facadeGetter;
    this.wtSettings = wtSettings;

    const {
      TABLE,
      hider,
      spreader,
      holder,
      wtRootElement,
    } = this.wot.wtTable; // todo ioc

    // legacy support, deprecated in the future
    this.instance = this.wot;

    this.type = type;
    this.mainTableScrollableElement = null;
    this.TABLE = TABLE;
    this.hider = hider;
    this.spreader = spreader;
    this.holder = holder;
    this.wtRootElement = wtRootElement;
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
    this.needFullRender = this.shouldBeRendered();
    this.clone = this.makeClone();
  }

  /**
   * Checks if the overlay rendering state has changed.
   *
   * @returns {boolean}
   */
  hasRenderingStateChanged() {
    return this.needFullRender !== this.shouldBeRendered();
  }

  /**
   * Updates internal state with an information about the need of full rendering of the overlay in the next draw cycles.
   *
   * If the state is changed to render the overlay, the `needFullRender` property is set to `true` which means that
   * the overlay will be fully rendered in the current draw cycle. If the state is changed to not render the overlay,
   * the `needFullRender` property is set to `false` which means that the overlay will be fully rendered in the
   * current draw cycle but it will not be rendered in the next draw cycles.
   *
   * @param {'before' | 'after'} drawPhase The phase of the rendering process.
   */
  updateStateOfRendering(drawPhase) {
    if (drawPhase === 'before' && this.shouldBeRendered()) {
      this.needFullRender = true;

    } else if (drawPhase === 'after' && !this.shouldBeRendered()) {
      this.needFullRender = false;
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
   * Update the trimming container.
   */
  updateTrimmingContainer() {
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode.parentNode);
  }

  /**
   * Update the main scrollable element.
   */
  updateMainScrollableElement() {
    const { wtTable } = this.wot;
    const { rootWindow } = this.domBindings;

    if (rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode).getPropertyValue('overflow') === 'hidden') {
      this.mainTableScrollableElement = this.wot.wtTable.holder;
    } else {
      this.mainTableScrollableElement = getScrollableElement(wtTable.TABLE);
    }
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element.
   * NOTE: The element needs to be a child of the overlay in order for the method to work correctly.
   *
   * @param {HTMLElement} element The cell element to calculate the position for.
   * @param {number} rowIndex Visual row index.
   * @param {number} columnIndex Visual column index.
   * @returns {{top: number, start: number}|undefined}
   */
  getRelativeCellPosition(element, rowIndex, columnIndex) {
    if (this.clone.wtTable.holder.contains(element) === false) {
      warn(`The provided element is not a child of the ${this.type} overlay`);

      return;
    }
    const windowScroll = this.mainTableScrollableElement === this.domBindings.rootWindow;
    const fixedColumnStart = columnIndex < this.wtSettings.getSetting('fixedColumnsStart');
    const fixedRowTop = rowIndex < this.wtSettings.getSetting('fixedRowsTop');
    const fixedRowBottom =
      rowIndex >= this.wtSettings.getSetting('totalRows') - this.wtSettings.getSetting('fixedRowsBottom');
    const spreader = this.clone.wtTable.spreader;

    const spreaderOffset = {
      start: this.getRelativeStartPosition(spreader),
      top: spreader.offsetTop
    };
    const elementOffset = {
      start: this.getRelativeStartPosition(element),
      top: element.offsetTop
    };
    let offsetObject = null;

    if (windowScroll) {
      offsetObject = this.getRelativeCellPositionWithinWindow(
        fixedRowTop, fixedColumnStart, elementOffset, spreaderOffset
      );

    } else {
      offsetObject = this.getRelativeCellPositionWithinHolder(
        fixedRowTop, fixedRowBottom, fixedColumnStart, elementOffset, spreaderOffset
      );
    }

    return offsetObject;
  }

  /**
   * Get inline start value depending of direction.
   *
   * @param {HTMLElement} el Element.
   * @returns {number}
   */
  getRelativeStartPosition(el) {
    return this.isRtl()
      ? el.offsetParent.offsetWidth - el.offsetLeft - el.offsetWidth
      : el.offsetLeft;
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
    const absoluteRootElementPosition = this.wot.wtTable.wtRootElement.getBoundingClientRect(); // todo refactoring: DEMETER
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = spreaderOffset.start;

    } else {
      let absoluteRootElementStartPosition = absoluteRootElementPosition.left;

      if (this.isRtl()) {
        absoluteRootElementStartPosition = this.domBindings.rootWindow.innerWidth -
          (absoluteRootElementPosition.left + absoluteRootElementPosition.width + getScrollbarWidth());
      }

      horizontalOffset = absoluteRootElementStartPosition <= 0 ? (-1) * absoluteRootElementStartPosition : 0;
    }

    if (onFixedRowTop) {
      const absoluteOverlayPosition = this.clone.wtTable.TABLE.getBoundingClientRect();

      verticalOffset = absoluteOverlayPosition.top - absoluteRootElementPosition.top;

    } else {
      verticalOffset = spreaderOffset.top;
    }

    return {
      start: elementOffset.start + horizontalOffset,
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
      horizontal: this.wot.wtOverlays.inlineStartOverlay.getScrollPosition(),
      vertical: this.wot.wtOverlays.topOverlay.getScrollPosition()
    };
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = tableScrollPosition.horizontal - spreaderOffset.start;
    }

    if (onFixedRowBottom) {
      const absoluteRootElementPosition = this.wot.wtTable.wtRootElement.getBoundingClientRect();// todo refactoring: DEMETER
      const absoluteOverlayPosition = this.clone.wtTable.TABLE.getBoundingClientRect();// todo refactoring: DEMETER

      verticalOffset = (absoluteOverlayPosition.top * (-1)) + absoluteRootElementPosition.top;

    } else if (!onFixedRowTop) {
      verticalOffset = tableScrollPosition.vertical - spreaderOffset.top;
    }

    return {
      start: elementOffset.start - horizontalOffset,
      top: elementOffset.top - verticalOffset,
    };
  }

  /**
   * Make a clone of table for overlay.
   *
   * @returns {Clone}
   */
  makeClone() {
    if (CLONE_TYPES.indexOf(this.type) === -1) {
      throw new Error(`Clone type "${this.type}" is not supported.`);
    }
    const {
      wtTable,
      wtSettings
    } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const clone = rootDocument.createElement('div');
    const clonedTable = rootDocument.createElement('table');
    const tableParent = wtTable.wtRootElement.parentNode;

    clone.className = `${CLONE_CLASS_NAMES.get(this.type)} handsontable`;
    clone.setAttribute('dir', this.isRtl() ? 'rtl' : 'ltr');
    clone.style.position = 'absolute';
    clone.style.top = 0;
    clone.style.overflow = 'visible';

    if (this.isRtl()) {
      clone.style.right = 0;
    } else {
      clone.style.left = 0;
    }

    if (wtSettings.getSetting('ariaTags')) {
      setAttribute(clone, [
        A11Y_PRESENTATION()
      ]);
    }

    clonedTable.className = wtTable.TABLE.className;

    // Clone the main table's `role` attribute to the cloned table.
    const mainTableRole = wtTable.TABLE.getAttribute('role');

    if (mainTableRole) {
      clonedTable.setAttribute('role', wtTable.TABLE.getAttribute('role'));
    }

    clone.appendChild(clonedTable);

    tableParent.appendChild(clone);

    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (preventOverflow === true ||
      preventOverflow === 'horizontal' && this.type === CLONE_TOP ||
      preventOverflow === 'vertical' && this.type === CLONE_INLINE_START) {
      this.mainTableScrollableElement = rootWindow;

    } else if (rootWindow.getComputedStyle(tableParent).getPropertyValue('overflow') === 'hidden') {
      this.mainTableScrollableElement = wtTable.holder;
    } else {
      this.mainTableScrollableElement = getScrollableElement(wtTable.TABLE);
    }

    // Create a new instance of the Walkontable class
    return new Clone(clonedTable, this.wtSettings, { // todo ioc factory
      source: this.wot,
      overlay: this,
      viewport: this.wot.wtViewport, // todo ioc , or factor func if used only here
      event: this.wot.wtEvent, // todo ioc , or factory func if used only here
      selectionManager: this.wot.selectionManager, // todo ioc , or factory func if used only here
      stylesHandler: this.wot.stylesHandler,
    });
  }

  /**
   * Refresh/Redraw overlay.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  refresh(fastDraw = false) {
    if (this.needFullRender) {
      const cloneSource = this.clone.cloneSource;

      cloneSource.activeOverlayName = this.clone.wtTable.name;
      this.clone.draw(fastDraw);
      cloneSource.activeOverlayName = 'master';
    }
  }

  /**
   * Reset overlay styles to initial values.
   */
  reset() {
    const holder = this.clone.wtTable.holder; // todo refactoring: DEMETER
    const hider = this.clone.wtTable.hider; // todo refactoring: DEMETER
    const holderStyle = holder.style;
    const hiderStyle = hider.style;
    const rootStyle = holder.parentNode.style;

    [holderStyle, hiderStyle, rootStyle].forEach((style) => {
      style.width = '';
      style.height = '';
    });
  }

  /**
   * Determine if Walkontable is running in RTL mode.
   *
   * @returns {boolean}
   */
  isRtl() {
    return this.wtSettings.getSetting('rtlMode');
  }

  /**
   * Destroy overlay instance.
   */
  destroy() {
    this.clone.eventManager.destroy(); // todo check if it is good place for that operation
  }
}
