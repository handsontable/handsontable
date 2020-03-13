import { extend, isObject } from '../../../helpers/object';
import { arrayEach } from '../../../helpers/array';
import { settingsNormalizer } from './settingsNormalizer';

/**
 * The class manages and normalizes settings passed by the developer
 * into the nested headers plugin. The SourceSettings class is a
 * source of truth for tree builder (HeaderTree) module.
 *
 * @class {SourceSettings}
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

  constructor(nestedHeadersSettings = []) {
    this.setData(nestedHeadersSettings);
  }

  /**
   * Sets a new nested header configuration.
   *
   * @param {Array[]} [nestedHeadersSettings=[]] The user-defined nested headers settings.
   */
  setData(nestedHeadersSettings = []) {
    this.#data = settingsNormalizer(nestedHeadersSettings);
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
   * @param {Object[]} additionalSettings
   */
  mergeWith(additionalSettings) {
    arrayEach(additionalSettings, ({ row, col, ...rest }) => {
      const columnSettings = this.getColumnSettings(row, col);

      if (columnSettings !== null) {
        extend(columnSettings, rest);
      }
    });
  }

  /**
   * @param {Function} callback
   */
  map(callback) {
    arrayEach(this.#data, (header) => {
      arrayEach(header, (columnSettings) => {
        const propsToExtend = callback({ ...columnSettings });

        if (isObject(propsToExtend)) {
          extend(columnSettings, propsToExtend);
        }
      });
    });
  }

  /**
   * Gets source column settings for a specified header. The returned object contains
   * information about the header label, its colspan length, or if it is hidden
   * in the header renderers.
   *
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} visibleColumnIndex A visual column index.
   * @returns {object|null}
   */
  getColumnSettings(headerLevel, visibleColumnIndex) {
    if (headerLevel >= this.#dataLength) {
      return null;
    }

    const columnsSettings = this.#data[headerLevel];

    if (visibleColumnIndex >= columnsSettings.length) {
      return null;
    }

    return columnsSettings[visibleColumnIndex] ?? null;
  }

  /**
   * Gets source columns settings for specified headers. If the retrieved column
   * settings overlap the range "box" determined by "visibleColumnIndex" and "columnsLength"
   * the exception will be thrown.
   *
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} visibleColumnIndex A visual column index from which the settings will be extracted.
   * @param {number} [columnsLength=1] The number of columns involved in the extraction of settings.
   * @returns {object}
   */
  getColumnsSettings(headerLevel, visibleColumnIndex, columnsLength = 1) {
    const columnsSettingsChunks = [];

    if (headerLevel >= this.#dataLength) {
      return columnsSettingsChunks;
    }

    const columnsSettings = this.#data[headerLevel];
    let currentLength = 0;

    for (let i = visibleColumnIndex; i < columnsSettings.length; i++) {
      const columnSettings = columnsSettings[i];

      if (columnSettings.hidden === true) {
        throw new Error('The first column settings cannot overlap the other header layers');
      }

      currentLength += columnSettings.colspan;
      columnsSettingsChunks.push(columnSettings);

      if (columnSettings.colspan > 1) {
        i += columnSettings.colspan - 1;
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

    return columnsSettingsChunks;
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
