import {
  innerHeight,
  innerWidth,
  getScrollLeft,
  getScrollTop,
  offset,
} from '../../../helpers/dom/element';
import {
  createObjectPropListener,
} from '../../../helpers/object';
import CellCoords from './cell/coords';
import { ScrollDao } from './types';

/**
 * @class Scroll
 */
class Scroll {
  /**
   * The data access object.
   *
   * @protected
   * @type {ScrollDao}
   */
  dataAccessObject: ScrollDao;

  /**
   * @param {ScrollDao} dataAccessObject Tha data access object.
   */
  constructor(dataAccessObject: ScrollDao) {
    this.dataAccessObject = dataAccessObject;
  }

  /**
   * Scrolls viewport to a cell.
   *
   * @param {CellCoords} coords The cell coordinates.
   * @param {'auto' | 'start' | 'end'} [horizontalSnap='auto'] If `'start'`, viewport is scrolled to show
   * the cell on the left of the table. If `'end'`, viewport is scrolled to show the cell on the right of
   * the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @param {'auto' | 'top' | 'bottom'} [verticalSnap='auto'] If `'top'`, viewport is scrolled to show
   * the cell on the top of the table. If `'bottom'`, viewport is scrolled to show the cell on the bottom of
   * the table. When `'auto'`, the viewport is scrolled only when the row is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewport(
    coords: CellCoords, 
    horizontalSnap: 'auto' | 'start' | 'end' = 'auto', 
    verticalSnap: 'auto' | 'top' | 'bottom' = 'auto'
  ): boolean {
    if (coords.col === null || coords.row === null) {
      return false;
    }
    
    const isHorizontalSuccess = this.scrollViewportHorizontally(coords.col, horizontalSnap);
    const isVerticalSuccess = this.scrollViewportVertically(coords.row, verticalSnap);

    return isHorizontalSuccess && isVerticalSuccess;
  }

  /**
   * Scrolls viewport to a column.
   *
   * @param {number} column Visual column index.
   * @param {'auto' | 'start' | 'end'} [snapping='auto'] If `'start'`, viewport is scrolled to show
   * the column on the left of the table. If `'end'`, viewport is scrolled to show the column on the right
   * of the table. When `'auto'`, the viewport is scrolled only when the column is outside of the viewport.
   * @returns {boolean}
   */
  scrollViewportHorizontally(column: number, snapping: 'auto' | 'start' | 'end' = 'auto'): boolean {
    if (!this.dataAccessObject.drawn) {
      return false;
    }

    const firstVisibleColumn = this.getFirstVisibleColumn();
    const lastVisibleColumn = this.getLastVisibleColumn();
    const autoSnap = snapping === 'auto';

    if (firstVisibleColumn === null || lastVisibleColumn === null) {
      return false;
    }

    if (autoSnap && column > lastVisibleColumn) {
      snapping = 'end';
    } else if (autoSnap && column < firstVisibleColumn) {
      snapping = 'start';
    }

    let result = autoSnap ? true : false;

    const { wtTable, wtSettings, inlineStartOverlay } = this.dataAccessObject;
    const rootWindow = this.dataAccessObject.rootWindow as Window;
    let alignCellContent = rootWindow.getComputedStyle(wtTable.TABLE).getPropertyValue('text-align');

    switch (snapping) {
      case 'start': {
        result = inlineStartOverlay.scrollTo(column);
        break;
      }
      case 'end': {
        let fixedColumnsStart = wtSettings.getSetting('fixedColumnsStart');
        const totalColumns = wtSettings.getSetting('totalColumns');

        if (column >= fixedColumnsStart && column <= totalColumns - 1) {
          // Additional properties may not be defined explicitly in the ScrollDao interface
          // We're assuming wtOverlays exists on the dataAccessObject
          const wtOverlays = (this.dataAccessObject as any).wtOverlays;
          if (wtOverlays && wtOverlays.inlineEndOverlay) {
            const scrollableElement = wtOverlays.inlineStartOverlay.mainTableScrollableElement;
            const rootDocument = this.dataAccessObject.rootWindow.document;
            let alignInlineContent = 'start';

            if (rootDocument.dir !== 'rtl') {
              alignCellContent = rootWindow.getComputedStyle(wtTable.TABLE).getPropertyValue('text-align');

              if (alignCellContent === 'center') {
                alignInlineContent = 'center';
              } else if (alignCellContent === 'right') {
                alignInlineContent = 'end';
              }
            }

            result = wtOverlays.inlineEndOverlay.scrollTo(column, alignInlineContent);
          }
        }

        break;
      }
      default:
        break;
    }

    return result;
  }

  /**
   * Scrolls viewport to a row.
   *
   * @param {number} row Visual row index.
   * @param {'auto' | 'top' | 'bottom'} [snapping='auto'] If `'top'`, viewport is scrolled to show the row on the top of the table.
   * If `'bottom'`, viewport is scrolled to show the row on the bottom of the table.
   * If not provided or value set to `'auto'` viewport is scrolled to the bottom edge of the table when row is below the viewport
   * and to the top edge of the table when row is above the viewport.
   * @returns {boolean}
   */
  scrollViewportVertically(row: number, snapping: 'auto' | 'top' | 'bottom' = 'auto'): boolean {
    if (!this.dataAccessObject.drawn) {
      return false;
    }

    const firstVisibleRow = this.getFirstVisibleRow();
    const lastVisibleRow = this.getLastVisibleRow();
    const autoSnap = snapping === 'auto';

    if (firstVisibleRow === null || lastVisibleRow === null) {
      return false;
    }

    let result = autoSnap ? true : false;

    if (autoSnap && row > lastVisibleRow) {
      snapping = 'bottom';
    } else if (autoSnap && row < firstVisibleRow) {
      snapping = 'top';
    }

    const { wtSettings, topOverlay } = this.dataAccessObject;

    switch (snapping) {
      case 'top': {
        result = topOverlay.scrollTo(row);
        break;
      }
      case 'bottom': {
        let fixedRowsTop = wtSettings.getSetting('fixedRowsTop');
        const totalRows = wtSettings.getSetting('totalRows');

        if (row >= fixedRowsTop && row <= totalRows - 1) {
          // Additional properties may not be defined explicitly in the ScrollDao interface
          // We're assuming wtOverlays exists on the dataAccessObject
          const wtOverlays = (this.dataAccessObject as any).wtOverlays;
          if (wtOverlays && wtOverlays.bottomOverlay) {
            result = wtOverlays.bottomOverlay.scrollTo(row);
          }
        }

        break;
      }
      default:
        break;
    }

    return result;
  }

  /**
   * Get first visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleRow(): number | null {
    if (!this.dataAccessObject.drawn) {
      return null;
    }

    return this.dataAccessObject.wtTable.getFirstVisibleRow();
  }

  /**
   * Get last visible row based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleRow(): number | null {
    if (!this.dataAccessObject.drawn) {
      return null;
    }

    return this.dataAccessObject.wtTable.getLastVisibleRow();
  }

  /**
   * Gets first visible row, from the top.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleRow(): number {
    if (!this.dataAccessObject.drawn) {
      return -1;
    }

    return this.dataAccessObject.wtTable.getFirstPartiallyVisibleRow();
  }

  /**
   * Gets last visible row, from the top.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleRow(): number {
    if (!this.dataAccessObject.drawn) {
      return -1;
    }

    return this.dataAccessObject.wtTable.getLastPartiallyVisibleRow();
  }

  /**
   * Get first visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getFirstVisibleColumn(): number | null {
    if (!this.dataAccessObject.drawn) {
      return null;
    }

    return this.dataAccessObject.wtTable.getFirstVisibleColumn();
  }

  /**
   * Get last visible column based on virtual dom and how table is visible in browser window viewport.
   *
   * @returns {number}
   */
  getLastVisibleColumn(): number | null {
    if (!this.dataAccessObject.drawn) {
      return null;
    }

    return this.dataAccessObject.wtTable.getLastVisibleColumn();
  }

  /**
   * Gets first visible column, from the left.
   *
   * @returns {number}
   */
  getFirstPartiallyVisibleColumn(): number {
    if (!this.dataAccessObject.drawn) {
      return -1;
    }

    return this.dataAccessObject.wtTable.getFirstPartiallyVisibleColumn();
  }

  /**
   * Gets last visible column, from the left.
   *
   * @returns {number}
   */
  getLastPartiallyVisibleColumn(): number {
    if (!this.dataAccessObject.drawn) {
      return -1;
    }

    return this.dataAccessObject.wtTable.getLastPartiallyVisibleColumn();
  }
}

export default Scroll;
