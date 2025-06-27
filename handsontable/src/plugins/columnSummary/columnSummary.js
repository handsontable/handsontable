import { BasePlugin } from '../base';

export const PLUGIN_KEY = 'columnSummary';
export const PLUGIN_PRIORITY = 220;

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
 * | `reversedRowCoords` | No | Boolean | `false` | [Reverses row coordinates](@/guides/columns/column-summary/column-summary.md#step-5-make-room-for-the-destination-cell) |
 * | `suppressDataTypeErrors` | No | Boolean | `true` | [Suppresses data type errors](@/guides/columns/column-summary/column-summary.md#throw-data-type-errors) |
 * | `readOnly` | No | Boolean | `true` | Makes summary cell read-only |
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
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link ColumnSummary#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings()[PLUGIN_KEY];

    this.addHook('afterInit', (...args) => this.#onAfterInit(...args));
    this.addHook('afterChange', (...args) => this.#onAfterChange(...args));
    this.addHook('afterRemoveRow', (...args) => this.#onAfterRemoveRow(...args));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.settings = null;

    super.disablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - [`columnSummary`](@/api/options.md#columnsummary)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * Calculates math for a single column summary.
   *
   * @private
   * @param {object} columnSummary Contains information about the column summary.
   * @returns {number} The calculated summary.
   */
  calculate(columnSummary) {
    const { type, values, customFunction } = columnSummary;

    switch (type.toLowerCase()) {
      case 'sum':
        return values.reduce((acc, curr) => acc + curr, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'average':
        return values.reduce((acc, curr) => acc + curr, 0) / values.length;
      case 'custom':
        return customFunction?.(values);
      default:
        break;
    }
  }

  setResult(physicalColumnIndex, physicalRowIndex) {
    if (physicalColumnIndex < 0) {
      return;
    }

    const visualColumnIndex = this.hot.toVisualColumn(physicalColumnIndex);
    let visualRowIndex;

    if (physicalRowIndex !== undefined && physicalRowIndex >= 0) {
      visualRowIndex = this.hot.toVisualRow(physicalRowIndex);
    } else {
      const rowCount = this.hot.countRows();

      for (let row = rowCount - 1; row >= 0; row--) {
        const cellMeta = this.hot.getCellMeta(row, visualColumnIndex);

        if (cellMeta.resValue) {
          visualRowIndex = row;
          break;
        }
      }
    }

    if (visualRowIndex === undefined || visualRowIndex < 0) {
      return;
    }

    const columnValues = this.hot.getDataAtCol(visualColumnIndex);

    const filteredColumnValues = columnValues.filter(
      (_, rowIndex) => rowIndex !== visualRowIndex
    );

    const result = this.calculate({
      type: this.settings.find(setting => setting.destinationColumn === physicalColumnIndex).type,
      values: filteredColumnValues,
      customFunction: this.settings.find(setting => setting.destinationColumn === physicalColumnIndex).customFunction,
    });

    const cellMeta = this.hot.getCellMeta(
      visualRowIndex,
      visualColumnIndex,
    );

    cellMeta.resValue = result;
    cellMeta.readOnly = true;
    cellMeta.className = 'columnSummaryResult';

    this.hot.setDataAtCell(visualRowIndex, visualColumnIndex, result, 'ColumnSummary.result');
  }

  /**
   * `afterInit` hook callback.
   */
  #onAfterInit() {
    this.settings.forEach((setting) => {
      if (setting.destinationColumn >= 0) {
        this.setResult(
          setting.destinationColumn,
          setting.reversedRowCoords
            ? this.hot.countRows() - setting.destinationRow - 1
            : setting.destinationRow);
      }
    });
  }

  /**
   * `afterChange` hook callback.
   *
   * @param {Array} changes 2D array containing information about each of the edited cells.
   * @param {string} source The string that identifies source of changes.
   */
  #onAfterChange(changes, source) {
    if (!changes || source === 'loadData' || source === 'ColumnSummary.result') {
      return;
    }

    changes.forEach(([, prop]) => {
      const visualColIndex = this.hot.propToCol(prop);
      const physicalColIndex = this.hot.toPhysicalColumn(visualColIndex);

      this.setResult(physicalColIndex);
    });
  }

  #onAfterRemoveRow() {
    const columnVisualToPhysical = this.hot.columnIndexMapper.getIndexesSequence();

    columnVisualToPhysical.forEach((columnPhysicalIndex) => {
      this.setResult(columnPhysicalIndex);
    });
  }
}
