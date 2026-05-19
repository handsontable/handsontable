import { extend, clone } from '../../../helpers/object';
import { substitute } from '../../../helpers/string';

/**
 * @private
 */
class BaseType {
  /**
   * Default options.
   *
   * @returns {object}
   */
  static get DEFAULT_OPTIONS() {
    return {
      mimeType: 'text/plain',
      fileExtension: 'txt',
      filename: 'Handsontable [YYYY]-[MM]-[DD]',
      encoding: 'utf-8',
      bom: false,
      colHeaders: false,
      rowHeaders: false,
      exportHiddenColumns: false,
      exportHiddenRows: false,
      range: [],
    };
  }

  /**
   * Whether the format produces binary (asynchronous) output.
   *
   * @returns {boolean}
   */
  get binary() {
    return false;
  }

  /**
   * Data provider.
   *
   * @type {DataProvider}
   */
  dataProvider;
  /**
   * Format type class options.
   *
   * @type {object}
   */
  options;

  constructor(dataProvider, options) {
    this.dataProvider = dataProvider;
    this.options = this._mergeOptions(options);
    this.dataProvider.setOptions(this.options);
  }

  /**
   * Merge options provided by users with defaults.
   *
   * @param {object} options An object with options to merge with.
   * @returns {object} Returns new options object.
   */
  _mergeOptions(options) {
    let _options = clone(this.constructor.DEFAULT_OPTIONS);
    const date = new Date();

    _options = extend(clone(BaseType.DEFAULT_OPTIONS), _options);

    // Legacy alias: `columnHeaders` was renamed to `colHeaders`. When a caller
    // passes the old name and does not also pass the new name, promote it so
    // that the rest of the code only needs to read `colHeaders`.
    if (options && 'columnHeaders' in options && !('colHeaders' in options)) {
      options = { ...options, colHeaders: options.columnHeaders };
    }

    _options = extend(_options, options);

    _options.filename = substitute(_options.filename, {
      YYYY: date.getFullYear(),
      MM: (`${date.getMonth() + 1}`).padStart(2, '0'),
      DD: (`${date.getDate()}`).padStart(2, '0'),
    });

    return _options;
  }
}

export default BaseType;
