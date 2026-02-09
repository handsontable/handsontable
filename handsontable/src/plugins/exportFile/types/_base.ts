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
  static get DEFAULT_OPTIONS(): Record<string, unknown> {
    return {
      mimeType: 'text/plain',
      fileExtension: 'txt',
      filename: 'Handsontable [YYYY]-[MM]-[DD]',
      encoding: 'utf-8',
      bom: false,
      columnHeaders: false,
      rowHeaders: false,
      exportHiddenColumns: false,
      exportHiddenRows: false,
      range: [],
    };
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
  declare options: Record<string, unknown>;

  constructor(dataProvider: Record<string, Function>, options: Record<string, unknown>) {
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
  _mergeOptions(options: Record<string, unknown>) {
    let _options: Record<string, unknown> = clone((this.constructor as unknown as { DEFAULT_OPTIONS: Record<string, unknown> }).DEFAULT_OPTIONS) as Record<string, unknown>;
    const date = new Date();

    _options = extend(clone(BaseType.DEFAULT_OPTIONS) as Record<string, unknown>, _options) as Record<string, unknown>;
    _options = extend(_options, options) as Record<string, unknown>;

    _options.filename = substitute(_options.filename as string, {
      YYYY: date.getFullYear(),
      MM: (`${date.getMonth() + 1}`).padStart(2, '0'),
      DD: (`${date.getDate()}`).padStart(2, '0'),
    });

    return _options;
  }
}

export default BaseType;
