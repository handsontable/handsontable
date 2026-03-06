import { arrayEach, arrayMap } from '../../../helpers/array';
import { stringify } from '../../../helpers/mixed';
import BaseType from './_base';

const CHAR_CARRIAGE_RETURN = String.fromCharCode(13);
const CHAR_DOUBLE_QUOTES = String.fromCharCode(34);
const CHAR_LINE_FEED = String.fromCharCode(10);
const CHAR_EQUAL = String.fromCharCode(61);
const CHAR_PLUS = String.fromCharCode(43);
const CHAR_MINUS = String.fromCharCode(45);
const CHAR_AT = String.fromCharCode(64);
const CHAR_TAB = String.fromCharCode(9);

/**
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
      sanitizeValues: false,
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
      columnHeaders = arrayMap(
        columnHeaders,
        value => this._escapeCell(value, { force: true, sanitizeValue: options.sanitizeValues })
      );

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
        result += this._escapeCell(rowHeaders[index], { sanitizeValue: options.sanitizeValues });
        result += options.columnDelimiter;
      }

      const escapedValue = value
        .map(cellValue => this._escapeCell(cellValue, { sanitizeValue: options.sanitizeValues }))
        .join(options.columnDelimiter);

      result += escapedValue;
    });

    return result;
  }

  /**
   * Escape cell value.
   *
   * @param {*} value Cell value.
   * @param {object} options Options.
   * @param {boolean} [options.force=false] Indicates if cell value will be escaped forcefully.
   * @param {boolean|RegExp|Function} [options.sanitizeValue=false] Controls the sanitization of cell value.
   * @returns {string}
   */
  _escapeCell(value, { force = false, sanitizeValue = false } = {}) {
    let returnValue = stringify(value);

    if (returnValue === '') {
      return returnValue;
    }

    if (sanitizeValue) {
      force = true;
    }

    if (sanitizeValue instanceof RegExp) {
      returnValue = this.#sanitizeValueWithRegExp(returnValue, sanitizeValue);
    } else if (typeof sanitizeValue === 'function') {
      returnValue = sanitizeValue(returnValue);
    } else if (sanitizeValue) {
      returnValue = this.#sanitizeValueWithOWASP(returnValue);
    }

    if (force
      || returnValue.indexOf(CHAR_CARRIAGE_RETURN) >= 0
      || returnValue.indexOf(CHAR_DOUBLE_QUOTES) >= 0
      || returnValue.indexOf(CHAR_LINE_FEED) >= 0
      || returnValue.indexOf(this.options.columnDelimiter) >= 0) {
      returnValue = returnValue.replace(new RegExp('"', 'g'), '""');
      returnValue = `"${returnValue}"`;
    }

    return returnValue;
  }

  /**
   * Sanitize value that may be interpreted as a formula in spreadsheet software.
   * Following the OWASP recommendations: https://owasp.org/www-community/attacks/CSV_Injection.
   *
   * @param {string} value Cell value.
   * @returns {string}
   */
  #sanitizeValueWithOWASP(value) {
    if (value.startsWith(CHAR_EQUAL)
      || value.startsWith(CHAR_PLUS)
      || value.startsWith(CHAR_MINUS)
      || value.startsWith(CHAR_AT)
      || value.startsWith(CHAR_TAB)
      || value.startsWith(CHAR_CARRIAGE_RETURN)) {
      return `'${value}`;
    }

    return value;
  }

  /**
   * Sanitize value using regular expression.
   *
   * @param {string} value Cell value.
   * @param {RegExp} regexp Regular expression to test against.
   * @returns {string}
   */
  #sanitizeValueWithRegExp(value, regexp) {
    return regexp.test(value) ? `'${value}` : value;
  }
}

export default Csv;
