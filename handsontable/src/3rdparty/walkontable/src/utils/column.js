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
    return this.wtSettings.getSetting('columnWidth', sourceIndex);
  }

  /**
   * Returns column header height based on passed header level.
   *
   * @param {number} level Column header level.
   * @returns {number}
   */
  getHeaderHeight(level) {
    return this.dataAccessObject.stylesHandler.getDefaultRowHeight();
  }

  /**
   * Returns column header width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getHeaderWidth(sourceIndex) {
    return 50;
  }

  /**
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {

  }
}
