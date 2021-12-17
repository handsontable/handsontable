import {
  getScrollbarWidth,
} from './../../../../helpers/dom/element';

/**
 * Column utils class contains all necessary information about sizes of the columns.
 *
 * @class {ColumnUtils}
 */
export default class ColumnUtils {
  /**
   * @param {TableDao} dataAccessObject The walkontable instance. @todo remove.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(dataAccessObject, wtSettings) {
    this.dataAccessObject = dataAccessObject;
    this.wtSettings = wtSettings;
    this.headerWidths = new Map();
  }

  /**
   * Returns column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getWidth(sourceIndex) {
    return this.wtSettings.getSetting('columnWidth', sourceIndex)
      || this.wtSettings.getSetting('defaultColumnWidth');
  }

  /**
   * Returns stretched column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getStretchedColumnWidth(sourceIndex) {
    const calculator = this.dataAccessObject.wtViewport.columnsRenderCalculator;
    let width = this.getWidth(sourceIndex);

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
   * @param {number} level Column header level.
   * @returns {number}
   */
  getHeaderHeight(level) {
    let height = this.wtSettings.getSetting('defaultRowHeight');
    const oversizedHeight = this.dataAccessObject.wtViewport.oversizedColumnHeaders[level];

    if (oversizedHeight !== void 0) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
    }

    return height;
  }

  /**
   * Returns column header width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getHeaderWidth(sourceIndex) {
    return this.headerWidths.get(this.dataAccessObject.wtTable.columnFilter.sourceToRendered(sourceIndex));
  }

  /**
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {
    const { wtSettings } = this;
    const { wtTable, wtViewport, cloneSource } = this.dataAccessObject;
    const mainHolder = cloneSource ? cloneSource.wtTable.holder : wtTable.holder;
    const scrollbarCompensation = mainHolder.offsetHeight < mainHolder.scrollHeight ? getScrollbarWidth() : 0;
    let rowHeaderWidthSetting = wtSettings.getSetting('rowHeaderWidth');

    wtViewport.columnsRenderCalculator.refreshStretching(wtViewport.getViewportWidth() - scrollbarCompensation);

    rowHeaderWidthSetting = wtSettings.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== void 0) {
      const rowHeadersCount = wtSettings.getSetting('rowHeaders').length;
      const defaultColumnWidth = wtSettings.getSetting('defaultColumnWidth');

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        let width = Array.isArray(rowHeaderWidthSetting)
          ? rowHeaderWidthSetting[visibleColumnIndex] : rowHeaderWidthSetting;

        width = (width === null || width === void 0) ? defaultColumnWidth : width;

        this.headerWidths.set(visibleColumnIndex, width);
      }
    }
  }
}
