import { BasePlugin } from '../base';
import { objectEach } from '../../helpers/object';
import Endpoints, { type EndpointConfig } from './endpoints';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isNullishOrNaN } from './utils';
import { throwWithCause } from '../../helpers/errors';

export const PLUGIN_KEY = 'columnSummary';
export const PLUGIN_PRIORITY = 220;

export interface SummaryEndpoint {
  ranges?: number[][];
  sourceColumn?: number;
  destinationRow?: number;
  destinationColumn?: number;
  forceNumeric?: boolean;
  type?: string;
  result?: number | string;
  customFunction?: ((this: ColumnSummary, endpoint: SummaryEndpoint) => number | string) | null;
  [key: string]: unknown;
}

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * @plugin ColumnSummary
 * @class ColumnSummary
 *
 * @description
 * The `ColumnSummary` plugin lets you [easily summarize your columns](@/guides/columns/column-summary/column-summary.md).
 *
 * You can use the [built-in summary functions](@/guides/columns/column-summary/column-summary.md#built-in-summary-functions),
 * or implement a [custom summary function](@/guides/columns/column-summary/column-summary.md#implement-a-custom-summary-function).
 *
 * For each column summary, you can set the following configuration options:
 *
 * | Option | Required | Type | Default | Description |
 * |---|---|---|---|---|
 * | `sourceColumn` | No | Number | Same as `destinationColumn` | [Selects a column to summarize](@/guides/columns/column-summary/column-summary.md#step-2-select-cells-that-you-want-to-summarize) |
 * | `ranges` | No | Array | - | [Selects ranges of rows to summarize](@/guides/columns/column-summary/column-summary.md#step-2-select-cells-that-you-want-to-summarize) |
 * | `type` | Yes | String | - | [Sets a summary function](@/guides/columns/column-summary/column-summary.md#step-3-calculate-your-summary) |
 * | `destinationRow` | Yes | Number | - | [Sets the destination cell's row coordinate](@/guides/columns/column-summary/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
 * | `destinationColumn` | Yes | Number | - | [Sets the destination cell's column coordinate](@/guides/columns/column-summary/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
 * | `forceNumeric` | No | Boolean | `false` | [Forces the summary to treat non-numerics as numerics](@/guides/columns/column-summary/column-summary.md#force-numeric-values) |
 * | `reversedRowCoords` | No | Boolean | `false` | [Reverses the row coordinate, count row coordinates backward](@/guides/columns/column-summary/column-summary.md#step-5-make-room-for-the-destination-cell). Useful when displaying summary results at the bottom of the grid, as it allows you to reference rows relative to the last row (e.g., `destinationRow: 0` refers to the last row when this option is enabled) |
 * | `suppressDataTypeErrors` | No | Boolean | `true` | [Suppresses data type errors](@/guides/columns/column-summary/column-summary.md#throw-data-type-errors) |
 * | `readOnly` | No | Boolean | `true` | Makes summary cell [read-only](@/api/options.md#readonly) |
 * | `roundFloat` | No | Number/<br>Boolean | - | [Rounds summary result](@/guides/columns/column-summary/column-summary.md#round-a-column-summary-result) |
 * | `customFunction` | No | Function | - | [Lets you add a custom summary function](@/guides/columns/column-summary/column-summary.md#implement-a-custom-summary-function) |
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   data: getData(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   columnSummary: [
 *     {
 *       type: 'min',
 *       destinationRow: 4,
 *       destinationColumn: 1,
 *     },
 *     {
 *       type: 'max',
 *       destinationRow: 0,
 *       destinationColumn: 3,
 *       reversedRowCoords: true
 *     },
 *     {
 *       type: 'sum',
 *       destinationRow: 4,
 *       destinationColumn: 5,
 *       forceNumeric: true
 *     }
 *   ]
 * });
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * <HotTable
 *   data={getData()}
 *   colHeaders={true}
 *   rowHeaders={true}
 *   columnSummary={[
 *     {
 *       type: 'min',
 *       destinationRow: 4,
 *       destinationColumn: 1,
 *     },
 *     {
 *       type: 'max',
 *       destinationRow: 0,
 *       destinationColumn: 3,
 *       reversedRowCoords: true
 *     },
 *     {
 *       type: 'sum',
 *       destinationRow: 4,
 *       destinationColumn: 5,
 *       forceNumeric: true
 *     }
 *   ]}
 * />
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * settings = {
 *   data: getData(),
 *   colHeaders: true,
 *   rowHeaders: true,
 *   columnSummary: [
 *     {
 *       type: "min",
 *       destinationRow: 4,
 *       destinationColumn: 1,
 *     },
 *     {
 *       type: "max",
 *       destinationRow: 0,
 *       destinationColumn: 3,
 *       reversedRowCoords: true,
 *     },
 *     {
 *       type: "sum",
 *       destinationRow: 4,
 *       destinationColumn: 5,
 *       forceNumeric: true,
 *     },
 *   ],
 * };
 * ```
 *
 * ```html
 * <hot-table [settings]="settings"></hot-table>
 * ```
 * :::
 */
export class ColumnSummary extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  /**
   * The Endpoints class instance. Used to make all endpoint-related operations.
   *
   * @private
   * @type {null|Endpoints}
   */
  endpoints: Endpoints | null = null;
  declare settings: Record<string, unknown> | null;
  declare currentEndpoint: unknown;

  /**
   * Re-entry guard for the `afterFormulasValuesUpdate` hook so that the summary
   * recalculation triggered by writing the summary result does not start
   * another refresh.
   *
   * @type {boolean}
   */
  #refreshingFromFormulas = false;

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ColumnSummary#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings()[PLUGIN_KEY] as unknown as Record<string, unknown>;
    this.endpoints = new Endpoints(
      this, this.settings as unknown as EndpointConfig[] | ((...args: unknown[]) => EndpointConfig[])
    );

    this.addHook('afterInit', this.#onAfterInit);
    this.addHook('afterChange', this.#onAfterChange);
    this.addHook('afterUpdateSettings', this.#onAfterUpdateSettings);
    this.addHook('afterLoadData', this.#onAfterLoadData);
    this.addHook('afterUpdateData', this.#onAfterUpdateData);

    this.addHook('beforeCreateRow', (index: number, amount: number) => {
      this.endpoints!.resetSetupBeforeStructureAlteration('insert_row', index, amount);
    });
    this.addHook('beforeCreateCol', (index: number, amount: number) => {
      this.endpoints!.resetSetupBeforeStructureAlteration('insert_col', index, amount);
    });
    this.addHook('beforeRemoveRow', (index: number, amount: number) => {
      this.endpoints!.resetSetupBeforeStructureAlteration('remove_row', index, amount);
    });
    this.addHook('beforeRemoveCol', (index: number, amount: number) => {
      this.endpoints!.resetSetupBeforeStructureAlteration('remove_col', index, amount);
    });

    this.addHook('afterCreateRow', (index: number, amount: number, source: string) => {
      this.endpoints!.resetSetupAfterStructureAlteration('insert_row', index, amount, null, source);
    });
    this.addHook('afterCreateCol', (index: number, amount: number, source: string) => {
      this.endpoints!.resetSetupAfterStructureAlteration('insert_col', index, amount, null, source);
    });
    this.addHook('afterRemoveRow',
      (index: number, amount: number, physicalRows: number[], source: string) => this.endpoints!.resetSetupAfterStructureAlteration('remove_row', index, amount, physicalRows, source)); // eslint-disable-line max-len
    this.addHook('afterRemoveCol',
      (index: number, amount: number, physicalColumns: number[], source: string) => this.endpoints!.resetSetupAfterStructureAlteration('remove_col', index, amount, physicalColumns, source)); // eslint-disable-line max-len
    this.addHook('afterRowMove', this.#onAfterRowMove);
    this.addHook('afterFormulasValuesUpdate', this.#onAfterFormulasValuesUpdate);

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    this.endpoints = null;
    this.settings = null;
    this.currentEndpoint = null;

    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`columnSummary`](@/api/options.md#columnsummary)
   */
  updatePlugin(): void {
    this.disablePlugin();
    this.enablePlugin();

    this.endpoints!.initEndpoints();

    super.updatePlugin();
  }

  /**
   * Calculates math for a single endpoint.
   *
   * @private
   * @param {object} endpoint Contains information about the endpoint.
   */
  calculate(endpoint: SummaryEndpoint): void {
    switch (endpoint.type!.toLowerCase()) {
      case 'sum':
        endpoint.result = this.calculateSum(endpoint);
        break;
      case 'min':
        endpoint.result = this.calculateMinMax(endpoint, endpoint.type as 'min' | 'max');
        break;
      case 'max':
        endpoint.result = this.calculateMinMax(endpoint, endpoint.type as 'min' | 'max');
        break;
      case 'count':
        endpoint.result = this.countEntries(endpoint);
        break;
      case 'average':
        endpoint.result = this.calculateAverage(endpoint);
        break;
      case 'custom':
        endpoint.result = endpoint.customFunction!.call(this, endpoint);
        break;
      default:
        break;
    }
  }

  /**
   * Calculates sum of the values contained in ranges provided in the plugin config.
   *
   * @private
   * @param {object} endpoint Contains the endpoint information.
   * @returns {number} Sum for the selected range.
   */
  calculateSum(endpoint: SummaryEndpoint): number {
    let sum = 0;

    for (const range of endpoint.ranges!) {
      sum += this.getPartialSum(range, endpoint.sourceColumn!);
    }

    return sum;
  }

  /**
   * Returns partial sum of values from a single row range.
   *
   * @private
   * @param {Array} rowRange Range for the sum.
   * @param {number} col Column index.
   * @returns {number} The partial sum.
   */
  getPartialSum(rowRange: number[], col: number): number {
    let sum = 0;
    let i = rowRange[1] || rowRange[0];
    let cellValue: number | null = null;
    let biggestDecimalPlacesCount = 0;

    do {
      const rawValue = this.getCellValue(i, col);

      cellValue = isNullishOrNaN(rawValue) ? null : Number(rawValue);

      if (cellValue !== null) {
        const decimalPlaces = (((`${cellValue}`).split('.')[1] || []).length) || 1;

        if (decimalPlaces > biggestDecimalPlacesCount) {
          biggestDecimalPlacesCount = decimalPlaces;
        }
      }

      sum += cellValue ?? 0;
      i -= 1;
    } while (i >= rowRange[0]);

    // Workaround for e.g. 802.2 + 1.1 = 803.3000000000001
    return Math.round(sum * (10 ** biggestDecimalPlacesCount)) / (10 ** biggestDecimalPlacesCount);
  }

  /**
   * Calculates the minimal value for the selected ranges.
   *
   * @private
   * @param {object} endpoint Contains the endpoint information.
   * @param {string} type `'min'` or `'max'`.
   * @returns {number} Min or Max value.
   */
  calculateMinMax(endpoint: SummaryEndpoint, type: 'min' | 'max'): number | string {
    let result: number | null = null;

    for (const range of endpoint.ranges!) {
      const partialResult = this.getPartialMinMax(range, endpoint.sourceColumn!, type);

      if (result === null && partialResult !== null) {
        result = partialResult;
      }

      if (partialResult !== null) {
        switch (type) {
          case 'min':
            result = Math.min(result!, partialResult);
            break;
          case 'max':
            result = Math.max(result!, partialResult);
            break;
          default:
            break;
        }
      }
    }

    return result === null ? 'Not enough data' : result;
  }

  /**
   * Returns a local minimum of the provided sub-range.
   *
   * @private
   * @param {Array} rowRange Range for the calculation.
   * @param {number} col Column index.
   * @param {string} type `'min'` or `'max'`.
   * @returns {number|null} Min or max value.
   */
  getPartialMinMax(rowRange: number[], col: number, type: 'min' | 'max'): number | null {
    let result: number | null = null;
    let i = rowRange[1] || rowRange[0];
    let cellValue: number | null;

    do {
      const rawValue = this.getCellValue(i, col);

      cellValue = isNullishOrNaN(rawValue) ? null : Number(rawValue);

      if (result === null) {
        result = cellValue;
      } else if (cellValue !== null) {
        switch (type) {
          case 'min':
            result = Math.min(result, cellValue);
            break;
          case 'max':
            result = Math.max(result, cellValue);
            break;
          default:
            break;
        }

      }

      i -= 1;
    } while (i >= rowRange[0]);

    return result;
  }

  /**
   * Counts empty cells in the provided row range.
   *
   * @private
   * @param {Array} rowRange Row range for the calculation.
   * @param {number} col Column index.
   * @returns {number} Empty cells count.
   */
  countEmpty(rowRange: number[], col: number): number {
    let cellValue;
    let counter = 0;
    let i = rowRange[1] || rowRange[0];

    do {
      cellValue = this.getCellValue(i, col);
      cellValue = isNullishOrNaN(cellValue) ? null : cellValue;

      if (cellValue === null) {
        counter += 1;
      }

      i -= 1;
    } while (i >= rowRange[0]);

    return counter;
  }

  /**
   * Counts non-empty cells in the provided row range.
   *
   * @private
   * @param {object} endpoint Contains the endpoint information.
   * @returns {number} Entry count.
   */
  countEntries(endpoint: SummaryEndpoint): number {
    let result = 0;
    const ranges = endpoint.ranges!;

    for (const range of ranges) {
      const partial = range[1] === undefined ? 1 : range[1] - range[0] + 1;
      const emptyCount = this.countEmpty(range, endpoint.sourceColumn!);

      result += partial;
      result -= emptyCount;
    }

    return result;
  }

  /**
   * Calculates the average value from the cells in the range.
   *
   * @private
   * @param {object} endpoint Contains the endpoint information.
   * @returns {number} Avarage value.
   */
  calculateAverage(endpoint: SummaryEndpoint): number {
    const sum = this.calculateSum(endpoint);
    const entriesCount = this.countEntries(endpoint);

    return sum / entriesCount;
  }

  /**
   * Returns a cell value, taking into consideration a basic validation.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} col Column index.
   * @returns {string} The cell value.
   */
  getCellValue(row: number, col: number): number | string | null {
    const visualRowIndex = this.hot.toVisualRow(row);

    let cellValue: number | string | null = (visualRowIndex !== null
      ? this.hot.getDataAtCell(visualRowIndex, col)
      : this.hot.getSourceDataAtCell(row, col)) as number | string | null;
    let cellClassName = '';

    if (visualRowIndex !== null) {
      cellClassName = (this.hot.getCellMeta(visualRowIndex, col).className as string) || '';
    }

    if (cellClassName.indexOf('columnSummaryResult') > -1) {
      return null;
    }

    if (this.endpoints!.currentEndpoint!.forceNumeric) {
      if (typeof cellValue === 'string') {
        cellValue = cellValue.replace(/,/, '.');
      }

      cellValue = parseFloat(cellValue as string);
    }

    if (isNaN(Number(cellValue))) {
      if (!this.endpoints!.currentEndpoint!.suppressDataTypeErrors) {
        throwWithCause(toSingleLine`ColumnSummary plugin: cell at (${row}, ${col}) is not in a\x20
          numeric format. Cannot do the calculation.`);
      }
    }

    return cellValue;
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit = () => {
    this.endpoints!.initEndpoints();
  };

  /**
   * Called after the settings were updated. There is a need to refresh cell metas after the settings update with
   * the `columns` property as the Core resets the cell metas to their initial state.
   *
   * @param {object} settings The settings object.
   */
  #onAfterUpdateSettings = (settings: Record<string, unknown>) => {
    if (settings.columns !== undefined) {
      this.endpoints!.refreshCellMetas();
    }
  };

  /**
   * `afterChange` hook callback.
   *
   * @param {Array} changes 2D array containing information about each of the edited cells.
   * @param {string} source The string that identifies source of changes.
   */
  #onAfterChange = (changes: unknown[][], source: string) => {
    if (changes && source !== 'ColumnSummary.reset' && source !== 'ColumnSummary.set' && source !== 'loadData') {
      this.endpoints!.refreshChangedEndpoints(changes);
    }
  };

  /**
   * `afterLoadData` hook callback.
   *
   * @param {Array} data The updated data.
   * @param {boolean} firstRun `true` if called on initial load, `false` otherwise.
   */
  #onAfterLoadData = (data: unknown[], firstRun: boolean) => {
    if (!firstRun) {
      this.endpoints!.refreshAllEndpoints();
    }
  };

  /**
   * `afterUpdateData` hook callback.
   *
   * @param {Array} data The updated data.
   * @param {boolean} firstRun `true` if called on initial load, `false` otherwise.
   */
  #onAfterUpdateData = (data: unknown[], firstRun: boolean) => {
    if (!firstRun) {
      this.endpoints!.refreshAllEndpoints();
    }
  };

  /**
   * `afterFormulasValuesUpdate` hook callback. Refresh only endpoints whose
   * `sourceColumn` (visual) maps to a column the engine recalculated.
   *
   * @param {Array} changes Changes from the formula engine.
   */
  #onAfterFormulasValuesUpdate = (changes: Array<{ address?: { sheet: number; col: number } }>) => {
    if (this.#refreshingFromFormulas || !this.endpoints || !changes?.length) {
      return;
    }

    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin?.enabled) {
      return;
    }

    const sheetId = formulasPlugin.sheetId;
    const changedHfColumns = new Set();

    changes.forEach((change) => {
      if (change?.address?.sheet === sheetId) {
        changedHfColumns.add(change.address.col);
      }
    });

    if (changedHfColumns.size === 0) {
      return;
    }

    const changedVisualColumns = new Set<number>();

    this.endpoints.getAllEndpoints().forEach((endpoint) => {
      const hfSourceColumn = formulasPlugin.columnAxisSyncer!
        .getHfIndexFromVisualIndex(endpoint.sourceColumn ?? 0);

      if (changedHfColumns.has(hfSourceColumn)) {
        changedVisualColumns.add(endpoint.sourceColumn ?? 0);
      }
    });

    if (changedVisualColumns.size === 0) {
      return;
    }

    this.#refreshingFromFormulas = true;

    try {
      this.endpoints.refreshEndpointsBySourceColumns(changedVisualColumns);
    } finally {
      this.#refreshingFromFormulas = false;
    }
  };

  /**
   * `beforeRowMove` hook callback.
   *
   * @param {Array} rows Array of visual row indexes to be moved.
   * @param {number} finalIndex Visual row index, being a start index for the moved rows. Points to where the elements will be placed after the moving action.
   * To check the visualization of the final index, please take a look at [documentation](@/guides/rows/row-moving/row-moving.md).
   */
  #onAfterRowMove = (rows: number[], finalIndex: number) => {
    this.endpoints!.resetSetupBeforeStructureAlteration('move_row', rows[0], rows.length);
    this.endpoints!.resetSetupAfterStructureAlteration('move_row', finalIndex, rows.length, rows, this.pluginName!);
  };
}
