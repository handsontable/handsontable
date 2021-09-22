import { extend, isObject } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';
import { normalizeSettings } from './settingsNormalizer';

/**
 * List of properties which are configurable. That properties can be changed using public API.
 *
 * @type {string[]}
 */
export const HEADER_CONFIGURABLE_PROPS = ['label', 'collapsible'];

/**
 * The class manages and normalizes settings passed by the developer
 * into the nested headers plugin. The SourceSettings class is a
 * source of truth for tree builder (HeaderTree) module.
 *
 * @class SourceSettings
 * @plugin NestedHeaders
 */
export default class SourceSettings {
  /**
   * The normalized source data (normalized user-defined settings for nested headers).
   *
   * @private
   * @type {Array[]}
   */
  #data = [];
  /**
   * The total length of the nested header layers.
   *
   * @private
   * @type {number}
   */
  #dataLength = 0;
  /**
   * Columns count limit value trims source settings to that value. If columns
   * count limit intersects nested header, the header's colspan value is reduced
   * to keep the whole structure stable (trimmed precisely where the limit is set).
   *
   * @type {number}
   */
  #columnsLimit = Infinity;

  /**
   * Sets columns limit to the source settings will be trimmed. All headers which
   * overlap the column limit will be reduced to keep the structure solid.
   *
   * @param {number} columnsCount The number of columns to limit to.
   */
  setColumnsLimit(columnsCount) {
    this.#columnsLimit = columnsCount;
  }

  /**
   * Sets a new nested header configuration.
   *
   * @param {Array[]} [nestedHeadersSettings=[]] The user-defined nested headers settings.
   */
  setData(nestedHeadersSettings = []) {
    this.#data = normalizeSettings(nestedHeadersSettings, this.#columnsLimit);
    this.#dataLength = this.#data.length;
  }

  /**
   * Gets normalized source settings.
   *
   * @returns {Array[]}
   */
  getData() {
    return this.#data;
  }

  /**
   * Merges settings with current source settings.
   *
   * @param {object[]} additionalSettings An array of objects with `row`, `col` and additional
   *                                      properties to merge with current source settings.
   */
  mergeWith(additionalSettings) {
    arrayEach(additionalSettings, ({ row, col, ...rest }) => {
      const headerSettings = this.getHeaderSettings(row, col);

      if (headerSettings !== null) {
        extend(headerSettings, rest, HEADER_CONFIGURABLE_PROPS);
      }
    });
  }

  /**
   * Maps the current state with a callback. For each source settings the callback function
   * is called. If the function returns value that value is merged with the source settings.
   *
   * @param {Function} callback A function that is called for every header settings.
   *                            Each time the callback is called, the returned value extends
   *                            header settings.
   */
  map(callback) {
    arrayEach(this.#data, (header) => {
      arrayEach(header, (headerSettings) => {
        const propsToExtend = callback({ ...headerSettings });

        if (isObject(propsToExtend)) {
          extend(headerSettings, propsToExtend, HEADER_CONFIGURABLE_PROPS);
        }
      });
    });
  }

  /**
   * Gets source column header settings for a specified header. The returned
   * object contains information about the header label, its colspan length,
   * or if it is hidden in the header renderers.
   *
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderSettings(headerLevel, columnIndex) {
    if (headerLevel >= this.#dataLength || headerLevel < 0) {
      return null;
    }

    const headersSettings = this.#data[headerLevel];

    if (columnIndex >= headersSettings.length) {
      return null;
    }

    return headersSettings[columnIndex] ?? null;
  }

  /**
   * Gets source of column headers settings for specified headers. If the retrieved column
   * settings overlap the range "box" determined by "columnIndex" and "columnsLength"
   * the exception will be thrown.
   *
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} columnIndex A visual column index from which the settings will be extracted.
   * @param {number} [columnsLength=1] The number of columns involved in the extraction of settings.
   * @returns {object}
   */
  getHeadersSettings(headerLevel, columnIndex, columnsLength = 1) {
    const headersSettingsChunks = [];

    if (headerLevel >= this.#dataLength || headerLevel < 0) {
      return headersSettingsChunks;
    }

    const headersSettings = this.#data[headerLevel];
    let currentLength = 0;

    for (let i = columnIndex; i < headersSettings.length; i++) {
      const headerSettings = headersSettings[i];

      if (headerSettings.isPlaceholder) {
        throw new Error('The first column settings cannot overlap the other header layers');
      }

      currentLength += headerSettings.colspan;
      headersSettingsChunks.push(headerSettings);

      if (headerSettings.colspan > 1) {
        i += headerSettings.colspan - 1;
      }

      // We met the current sum of the child colspans
      if (currentLength === columnsLength) {
        break;
      }
      // We exceeds the current sum of the child colspans, the last columns colspan overlaps the "columnsLength" length.
      if (currentLength > columnsLength) {
        throw new Error('The last column settings cannot overlap the other header layers');
      }
    }

    return headersSettingsChunks;
  }

  /**
   * Gets a total number of headers levels.
   *
   * @returns {number}
   */
  getLayersCount() {
    return this.#dataLength;
  }

  /**
   * Gets a total number of columns count.
   *
   * @returns {number}
   */
  getColumnsCount() {
    return this.#dataLength > 0 ? this.#data[0].length : 0;
  }

  /**
   * Clears the data.
   */
  clear() {
    this.#data = [];
    this.#dataLength = 0;
  }
}
