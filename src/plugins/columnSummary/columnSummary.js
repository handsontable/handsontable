import BasePlugin from 'handsontable/plugins/_base.js';
import {deepClone, objectEach, hasOwnProperty} from 'handsontable/helpers/object';
import {arrayEach} from 'handsontable/helpers/array';
import {registerPlugin, getPlugin} from 'handsontable/plugins.js';
import Endpoints from './endpoints';

/**
 * @plugin ColumnSummary
 * @pro
 *
 * @description
 * Allows making pre-defined calculations on the cell values and display the results within Handsontable.
 * See the demo for more information.
 */
class ColumnSummary extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * The Endpoints class instance. Used to make all endpoint-related operations.
     *
     * @type {null|Endpoints}
     */
    this.endpoints = null;
  }

  /**
   * Check if plugin is enabled.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().columnSummary;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().columnSummary;
    this.endpoints = new Endpoints(this, this.settings);

    this.addHook('afterInit', (...args) => this.onAfterInit(...args));
    this.addHook('afterChange', (...args) => this.onAfterChange(...args));

    this.addHook('beforeCreateRow', (index, amount, source) => this.endpoints.resetSetupBeforeStructureAlteration('insert_row', index, amount, null, source));
    this.addHook('beforeCreateCol', (index, amount, source) => this.endpoints.resetSetupBeforeStructureAlteration('insert_col', index, amount, null, source));
    this.addHook('beforeRemoveRow', (...args) => this.endpoints.resetSetupBeforeStructureAlteration('remove_row', ...args));
    this.addHook('beforeRemoveCol', (...args) => this.endpoints.resetSetupBeforeStructureAlteration('remove_col', ...args));
    this.addHook('beforeRowMove', (...args) => this.onBeforeRowMove(...args));

    this.addHook('afterCreateRow', (index, amount, source) => this.endpoints.resetSetupAfterStructureAlteration('insert_row', index, amount, null, source));
    this.addHook('afterCreateCol', (index, amount, source) => this.endpoints.resetSetupAfterStructureAlteration('insert_col', index, amount, null, source));
    this.addHook('afterRemoveRow', (...args) => this.endpoints.resetSetupAfterStructureAlteration('remove_row', ...args));
    this.addHook('afterRemoveCol', (...args) => this.endpoints.resetSetupAfterStructureAlteration('remove_col', ...args));
    this.addHook('afterRowMove', (...args) => this.onAfterRowMove(...args));

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    this.endpoints = null;
    this.settings = null;
    this.currentEndpoint = null;
  }

  /**
   * Do the math for a single endpoint.
   *
   * @param {Object} endpoint Contains information about the endpoint.
   */
  calculate(endpoint) {
    switch (endpoint.type.toLowerCase()) {
      case 'sum':
        endpoint.result = this.calculateSum(endpoint);
        break;
      case 'min':
        endpoint.result = this.calculateMinMax(endpoint, endpoint.type);
        break;
      case 'max':
        endpoint.result = this.calculateMinMax(endpoint, endpoint.type);
        break;
      case 'count':
        endpoint.result = this.countEntries(endpoint);
        break;
      case 'average':
        endpoint.result = this.calculateAverage(endpoint);
        break;
      case 'custom':
        endpoint.result = endpoint.customFunction.call(this, endpoint);
        break;
      default:
        break;
    }
  }

  /**
   * Calculate sum of the values contained in ranges provided in the plugin config.
   *
   * @param {Object} endpoint Contains the endpoint information.
   * @returns {Number} Sum for the selected range
   */
  calculateSum(endpoint) {
    let sum = 0;

    for (let r in endpoint.ranges) {
      if (hasOwnProperty(endpoint.ranges, r)) {
        sum += this.getPartialSum(endpoint.ranges[r], endpoint.sourceColumn);
      }
    }

    return sum;
  }

  /**
   * Get partial sum of values from a single row range
   *
   * @param {Array} rowRange Range for the sum.
   * @param {Number} col Column index.
   * @returns {Number} The partial sum.
   */
  getPartialSum(rowRange, col) {
    let sum = 0;
    let i = rowRange[1] || rowRange[0];
    let cellValue = null;
    let biggestDecimalPlacesCount = 0;

    do {
      cellValue = this.getCellValue(i, col) || 0;
      let decimalPlaces = (((cellValue + '').split('.')[1] || []).length) || 1;
      if (decimalPlaces > biggestDecimalPlacesCount) {
        biggestDecimalPlacesCount = decimalPlaces;
      }

      sum += cellValue || 0;
      i--;
    } while (i >= rowRange[0]);

    // Workaround for e.g. 802.2 + 1.1 = 803.3000000000001
    return Math.round(sum * Math.pow(10, biggestDecimalPlacesCount)) / Math.pow(10, biggestDecimalPlacesCount);
  }

  /**
   * Calculate the minimal value for the selected ranges
   *
   * @param {Object} endpoint Contains the endpoint information.
   * @param {String} type `'min'` or `'max'`.
   * @returns {Number} Min or Max value.
   */
  calculateMinMax(endpoint, type) {
    let result = null;

    for (let r in endpoint.ranges) {
      if (hasOwnProperty(endpoint.ranges, r)) {
        let partialResult = this.getPartialMinMax(endpoint.ranges[r], endpoint.sourceColumn, type);

        if (result === null && partialResult !== null) {
          result = partialResult;
        }

        if (partialResult !== null) {
          switch (type) {
            case 'min':
              result = Math.min(result, partialResult);
              break;
            case 'max':
              result = Math.max(result, partialResult);
              break;
            default:
              break;
          }

        }
      }
    }

    return result === null ? 'Not enough data' : result;
  }

  /**
   * Get a local minimum of the provided sub-range
   *
   * @param {Array} rowRange Range for the calculation.
   * @param {Number} col Column index.
   * @param {String} type `'min'` or `'max'`
   * @returns {Number} Min or max value.
   */
  getPartialMinMax(rowRange, col, type) {
    let result = null;
    let i = rowRange[1] || rowRange[0];
    let cellValue;

    do {
      cellValue = this.getCellValue(i, col) || null;

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

      i--;
    } while (i >= rowRange[0]);

    return result;
  }

  /**
   * Count empty cells in the provided row range.
   *
   * @param {Array} rowRange Row range for the calculation.
   * @param {Number} col Column index.
   * @returns {Number} Empty cells count.
   */
  countEmpty(rowRange, col) {
    let cellValue;
    let counter = 0;
    let i = rowRange[1] || rowRange[0];

    do {
      cellValue = this.getCellValue(i, col);

      if (!cellValue) {
        counter++;
      }

      i--;
    } while (i >= rowRange[0]);

    return counter;
  }

  /**
   * Count non-empty cells in the provided row range.
   *
   * @param {Object} endpoint Contains the endpoint information.
   * @returns {Number} Entry count.
   */
  countEntries(endpoint) {
    let result = 0;
    let ranges = endpoint.ranges;

    for (let r in ranges) {
      if (hasOwnProperty(ranges, r)) {
        let partial = ranges[r][1] === void 0 ? 1 : ranges[r][1] - ranges[r][0] + 1;
        let emptyCount = this.countEmpty(ranges[r], endpoint.sourceColumn);

        result += partial;
        result -= emptyCount;
      }
    }

    return result;
  }

  /**
   * Calculate the average value from the cells in the range.
   *
   * @param {Object} endpoint Contains the endpoint information.
   * @returns {Number} Avarage value.
   */
  calculateAverage(endpoint) {
    let sum = this.calculateSum(endpoint);
    let entriesCount = this.countEntries(endpoint);

    return sum / entriesCount;
  }

  /**
   * Gets a cell value, taking into consideration a basic validation.
   *
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @returns {String} The cell value.
   */
  getCellValue(row, col) {
    let visualRowIndex = this.endpoints.getVisualRowIndex(row);
    let visualColumnIndex = this.endpoints.getVisualColumnIndex(col);

    let cellValue = this.hot.getSourceDataAtCell(row, col);
    let cellClassName = this.hot.getCellMeta(visualRowIndex, visualColumnIndex).className || '';

    if (cellClassName.indexOf('columnSummaryResult') > -1) {
      return null;
    }

    if (this.endpoints.currentEndpoint.forceNumeric) {
      if (typeof cellValue === 'string') {
        cellValue = cellValue.replace(/,/, '.');
      }

      cellValue = parseFloat(cellValue);
    }

    if (isNaN(cellValue)) {
      if (!this.endpoints.currentEndpoint.suppressDataTypeErrors) {
        throw new Error(`ColumnSummary plugin: cell at (${row}, ${col}) is not in a numeric format. Cannot do the calculation.`);
      }
    }

    return cellValue;
  }

  /**
   * `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit() {
    this.endpoints.endpoints = this.endpoints.parseSettings();
    this.endpoints.refreshAllEndpoints(true);
  }

  /**
   * `afterChange` hook callback.
   *
   * @private
   * @param {Array} changes
   * @param {String} source
   */
  onAfterChange(changes, source) {
    if (changes && source !== 'ColumnSummary.reset' && source !== 'ColumnSummary.set' && source !== 'loadData') {
      this.endpoints.refreshChangedEndpoints(changes);
    }
  }

  /**
   * `beforeRowMove` hook callback.
   *
   * @param {Array} rows Array of logical rows to be moved.
   * @param {Number} target Index of the destination row.
   */
  onBeforeRowMove(rows, target) {
    this.endpoints.resetSetupBeforeStructureAlteration('move_row', rows[0], rows.length, rows, this.pluginName);
  }

  /**
   * `afterRowMove` hook callback.
   *
   * @param {Array} rows Array of logical rows that were moved.
   * @param {Number} target Index of the destination row.
   */
  onAfterRowMove(rows, target) {
    this.endpoints.resetSetupAfterStructureAlteration('move_row', target, rows.length, rows, this.pluginName);
  }
}

registerPlugin('columnSummary', ColumnSummary);

export default ColumnSummary;
