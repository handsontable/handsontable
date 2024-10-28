import {
  getScrollbarWidth,
} from './../../../../helpers/dom/element';
import { ColumnStretching } from './columnStretching';

/**
 * Column utils class contains all necessary information about sizes of the columns.
 *
 * @class {ColumnUtils}
 */
export default class ColumnUtils {
  /**
   * @type {TableDao}
   */
  dataAccessObject;
  /**
   * @type {Settings}
   */
  wtSettings;
  /**
   * @type {Map<number, number>}
   */
  headerWidths = new Map();
  /**
   * @type {ColumnStretching}
   */
  stretching;

  /**
   * @param {TableDao} dataAccessObject The table Data Access Object.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(dataAccessObject, wtSettings) {
    this.dataAccessObject = dataAccessObject;
    this.wtSettings = wtSettings;

    this.stretching = new ColumnStretching({
      totalColumns: () => this.wtSettings.getSetting('totalColumns'),
      stretchMode: () => this.wtSettings.getSetting('stretchH'),
      stretchingColumnWidthFn: (stretchedWidth, column) =>
        this.wtSettings.getSetting('onBeforeStretchingColumnWidth', stretchedWidth, column),
      columnWidthFn: sourceCol => this.dataAccessObject.wtTable.getColumnWidth(sourceCol),
    });
  }

  /**
   * Returns column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getWidth(sourceIndex) {
    const width = this.wtSettings.getSetting('columnWidth', sourceIndex)
      || this.wtSettings.getSetting('defaultColumnWidth');

    return width;
  }

  /**
   * Returns stretched column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getStretchedColumnWidth(sourceIndex) {
    let width = this.getWidth(sourceIndex);

    const stretchedWidth = this.stretching.getStretchedColumnWidth(sourceIndex, width);

    if (stretchedWidth) {
      width = stretchedWidth;
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

    if (oversizedHeight !== undefined) {
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
   * Refreshes the stretching column width by recalculating the widths of the columns.
   */
  refreshStretching() {
    const { wtTable, wtViewport, cloneSource } = this.dataAccessObject;
    const mainHolder = cloneSource ? cloneSource.wtTable.holder : wtTable.holder;
    const scrollbarCompensation = mainHolder.offsetHeight < mainHolder.scrollHeight ? getScrollbarWidth() : 0;

    this.stretching.refreshStretching(wtViewport.getViewportWidth() - scrollbarCompensation);
  }

  /**
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {
    const { wtSettings } = this;
    let rowHeaderWidthSetting = wtSettings.getSetting('rowHeaderWidth');

    this.refreshStretching();

    rowHeaderWidthSetting = wtSettings.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== undefined) {
      const rowHeadersCount = wtSettings.getSetting('rowHeaders').length;
      const defaultColumnWidth = wtSettings.getSetting('defaultColumnWidth');

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        let width = Array.isArray(rowHeaderWidthSetting)
          ? rowHeaderWidthSetting[visibleColumnIndex] : rowHeaderWidthSetting;

        width = (width === null || width === undefined) ? defaultColumnWidth : width;

        this.headerWidths.set(visibleColumnIndex, width);
      }
    }
  }
}
