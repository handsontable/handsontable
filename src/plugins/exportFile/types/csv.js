import { arrayEach, arrayMap } from '../../../helpers/array';
import { stringify } from '../../../helpers/mixed';
import BaseType from './_base';

const CHAR_CARRIAGE_RETURN = String.fromCharCode(13);
const CHAR_DOUBLE_QUOTES = String.fromCharCode(34);
const CHAR_LINE_FEED = String.fromCharCode(10);

/**
 * @plugin ExportFile
 * @private
 */
class Csv extends BaseType {
  /**
   * Default options for exporting CSV format.
   *
   * @returns {object}
   */
  static get DEFAULT_OPTIONS() {
    return {
      mimeType: 'text/csv',
      fileExtension: 'csv',
      bom: true,
      columnDelimiter: ',',
      rowDelimiter: '\r\n',
    };
  }

  /**
   * Create string body in desired format.
   *
   * @returns {string}
   */
  export() {
    const options = this.options;
    const data = this.dataProvider.getData();
    let columnHeaders = this.dataProvider.getColumnHeaders();
    const hasColumnHeaders = columnHeaders.length > 0;
    const rowHeaders = this.dataProvider.getRowHeaders();
    const hasRowHeaders = rowHeaders.length > 0;
    let result = options.bom ? String.fromCharCode(0xFEFF) : '';

    if (hasColumnHeaders) {
      columnHeaders = arrayMap(columnHeaders, value => this._escapeCell(value, true));

      if (hasRowHeaders) {
        result += options.columnDelimiter;
      }
      result += columnHeaders.join(options.columnDelimiter);
      result += options.rowDelimiter;
    }

    arrayEach(data, (value, index) => {
      if (index > 0) {
        result += options.rowDelimiter;
      }
      if (hasRowHeaders) {
        result += this._escapeCell(rowHeaders[index]) + options.columnDelimiter;
      }
      result += value.map(cellValue => this._escapeCell(cellValue)).join(options.columnDelimiter);
    });

    return result;
  }

  /**
   * Escape cell value.
   *
   * @param {*} value Cell value.
   * @param {boolean} [force=false] Indicates if cell value will be escaped forcefully.
   * @returns {string}
   */
  _escapeCell(value, force = false) {
    let escapedValue = stringify(value);

    if (escapedValue !== '' && (force ||
      escapedValue.indexOf(CHAR_CARRIAGE_RETURN) >= 0 ||
      escapedValue.indexOf(CHAR_DOUBLE_QUOTES) >= 0 ||
      escapedValue.indexOf(CHAR_LINE_FEED) >= 0 ||
      escapedValue.indexOf(this.options.columnDelimiter) >= 0)) {

      escapedValue = escapedValue.replace(new RegExp('"', 'g'), '""');
      escapedValue = `"${escapedValue}"`;
    }

    return escapedValue;
  }
}

export default Csv;
