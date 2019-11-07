import {
  getScrollbarWidth,
} from './../../../../helpers/dom/element';

/**
 * Column utils class contains all necessary information about sizes of the columns.
 *
 * @class {ColumnUtils}
 */
export default class ColumnUtils {
  constructor(wot) {
    this.wot = wot;
    this.headerWidths = new Map();
  }

  /**
   * Returns column width based on passed source index.
   *
   * @param {Number} sourceIndex Column source index.
   * @returns {Number}
   */
  getWidth(sourceIndex) {
    let width = this.wot.wtSettings.settings.columnWidth;

    if (typeof width === 'function') {
      width = width(sourceIndex);

    } else if (typeof width === 'object') {
      width = width[sourceIndex];
    }

    return width || this.wot.wtSettings.settings.defaultColumnWidth;
  }

  /**
   * Returns stretched column width based on passed source index.
   *
   * @param {Number} sourceIndex Column source index.
   * @returns {Number}
   */
  getStretchedColumnWidth(sourceIndex) {
    const columnWidth = this.getWidth(sourceIndex);
    const calculator = this.wot.wtViewport.columnsRenderCalculator;
    let width = (columnWidth === null || columnWidth === void 0) ? this.wot.wtSettings.settings.defaultColumnWidth : columnWidth;

    if (calculator) {
      const stretchedWidth = calculator.getStretchedColumnWidth(sourceIndex, width);

      if (stretchedWidth) {
        width = stretchedWidth;
      }
    }

    return width;
  }

  /**
   * Returns column header height based on passed header level.
   *
   * @param {Number} level Column header level.
   * @returns {Number}
   */
  getHeaderHeight(level) {
    let height = this.wot.wtSettings.settings.defaultRowHeight;
    const oversizedHeight = this.wot.wtViewport.oversizedColumnHeaders[level];

    if (oversizedHeight !== void 0) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
    }

    return height;
  }

  /**
   * Returns column header width based on passed source index.
   *
   * @param {Number} sourceIndex Column source index.
   * @returns {Number}
   */
  getHeaderWidth(sourceIndex) {
    return this.headerWidths.get(this.wot.wtTable.columnFilter.sourceToRendered(sourceIndex));
  }

  /**
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {
    const { wot } = this;
    const { wtTable, wtViewport, cloneSource } = wot;
    const mainHolder = cloneSource ? cloneSource.wtTable.holder : wtTable.holder;
    const scrollbarCompensation = mainHolder.offsetHeight < mainHolder.scrollHeight ? getScrollbarWidth() : 0;
    let rowHeaderWidthSetting = wot.getSetting('rowHeaderWidth');

    wtViewport.columnsRenderCalculator.refreshStretching(wtViewport.getViewportWidth() - scrollbarCompensation);

    rowHeaderWidthSetting = wot.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
      const rowHeadersCount = wot.getSetting('rowHeaders').length;
      const defaultColumnWidth = wot.getSetting('defaultColumnWidth');

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        let width = Array.isArray(rowHeaderWidthSetting) ? rowHeaderWidthSetting[visibleColumnIndex] : rowHeaderWidthSetting;

        width = (width === null || width === void 0) ? defaultColumnWidth : width;

        this.headerWidths.set(visibleColumnIndex, width);
      }
    }
  }
}
