'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _element = require('../../helpers/dom/element');

var _mixed = require('../../helpers/mixed');

var _object = require('../../helpers/object');

var _array = require('../../helpers/array');

var _number = require('../../helpers/number');

var _base = require('../_base');

var _base2 = _interopRequireDefault(_base);

var _plugins = require('./../../plugins');

var _mergeSort = require('../../utils/sortingAlgorithms/mergeSort');

var _mergeSort2 = _interopRequireDefault(_mergeSort);

var _pluginHooks = require('../../pluginHooks');

var _pluginHooks2 = _interopRequireDefault(_pluginHooks);

var _keyStateObserver = require('../../utils/keyStateObserver');

var _comparatorEngine = require('./comparatorEngine');

var _columnStatesManager = require('./columnStatesManager');

var _utils = require('./utils');

var _domHelper = require('./domHelper');

var _rowsMapper = require('./rowsMapper');

var _rowsMapper2 = _interopRequireDefault(_rowsMapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

_pluginHooks2.default.getSingleton().register('beforeColumnSort');
_pluginHooks2.default.getSingleton().register('afterColumnSort');

var APPEND_COLUMN_CONFIG_STRATEGY = 'append';
var REPLACE_COLUMN_CONFIG_STRATEGY = 'replace';

// DIFF - MultiColumnSorting & ColumnSorting: changed configuration documentation.

/**
 * @plugin ColumnSorting
 *
 * @description
 * This plugin sorts the view by columns (but does not sort the data source!). To enable the plugin, set the
 * {@link Options#columnSorting} property to the correct value (see the examples below).
 *
 * @example
 * ```js
 * // as boolean
 * columnSorting: true
 *
 * // as an object with initial sort config (sort ascending for column at index 1)
 * columnSorting: {
 *   initialConfig: {
 *     column: 1,
 *     sortOrder: 'asc'
 *   }
 * }
 *
 * // as an object which define specific sorting options for all columns
 * columnSorting: {
 *   sortEmptyCells: true, // true = the table sorts empty cells, false = the table moves all empty cells to the end of the table (by default)
 *   indicator: true, // true = shows indicator for all columns (by default), false = don't show indicator for columns
 *   headerAction: true, // true = allow to click on the headers to sort (by default), false = turn off possibility to click on the headers to sort
 *   compareFunctionFactory: function(sortOrder, columnMeta) {
 *     return function(value, nextValue) {
 *       // Some value comparisons which will return -1, 0 or 1...
 *     }
 *   }
 * }
 *
 * // as an object passed to the `column` property, allows specifying a custom options for the desired column.
 * // please take a look at documentation of `column` property: https://docs.handsontable.com/pro/Options.html#columns
 * columns: [{
 *   columnSorting: {
 *     indicator: false, // disable indicator for the first column,
 *     sortEmptyCells: true,
 *     headerAction: false, // clicks on the first column won't sort
 *     compareFunctionFactory: function(sortOrder, columnMeta) {
 *       return function(value, nextValue) {
 *         return 0; // Custom compare function for the first column (don't sort)
 *       }
 *     }
 *   }
 * }]```
 *
 * @dependencies ObserveChanges moment
 */

var ColumnSorting = function (_BasePlugin) {
  _inherits(ColumnSorting, _BasePlugin);

  function ColumnSorting(hotInstance) {
    _classCallCheck(this, ColumnSorting);

    /**
     * Instance of column state manager.
     *
     * @private
     * @type {ColumnStatesManager}
     */
    var _this2 = _possibleConstructorReturn(this, (ColumnSorting.__proto__ || Object.getPrototypeOf(ColumnSorting)).call(this, hotInstance));

    _this2.columnStatesManager = new _columnStatesManager.ColumnStatesManager();
    /**
     * Instance of DOM helper.
     *
     * @private
     * @type {DomHelper}
     */
    _this2.domHelper = new _domHelper.DomHelper(_this2.columnStatesManager);
    /**
     * Object containing visual row indexes mapped to data source indexes.
     *
     * @private
     * @type {RowsMapper}
     */
    _this2.rowsMapper = new _rowsMapper2.default(_this2);
    /**
     * It blocks the plugin translation, this flag is checked inside `onModifyRow` callback.
     *
     * @private
     * @type {Boolean}
     */
    _this2.blockPluginTranslation = true;
    /**
     * Cached column properties from plugin like i.e. `indicator`, `headerAction`.
     *
     * @private
     * @type {Map<number, Object>}
     */
    _this2.columnMetaCache = new Map();
    return _this2;
  }

  /**
   * Checks if the plugin is enabled in the Handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link ColumnSorting#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(ColumnSorting, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return !!this.hot.getSettings().columnSorting;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this3 = this;

      if (this.enabled) {
        return;
      }

      (0, _utils.warnIfPluginsHaveConflict)(this.hot.getSettings().columnSorting);

      if ((0, _mixed.isUndefined)(this.hot.getSettings().observeChanges)) {
        this.enableObserveChangesPlugin();
      }

      this.addHook('afterTrimRow', function () {
        return _this3.sortByPresetSortStates();
      });
      this.addHook('afterUntrimRow', function () {
        return _this3.sortByPresetSortStates();
      });
      this.addHook('modifyRow', function (row, source) {
        return _this3.onModifyRow(row, source);
      });
      this.addHook('unmodifyRow', function (row, source) {
        return _this3.onUnmodifyRow(row, source);
      });
      this.addHook('afterGetColHeader', function (column, TH) {
        return _this3.onAfterGetColHeader(column, TH);
      });
      this.addHook('beforeOnCellMouseDown', function (event, coords, TD, controller) {
        return _this3.onBeforeOnCellMouseDown(event, coords, TD, controller);
      });
      this.addHook('afterOnCellMouseDown', function (event, target) {
        return _this3.onAfterOnCellMouseDown(event, target);
      });
      this.addHook('afterCreateRow', function (index, amount) {
        return _this3.onAfterCreateRow(index, amount);
      });
      this.addHook('afterRemoveRow', function (index, amount) {
        return _this3.onAfterRemoveRow(index, amount);
      });
      this.addHook('afterInit', function () {
        return _this3.loadOrSortBySettings();
      });
      this.addHook('afterLoadData', function (initialLoad) {
        return _this3.onAfterLoadData(initialLoad);
      });
      this.addHook('afterCreateCol', function () {
        return _this3.onAfterCreateCol();
      });
      this.addHook('afterRemoveCol', function () {
        return _this3.onAfterRemoveCol();
      });

      // TODO: Workaround? It should be refactored / described.
      if (this.hot.view) {
        this.loadOrSortBySettings();
      }

      _get(ColumnSorting.prototype.__proto__ || Object.getPrototypeOf(ColumnSorting.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      var _this4 = this;

      var clearColHeader = function clearColHeader(column, TH) {
        var headerSpanElement = (0, _utils.getHeaderSpanElement)(TH);

        if ((0, _utils.isFirstLevelColumnHeader)(column, TH) === false || headerSpanElement === null) {
          return;
        }

        (0, _element.removeClass)(headerSpanElement, _this4.domHelper.getRemovedClasses(headerSpanElement));
      };

      // Changing header width and removing indicator.
      this.hot.addHook('afterGetColHeader', clearColHeader);
      this.hot.addHookOnce('afterRender', function () {
        _this4.hot.removeHook('afterGetColHeader', clearColHeader);
      });

      this.rowsMapper.clearMap();

      _get(ColumnSorting.prototype.__proto__ || Object.getPrototypeOf(ColumnSorting.prototype), 'disablePlugin', this).call(this);
    }

    // DIFF - MultiColumnSorting & ColumnSorting: changed function documentation.

    /**
     * Sorts the table by chosen columns and orders.
     *
     * @param {undefined|Object} sortConfig Single column sort configuration. The configuration object contains `column` and `sortOrder` properties.
     * First of them contains visual column index, the second one contains sort order (`asc` for ascending, `desc` for descending).
     *
     * **Note**: Please keep in mind that every call of `sort` function set an entirely new sort order. Previous sort configs aren't preserved.
     *
     * @example
     * ```js
     * // sort ascending first visual column
     * hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
     * ```
     *
     * @fires Hooks#beforeColumnSort
     * @fires Hooks#afterColumnSort
     */

  }, {
    key: 'sort',
    value: function sort(sortConfig) {
      var _this5 = this;

      var currentSortConfig = this.getSortConfig();

      // We always pass to hook configs defined as an array to `beforeColumnSort` and `afterColumnSort` hooks.
      // DIFF - MultiColumnSorting & ColumnSorting: extra `slice` method call.
      var destinationSortConfigs = (0, _utils.getFullSortConfiguration)(sortConfig).slice(0, 1);

      var sortPossible = this.areValidSortConfigs(destinationSortConfigs);
      var allowSort = this.hot.runHooks('beforeColumnSort', currentSortConfig, destinationSortConfigs, sortPossible);

      if (sortPossible === false) {
        (0, _utils.warnAboutNotValidatedConfig)();
      }

      if (allowSort === false) {
        return;
      }

      if (sortPossible) {
        var translateColumnToPhysical = function translateColumnToPhysical(_ref) {
          var visualColumn = _ref.column,
              restOfProperties = _objectWithoutProperties(_ref, ['column']);

          return Object.assign({ column: _this5.hot.toPhysicalColumn(visualColumn) }, restOfProperties);
        };
        var internalSortStates = (0, _array.arrayMap)(destinationSortConfigs, function (columnSortConfig) {
          return translateColumnToPhysical(columnSortConfig);
        });

        this.columnStatesManager.setSortStates(internalSortStates);
        this.sortByPresetSortStates();
        this.saveAllSortSettings();

        this.hot.render();
        this.hot.view.wt.draw(true); // TODO: Workaround? One test won't pass after removal. It should be refactored / described.
      }

      this.hot.runHooks('afterColumnSort', currentSortConfig, this.getSortConfig(), sortPossible);
    }

    /**
     * Clear the sort performed on the table.
     */

  }, {
    key: 'clearSort',
    value: function clearSort() {
      this.sort([]);
    }

    /**
     * Checks if the table is sorted (any column have to be sorted).
     *
     * @returns {Boolean}
     */

  }, {
    key: 'isSorted',
    value: function isSorted() {
      return this.enabled && !this.columnStatesManager.isListOfSortedColumnsEmpty();
    }

    /**
     * Get sort configuration for particular column or for all sorted columns. Objects contain `column` and `sortOrder` properties.
     *
     * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key. They are handled by the `sort` function.
     *
     * @param {Number} [column] Visual column index.
     * @returns {undefined|Object|Array}
     */

  }, {
    key: 'getSortConfig',
    value: function getSortConfig(column) {
      var _this6 = this;

      var translateColumnToVisual = function translateColumnToVisual(_ref2) {
        var physicalColumn = _ref2.column,
            restOfProperties = _objectWithoutProperties(_ref2, ['column']);

        return Object.assign({ column: _this6.hot.toVisualColumn(physicalColumn) }, restOfProperties);
      };

      if ((0, _mixed.isDefined)(column)) {
        var physicalColumn = this.hot.toPhysicalColumn(column);
        var columnSortState = this.columnStatesManager.getColumnSortState(physicalColumn);

        if ((0, _mixed.isDefined)(columnSortState)) {
          return translateColumnToVisual(columnSortState);
        }

        return;
      }

      var sortStates = this.columnStatesManager.getSortStates();

      return (0, _array.arrayMap)(sortStates, function (columnState) {
        return translateColumnToVisual(columnState);
      });
    }

    /**
     * @description
     * Warn: Useful mainly for providing server side sort implementation (see in the example below). It doesn't sort the data set. It just sets sort configuration for all sorted columns.
     *
     * @example
     * ```js
     * beforeColumnSort: function(currentSortConfig, destinationSortConfigs) {
     *   const columnSortPlugin = this.getPlugin('columnSorting');
     *
     *   columnSortPlugin.setSortConfig(destinationSortConfigs);
     *
     *   // const newData = ... // Calculated data set, ie. from an AJAX call.
     *
     *   // this.loadData(newData); // Load new data set.
     *
     *   return false; // The blockade for the default sort action.
     * }```
     *
     * @param {undefined|Object|Array} sortConfig Single column sort configuration or full sort configuration (for all sorted columns).
     * The configuration object contains `column` and `sortOrder` properties. First of them contains visual column index, the second one contains
     * sort order (`asc` for ascending, `desc` for descending).
     */

  }, {
    key: 'setSortConfig',
    value: function setSortConfig(sortConfig) {
      var _this7 = this;

      // DIFF - MultiColumnSorting & ColumnSorting: extra `slice` method call.
      var destinationSortConfigs = (0, _utils.getFullSortConfiguration)(sortConfig).slice(0, 1);

      if (this.areValidSortConfigs(destinationSortConfigs)) {
        var translateColumnToPhysical = function translateColumnToPhysical(_ref3) {
          var visualColumn = _ref3.column,
              restOfProperties = _objectWithoutProperties(_ref3, ['column']);

          return Object.assign({ column: _this7.hot.toPhysicalColumn(visualColumn) }, restOfProperties);
        };
        var internalSortStates = (0, _array.arrayMap)(destinationSortConfigs, function (columnSortConfig) {
          return translateColumnToPhysical(columnSortConfig);
        });

        this.columnStatesManager.setSortStates(internalSortStates);
      } else {
        (0, _utils.warnAboutNotValidatedConfig)();
      }
    }

    /**
     * Get if sort configs are valid.
     *
     * @private
     * @param {Array} sortConfigs Sort configuration for all sorted columns. Objects contain `column` and `sortOrder` properties.
     * @returns {Boolean}
     */

  }, {
    key: 'areValidSortConfigs',
    value: function areValidSortConfigs(sortConfigs) {
      if (Array.isArray(sortConfigs) === false) {
        return false;
      }

      var sortedColumns = sortConfigs.map(function (_ref4) {
        var column = _ref4.column;
        return column;
      });
      var numberOfColumns = this.hot.countCols();
      var onlyExistingVisualIndexes = sortedColumns.every(function (visualColumn) {
        return visualColumn <= numberOfColumns && visualColumn >= 0;
      });

      return (0, _utils.areValidSortStates)(sortConfigs) && onlyExistingVisualIndexes; // We don't translate visual indexes to physical indexes.
    }

    /**
     * Saves all sorting settings. Saving works only when {@link Options#persistentState} option is enabled.
     *
     * @private
     * @fires Hooks#persistentStateSave
     */

  }, {
    key: 'saveAllSortSettings',
    value: function saveAllSortSettings() {
      var allSortSettings = this.columnStatesManager.getAllColumnsProperties();

      allSortSettings.initialConfig = this.columnStatesManager.getSortStates();

      this.hot.runHooks('persistentStateSave', 'columnSorting', allSortSettings);
    }

    /**
     * Get all saved sorting settings. Loading works only when {@link Options#persistentState} option is enabled.
     *
     * @private
     * @returns {Object} Previously saved sort settings.
     *
     * @fires Hooks#persistentStateLoad
     */

  }, {
    key: 'getAllSavedSortSettings',
    value: function getAllSavedSortSettings() {
      var _this8 = this;

      var storedAllSortSettings = {};

      this.hot.runHooks('persistentStateLoad', 'columnSorting', storedAllSortSettings);

      var allSortSettings = storedAllSortSettings.value;
      var translateColumnToVisual = function translateColumnToVisual(_ref5) {
        var physicalColumn = _ref5.column,
            restOfProperties = _objectWithoutProperties(_ref5, ['column']);

        return Object.assign({ column: _this8.hot.toVisualColumn(physicalColumn) }, restOfProperties);
      };

      if ((0, _mixed.isDefined)(allSortSettings) && Array.isArray(allSortSettings.initialConfig)) {
        allSortSettings.initialConfig = (0, _array.arrayMap)(allSortSettings.initialConfig, translateColumnToVisual);
      }

      return allSortSettings;
    }

    /**
     * Get next sort configuration for particular column. Object contain `column` and `sortOrder` properties.
     *
     * **Note**: Please keep in mind that returned object expose **visual** column index under the `column` key.
     *
     * @private
     * @param {Number} column Visual column index.
     * @returns {undefined|Object}
     */

  }, {
    key: 'getColumnNextConfig',
    value: function getColumnNextConfig(column) {
      var physicalColumn = this.hot.toPhysicalColumn(column);

      if (this.columnStatesManager.isColumnSorted(physicalColumn)) {
        var columnSortConfig = this.getSortConfig(column);
        var sortOrder = (0, _utils.getNextSortOrder)(columnSortConfig.sortOrder);

        if ((0, _mixed.isDefined)(sortOrder)) {
          columnSortConfig.sortOrder = sortOrder;

          return columnSortConfig;
        }

        return;
      }

      var nrOfColumns = this.hot.countCols();

      if (Number.isInteger(column) && column >= 0 && column < nrOfColumns) {
        return {
          column: column,
          sortOrder: (0, _utils.getNextSortOrder)()
        };
      }
    }

    /**
     * Get sort configuration with "next order" for particular column.
     *
     * @private
     * @param {Number} columnToChange Visual column index of column which order will be changed.
     * @param {String} strategyId ID of strategy. Possible values: 'append' and 'replace'. The first one
     * change order of particular column and change it's position in the sort queue to the last one. The second one
     * just change order of particular column.
     *
     * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
     *
     * @returns {Array}
     */

  }, {
    key: 'getNextSortConfig',
    value: function getNextSortConfig(columnToChange) {
      var strategyId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : APPEND_COLUMN_CONFIG_STRATEGY;

      var physicalColumn = this.hot.toPhysicalColumn(columnToChange);
      var indexOfColumnToChange = this.columnStatesManager.getIndexOfColumnInSortQueue(physicalColumn);
      var isColumnSorted = this.columnStatesManager.isColumnSorted(physicalColumn);
      var currentSortConfig = this.getSortConfig();
      var nextColumnConfig = this.getColumnNextConfig(columnToChange);

      if (isColumnSorted) {
        if ((0, _mixed.isUndefined)(nextColumnConfig)) {
          return [].concat(_toConsumableArray(currentSortConfig.slice(0, indexOfColumnToChange)), _toConsumableArray(currentSortConfig.slice(indexOfColumnToChange + 1)));
        }

        if (strategyId === APPEND_COLUMN_CONFIG_STRATEGY) {
          return [].concat(_toConsumableArray(currentSortConfig.slice(0, indexOfColumnToChange)), _toConsumableArray(currentSortConfig.slice(indexOfColumnToChange + 1)), [nextColumnConfig]);
        } else if (strategyId === REPLACE_COLUMN_CONFIG_STRATEGY) {
          return [].concat(_toConsumableArray(currentSortConfig.slice(0, indexOfColumnToChange)), [nextColumnConfig], _toConsumableArray(currentSortConfig.slice(indexOfColumnToChange + 1)));
        }
      }

      if ((0, _mixed.isDefined)(nextColumnConfig)) {
        return currentSortConfig.concat(nextColumnConfig);
      }

      return currentSortConfig;
    }

    /**
     * Saves to cache part of plugins related properties, properly merged from cascade settings.
     *
     * @private
     * @param {Number} column Visual column index.
     * @returns {Object}
     */
    // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. Using this function we don't count
    // merged properties few times.

  }, {
    key: 'setMergedPluginSettings',
    value: function setMergedPluginSettings(column) {
      var physicalColumnIndex = this.hot.toPhysicalColumn(column);
      var pluginMainSettings = this.hot.getSettings().columnSorting;
      var storedColumnProperties = this.columnStatesManager.getAllColumnsProperties();
      var cellMeta = this.hot.getCellMeta(0, column);
      var columnMeta = Object.getPrototypeOf(cellMeta);
      var columnMetaHasPluginSettings = Object.hasOwnProperty.call(columnMeta, 'columnSorting');
      var pluginColumnConfig = columnMetaHasPluginSettings ? columnMeta.columnSorting : {};

      this.columnMetaCache.set(physicalColumnIndex, Object.assign(storedColumnProperties, pluginMainSettings, pluginColumnConfig));
    }

    /**
     * Get copy of settings for first cell in the column.
     *
     * @private
     * @param {Number} column Visual column index.
     * @returns {Object}
     */
    // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. Instead of getting properties from
    // column meta we call this function.

  }, {
    key: 'getFirstCellSettings',
    value: function getFirstCellSettings(column) {
      var _this9 = this;

      // TODO: Remove test named: "should not break the dataset when inserted new row" (#5431).
      var actualBlockTranslationFlag = this.blockPluginTranslation;

      this.blockPluginTranslation = true;

      if (this.columnMetaCache.size === 0) {
        var numberOfColumns = this.hot.countCols();

        (0, _number.rangeEach)(numberOfColumns, function (visualColumnIndex) {
          return _this9.setMergedPluginSettings(visualColumnIndex);
        });
      }

      var cellMeta = this.hot.getCellMeta(0, column);

      this.blockPluginTranslation = actualBlockTranslationFlag;

      var cellMetaCopy = Object.create(cellMeta);
      cellMetaCopy.columnSorting = this.columnMetaCache.get(this.hot.toPhysicalColumn(column));

      return cellMetaCopy;
    }

    /**
     * Get number of rows which should be sorted.
     *
     * @private
     * @param {Number} numberOfRows Total number of displayed rows.
     * @returns {Number}
     */

  }, {
    key: 'getNumberOfRowsToSort',
    value: function getNumberOfRowsToSort(numberOfRows) {
      var settings = this.hot.getSettings();

      // `maxRows` option doesn't take into account `minSpareRows` option in this case.
      if (settings.maxRows <= numberOfRows) {
        return settings.maxRows;
      }

      return numberOfRows - settings.minSpareRows;
    }

    /**
     * Performs the sorting using a stable sort function basing on internal state of sorting.
     *
     * @private
     */

  }, {
    key: 'sortByPresetSortStates',
    value: function sortByPresetSortStates() {
      var _this10 = this;

      if (this.columnStatesManager.isListOfSortedColumnsEmpty()) {
        this.rowsMapper.clearMap();

        return;
      }

      var indexesWithData = [];
      var sortedColumnsList = this.columnStatesManager.getSortedColumns();
      var numberOfRows = this.hot.countRows();

      // Function `getDataAtCell` won't call the indices translation inside `onModifyRow` callback - we check the `blockPluginTranslation`
      // flag inside it (we just want to get data not already modified by `columnSorting` plugin translation).
      this.blockPluginTranslation = true;

      var getDataForSortedColumns = function getDataForSortedColumns(visualRowIndex) {
        return (0, _array.arrayMap)(sortedColumnsList, function (physicalColumn) {
          return _this10.hot.getDataAtCell(visualRowIndex, _this10.hot.toVisualColumn(physicalColumn));
        });
      };

      for (var visualRowIndex = 0; visualRowIndex < this.getNumberOfRowsToSort(numberOfRows); visualRowIndex += 1) {
        indexesWithData.push([visualRowIndex].concat(getDataForSortedColumns(visualRowIndex)));
      }

      (0, _mergeSort2.default)(indexesWithData, (0, _comparatorEngine.mainSortComparator)((0, _array.arrayMap)(sortedColumnsList, function (physicalColumn) {
        return _this10.columnStatesManager.getSortOrderOfColumn(physicalColumn);
      }), (0, _array.arrayMap)(sortedColumnsList, function (physicalColumn) {
        return _this10.getFirstCellSettings(_this10.hot.toVisualColumn(physicalColumn));
      })));

      // Append spareRows
      for (var _visualRowIndex = indexesWithData.length; _visualRowIndex < numberOfRows; _visualRowIndex += 1) {
        indexesWithData.push([_visualRowIndex].concat(getDataForSortedColumns(_visualRowIndex)));
      }

      // The blockade of the indices translation is released.
      this.blockPluginTranslation = false;

      // Save all indexes to arrayMapper, a completely new sequence is set by the plugin
      this.rowsMapper._arrayMap = (0, _array.arrayMap)(indexesWithData, function (indexWithData) {
        return indexWithData[0];
      });
    }

    /**
     * Load saved settings or sort by predefined plugin configuration.
     *
     * @private
     */

  }, {
    key: 'loadOrSortBySettings',
    value: function loadOrSortBySettings() {
      this.columnMetaCache.clear();

      var storedAllSortSettings = this.getAllSavedSortSettings();

      if ((0, _object.isObject)(storedAllSortSettings)) {
        this.sortBySettings(storedAllSortSettings);
      } else {
        var allSortSettings = this.hot.getSettings().columnSorting;

        this.sortBySettings(allSortSettings);
      }
    }

    /**
     * Sort the table by provided configuration.
     *
     * @private
     * @param {Object} allSortSettings All sort config settings. Object may contain `initialConfig`, `indicator`,
     * `sortEmptyCells`, `headerAction` and `compareFunctionFactory` properties.
     */

  }, {
    key: 'sortBySettings',
    value: function sortBySettings(allSortSettings) {
      if ((0, _object.isObject)(allSortSettings)) {
        this.columnStatesManager.updateAllColumnsProperties(allSortSettings);

        var initialConfig = allSortSettings.initialConfig;

        if (Array.isArray(initialConfig) || (0, _object.isObject)(initialConfig)) {
          this.sort(initialConfig);
        }
      } else {
        // Extra render for headers. Their width may change.
        this.hot.render();
      }
    }

    /**
     * Enables the ObserveChanges plugin.
     *
     * @private
     */

  }, {
    key: 'enableObserveChangesPlugin',
    value: function enableObserveChangesPlugin() {
      var _this = this;

      this.hot._registerTimeout(setTimeout(function () {
        _this.hot.updateSettings({
          observeChanges: true
        });
      }, 0));
    }

    /**
     * Callback for `modifyRow` hook. Translates visual row index to the sorted row index.
     *
     * @private
     * @param {Number} row Visual row index.
     * @returns {Number} Physical row index.
     */

  }, {
    key: 'onModifyRow',
    value: function onModifyRow(row, source) {
      if (this.blockPluginTranslation === false && source !== this.pluginName) {
        var rowInMapper = this.rowsMapper.getValueByIndex(row);
        row = rowInMapper === null ? row : rowInMapper;
      }

      return row;
    }

    /**
     * Callback for `unmodifyRow` hook. Translates sorted row index to visual row index.
     *
     * @private
     * @param {Number} row Physical row index.
     * @returns {Number} Visual row index.
     */

  }, {
    key: 'onUnmodifyRow',
    value: function onUnmodifyRow(row, source) {
      if (this.blockPluginTranslation === false && source !== this.pluginName) {
        row = this.rowsMapper.getIndexByValue(row);
      }

      return row;
    }

    /**
     * Callback for the `onAfterGetColHeader` hook. Adds column sorting CSS classes.
     *
     * @private
     * @param {Number} column Visual column index.
     * @param {Element} TH TH HTML element.
     */

  }, {
    key: 'onAfterGetColHeader',
    value: function onAfterGetColHeader(column, TH) {
      var headerSpanElement = (0, _utils.getHeaderSpanElement)(TH);

      if ((0, _utils.isFirstLevelColumnHeader)(column, TH) === false || headerSpanElement === null) {
        return;
      }

      var physicalColumn = this.hot.toPhysicalColumn(column);
      var pluginSettingsForColumn = this.getFirstCellSettings(column).columnSorting;
      var showSortIndicator = pluginSettingsForColumn.indicator;
      var headerActionEnabled = pluginSettingsForColumn.headerAction;

      (0, _element.removeClass)(headerSpanElement, this.domHelper.getRemovedClasses(headerSpanElement));
      (0, _element.addClass)(headerSpanElement, this.domHelper.getAddedClasses(physicalColumn, showSortIndicator, headerActionEnabled));
    }

    /**
     * Overwriting base plugin's `onUpdateSettings` method. Please keep in mind that `onAfterUpdateSettings` isn't called
     * for `updateSettings` in specific situations.
     *
     * @private
     * @param {Object} newSettings New settings object.
     */

  }, {
    key: 'onUpdateSettings',
    value: function onUpdateSettings(newSettings) {
      _get(ColumnSorting.prototype.__proto__ || Object.getPrototypeOf(ColumnSorting.prototype), 'onUpdateSettings', this).call(this);

      (0, _utils.warnIfPluginsHaveConflict)(newSettings.columnSorting);

      this.columnMetaCache.clear();

      if ((0, _mixed.isDefined)(newSettings.columnSorting)) {
        this.sortBySettings(newSettings.columnSorting);
      }
    }

    /**
     * Callback for the `afterLoadData` hook.
     *
     * @private
     * @param {Boolean} initialLoad flag that determines whether the data has been loaded during the initialization.
     */

  }, {
    key: 'onAfterLoadData',
    value: function onAfterLoadData(initialLoad) {
      this.rowsMapper.clearMap();

      if (initialLoad === true) {
        // TODO: Workaround? It should be refactored / described.
        if (this.hot.view) {
          this.loadOrSortBySettings();
        }
      }
    }

    /**
     * Callback for the `afterCreateRow` hook.
     *
     * @private
     * @param {Number} index Visual index of the created row.
     * @param {Number} amount Amount of created rows.
     */

  }, {
    key: 'onAfterCreateRow',
    value: function onAfterCreateRow(index, amount) {
      this.rowsMapper.shiftItems(index, amount);
    }

    /**
     * Callback for the `afterRemoveRow` hook.
     *
     * @private
     * @param {Number} removedRows Visual indexes of the removed row.
     * @param {Number} amount  Amount of removed rows.
     */

  }, {
    key: 'onAfterRemoveRow',
    value: function onAfterRemoveRow(removedRows, amount) {
      this.rowsMapper.unshiftItems(removedRows, amount);
    }

    // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. We clear the cache after action which reorganize sequence of columns.
    // TODO: Remove test named: "should add new columns properly when the `columnSorting` plugin is enabled (inheriting of non-primitive cell meta values)".
    /**
     * Callback for the `afterCreateCol` hook.
     *
     * @private
     */

  }, {
    key: 'onAfterCreateCol',
    value: function onAfterCreateCol() {
      this.columnMetaCache.clear();
    }

    // TODO: Workaround. Inheriting of non-primitive cell meta values doesn't work. We clear the cache after action which reorganize sequence of columns.
    // TODO: Remove test named: "should add new columns properly when the `columnSorting` plugin is enabled (inheriting of non-primitive cell meta values)".
    /**
     * Callback for the `afterRemoveCol` hook.
     *
     * @private
     */

  }, {
    key: 'onAfterRemoveCol',
    value: function onAfterRemoveCol() {
      this.columnMetaCache.clear();
    }

    /**
     * Indicates if clickable header was clicked.
     *
     * @private
     * @param {MouseEvent} event The `mousedown` event.
     * @param {Number} column Visual column index.
     * @returns {Boolean}
     */

  }, {
    key: 'wasClickableHeaderClicked',
    value: function wasClickableHeaderClicked(event, column) {
      var pluginSettingsForColumn = this.getFirstCellSettings(column).columnSorting;
      var headerActionEnabled = pluginSettingsForColumn.headerAction;

      return headerActionEnabled && event.realTarget.nodeName === 'SPAN';
    }

    /**
     * Changes the behavior of selection / dragging.
     *
     * @private
     * @param {MouseEvent} event The `mousedown` event.
     * @param {CellCoords} coords Visual coordinates.
     * @param {HTMLElement} TD
     * @param {Object} blockCalculations
     */

  }, {
    key: 'onBeforeOnCellMouseDown',
    value: function onBeforeOnCellMouseDown(event, coords, TD, blockCalculations) {
      // Click below the level of column headers
      if (coords.row >= 0 || coords.col < 0) {
        return;
      }

      if (this.wasClickableHeaderClicked(event, coords.col) && (0, _keyStateObserver.isPressedCtrlKey)()) {
        blockCalculations.column = true;
      }
    }

    /**
     * Callback for the `onAfterOnCellMouseDown` hook.
     *
     * @private
     * @param {Event} event Event which are provided by hook.
     * @param {CellCoords} coords Visual coords of the selected cell.
     */

  }, {
    key: 'onAfterOnCellMouseDown',
    value: function onAfterOnCellMouseDown(event, coords) {
      // Click below the level of column headers
      if (coords.row >= 0 || coords.col < 0) {
        return;
      }

      if (this.wasClickableHeaderClicked(event, coords.col)) {
        if ((0, _keyStateObserver.isPressedCtrlKey)()) {
          this.hot.deselectCell();
          this.hot.selectColumns(coords.col);

          // DIFF - MultiColumnSorting & ColumnSorting: removed selection of next column to sort.
        }

        this.sort(this.getColumnNextConfig(coords.col));
      }
    }

    /**
     * Destroys the plugin instance.
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.rowsMapper.destroy();
      this.domHelper.destroy();
      this.columnStatesManager.destroy();

      _get(ColumnSorting.prototype.__proto__ || Object.getPrototypeOf(ColumnSorting.prototype), 'destroy', this).call(this);
    }
  }]);

  return ColumnSorting;
}(_base2.default);

(0, _plugins.registerPlugin)('columnSorting', ColumnSorting);

exports.default = ColumnSorting;