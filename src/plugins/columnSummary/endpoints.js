import { arrayEach } from '../../helpers/array';
import { warn } from '../../helpers/console';

/**
 * Class used to make all endpoint-related operations.
 *
 * @class Endpoints
 * @plugin ColumnSummary
 */
class Endpoints {
  constructor(plugin, settings) {
    /**
     * The main plugin instance.
     */
    this.plugin = plugin;
    /**
     * Handsontable instance.
     *
     * @type {object}
     */
    this.hot = this.plugin.hot;
    /**
     * Array of declared plugin endpoints (calculation destination points).
     *
     * @type {Array}
     * @default {Array} Empty array.
     */
    this.endpoints = [];
    /**
     * The plugin settings, taken from Handsontable configuration.
     *
     * @type {object|Function}
     * @default null
     */
    this.settings = settings;
    /**
     * Settings type. Can be either 'array' or 'function.
     *
     * @type {string}
     * @default {'array'}
     */
    this.settingsType = 'array';
    /**
     * The current endpoint (calculation destination point) in question.
     *
     * @type {object}
     * @default null
     */
    this.currentEndpoint = null;
    /**
     * Array containing a list of changes to be applied.
     *
     * @private
     * @type {Array}
     * @default {[]}
     */
    this.cellsToSetCache = [];
  }

  /**
   * Get a single endpoint object.
   *
   * @param {number} index Index of the endpoint.
   * @returns {object}
   */
  getEndpoint(index) {
    if (this.settingsType === 'function') {
      return this.fillMissingEndpointData(this.settings)[index];
    }

    return this.endpoints[index];
  }

  /**
   * Get an array with all the endpoints.
   *
   * @returns {Array}
   */
  getAllEndpoints() {
    if (this.settingsType === 'function') {
      return this.fillMissingEndpointData(this.settings);
    }

    return this.endpoints;
  }

  /**
   * Used to fill the blanks in the endpoint data provided by a settings function.
   *
   * @private
   * @param {Function} func Function provided in the HOT settings.
   * @returns {Array} An array of endpoints.
   */
  fillMissingEndpointData(func) {
    return this.parseSettings(func.call(this));
  }

  /**
   * Parse plugin's settings.
   *
   * @param {Array} settings The settings array.
   * @returns {object[]}
   */
  parseSettings(settings) {
    const endpointsArray = [];
    let settingsArray = settings;

    if (!settingsArray && typeof this.settings === 'function') {
      this.settingsType = 'function';

      return;
    }

    if (!settingsArray) {
      settingsArray = this.settings;
    }

    arrayEach(settingsArray, (val) => {
      const newEndpoint = {};

      this.assignSetting(val, newEndpoint, 'ranges', [[0, this.hot.countRows() - 1]]);
      this.assignSetting(val, newEndpoint, 'reversedRowCoords', false);
      this.assignSetting(val, newEndpoint, 'destinationRow', new Error(`
        You must provide a destination row for the Column Summary plugin in order to work properly!
      `));
      this.assignSetting(val, newEndpoint, 'destinationColumn', new Error(`
        You must provide a destination column for the Column Summary plugin in order to work properly!
      `));
      this.assignSetting(val, newEndpoint, 'sourceColumn', val.destinationColumn);
      this.assignSetting(val, newEndpoint, 'type', 'sum');
      this.assignSetting(val, newEndpoint, 'forceNumeric', false);
      this.assignSetting(val, newEndpoint, 'suppressDataTypeErrors', true);
      this.assignSetting(val, newEndpoint, 'suppressDataTypeErrors', true);
      this.assignSetting(val, newEndpoint, 'customFunction', null);
      this.assignSetting(val, newEndpoint, 'readOnly', true);
      this.assignSetting(val, newEndpoint, 'roundFloat', false);

      endpointsArray.push(newEndpoint);
    });

    return endpointsArray;
  }

  /**
   * Setter for the internal setting objects.
   *
   * @param {object} settings Object with the settings.
   * @param {object} endpoint Contains information about the endpoint for the the calculation.
   * @param {string} name Settings name.
   * @param {object} defaultValue Default value for the settings.
   */
  assignSetting(settings, endpoint, name, defaultValue) {
    if (name === 'ranges' && settings[name] === void 0) {
      endpoint[name] = defaultValue;

      return;
    } else if (name === 'ranges' && settings[name].length === 0) {
      return;
    }

    if (settings[name] === void 0) {
      if (defaultValue instanceof Error) {
        throw defaultValue;

      }

      endpoint[name] = defaultValue;

    } else {
      /* eslint-disable no-lonely-if */
      if (name === 'destinationRow' && endpoint.reversedRowCoords) {
        endpoint[name] = this.hot.countRows() - settings[name] - 1;

      } else {
        endpoint[name] = settings[name];
      }
    }
  }

  /**
   * Resets the endpoint setup before the structure alteration (like inserting or removing rows/columns). Used for settings provided as a function.
   *
   * @private
   * @param {string} action Type of the action performed.
   * @param {number} index Row/column index.
   * @param {number} number Number of rows/columns added/removed.
   */
  resetSetupBeforeStructureAlteration(action, index, number) {
    if (this.settingsType !== 'function') {
      return;
    }

    const type = action.indexOf('row') > -1 ? 'row' : 'col';
    const endpoints = this.getAllEndpoints();

    arrayEach(endpoints, (val) => {
      if (type === 'row' && val.destinationRow >= index) {
        if (action === 'insert_row') {
          val.alterRowOffset = number;
        } else if (action === 'remove_row') {
          val.alterRowOffset = (-1) * number;
        }
      }

      if (type === 'col' && val.destinationColumn >= index) {
        if (action === 'insert_col') {
          val.alterColumnOffset = number;
        } else if (action === 'remove_col') {
          val.alterColumnOffset = (-1) * number;
        }
      }
    });

    this.resetAllEndpoints(endpoints, false);
  }

  /**
   * AfterCreateRow/afterCreateRow/afterRemoveRow/afterRemoveCol hook callback. Reset and reenables the summary functionality
   * after changing the table structure.
   *
   * @private
   * @param {string} action Type of the action performed.
   * @param {number} index Row/column index.
   * @param {number} number Number of rows/columns added/removed.
   * @param {Array} [logicRows] Array of the logical indexes.
   * @param {string} [source] Source of change.
   * @param {boolean} [forceRefresh] `true` of the endpoints should refresh after completing the function.
   */
  resetSetupAfterStructureAlteration(action, index, number, logicRows, source, forceRefresh = true) {
    if (this.settingsType === 'function') {

      // We need to run it on a next avaiable hook, because the TrimRows' `afterCreateRow` hook triggers after this one,
      // and it needs to be run to properly calculate the endpoint value.
      const beforeViewRenderCallback = () => {
        this.hot.removeHook('beforeViewRender', beforeViewRenderCallback);

        return this.refreshAllEndpoints();
      };

      this.hot.addHookOnce('beforeViewRender', beforeViewRenderCallback);

      return;
    }

    const type = action.indexOf('row') > -1 ? 'row' : 'col';
    const multiplier = action.indexOf('remove') > -1 ? -1 : 1;
    const endpoints = this.getAllEndpoints();
    const rowMoving = action.indexOf('move_row') === 0;
    const placeOfAlteration = index;

    arrayEach(endpoints, (val) => {
      if (type === 'row' && val.destinationRow >= placeOfAlteration) {
        val.alterRowOffset = multiplier * number;
      }

      if (type === 'col' && val.destinationColumn >= placeOfAlteration) {
        val.alterColumnOffset = multiplier * number;
      }
    });

    this.resetAllEndpoints(endpoints, !rowMoving);

    if (rowMoving) {
      arrayEach(endpoints, (endpoint) => {
        this.extendEndpointRanges(endpoint, placeOfAlteration, logicRows[0], logicRows.length);
        this.recreatePhysicalRanges(endpoint);
        this.clearOffsetInformation(endpoint);
      });

    } else {
      arrayEach(endpoints, (endpoint) => {
        this.shiftEndpointCoordinates(endpoint, placeOfAlteration);
      });
    }

    if (forceRefresh) {
      this.refreshAllEndpoints();
    }
  }

  /**
   * Clear the offset information from the endpoint object.
   *
   * @private
   * @param {object} endpoint And endpoint object.
   */
  clearOffsetInformation(endpoint) {
    endpoint.alterRowOffset = void 0;
    endpoint.alterColumnOffset = void 0;
  }

  /**
   * Extend the row ranges for the provided endpoint.
   *
   * @private
   * @param {object} endpoint The endpoint object.
   * @param {number} placeOfAlteration Index of the row where the alteration takes place.
   * @param {number} previousPosition Previous endpoint result position.
   * @param {number} offset Offset generated by the alteration.
   */
  extendEndpointRanges(endpoint, placeOfAlteration, previousPosition, offset) {
    arrayEach(endpoint.ranges, (range) => {
      // is a range, not a single row
      if (range[1]) {

        if (placeOfAlteration >= range[0] && placeOfAlteration <= range[1]) {
          if (previousPosition > range[1]) {
            range[1] += offset;
          } else if (previousPosition < range[0]) {
            range[0] -= offset;
          }
        } else if (previousPosition >= range[0] && previousPosition <= range[1]) {
          range[1] -= offset;

          if (placeOfAlteration <= range[0]) {
            range[0] += 1;
            range[1] += 1;
          }
        }
      }
    });
  }

  /**
   * Recreate the physical ranges for the provided endpoint. Used (for example) when a row gets moved and extends an existing range.
   *
   * @private
   * @param {object} endpoint An endpoint object.
   */
  recreatePhysicalRanges(endpoint) {
    const ranges = endpoint.ranges;
    const newRanges = [];
    const allIndexes = [];

    arrayEach(ranges, (range) => {
      const newRange = [];

      if (range[1]) {
        for (let i = range[0]; i <= range[1]; i++) {
          newRange.push(this.hot.toPhysicalRow(i));
        }
      } else {
        newRange.push(this.hot.toPhysicalRow(range[0]));
      }

      allIndexes.push(newRange);
    });

    arrayEach(allIndexes, (range) => {
      let newRange = [];

      arrayEach(range, (coord, index) => {
        if (index === 0) {
          newRange.push(coord);

        } else if (range[index] !== range[index - 1] + 1) {
          newRange.push(range[index - 1]);
          newRanges.push(newRange);
          newRange = [];
          newRange.push(coord);
        }

        if (index === range.length - 1) {
          newRange.push(coord);
          newRanges.push(newRange);
        }
      });
    });

    endpoint.ranges = newRanges;
  }

  /**
   * Shifts the endpoint coordinates by the defined offset.
   *
   * @private
   * @param {object} endpoint Endpoint object.
   * @param {number} offsetStartIndex Index of the performed change (if the change is located after the endpoint, nothing about the endpoint has to be changed.
   */
  shiftEndpointCoordinates(endpoint, offsetStartIndex) {
    if (endpoint.alterRowOffset && endpoint.alterRowOffset !== 0) {
      endpoint.destinationRow += endpoint.alterRowOffset || 0;

      arrayEach(endpoint.ranges, (element) => {
        arrayEach(element, (subElement, j) => {
          if (subElement >= offsetStartIndex) {
            element[j] += endpoint.alterRowOffset || 0;
          }
        });
      });

    } else if (endpoint.alterColumnOffset && endpoint.alterColumnOffset !== 0) {
      endpoint.destinationColumn += endpoint.alterColumnOffset || 0;
      endpoint.sourceColumn += endpoint.alterColumnOffset || 0;
    }
  }

  /**
   * Resets (removes) the endpoints from the table.
   *
   * @param {Array} [endpoints] Array containing the endpoints.
   * @param {boolean} [useOffset=true] Use the cell offset value.
   */
  resetAllEndpoints(endpoints = this.getAllEndpoints(), useOffset = true) {
    const anyEndpointOutOfRange = endpoints.some((endpoint) => {
      const alterRowOffset = endpoint.alterRowOffset || 0;
      const alterColOffset = endpoint.alterColumnOffset || 0;

      if (endpoint.destinationRow + alterRowOffset >= this.hot.countRows() ||
          endpoint.destinationColumn + alterColOffset >= this.hot.countCols()) {
        return true;
      }

      return false;
    });

    if (anyEndpointOutOfRange) {
      return;
    }

    this.cellsToSetCache = [];

    arrayEach(endpoints, (endpoint) => {
      this.resetEndpointValue(endpoint, useOffset);
    });

    this.hot.setDataAtCell(this.cellsToSetCache, 'ColumnSummary.reset');

    this.cellsToSetCache = [];
  }

  /**
   * Calculate and refresh all defined endpoints.
   */
  refreshAllEndpoints() {
    this.cellsToSetCache = [];

    arrayEach(this.getAllEndpoints(), (value) => {
      this.currentEndpoint = value;
      this.plugin.calculate(value);
      this.setEndpointValue(value, 'init');
    });
    this.currentEndpoint = null;

    this.hot.setDataAtCell(this.cellsToSetCache, 'ColumnSummary.reset');

    this.cellsToSetCache = [];
  }

  /**
   * Calculate and refresh endpoints only in the changed columns.
   *
   * @param {Array} changes Array of changes from the `afterChange` hook.
   */
  refreshChangedEndpoints(changes) {
    const needToRefresh = [];

    this.cellsToSetCache = [];

    arrayEach(changes, (value, key, changesObj) => {
      // if nothing changed, dont update anything
      if (`${value[2] || ''}` === `${value[3]}`) {
        return;
      }

      arrayEach(this.getAllEndpoints(), (endpoint, j) => {
        if (this.hot.propToCol(changesObj[key][1]) === endpoint.sourceColumn && needToRefresh.indexOf(j) === -1) {
          needToRefresh.push(j);
        }
      });
    });

    arrayEach(needToRefresh, (value) => {
      this.refreshEndpoint(this.getEndpoint(value));
    });

    this.hot.setDataAtCell(this.cellsToSetCache, 'ColumnSummary.reset');
    this.cellsToSetCache = [];
  }

  /**
   * Calculate and refresh a single endpoint.
   *
   * @param {object} endpoint Contains the endpoint information.
   */
  refreshEndpoint(endpoint) {
    this.currentEndpoint = endpoint;
    this.plugin.calculate(endpoint);
    this.setEndpointValue(endpoint);
    this.currentEndpoint = null;
  }

  /**
   * Reset the endpoint value.
   *
   * @param {object} endpoint Contains the endpoint information.
   * @param {boolean} [useOffset=true] Use the cell offset value.
   */
  resetEndpointValue(endpoint, useOffset = true) {
    const alterRowOffset = endpoint.alterRowOffset || 0;
    const alterColOffset = endpoint.alterColumnOffset || 0;
    const [visualRowIndex, visualColumnIndex] = [
      this.hot.toVisualRow(endpoint.destinationRow),
      this.hot.toVisualColumn(endpoint.destinationColumn)
    ];

    if (visualColumnIndex !== null && visualRowIndex !== null) {
      // Clear the meta on the "old" indexes
      const cellMeta = this.hot.getCellMeta(visualRowIndex, visualColumnIndex);

      cellMeta.readOnly = false;
      cellMeta.className = '';
    }

    this.cellsToSetCache.push([
      this.hot.toVisualRow(endpoint.destinationRow + (useOffset ? alterRowOffset : 0)),
      this.hot.toVisualColumn(endpoint.destinationColumn + (useOffset ? alterColOffset : 0)),
      ''
    ]);
  }

  /**
   * Set the endpoint value.
   *
   * @param {object} endpoint Contains the endpoint information.
   * @param {string} [source] Source of the call information.
   * @param {boolean} [render=false] `true` if it needs to render the table afterwards.
   */
  setEndpointValue(endpoint, source, render = false) {
    // We'll need the reversed offset values, because cellMeta will be shifted AGAIN afterwards.
    const reverseRowOffset = (-1) * endpoint.alterRowOffset || 0;
    const reverseColOffset = (-1) * endpoint.alterColumnOffset || 0;
    const visualEndpointRowIndex = this.hot.toVisualRow(endpoint.destinationRow);

    if (endpoint.destinationRow >= this.hot.countRows() || endpoint.destinationColumn >= this.hot.countCols()) {
      this.throwOutOfBoundsWarning();

      return;
    }

    const destinationVisualRow = this.hot.toVisualRow(endpoint.destinationRow + reverseRowOffset);

    if (destinationVisualRow !== null) {
      const cellMeta = this.hot.getCellMeta(
        destinationVisualRow,
        endpoint.destinationColumn + reverseColOffset
      );

      if (source === 'init' || cellMeta.readOnly !== endpoint.readOnly) {
        cellMeta.readOnly = endpoint.readOnly;
        cellMeta.className = 'columnSummaryResult';
      }
    }

    if (endpoint.roundFloat && !isNaN(endpoint.result)) {
      endpoint.result = endpoint.result.toFixed(endpoint.roundFloat);
    }

    if (render) {
      this.hot.setDataAtCell(visualEndpointRowIndex, endpoint.destinationColumn, endpoint.result, 'ColumnSummary.set');
    } else {
      this.cellsToSetCache.push([visualEndpointRowIndex, endpoint.destinationColumn, endpoint.result]);
    }

    endpoint.alterRowOffset = void 0;
    endpoint.alterColumnOffset = void 0;
  }

  /**
   * Throw an error for the calculation range being out of boundaries.
   *
   * @private
   */
  throwOutOfBoundsWarning() {
    warn('One of the Column Summary plugins\' destination points you provided is beyond the table boundaries!');
  }
}

export default Endpoints;
