import BasePlugin from './../_base.js';
import {registerPlugin, getPlugin} from './../../plugins.js';

/**
 * @class ColumnSummary
 * @plugin
 *
 *
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

    this.init();
  }

  init() {
    this.settings = this.hot.getSettings().columnSummary;

    this.bindHooks();
  }

  bindHooks() {
    let _this = this;

    this.hot.addHook('afterInit', function() {
      _this.parseSettings(_this.settings);
      _this.refreshAllEndpoints(true);
    });

    this.hot.addHook('afterChange', function(changes, source) {
      if (changes && source !== 'columnSummary' && source !== 'loadData') {
        _this.refreshChangedEndpoints(changes);
      }
    });
  }

  parseSettings() {
    for (var s in this.settings) {
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

  assignSetting(settings, endpoint, name, defaultValue) {
    if (name === 'ranges' && settings[name] === void 0) {
      endpoint[name] = defaultValue;
      return;
    } else if (name === 'ranges' && settings[name].length === 0) {
      return;
    }

    if (settings[name] !== void 0) {
      if (name === 'destinationRow' && endpoint.reversedRowCoords) {
        endpoint[name] = this.hot.countRows() + this.hot.getSettings().minSpareRows - settings[name] - 1;

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
   * Calculate and refresh all defined endpoints
   */
  refreshAllEndpoints(init) {
    for (var i = 0; i < this.endpoints.length; i++) {
      this.currentEndpoint = this.endpoints[i];
      this.calculate(this.endpoints[i]);
      this.setEndpointValue(this.endpoints[i], 'init');
    }
    this.currentEndpoint = null;
  }

  /**
   * Calculate and refresh endpoints only in the changed columns
   * @param changes
   */
  refreshChangedEndpoints(changes) {
    let needToRefresh = [];

    for (var i = 0, changesCount = changes.length; i < changesCount; i++) {

      // if nothing changed, dont update anything
      if((changes[i][2] || '') + '' === changes[i][3] + '') {
        continue;
      }

      for (var j = 0, endpointsCount = this.endpoints.length; j < endpointsCount; j++) {
        if (changes[i][1] === this.endpoints[j].sourceColumn && needToRefresh.indexOf(j) === -1) {
          needToRefresh.push(j);
        }
      }
    }

    for (var i = 0, refreshListCount = needToRefresh.length; i < refreshListCount; i++) {
      this.refreshEndpoint(this.endpoints[needToRefresh[i]]);
    }
  }

  /**
   * Calculate and refresh a single endpoint
   * @param endpoint
   */
  refreshEndpoint(endpoint) {
    this.currentEndpoint = endpoint;
    this.calculate(endpoint);
    this.setEndpointValue(endpoint);
    this.currentEndpoint = null;
  }

  /**
   * Set the endpoint value
   * @param endpoint
   */
  setEndpointValue(endpoint, source) {
    if (source === 'init') {
      this.hot.setCellMeta(endpoint.destinationRow, endpoint.destinationColumn, 'readOnly', endpoint.readOnly);
      this.hot.setCellMeta(endpoint.destinationRow, endpoint.destinationColumn, 'className', 'columnSummaryResult');
    }

    if (endpoint.roundFloat && !isNaN(endpoint.result)) {
      endpoint.result = endpoint.result.toFixed(endpoint.roundFloat);
    }

    this.hot.setDataAtCell(endpoint.destinationRow, endpoint.destinationColumn, endpoint.result, 'columnSummary');
  }

  /**
   * Calculate sum of the values contained in ranges provided in the plugin config
   */
  calculateSum(endpoint) {
    let sum = 0;

    for (var r in endpoint.ranges) {
      if (endpoint.ranges.hasOwnProperty(r)) {
        sum += this.getPartialSum(endpoint.ranges[r], endpoint.sourceColumn);
      }
    }

    return sum;
  }

  /**
   * Get partial sum of values from a single row range
   * @param range
   * @returns {number}
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
   * @param endpoint
   * @returns {*}
   */
  calculateMinMax(endpoint, type) {
    let result = null;

    for (var r in endpoint.ranges) {
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
   * @param rowRange
   * @param col
   * @returns {*}
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
   * @param rowRange
   * @param col
   * @returns {number}
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
   * @param endpoint
   * @returns {number}
   */
  countEntries(endpoint) {
    let result = 0;
    let ranges = endpoint.ranges;

    for (var r in ranges) {
      if (ranges.hasOwnProperty(r)) {
        let partial = ranges[r][1] !== void 0 ? ranges[r][1] - ranges[r][0] + 1 : 1;
        let emptyCount = this.countEmpty(ranges[r], endpoint.sourceColumn);

        result += partial;
        result -= emptyCount;
      }
    }

    return result;
  }


  calculateAverage(endpoint) {
    let sum = this.calculateSum(endpoint);
    let entriesCount = this.countEntries(endpoint);

    return sum / entriesCount;
  }

  /**
   * Gets a cell value, taking into consideration a basic validation
   * @param row
   * @param col
   * @returns {string}
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