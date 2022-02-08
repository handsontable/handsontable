import {
  addClass,
  getScrollbarWidth,
  getScrollLeft,
  getWindowScrollTop,
  hasClass,
  outerWidth,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import InlineStartOverlayTable from '../table/inlineStart';
import { Overlay } from './_base';
import {
  CLONE_INLINE_START,
} from './constants';

/**
 * @class InlineStartOverlay
 */
export class InlineStartOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance, facadeGetter, wtSettings, domBindings) {
    super(wotInstance, facadeGetter, CLONE_INLINE_START, wtSettings, domBindings);
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {InlineStartOverlayTable}
   */
  createTable(...args) {
    return new InlineStartOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered() {
    return this.wtSettings.getSetting('shouldRenderInlineStartOverlay');
  }

  /**
   * Updates the left overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    const { wtTable } = this.wot;

    if (!this.needFullRender || !wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const { rootWindow, rootDocument } = this.domBindings;
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    let headerPosition = 0;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      const hiderRect = wtTable.hider.getBoundingClientRect();
      const left = Math.ceil(hiderRect.left);
      const right = Math.ceil(hiderRect.right);
      let finalLeft = 0;

      if (this.isRtl()) {
        const documentWidth = rootDocument.documentElement.clientWidth;

        if (right >= documentWidth) {
          finalLeft = documentWidth - right;
        }

      } else if (left < 0 && (right - overlayRoot.offsetWidth) > 0) {
        finalLeft = -left;
      }

      headerPosition = finalLeft;
      setOverlayPosition(overlayRoot, `${finalLeft}px`, '0px');

    } else {
      headerPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    const positionChanged = this.adjustHeaderBordersPosition(headerPosition);

    this.adjustElementsSize();

    return positionChanged;
  }

  /**
   * Sets the main overlay's horizontal scroll position.
   *
   * @param {number} pos The scroll position.
   * @returns {boolean}
   */
  setScrollPosition(pos) {
    const { rootWindow } = this.domBindings;
    let result = false;

    if (this.isRtl()) {
      pos = -pos;
    }

    if (this.mainTableScrollableElement === rootWindow && rootWindow.scrollX !== pos) {
      rootWindow.scrollTo(pos, getWindowScrollTop(rootWindow));
      result = true;

    } else if (this.mainTableScrollableElement.scrollLeft !== pos) {
      this.mainTableScrollableElement.scrollLeft = pos;
      result = true;
    }

    return result;
  }

  /**
   * Triggers onScroll hook callback.
   */
  onScroll() {
    this.wtSettings.getSetting('onScrollVertically');
  }

  /**
   * Calculates total sum cells width.
   *
   * @param {number} from Column index which calculates started from.
   * @param {number} to Column index where calculation is finished.
   * @returns {number} Width sum.
   */
  sumCellSizes(from, to) {
    const defaultColumnWidth = this.wtSettings.getSetting('defaultColumnWidth');
    let column = from;
    let sum = 0;

    while (column < to) {
      sum += this.wot.wtTable.getStretchedColumnWidth(column) || defaultColumnWidth;
      column += 1;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, childs and master table element sizes (width, height).
   *
   * @param {boolean} [force=false] When `true`, it adjusts the DOM nodes sizes for that overlay.
   */
  adjustElementsSize(force = false) {
    this.updateTrimmingContainer();

    if (this.needFullRender || force) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    const { wtTable } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const scrollbarHeight = getScrollbarWidth(rootDocument);
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'vertical') {
      let height = this.wot.wtViewport.getWorkspaceHeight();

      if (this.wot.wtOverlays.hasScrollbarBottom) {
        height -= scrollbarHeight;
      }

      height = Math.min(height, wtTable.wtRootElement.scrollHeight);
      overlayRootStyle.height = `${height}px`;

    } else {
      overlayRootStyle.height = '';
    }

    this.clone.wtTable.holder.style.height = overlayRootStyle.height;

    const tableWidth = outerWidth(this.clone.wtTable.TABLE);

    overlayRootStyle.width = `${tableWidth}px`;
  }

  /**
   * Adjust overlay root childs size.
   */
  adjustRootChildrenSize() {
    const { holder } = this.clone.wtTable;
    const { selections } = this.wot;
    const facade = this.facadeGetter();
    const selectionCornerOffset = Math.abs(selections?.getCell().getBorder(facade).cornerCenterPointOffset ?? 0);

    this.clone.wtTable.hider.style.height = this.hider.style.height;
    holder.style.height = holder.parentNode.style.height;
    // Add selection corner protruding part to the holder total width to make sure that
    // borders' corner won't be cut after horizontal scroll (#6937).
    holder.style.width = `${parseInt(holder.parentNode.style.width, 10) + selectionCornerOffset}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  applyToDOM() {
    const total = this.wtSettings.getSetting('totalColumns');
    const styleProperty = this.isRtl() ? 'right' : 'left';

    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.spreader.style[styleProperty] = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else if (total === 0) {
      this.spreader.style[styleProperty] = '0';

    } else {
      throw new Error('Incorrect value of the columnsRenderCalculator');
    }

    if (this.isRtl()) {
      this.spreader.style.left = '';
    } else {
      this.spreader.style.right = '';
    }

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   * Synchronize calculated top position to an element.
   */
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;

    } else {
      this.clone.wtTable.spreader.style.top = '';
    }
  }

  /**
   * Scrolls horizontally to a column at the left edge of the viewport.
   *
   * @param {number} sourceCol  Column index which you want to scroll to.
   * @param {boolean} [beyondRendered]  If `true`, scrolls according to the bottom
   *                                    edge (top edge is by default).
   * @returns {boolean}
   */
  scrollTo(sourceCol, beyondRendered) {
    let newX = this.getTableParentOffset();
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    let scrollbarCompensation = 0;

    if (beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
      scrollbarCompensation = getScrollbarWidth(this.domBindings.rootDocument);
    }
    if (beyondRendered) {
      newX += this.sumCellSizes(0, sourceCol + 1);
      newX -= this.wot.wtViewport.getViewportWidth();

    } else {
      newX += this.sumCellSizes(this.wtSettings.getSetting('fixedColumnsStart'), sourceCol);
    }

    newX += scrollbarCompensation;

    return this.setScrollPosition(newX);
  }

  /**
   * Gets table parent left position.
   *
   * @returns {number}
   */
  getTableParentOffset() {
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let offset = 0;

    if (!preventOverflow && this.trimmingContainer === this.domBindings.rootWindow) {
      offset = this.wot.wtTable.holderOffset.left;
    }

    return offset;
  }

  /**
   * Gets the main overlay's horizontal scroll position.
   *
   * @returns {number} Main table's vertical scroll position.
   */
  getScrollPosition() {
    return getScrollLeft(this.mainTableScrollableElement, this.domBindings.rootWindow) * (this.isRtl() ? -1 : 1);
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header X position if trimming container is window or scroll top if not.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position) {
    const masterParent = this.wot.wtTable.holder.parentNode;
    const rowHeaders = this.wtSettings.getSetting('rowHeaders');
    const fixedColumnsStart = this.wtSettings.getSetting('fixedColumnsStart');
    const totalRows = this.wtSettings.getSetting('totalRows');

    if (totalRows) {
      removeClass(masterParent, 'emptyRows');
    } else {
      addClass(masterParent, 'emptyRows');
    }

    let positionChanged = false;

    if (fixedColumnsStart && !rowHeaders.length) {
      // "innerBorderLeft" is for backward compatibility
      addClass(masterParent, 'innerBorderLeft innerBorderInlineStart');

    } else if (!fixedColumnsStart && rowHeaders.length) {
      const previousState = hasClass(masterParent, 'innerBorderInlineStart');

      if (position) {
        addClass(masterParent, 'innerBorderLeft innerBorderInlineStart');
        positionChanged = !previousState;
      } else {
        removeClass(masterParent, 'innerBorderLeft innerBorderInlineStart');
        positionChanged = previousState;
      }
    }

    return positionChanged;
  }
}
