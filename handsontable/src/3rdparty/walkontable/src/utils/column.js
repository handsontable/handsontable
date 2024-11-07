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
   * @param {TableDao} dataAccessObject The table Data Access Object.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(dataAccessObject, wtSettings) {
    this.dataAccessObject = dataAccessObject;
    this.wtSettings = wtSettings;
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
   * Returns column header height based on passed header level.
   *
   * @param {number} level Column header level.
   * @returns {number}
   */
  getHeaderHeight(level) {
    let height = this.dataAccessObject.stylesHandler.getDefaultRowHeight();
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
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {
    const { wtSettings } = this;
    let rowHeaderWidthSetting = wtSettings.getSetting('rowHeaderWidth');

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
