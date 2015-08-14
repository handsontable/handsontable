import BasePlugin from './../_base.js';
import {deepClone} from './../../helpers/object';
import {registerPlugin, getPlugin} from './../../plugins.js';

/**
 * @class ColumnSummary
 * @plugin ColumnSummary
 */
class ColumnSummary extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    if (!this.hot.getSettings().columnSummary) {
      return;
    }

    this.endpoints = [];
    this.settings = null;
    this.currentEndpoint = null;

    this.initPlugin();
  }

  initPlugin() {
    this.settings = this.hot.getSettings().columnSummary;

    this.bindHooks();
  }

  /**
   * Bind HOT hooks for the plugin
   */
  bindHooks() {
    this.hot.addHook('afterInit', () => this.onAfterInit());
    this.hot.addHook('afterChange', (changes, source) => this.onAfterChange(changes, source));
    this.hot.addHook('afterCreateRow', (index, num, auto) => this.resetSetupAfterStructureAlteration('insert_row', index, num, auto));
    this.hot.addHook('afterCreateCol', (index, num, auto) => this.resetSetupAfterStructureAlteration('insert_col', index, num, auto));
    this.hot.addHook('afterRemoveRow', (index, num, auto) => this.resetSetupAfterStructureAlteration('remove_row', index, num, auto));
    this.hot.addHook('afterRemoveCol', (index, num, auto) => this.resetSetupAfterStructureAlteration('remove_col', index, num, auto));
  }

  /**
   * afterCreateRow/afterCreateRow/afterRemoveRow/afterRemoveCol hook callback. Reset and reenables the summary functionality
   * after changing the table structure.
   *
   * @param action {String}
   * @param index {Number}
   * @param number {Number}
   * @param createdAutomatically {Boolean}
   */
  resetSetupAfterStructureAlteration(action, index, number, createdAutomatically) {
    if(createdAutomatically) {
      return;
    }

    let type = action.indexOf('row') > -1 ? 'row' : 'col';

    var oldEndpoints = deepClone(this.endpoints);
    for (let i in oldEndpoints) {
      if (oldEndpoints.hasOwnProperty(i)) {

        if (type === 'row' && oldEndpoints[i].destinationRow >= index) {
          if (action === 'insert_row') {
            oldEndpoints[i].alterRowOffset = number;
          } else if (action === 'remove_row') {
            oldEndpoints[i].alterRowOffset = (-1) * number;
          }
        }

        if (type === 'col' && oldEndpoints[i].destinationColumn >= index) {
          if (action === 'insert_col') {
            oldEndpoints[i].alterColumnOffset = number;
          } else if (action === 'remove_col') {
            oldEndpoints[i].alterColumnOffset = (-1) * number;
          }
        }
      }
    }

    this.endpoints = [];
    this.resetAllEndpoints(oldEndpoints);
    this.parseSettings();

    for (let i in this.endpoints) {
      if (this.endpoints.hasOwnProperty(i)) {

        if (type === 'row' && this.endpoints[i].destinationRow >= index) {
          if (action === 'insert_row') {
            this.endpoints[i].alterRowOffset = number;
          } else if (action === 'remove_row') {
            this.endpoints[i].alterRowOffset = (-1) * number;
          }
        }

        if (type === 'col' && this.endpoints[i].destinationColumn >= index) {
          if (action === 'insert_col') {
            this.endpoints[i].alterColumnOffset = number;
          } else if (action === 'remove_col') {
            this.endpoints[i].alterColumnOffset = (-1) * number;
          }
        }
      }
    }

    this.refreshAllEndpoints(true);
  }

  /**
   * afterInit hook callback
   *
   * @private
   */
  onAfterInit() {
    this.parseSettings(this.settings);
    this.refreshAllEndpoints(true);
  }

  /**
   * afterChange hook callback
   *
   * @private
   * @param {Array} changes
   * @param {String} source
   */
  onAfterChange(changes, source) {
    if (changes && source !== 'columnSummary' && source !== 'loadData') {
      this.refreshChangedEndpoints(changes);
    }
  }

  /**
   * Parse plugin's settings
   */
  parseSettings() {
    for (let s in this.settings) {
      if (this.settings.hasOwnProperty(s)) {
        let newEndpoint = {};

        this.assignSetting(this.settings[s], newEndpoint, 'ranges', [[0, this.hot.countRows() - 1]]);
        this.assignSetting(this.settings[s], newEndpoint, 'reversedRowCoords', false);
        this.assignSetting(this.settings[s], newEndpoint, 'destinationRow', new Error('You must provide a destination row for the Column Summary plugin in order to work properly!'));
        this.assignSetting(this.settings[s], newEndpoint, 'destinationColumn', new Error('You must provide a destination column for the Column Summary plugin in order to work properly!'));
        this.assignSetting(this.settings[s], newEndpoint, 'sourceColumn', this.settings[s].destinationColumn);
        this.assignSetting(this.settings[s], newEndpoint, 'type', 'sum');
        this.assignSetting(this.settings[s], newEndpoint, 'forceNumeric', false);
        this.assignSetting(this.settings[s], newEndpoint, 'suppressDataTypeErrors', true);
        this.assignSetting(this.settings[s], newEndpoint, 'suppressDataTypeErrors', true);
        this.assignSetting(this.settings[s], newEndpoint, 'customFunction', null);
        this.assignSetting(this.settings[s], newEndpoint, 'readOnly', true);
        this.assignSetting(this.settings[s], newEndpoint, 'roundFloat', false);

        this.endpoints.push(newEndpoint);
      }
    }
  }

  /**
   * Setter for the internal setting objects
   *
   * @param {Object} settings
   * @param {Object} endpoint
   * @param {String} name
   * @param defaultValue
   */
  assignSetting(settings, endpoint, name, defaultValue) {
    if (name === 'ranges' && settings[name] === void 0) {
      endpoint[name] = defaultValue;
      return;
    } else if (name === 'ranges' && settings[name].length === 0) {
      return;
    }

    if (settings[name] !== void 0) {
      if (name === 'destinationRow' && endpoint.reversedRowCoords) {
        endpoint[name] = this.hot.countRows() - settings[name] - 1;

      } else {
        endpoint[name] = settings[name];

      }
    } else {
      if (defaultValue instanceof Error) {
        throw defaultValue;

      }

      endpoint[name] = defaultValue;
    }
  }

  /**
   * Do the math for a single endpoint
   *
   * @param endpoint
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
    }
  }

  /**
   * Reset (removes) the endpoints from the table.
   *
   * @param endpoints {Array}
   */
  resetAllEndpoints(endpoints) {
    if (!endpoints) {
      endpoints = this.endpoints;
    }

    for (let i = 0; i < endpoints.length; i++) {
      this.resetEndpointValue(endpoints[i]);
    }
  }

  /**
   * Calculate and refresh all defined endpoints
   *
   * @param {Boolean} init True if initial call
   */
  refreshAllEndpoints(init) {
    for (let i = 0; i < this.endpoints.length; i++) {
      this.currentEndpoint = this.endpoints[i];
      this.calculate(this.endpoints[i]);
      this.setEndpointValue(this.endpoints[i], 'init');
    }
    this.currentEndpoint = null;
  }

  /**
   * Calculate and refresh endpoints only in the changed columns
   *
   * @param {Array} changes
   */
  refreshChangedEndpoints(changes) {
    let needToRefresh = [];

    for (let i = 0, changesCount = changes.length; i < changesCount; i++) {

      // if nothing changed, dont update anything
      if ((changes[i][2] || '') + '' === changes[i][3] + '') {
        continue;
      }

      for (let j = 0, endpointsCount = this.endpoints.length; j < endpointsCount; j++) {
        if (changes[i][1] === this.endpoints[j].sourceColumn && needToRefresh.indexOf(j) === -1) {
          needToRefresh.push(j);
        }
      }
    }

    for (let i = 0, refreshListCount = needToRefresh.length; i < refreshListCount; i++) {
      this.refreshEndpoint(this.endpoints[needToRefresh[i]]);
    }
  }

  /**
   * Calculate and refresh a single endpoint
   *
   * @param {Object} endpoint
   */
  refreshEndpoint(endpoint) {
    this.currentEndpoint = endpoint;
    this.calculate(endpoint);
    this.setEndpointValue(endpoint);
    this.currentEndpoint = null;
  }

  /**
   * Reset the endpoint value.
   *
   * @param endpoint {Object}
   */
  resetEndpointValue(endpoint) {
    let alterRowOffset = endpoint.alterRowOffset || 0;
    let alterColOffset = endpoint.alterColumnOffset || 0;

    this.hot.setCellMeta(endpoint.destinationRow, endpoint.destinationColumn, 'readOnly', false);
    this.hot.setCellMeta(endpoint.destinationRow, endpoint.destinationColumn, 'className', '');
    this.hot.setDataAtCell(endpoint.destinationRow + alterRowOffset, endpoint.destinationColumn + alterColOffset, '', 'columnSummary');
  }

  /**
   * Set the endpoint value
   *
   * @param {Object} endpoint
   */
  setEndpointValue(endpoint, source) {
    let alterRowOffset = endpoint.alterRowOffset || 0;
    let alterColumnOffset = endpoint.alterColumnOffset || 0;

    let rowOffset = Math.max(-alterRowOffset, 0);
    let colOffset = Math.max(-alterColumnOffset, 0);

    if (source === 'init') {
      this.hot.setCellMeta(endpoint.destinationRow + rowOffset, endpoint.destinationColumn + colOffset, 'readOnly', endpoint.readOnly);
      this.hot.setCellMeta(endpoint.destinationRow + rowOffset, endpoint.destinationColumn + colOffset, 'className', 'columnSummaryResult');
    }

    if (endpoint.roundFloat && !isNaN(endpoint.result)) {
      endpoint.result = endpoint.result.toFixed(endpoint.roundFloat);
    }

    this.hot.setDataAtCell(endpoint.destinationRow, endpoint.destinationColumn, endpoint.result, 'columnSummary');

    endpoint.alterRowOffset = void 0;
    endpoint.alterColOffset = void 0;
  }

  /**
   * Calculate sum of the values contained in ranges provided in the plugin config
   *
   * @param {Object} endpoint
   * @returns {Number} Sum for the selected range
   */
  calculateSum(endpoint) {
    let sum = 0;

    for (let r in endpoint.ranges) {
      if (endpoint.ranges.hasOwnProperty(r)) {
        sum += this.getPartialSum(endpoint.ranges[r], endpoint.sourceColumn);
      }
    }

    return sum;
  }

  /**
   * Get partial sum of values from a single row range
   *
   * @param {Array} range
   * @returns {Number}
   */
  getPartialSum(rowRange, col) {
    let sum = 0;
    let i = rowRange[1] || rowRange[0];

    do {
      sum += this.getCellValue(i, col) || 0;
      i--;
    } while (i >= rowRange[0]);

    return sum;
  }

  /**
   * Calculate the minimal value for the selected ranges
   *
   * @param {Object} endpoint
   * @returns {Number}
   */
  calculateMinMax(endpoint, type) {
    let result = null;

    for (let r in endpoint.ranges) {
      if (endpoint.ranges.hasOwnProperty(r)) {
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
          }

        }
      }
    }


    return result === null ? 'Not enough data' : result;
  }

  /**
   * Get a local minimum of the provided sub-range
   *
   * @param {Array} rowRange
   * @param {Number} col
   * @param {String} type `min` or `max`
   * @returns {Number}
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
        }

      }

      i--;
    } while (i >= rowRange[0]);

    return result;
  }

  /**
   * Count empty cells in the provided row range
   * @param {Array} rowRange
   * @param {Number} col
   * @returns {Number}
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
   * Count non-empty cells in the provided row range
   *
   * @param {Object} endpoint
   * @returns {Number}
   */
  countEntries(endpoint) {
    let result = 0;
    let ranges = endpoint.ranges;

    for (let r in ranges) {
      if (ranges.hasOwnProperty(r)) {
        let partial = ranges[r][1] !== void 0 ? ranges[r][1] - ranges[r][0] + 1 : 1;
        let emptyCount = this.countEmpty(ranges[r], endpoint.sourceColumn);

        result += partial;
        result -= emptyCount;
      }
    }

    return result;
  }


  /**
   * Calculate the average value from the cells in the range
   *
   * @param {Object} endpoint
   * @returns {Number}
   */
  calculateAverage(endpoint) {
    let sum = this.calculateSum(endpoint);
    let entriesCount = this.countEntries(endpoint);

    return sum / entriesCount;
  }

  /**
   * Gets a cell value, taking into consideration a basic validation
   *
   * @param {Number} row
   * @param {Number} col
   * @returns {String}
   */
  getCellValue(row, col) {
    let cellValue = this.hot.getDataAtCell(row, col);
    let cellClassName = this.hot.getCellMeta(row, col).className || '';

    if (cellClassName.indexOf('columnSummaryResult') > -1) {
      return null;
    }

    if (this.currentEndpoint.forceNumeric) {
      if (typeof cellValue === 'string') {
        cellValue.replace(/,/, '.');
      }

      cellValue = parseFloat(cellValue);
    }

    if (isNaN(cellValue)) {
      if (this.currentEndpoint.suppressDataTypeErrors) {
        return false;
      } else {
        throw new Error("ColumnSummary plugin: cell at (" + row + "," + col + ") is not in a numeric format. Cannot do the calculation.");
      }
    }

    return cellValue;
  }

}

export {ColumnSummary};

registerPlugin('columnSummary', ColumnSummary);

Handsontable.plugins.ColumnSummary = ColumnSummary;