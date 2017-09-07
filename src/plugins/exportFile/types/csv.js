import {arrayEach, arrayMap} from 'handsontable/helpers/array';
import {stringify} from 'handsontable/helpers/mixed';
import BaseType from './_base.js';

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
   * @returns {Object}
   */
  static get DEFAULT_OPTIONS() {
    return {
      mimeType: 'text/csv',
      fileExtension: 'csv',
      columnDelimiter: ',',
      rowDelimiter: '\r\n',
    };
  }

  /**
   * Create string body in desired format.
   *
   * @return {String}
  */
  export() {
    const options = this.options;
    const data = this.dataProvider.getData();
    let columnHeaders = this.dataProvider.getColumnHeaders();
    const hasColumnHeaders = columnHeaders.length > 0;
    let rowHeaders = this.dataProvider.getRowHeaders();
    const hasRowHeaders = rowHeaders.length > 0;

    // Starts with utf-8 BOM
    let result = '\ufeff';

    if (hasColumnHeaders) {
      columnHeaders = arrayMap(columnHeaders, (value) => this._escapeCell(value, true));

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
      result += value.map((value) => this._escapeCell(value)).join(options.columnDelimiter);
    });

    return result;
  }

  /**
   * Escape cell value.
   *
   * @param {*} value Cell value.
   * @param {Boolean} [force=false] Indicates if cell value will be escaped forcefully.
   * @return {String}
   */
  _escapeCell(value, force = false) {
    value = stringify(value);

    if (value !== '' && (force ||
        value.indexOf(CHAR_CARRIAGE_RETURN) >= 0 ||
        value.indexOf(CHAR_DOUBLE_QUOTES) >= 0 ||
        value.indexOf(CHAR_LINE_FEED) >= 0 ||
        value.indexOf(this.options.columnDelimiter) >= 0)) {

      value = value.replace(new RegExp('"', 'g'), '""');
      value = `"${value}"`;
    }

    return value;
  }
}

export default Csv;
