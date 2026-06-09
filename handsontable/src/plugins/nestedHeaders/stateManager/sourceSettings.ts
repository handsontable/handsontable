import { extend, isObject } from '../../../helpers/object';
import { throwWithCause } from '../../../helpers/errors';
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
 * @private
 * @class SourceSettings
 */
export default class SourceSettings {
  /**
   * The normalized source data (normalized user-defined settings for nested headers).
   *
   * @private
   * @type {Array[]}
   */
  #data: unknown[][] = [];
  /**
   * The total length of the nested header layers.
   *
   * @private
   * @type {number}
   */
  #dataLength = 0;
  /**
   * Columns count limit value trims source settings to that value.
   *
   * @type {number}
   */
  #columnsLimit = Infinity;

  /**
   * Sets columns limit to the source settings will be trimmed.
   *
   * @param {number} columnsCount The number of columns to limit to.
   */
  setColumnsLimit(columnsCount: number) {
    this.#columnsLimit = columnsCount;
  }

  /**
   * Sets a new nested header configuration.
   *
   * @param {Array[]} [nestedHeadersSettings=[]] The user-defined nested headers settings.
   */
  setData(nestedHeadersSettings: unknown[][] = []) {
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
  mergeWith(additionalSettings: { row: number, col: number, [key: string]: unknown }[]) {
    arrayEach(additionalSettings, ({ row, col, ...rest }) => {
      const headerSettings = this.getHeaderSettings(row, col);

      if (headerSettings !== null) {
        extend(headerSettings as Record<string, unknown>, rest, HEADER_CONFIGURABLE_PROPS);
      }
    });
  }

  /**
   * Maps the current state with a callback.
   *
   * @param {Function} callback A function that is called for every header settings.
   */
  map(callback: (headerSettings: Record<string, unknown>) => unknown) {
    arrayEach(this.#data, (header) => {
      arrayEach(header, (headerSettings) => {
        const propsToExtend: unknown = callback({ ...(headerSettings as Record<string, unknown>) });

        if (isObject(propsToExtend)) {
          extend(
            headerSettings as Record<string, unknown>,
            propsToExtend as Record<string, unknown>,
            HEADER_CONFIGURABLE_PROPS
          );
        }
      });
    });
  }

  /**
   * Gets source column header settings for a specified header.
   *
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} columnIndex A visual column index.
   * @returns {object|null}
   */
  getHeaderSettings(headerLevel: number, columnIndex: number) {
    if (headerLevel >= this.#dataLength || headerLevel < 0) {
      return null;
    }

    const headersSettings = this.#data[headerLevel];

    if (Array.isArray(headersSettings) === false || columnIndex >= headersSettings.length) {
      return null;
    }

    return headersSettings[columnIndex] ?? null;
  }

  /**
   * Gets source of column headers settings for specified headers.
   *
   * @param {number} headerLevel Header level (0 = most distant to the table).
   * @param {number} columnIndex A visual column index from which the settings will be extracted.
   * @param {number} [columnsLength=1] The number of columns involved in the extraction of settings.
   * @returns {object}
   */
  getHeadersSettings(headerLevel: number, columnIndex: number, columnsLength = 1) {
    const headersSettingsChunks: unknown[] = [];

    if (headerLevel >= this.#dataLength || headerLevel < 0) {
      return headersSettingsChunks;
    }

    const headersSettings = this.#data[headerLevel];
    let currentLength = 0;

    for (let i = columnIndex; i < headersSettings.length; i++) {
      const headerSettings = headersSettings[i] as Record<string, unknown>;

      if (headerSettings.isPlaceholder) {
        throwWithCause('The first column settings cannot overlap the other header layers');
      }

      currentLength += headerSettings.colspan as number;
      headersSettingsChunks.push(headerSettings);

      if ((headerSettings.colspan as number) > 1) {
        i += (headerSettings.colspan as number) - 1;
      }

      // We met the current sum of the child colspans
      if (currentLength === columnsLength) {
        break;
      }
      // We exceeds the current sum of the child colspans
      if (currentLength > columnsLength) {
        throwWithCause('The last column settings cannot overlap the other header layers');
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
