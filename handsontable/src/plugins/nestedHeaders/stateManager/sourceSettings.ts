import { extend, isObject } from '../../../helpers/object';
import { throwWithCause } from '../../../helpers/errors';
import { arrayEach } from '../../../helpers/array';
import { normalizeSettings } from './settingsNormalizer';
import { createDefaultHeaderSettings, createPlaceholderHeaderSettings } from './utils';

export interface SourceHeaderCell {
  colspan?: number;
  origColspan?: number;
  isPlaceholder?: boolean;
  splittable?: boolean;
  headerClassNames?: string[];
  crossHiddenColumns?: number[];
  [key: string]: unknown;
}

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
  #data: SourceHeaderCell[][] = [];
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
    // normalizeSettings builds the per-column header cells from untyped user input; assert the
    // normalized shape here, at the single boundary, so the rest of the class stays typed.
    this.#data = normalizeSettings(nestedHeadersSettings, this.#columnsLimit) as SourceHeaderCell[][];
    this.#dataLength = this.#data.length;
  }

  /**
   * Sets already-normalized source settings directly, bypassing normalization.
   *
   * Used to feed a derived (e.g. visual-order) settings matrix that is already in the normalized
   * shape, so it must not be re-normalized. Callers are responsible for passing a well-formed matrix
   * with equal-length layers.
   *
   * @param {Array[]} normalizedSettings The already-normalized nested headers settings.
   */
  setNormalizedData(normalizedSettings: SourceHeaderCell[][]) {
    this.#data = normalizedSettings;
    this.#dataLength = normalizedSettings.length;
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
   * Inserts `amount` columns into the normalized settings starting at `columnIndex`. The index is a
   * position within the authored, source-order settings (which the StateManager keys by physical
   * column), not a visual index.
   *
   * The behavior mirrors the MergeCells plugin: a column inserted strictly inside a header's span
   * extends that header (and every ancestor that also spans the point), while a column inserted at a
   * header's left boundary (or before/after the whole structure) is added as a standalone header.
   * In the normalized representation "strictly inside a span" is exactly "the cell at the insert
   * index is a placeholder".
   *
   * @param {number} columnIndex A source-order column index at which the new columns are inserted.
   * @param {number} amount The number of columns to insert.
   */
  insertColumns(columnIndex: number, amount: number) {
    arrayEach(this.#data, (cells) => {
      if (columnIndex > 0 && columnIndex < cells.length && cells[columnIndex].isPlaceholder) {
        let headerIndex = columnIndex - 1;

        // Walk left to the header that owns the placeholder at the insert index.
        while (headerIndex > 0 && cells[headerIndex].isPlaceholder) {
          headerIndex -= 1;
        }

        cells[headerIndex].colspan = (cells[headerIndex].colspan ?? 1) + amount;
        cells[headerIndex].origColspan = (cells[headerIndex].origColspan ?? 1) + amount;

        const placeholders = [];

        for (let i = 0; i < amount; i++) {
          placeholders.push(createPlaceholderHeaderSettings());
        }

        cells.splice(columnIndex, 0, ...placeholders);

      } else {
        const defaults = [];

        for (let i = 0; i < amount; i++) {
          defaults.push(createDefaultHeaderSettings());
        }

        cells.splice(Math.min(columnIndex, cells.length), 0, ...defaults);
      }
    });
  }

  /**
   * Removes `amount` columns from the normalized settings starting at `columnIndex`. The index is a
   * position within the authored, source-order settings (which the StateManager keys by physical
   * column), not a visual index.
   *
   * Every header that overlaps the removed range is shrunk by the number of removed columns it
   * covered. A header that loses all its columns is dropped; a header whose leftmost (labeled)
   * column is removed but which still has surviving columns is re-anchored to the first surviving
   * column, keeping its label and configurable properties.
   *
   * @param {number} columnIndex A source-order column index from which the columns are removed.
   * @param {number} amount The number of columns to remove.
   */
  removeColumns(columnIndex: number, amount: number) {
    const endIndex = columnIndex + amount;

    this.#data = this.#data.map((cells) => {
      const newCells: SourceHeaderCell[] = [];
      let cellIndex = 0;

      while (cellIndex < cells.length) {
        const cell = cells[cellIndex];
        const span = cell.isPlaceholder ? 1 : (cell.origColspan ?? 1);
        const segmentEnd = cellIndex + span - 1;
        let survivingColumns = 0;

        for (let column = cellIndex; column <= segmentEnd; column++) {
          if (column < columnIndex || column >= endIndex) {
            survivingColumns += 1;
          }
        }

        if (survivingColumns > 0) {
          newCells.push(createDefaultHeaderSettings({
            ...cell,
            colspan: survivingColumns,
            origColspan: survivingColumns,
            isPlaceholder: false,
          }));

          for (let i = 1; i < survivingColumns; i++) {
            newCells.push(createPlaceholderHeaderSettings());
          }
        }

        cellIndex = segmentEnd + 1;
      }

      return newCells;
    });
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
