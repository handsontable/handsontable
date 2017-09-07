import {arrayEach} from 'handsontable/helpers/array';
import {extend, clone} from 'handsontable/helpers/object';
import {rangeEach} from 'handsontable/helpers/number';
import {substitute} from 'handsontable/helpers/string';

/**
 * @plugin ExportFile
 * @private
 */
class BaseType {
  /**
   * Default options.
   *
   * @returns {Object}
   */
  static get DEFAULT_OPTIONS() {
    return {
      mimeType: 'text/plain',
      fileExtension: 'txt',
      filename: 'Handsontable [YYYY]-[MM]-[DD]',
      encoding: 'utf-8',
      columnHeaders: false,
      rowHeaders: false,
      exportHiddenColumns: false,
      exportHiddenRows: false,
      range: [],
    };
  }

  constructor(dataProvider, options) {
    /**
     * Data provider.
     *
     * @type {DataProvider}
     */
    this.dataProvider = dataProvider;
    /**
     * Format type class options.
     *
     * @type {Object}
     */
    this.options = this._mergeOptions(options);

    this.dataProvider.setOptions(this.options);
  }

  /**
   * Merge options provided by users with defaults.
   *
   * @return {Object} Returns new options object.
   */
  _mergeOptions(options) {
    let _options = clone(this.constructor.DEFAULT_OPTIONS);
    let date = new Date();

    _options = extend(clone(BaseType.DEFAULT_OPTIONS), _options);
    _options = extend(_options, options);

    _options.filename = substitute(_options.filename, {
      YYYY: date.getFullYear(),
      MM: ((date.getMonth() + 1) + '').padStart(2, '0'),
      DD: (date.getDate() + '').padStart(2, '0'),
    });

    return _options;
  }
}

export default BaseType;
