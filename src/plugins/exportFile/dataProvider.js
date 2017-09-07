import {arrayEach} from 'handsontable/helpers/array';
import {extend, clone} from 'handsontable/helpers/object';
import {rangeEach} from 'handsontable/helpers/number';

// Waiting for jshint >=2.9.0 where they added support for destructing
// jshint ignore: start

/**
 * @plugin ExportFile
 * @private
 */
class DataProvider {
  constructor(hotInstance) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hotInstance;
    /**
     * Format type class options.
     *
     * @type {Object}
     */
    this.options = {};
  }

  /**
   * Set options for data provider.
   *
   * @param {Object} options Object with specified options.
   */
  setOptions(options) {
    this.options = options;
  }

  /**
   * Get table data based on provided settings to the class constructor.
   *
   * @returns {Array}
   */
  getData() {
    const {startRow, startCol, endRow, endCol} = this._getDataRange();
    const options = this.options;
    const data = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      const row = [];

      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }
      rangeEach(startCol, endCol, (colIndex) => {
        if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
          return;
        }
        row.push(this.hot.getDataAtCell(rowIndex, colIndex));
      });

      data.push(row);
    });

    return data;
  }

  /**
   * Gets list of row headers.
   *
   * @return {Array}
   */
  getRowHeaders() {
    let headers = [];

    if (this.options.rowHeaders) {
      const {startRow, endRow} = this._getDataRange();
      const rowHeaders = this.hot.getRowHeader();

      rangeEach(startRow, endRow, (row) => {
        if (!this.options.exportHiddenRows && this._isHiddenRow(row)) {
          return;
        }
        headers.push(rowHeaders[row]);
      });
    }

    return headers;
  }

  /**
   * Gets list of columns headers.
   *
   * @return {Array}
   */
  getColumnHeaders() {
    let headers = [];

    if (this.options.columnHeaders) {
      const {startCol, endCol} = this._getDataRange();
      const colHeaders = this.hot.getColHeader();

      rangeEach(startCol, endCol, (column) => {
        if (!this.options.exportHiddenColumns && this._isHiddenColumn(column)) {
          return;
        }
        headers.push(colHeaders[column]);
      });
    }

    return headers;
  }

  /**
   * Get data range object based on settings provided in the class constructor.
   *
   * @private
   * @returns {Object} Returns object with keys `startRow`, `startCol`, `endRow` and `endCol`.
   */
  _getDataRange() {
    const cols = this.hot.countCols() - 1;
    const rows = this.hot.countRows() - 1;
    let [startRow = 0, startCol = 0, endRow = rows, endCol = cols] = this.options.range;

    startRow = Math.max(startRow, 0);
    startCol = Math.max(startCol, 0);
    endRow = Math.min(endRow, rows);
    endCol = Math.min(endCol, cols);

    return {startRow, startCol, endRow, endCol};
  }

  /**
   * Check if row at specified row index is hidden.
   *
   * @private
   * @param {Number} row Row index.
   * @returns {Boolean}
   */
  _isHiddenRow(row) {
    return this.hot.hasHook('hiddenRow') && this.hot.runHooks('hiddenRow', row);
  }

  /**
   * Check if column at specified column index is hidden.
   *
   * @private
   * @param {Number} column Column index.
   * @returns {Boolean}
   */
  _isHiddenColumn(column) {
    return this.hot.hasHook('hiddenColumn') && this.hot.runHooks('hiddenColumn', column);
  }
}

export default DataProvider;
