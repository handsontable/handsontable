import {
  addClass,
  getScrollbarWidth,
  getScrollLeft,
  getMaximumScrollLeft,
  getWindowScrollTop,
  hasClass,
  outerWidth,
  removeClass,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import InlineStartOverlayTable from '../table/inlineStart';
import { Overlay } from './_base';
import { getCornerStyle } from '../selection';
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

    if (!this.needFullRender || !this.shouldBeRendered() || !wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const { rootWindow } = this.domBindings;
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let overlayPosition = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      overlayPosition = this.getOverlayOffset() * (this.isRtl() ? -1 : 1);
      setOverlayPosition(overlayRoot, `${overlayPosition}px`, '0px');

    } else {
      overlayPosition = this.getScrollPosition();
      resetCssTransform(overlayRoot);
    }

    const positionChanged = this.adjustHeaderBordersPosition(overlayPosition);

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
      sum += this.wot.wtTable.getColumnWidth(column) || defaultColumnWidth;
      column += 1;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, children and master table element sizes (width, height).
   */
  adjustElementsSize() {
    this.updateTrimmingContainer();

    if (this.needFullRender) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    const { wtTable, wtViewport } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const overlayRoot = this.clone.wtTable.holder.parentNode;
    const overlayRootStyle = overlayRoot.style;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (this.trimmingContainer !== rootWindow || preventOverflow === 'vertical') {
      let height = wtViewport.getWorkspaceHeight();

      if (wtViewport.hasHorizontalScroll()) {
        height -= getScrollbarWidth(rootDocument);
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
    const cornerStyle = getCornerStyle(this.wot);
    const selectionCornerOffset = this.wot.selectionManager
      .getFocusSelection() ? parseInt(cornerStyle.width, 10) / 2 : 0;

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
   * @param {boolean} [beyondRendered]  If `true`, scrolls according to the right
   *                                    edge (left edge is by default).
   * @returns {boolean}
   */
  scrollTo(sourceCol, beyondRendered) {
    const { wtSettings } = this;
    const rowHeaders = wtSettings.getSetting('rowHeaders');
    const fixedColumnsStart = wtSettings.getSetting('fixedColumnsStart');
    const sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    const mainHolder = sourceInstance.wtTable.holder;
    const rowHeaderBorderCompensation = (
      fixedColumnsStart === 0 &&
      rowHeaders.length > 0 &&
      !hasClass(mainHolder.parentNode, 'innerBorderInlineStart')
    ) ? 1 : 0;
    let newX = this.getTableParentOffset();
    let scrollbarCompensation = 0;

    if (beyondRendered) {
      const columnWidth = this.wot.wtTable.getColumnWidth(sourceCol);
      const viewportWidth = this.wot.wtViewport.getViewportWidth();

      if (columnWidth > viewportWidth) {
        beyondRendered = false;
      }
    }

    if (beyondRendered && mainHolder.offsetWidth !== mainHolder.clientWidth) {
      scrollbarCompensation = getScrollbarWidth(this.domBindings.rootDocument);
    }
    if (beyondRendered) {
      newX += this.sumCellSizes(0, sourceCol + 1);
      newX -= this.wot.wtViewport.getViewportWidth();
      // Compensate for the right header border if scrolled from the absolute left.
      newX += rowHeaderBorderCompensation;

    } else {
      newX += this.sumCellSizes(this.wtSettings.getSetting('fixedColumnsStart'), sourceCol);
    }

    newX += scrollbarCompensation;

    // If the table is scrolled all the way left when starting the scroll and going to be scrolled to the far right,
    // we need to compensate for the potential header border width.
    if (
      getMaximumScrollLeft(this.mainTableScrollableElement) === newX - rowHeaderBorderCompensation &&
      rowHeaderBorderCompensation > 0
    ) {
      this.wot.wtOverlays.expandHiderHorizontallyBy(rowHeaderBorderCompensation);
    }

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
   * @returns {number} Main table's horizontal scroll position.
   */
  getScrollPosition() {
    return Math.abs(getScrollLeft(this.mainTableScrollableElement, this.domBindings.rootWindow));
  }

  /**
   * Gets the main overlay's horizontal overlay offset.
   *
   * @returns {number} Main table's horizontal overlay offset.
   */
  getOverlayOffset() {
    const { rootWindow } = this.domBindings;
    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    let overlayOffset = 0;

    if (this.trimmingContainer === rootWindow && (!preventOverflow || preventOverflow !== 'horizontal')) {
      if (this.isRtl()) {
        overlayOffset = Math.abs(Math.min(this.getTableParentOffset() - this.getScrollPosition(), 0));
      } else {
        overlayOffset = Math.max(this.getScrollPosition() - this.getTableParentOffset(), 0);
      }

      const rootWidth = this.wot.wtTable.getTotalWidth();
      const overlayRootWidth = this.clone.wtTable.getTotalWidth();
      const maxOffset = rootWidth - overlayRootWidth;

      if (overlayOffset > maxOffset) {
        overlayOffset = 0;
      }
    }

    return overlayOffset;
  }

  /**
   * Adds css classes to hide the header border's header (cell-selection border hiding issue).
   *
   * @param {number} position Header X position if trimming container is window or scroll top if not.
   * @returns {boolean}
   */
  adjustHeaderBordersPosition(position) {
    const { wtSettings } = this;
    const masterParent = this.wot.wtTable.holder.parentNode;
    const rowHeaders = wtSettings.getSetting('rowHeaders');
    const fixedColumnsStart = wtSettings.getSetting('fixedColumnsStart');
    const totalRows = wtSettings.getSetting('totalRows');
    const preventVerticalOverflow = wtSettings.getSetting('preventOverflow') === 'vertical';

    if (totalRows) {
      removeClass(masterParent, 'emptyRows');
    } else {
      addClass(masterParent, 'emptyRows');
    }

    let positionChanged = false;

    if (!preventVerticalOverflow) {
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
    }

    return positionChanged;
  }
}
