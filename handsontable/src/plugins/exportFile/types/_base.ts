import { extend, clone } from '../../../helpers/object';
import { substitute } from '../../../helpers/string';
import { throwWithCause } from '../../../helpers/errors';
import type DataProvider from '../dataProvider';

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
  get binary(): boolean {
    return false;
  }

  /**
   * Type predicate: narrows this formatter to a binary (asynchronous) one.
   *
   * @returns {boolean}
   */
  isBinary(): this is BaseType & { binary: true; export(): Promise<unknown> } {
    return this.binary;
  }

  /**
   * Type predicate: narrows this formatter to a text (synchronous) one.
   *
   * @returns {boolean}
   */
  isText(): this is BaseType & { binary: false; export(): string } {
    return !this.binary;
  }

  /**
   * Performs the actual export and returns the data as a string or a Promise.
   */
  export(): string | Promise<unknown> {
    throwWithCause('export() must be implemented by subclass');
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

  /**
   * Initializes the export type with the data provider and merges the given options with the class defaults.
   */
  constructor(dataProvider: DataProvider, options: Record<string, unknown>) {
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
    const ctorDefaults = (this.constructor as unknown as { DEFAULT_OPTIONS: Record<string, unknown> }).DEFAULT_OPTIONS;
    let _options: Record<string, unknown> = clone(ctorDefaults) as Record<string, unknown>;
    const date = new Date();

    _options = extend(clone(BaseType.DEFAULT_OPTIONS) as Record<string, unknown>, _options) as Record<string, unknown>;

    // Legacy alias: `columnHeaders` was renamed to `colHeaders`. When a caller
    // passes the old name and does not also pass the new name, promote it so
    // that the rest of the code only needs to read `colHeaders`.
    if (options && 'columnHeaders' in options && !('colHeaders' in options)) {
      options = { ...options, colHeaders: options.columnHeaders };
    }

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
