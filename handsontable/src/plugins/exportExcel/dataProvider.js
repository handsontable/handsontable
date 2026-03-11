import { rangeEach } from '../../helpers/number';
import { stringify } from '../../helpers/mixed';

/**
 * @private
 */
class DataProvider {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  hot;
  /**
   * Format type class options.
   *
   * @type {object}
   */
  options = {};

  constructor(hotInstance) {
    this.hot = hotInstance;
  }

  /**
   * Set options for data provider.
   *
   * @param {object} options Object with specified options.
   */
  setOptions(options) {
    this.options = options;
  }

  /**
   * Get table data as cell descriptors.
   *
   * @returns {Array[]}
   */
  getCells() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const options = this.options;
    const rows = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }

      const row = [];

      rangeEach(startCol, endCol, (colIndex) => {
        if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
          return;
        }

        row.push(this._getCellDescriptor(rowIndex, colIndex));
      });

      rows.push(row);
    });

    return rows;
  }

  /**
   * Gets list of row headers.
   *
   * @returns {Array}
   */
  getRowHeaders() {
    const headers = [];

    if (this.options.rowHeaders) {
      const { startRow, endRow } = this._getDataRange();
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
   * @returns {Array}
   */
  getColumnHeaders() {
    const headers = [];

    if (this.options.columnHeaders) {
      const { startCol, endCol } = this._getDataRange();
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
   * @returns {object} Returns object with keys `startRow`, `startCol`, `endRow` and `endCol`.
   */
  _getDataRange() {
    const cols = this.hot.countCols() - 1;
    const rows = this.hot.countRows() - 1;
    let [startRow = 0, startCol = 0, endRow = rows, endCol = cols] = this.options.range;

    startRow = Math.max(startRow, 0);
    startCol = Math.max(startCol, 0);
    endRow = Math.min(endRow, rows);
    endCol = Math.min(endCol, cols);

    return { startRow, startCol, endRow, endCol };
  }

  /**
   * Return descriptor for a single cell.
   *
   * @private
   * @param {number} visualRow Visual row index.
   * @param {number} visualColumn Visual column index.
   * @returns {{type: string, value: *}}
   */
  _getCellDescriptor(visualRow, visualColumn) {
    const displayedValue = this.hot.getDataAtCell(visualRow, visualColumn);
    const physicalRow = this.hot.toPhysicalRow(visualRow);
    const sourceValue = physicalRow >= 0 ? this.hot.getSourceDataAtCell(physicalRow, visualColumn) : null;

    if (this.options.formulas && typeof sourceValue === 'string' && sourceValue.startsWith('=')) {
      return {
        type: 'formula',
        value: sourceValue.slice(1),
      };
    }

    if (typeof displayedValue === 'number' && Number.isFinite(displayedValue)) {
      return {
        type: 'number',
        value: displayedValue,
      };
    }

    if (typeof displayedValue === 'boolean') {
      return {
        type: 'boolean',
        value: displayedValue,
      };
    }

    const stringValue = stringify(displayedValue);

    if (stringValue === '') {
      return {
        type: 'empty',
        value: '',
      };
    }

    return {
      type: 'string',
      value: stringValue,
    };
  }

  /**
   * Check if row at specified row index is hidden.
   *
   * @private
   * @param {number} row Row index.
   * @returns {boolean}
   */
  _isHiddenRow(row) {
    return this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(row));
  }

  /**
   * Check if column at specified column index is hidden.
   *
   * @private
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  _isHiddenColumn(column) {
    return this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(column));
  }
}

export default DataProvider;
