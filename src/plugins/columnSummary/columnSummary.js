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


    // Plugin structure
    //
    //var plugin = {
    //  endPoints: [
    //    {
    //      destinationColumn: 0,
    //      destinationRow: 4,
    //      ranges: [
    //        [0,4],[6],[8,9]
    //      ],
    //      type: 'custom',
    //      customFunction: function() {
    //      },
    //      forceNumeric: true,
    //      suppressDataTypeErrors: true,
    //      readOnly: true
    //    }
    //  ]


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
      _this.refreshAllEndpoints();
      console.log(_this.endpoints);
    });

    this.hot.addHook('afterChange', function(changes, source) {
      if (changes && source !== 'columnSummary') {
        _this.refreshChangedEndpoints(changes);
        console.log(_this.endpoints);
      }
    });
  }

  parseSettings() {
    for (var s in this.settings) {
      if (this.settings.hasOwnProperty(s)) {
        let newEndpoint = {};

        //assignSetting(newEndpoint, 'ranges', this.settings[s].ranges, [[0, this.hot.countRows() - 1]]);
        if (this.settings[s].ranges) {
          this.setRanges(newEndpoint, this.settings[s].ranges);
        } else {
          // default the calculation range to all rows
          this.setRanges(newEndpoint, [[0, this.hot.countRows() - 1]]);
        }
        //
        //assignSetting(newEndpoint, 'destination', [this.settings[s].destinationRow, this.settings[s].destinationColumn], function () {
        //  throw new Error('You must provide a destination cell for the Column Summary plugin in order to work properly!');
        //});

        if (this.settings[s].destinationRow && this.settings[s].destinationColumn) {
          this.setDestination(newEndpoint, this.settings[s].destinationRow, this.settings[s].destinationColumn);
        } else {
          throw new Error('You must provide a destination cell for the Column Summary plugin in order to work properly!');
        }

        if (this.settings[s].type) {
          this.setType(newEndpoint, this.settings[s].type);
        } else {
          // default the calculation type to sum
          this.setType(newEndpoint, 'sum');
        }

        if (this.settings[s].forceNumeric !== void 0) {
          this.setNumericForcing(newEndpoint, this.settings[s].forceNumeric);
        } else {
          // default the numeric forcing to false
          this.setNumericForcing(newEndpoint, false);
        }

        if (this.settings[s].suppressDataTypeErrors !== void 0) {
          this.setErrorSuppressing(newEndpoint, this.settings[s].suppressDataTypeErrors);
        } else {
          // default the data type error suppressing to true
          this.setErrorSuppressing(newEndpoint, true);
        }

        if (this.settings[s].suppressDataTypeErrors !== void 0) {
          this.setErrorSuppressing(newEndpoint, this.settings[s].suppressDataTypeErrors);
        } else {
          // default the data type error suppressing to true
          this.setErrorSuppressing(newEndpoint, true);
        }

        if (this.settings[s].customFunction !== void 0) {
          this.setCustomFunction(newEndpoint, this.settings[s].customFunction);
        } else {
          // default the custom function to null
          this.setCustomFunction(newEndpoint, null);
        }

        this.endpoints.push(newEndpoint);
      }
    }
  }

  //assignSetting(endpoint, name, value, defaultValue) {
  //  if (value !== void 0) {
  //    endpoint[name] = value;
  //  } else {
  //    endpoint[name] = defaultValue;
  //  }
  //}


  setCustomFunction(endpoint, customFunction) {
    endpoint.customFunction = customFunction;
  }

  setErrorSuppressing(endpoint, suppress) {
    endpoint.errorSuppressing = suppress;
  }

  setNumericForcing(endpoint, forcing) {
    endpoint.forceNumeric = forcing;
  }

  /**
   * Set the calculation type for the provided endpoint
   * @param endpoint
   * @param type
   */
  setType(endpoint, type) {
    endpoint.type = type;
  }

  /**
   * Set the provided endpoint's calculation destination cell
   * @param endpoint
   * @param destination
   */
  setDestination(endpoint, row, col) {
    endpoint.destination = new WalkontableCellCoords(row, col);
  }

  /**
   * Set the range of calculations for the provided endpoint
   * @param rangeArray
   */
  setRanges(endpoint, rangeArray) {
    if (rangeArray.length === 0) {
      return;
    }

    for (var i = 0; i < rangeArray.length; i++) {
      if (!endpoint.ranges) {
        endpoint.ranges = [];
      }

      endpoint.ranges.push(rangeArray[i]);
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
        endpoint.customFunction.call(this, endpoint);
        break;
    }
  }

  /**
   * Calculate and refresh all defined endpoints
   */
  refreshAllEndpoints() {
    for (var i = 0; i < this.endpoints.length; i++) {
      this.currentEndpoint = this.endpoints[i];
      this.calculate(this.endpoints[i]);
      this.setEndpointValue(this.endpoints[i]);
    }
    this.currentEndpoint = null;
  }

  /**
   * Calculate and refresh endpoints only in the changed columns
   * @param changes
   */
  refreshChangedEndpoints(changes) {
    for (var i = 0, changesCount = changes.length; i < changesCount; i++) {
      for (var j = 0, endpointsCount = this.endpoints.length; j < endpointsCount; j++) {
        if (changes[i][1] === this.endpoints[j].destination.col) {
          this.refreshEndpoint(this.endpoints[j]);
        }
      }
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
  setEndpointValue(endpoint) {
    this.hot.setDataAtCell(endpoint.destination.row, endpoint.destination.col, endpoint.result, 'columnSummary');
  }

  /**
   * Calculate sum of the values contained in ranges provided in the plugin config
   */
  calculateSum(endpoint) {
    let sum = 0;

    for (var r in endpoint.ranges) {
      if (endpoint.ranges.hasOwnProperty(r)) {
        sum += this.getPartialSum(endpoint.ranges[r], endpoint.destination.col);
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
        let partialResult = this.getPartialMinMax(endpoint.ranges[r], endpoint.destination.col, type);

        if (result === null && partialResult !== null) {
          result = partialResult;
        }

        if (partialResult !== null) {
          switch(type) {
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
        switch(type) {
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

      if(!cellValue) {
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
        let emptyCount = this.countEmpty(ranges[r], endpoint.destination.col);

        result += partial;
        result -= emptyCount;
      }
    }

    return result;
  }


  calculateAverage(endpoint) {
    let sum = this.calculateSum(endpoint);
    let entriesCount = this.countEntries(endpoint);

    console.log(sum, entriesCount);

    return sum/entriesCount;
  }

  /**
   * Gets a cell value, taking into consideration a basic validation
   * @param row
   * @param col
   * @returns {string}
   */
  getCellValue(row, col) {
    let cellValue = this.hot.getDataAtCell(row, col);

    if (this.currentEndpoint.forceNumeric) {
      if (typeof cellValue === 'string') {
        cellValue.replace(/,/, '.');
      }

      cellValue = parseFloat(cellValue);
    }

    if (isNaN(cellValue)) {
      if (this.currentEndpoint.errorSuppressing) {
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