var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import { registerPlugin } from './../../plugins';
import { stopImmediatePropagation } from './../../helpers/dom/event';
import { CellCoords, CellRange } from './../../3rdparty/walkontable/src';
import MergedCellsCollection from './cellsCollection';
import MergedCellCoords from './cellCoords';
import AutofillCalculations from './calculations/autofill';
import SelectionCalculations from './calculations/selection';
import toggleMergeItem from './contextMenuItem/toggleMerge';
import { arrayEach } from '../../helpers/array';
import { clone } from '../../helpers/object';
import { warn } from '../../helpers/console';
import { rangeEach } from '../../helpers/number';
import { applySpanProperties } from './utils';


Hooks.getSingleton().register('beforeMergeCells');
Hooks.getSingleton().register('afterMergeCells');
Hooks.getSingleton().register('beforeUnmergeCells');
Hooks.getSingleton().register('afterUnmergeCells');

var privatePool = new WeakMap();

/**
 * @plugin MergeCells
 *
 * @description
 * Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).
 *
 * @example
 *
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *  data: getData(),
 *  mergeCells: [
 *    {row: 0, col: 3, rowspan: 3, colspan: 3},
 *    {row: 2, col: 6, rowspan: 2, colspan: 2},
 *    {row: 4, col: 8, rowspan: 3, colspan: 3}
 *  ],
 * ```
 */

var MergeCells = function (_BasePlugin) {
  _inherits(MergeCells, _BasePlugin);

  function MergeCells(hotInstance) {
    _classCallCheck(this, MergeCells);

    var _this = _possibleConstructorReturn(this, (MergeCells.__proto__ || Object.getPrototypeOf(MergeCells)).call(this, hotInstance));

    privatePool.set(_this, {
      lastDesiredCoords: null
    });

    /**
     * A container for all the merged cells.
     *
     * @private
     * @type {MergedCellsCollection}
     */
    _this.mergedCellsCollection = null;
    /**
     * Instance of the class responsible for all the autofill-related calculations.
     *
     * @private
     * @type {AutofillCalculations}
     */
    _this.autofillCalculations = null;
    /**
     * Instance of the class responsible for the selection-related calculations.
     *
     * @private
     * @type {SelectionCalculations}
     */
    _this.selectionCalculations = null;
    return _this;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link MergeCells#enablePlugin} method is called.
   *
   * @returns {Boolean}
   */


  _createClass(MergeCells, [{
    key: 'isEnabled',
    value: function isEnabled() {
      return !!this.hot.getSettings().mergeCells;
    }

    /**
     * Enables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'enablePlugin',
    value: function enablePlugin() {
      var _this2 = this;

      if (this.enabled) {
        return;
      }

      this.mergedCellsCollection = new MergedCellsCollection(this);
      this.autofillCalculations = new AutofillCalculations(this);
      this.selectionCalculations = new SelectionCalculations(this);

      this.addHook('afterInit', function () {
        return _this2.onAfterInit.apply(_this2, arguments);
      });
      this.addHook('beforeKeyDown', function () {
        return _this2.onBeforeKeyDown.apply(_this2, arguments);
      });
      this.addHook('modifyTransformStart', function () {
        return _this2.onModifyTransformStart.apply(_this2, arguments);
      });
      this.addHook('afterModifyTransformStart', function () {
        return _this2.onAfterModifyTransformStart.apply(_this2, arguments);
      });
      this.addHook('modifyTransformEnd', function () {
        return _this2.onModifyTransformEnd.apply(_this2, arguments);
      });
      this.addHook('modifyGetCellCoords', function () {
        return _this2.onModifyGetCellCoords.apply(_this2, arguments);
      });
      this.addHook('beforeSetRangeEnd', function () {
        return _this2.onBeforeSetRangeEnd.apply(_this2, arguments);
      });
      this.addHook('afterIsMultipleSelection', function () {
        return _this2.onAfterIsMultipleSelection.apply(_this2, arguments);
      });
      this.addHook('afterRenderer', function () {
        return _this2.onAfterRenderer.apply(_this2, arguments);
      });
      this.addHook('afterContextMenuDefaultOptions', function () {
        return _this2.addMergeActionsToContextMenu.apply(_this2, arguments);
      });
      this.addHook('afterGetCellMeta', function () {
        return _this2.onAfterGetCellMeta.apply(_this2, arguments);
      });
      this.addHook('afterViewportRowCalculatorOverride', function () {
        return _this2.onAfterViewportRowCalculatorOverride.apply(_this2, arguments);
      });
      this.addHook('afterViewportColumnCalculatorOverride', function () {
        return _this2.onAfterViewportColumnCalculatorOverride.apply(_this2, arguments);
      });
      this.addHook('modifyAutofillRange', function () {
        return _this2.onModifyAutofillRange.apply(_this2, arguments);
      });
      this.addHook('afterCreateCol', function () {
        return _this2.onAfterCreateCol.apply(_this2, arguments);
      });
      this.addHook('afterRemoveCol', function () {
        return _this2.onAfterRemoveCol.apply(_this2, arguments);
      });
      this.addHook('afterCreateRow', function () {
        return _this2.onAfterCreateRow.apply(_this2, arguments);
      });
      this.addHook('afterRemoveRow', function () {
        return _this2.onAfterRemoveRow.apply(_this2, arguments);
      });
      this.addHook('afterChange', function () {
        return _this2.onAfterChange.apply(_this2, arguments);
      });
      this.addHook('beforeDrawBorders', function () {
        return _this2.onBeforeDrawAreaBorders.apply(_this2, arguments);
      });
      this.addHook('afterDrawSelection', function () {
        return _this2.onAfterDrawSelection.apply(_this2, arguments);
      });
      this.addHook('beforeRemoveCellClassNames', function () {
        return _this2.onBeforeRemoveCellClassNames.apply(_this2, arguments);
      });

      _get(MergeCells.prototype.__proto__ || Object.getPrototypeOf(MergeCells.prototype), 'enablePlugin', this).call(this);
    }

    /**
     * Disables the plugin functionality for this Handsontable instance.
     */

  }, {
    key: 'disablePlugin',
    value: function disablePlugin() {
      this.clearCollections();
      this.hot.render();
      _get(MergeCells.prototype.__proto__ || Object.getPrototypeOf(MergeCells.prototype), 'disablePlugin', this).call(this);
    }

    /**
     * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
     */

  }, {
    key: 'updatePlugin',
    value: function updatePlugin() {
      var settings = this.hot.getSettings().mergeCells;

      this.disablePlugin();
      this.enablePlugin();

      this.generateFromSettings(settings);

      _get(MergeCells.prototype.__proto__ || Object.getPrototypeOf(MergeCells.prototype), 'updatePlugin', this).call(this);
    }

    /**
     * Validates a single setting object, represented by a single merged cell information object.
     *
     * @private
     * @param {Object} setting An object with `row`, `col`, `rowspan` and `colspan` properties.
     * @return {Boolean}
     */

  }, {
    key: 'validateSetting',
    value: function validateSetting(setting) {
      var valid = true;

      if (!setting) {
        return false;
      }

      if (MergedCellCoords.containsNegativeValues(setting)) {
        warn(MergedCellCoords.NEGATIVE_VALUES_WARNING(setting));

        valid = false;
      } else if (MergedCellCoords.isOutOfBounds(setting, this.hot.countRows(), this.hot.countCols())) {
        warn(MergedCellCoords.IS_OUT_OF_BOUNDS_WARNING(setting));

        valid = false;
      } else if (MergedCellCoords.isSingleCell(setting)) {
        warn(MergedCellCoords.IS_SINGLE_CELL(setting));

        valid = false;
      } else if (MergedCellCoords.containsZeroSpan(setting)) {
        warn(MergedCellCoords.ZERO_SPAN_WARNING(setting));

        valid = false;
      }

      return valid;
    }

    /**
     * Generates the merged cells from the settings provided to the plugin.
     *
     * @private
     * @param {Array|Boolean} settings The settings provided to the plugin.
     */

  }, {
    key: 'generateFromSettings',
    value: function generateFromSettings(settings) {
      var _this3 = this;

      if (Array.isArray(settings)) {
        var _hot;

        var populationArgumentsList = [];

        arrayEach(settings, function (setting) {
          if (!_this3.validateSetting(setting)) {
            return;
          }

          var highlight = new CellCoords(setting.row, setting.col);
          var rangeEnd = new CellCoords(setting.row + setting.rowspan - 1, setting.col + setting.colspan - 1);
          var mergeRange = new CellRange(highlight, highlight, rangeEnd);

          populationArgumentsList.push(_this3.mergeRange(mergeRange, true, true));
        });

        // remove 'empty' setting objects, caused by improper merge range declarations
        populationArgumentsList = populationArgumentsList.filter(function (value) {
          return value !== true;
        });

        var bulkPopulationData = this.getBulkCollectionData(populationArgumentsList);

        (_hot = this.hot).populateFromArray.apply(_hot, _toConsumableArray(bulkPopulationData));
      }
    }

    /**
     * Generates a bulk set of all the data to be populated to fill the data "under" the added merged cells.
     *
     * @private
     * @param {Array} populationArgumentsList Array in a form of `[row, column, dataUnderCollection]`.
     * @return {Array} Array in a form of `[row, column, dataOfAllCollections]`.
     */

  }, {
    key: 'getBulkCollectionData',
    value: function getBulkCollectionData(populationArgumentsList) {
      var _hot2;

      var populationDataRange = this.getBulkCollectionDataRange(populationArgumentsList);
      var dataAtRange = (_hot2 = this.hot).getData.apply(_hot2, _toConsumableArray(populationDataRange));
      var newDataAtRange = dataAtRange.splice(0);

      arrayEach(populationArgumentsList, function (mergedCellArguments) {
        var _mergedCellArguments = _slicedToArray(mergedCellArguments, 3),
            mergedCellRowIndex = _mergedCellArguments[0],
            mergedCellColumnIndex = _mergedCellArguments[1],
            mergedCellData = _mergedCellArguments[2];

        arrayEach(mergedCellData, function (mergedCellRow, rowIndex) {
          arrayEach(mergedCellRow, function (mergedCellElement, columnIndex) {
            newDataAtRange[mergedCellRowIndex - populationDataRange[0] + rowIndex][mergedCellColumnIndex - populationDataRange[1] + columnIndex] = mergedCellElement;
          });
        });
      });

      return [populationDataRange[0], populationDataRange[1], newDataAtRange];
    }

    /**
     * Gets the range of combined data ranges provided in a form of an array of arrays ([row, column, dataUnderCollection])
     *
     * @private
     * @param {Array} populationArgumentsList Array containing argument lists for the `populateFromArray` method - row, column and data for population.
     * @return {Array[]} Start and end coordinates of the merged cell range. (in a form of [rowIndex, columnIndex])
     */

  }, {
    key: 'getBulkCollectionDataRange',
    value: function getBulkCollectionDataRange(populationArgumentsList) {
      var start = [0, 0];
      var end = [0, 0];
      var mergedCellRow = null;
      var mergedCellColumn = null;
      var mergedCellData = null;

      arrayEach(populationArgumentsList, function (mergedCellArguments) {
        mergedCellRow = mergedCellArguments[0];
        mergedCellColumn = mergedCellArguments[1];
        mergedCellData = mergedCellArguments[2];

        start[0] = Math.min(mergedCellRow, start[0]);
        start[1] = Math.min(mergedCellColumn, start[1]);
        end[0] = Math.max(mergedCellRow + mergedCellData.length - 1, end[0]);
        end[1] = Math.max(mergedCellColumn + mergedCellData[0].length - 1, end[1]);
      });

      return [].concat(start, end);
    }

    /**
     * Clears the merged cells from the merged cell container.
     */

  }, {
    key: 'clearCollections',
    value: function clearCollections() {
      this.mergedCellsCollection.clear();
    }

    /**
     * Returns `true` if a range is mergeable.
     *
     * @private
     * @param {Object} newMergedCellInfo Merged cell information object to test.
     * @param {Boolean} [auto=false] `true` if triggered at initialization.
     * @returns {Boolean}
     */

  }, {
    key: 'canMergeRange',
    value: function canMergeRange(newMergedCellInfo) {
      var auto = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return auto ? true : this.validateSetting(newMergedCellInfo);
    }

    /**
     * Merge or unmerge, based on last selected range.
     *
     * @private
     */

  }, {
    key: 'toggleMergeOnSelection',
    value: function toggleMergeOnSelection() {
      var currentRange = this.hot.getSelectedRangeLast();

      if (!currentRange) {
        return;
      }

      currentRange.setDirection('NW-SE');

      var from = currentRange.from,
          to = currentRange.to;


      this.toggleMerge(currentRange);
      this.hot.selectCell(from.row, from.col, to.row, to.col, false);
    }

    /**
     * Merges the selection provided as a cell range.
     *
     * @param {CellRange} [cellRange] Selection cell range.
     */

  }, {
    key: 'mergeSelection',
    value: function mergeSelection() {
      var cellRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.hot.getSelectedRangeLast();

      if (!cellRange) {
        return;
      }

      cellRange.setDirection('NW-SE');

      var from = cellRange.from,
          to = cellRange.to;


      this.unmergeRange(cellRange, true);
      this.mergeRange(cellRange);
      this.hot.selectCell(from.row, from.col, to.row, to.col, false);
    }

    /**
     * Unmerges the selection provided as a cell range.
     *
     * @param {CellRange} [cellRange] Selection cell range.
     */

  }, {
    key: 'unmergeSelection',
    value: function unmergeSelection() {
      var cellRange = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.hot.getSelectedRangeLast();

      if (!cellRange) {
        return;
      }

      var from = cellRange.from,
          to = cellRange.to;


      this.unmergeRange(cellRange, true);
      this.hot.selectCell(from.row, from.col, to.row, to.col, false);
    }

    /**
     * Merges cells in the provided cell range.
     *
     * @private
     * @param {CellRange} cellRange Cell range to merge.
     * @param {Boolean} [auto=false] `true` if is called automatically, e.g. at initialization.
     * @param {Boolean} [preventPopulation=false] `true`, if the method should not run `populateFromArray` at the end, but rather return its arguments.
     * @returns {Array|Boolean} Returns an array of [row, column, dataUnderCollection] if preventPopulation is set to true. If the the merging process went successful, it returns `true`, otherwise - `false`.
     * @fires Hooks#beforeMergeCells
     * @fires Hooks#afterMergeCells
     */

  }, {
    key: 'mergeRange',
    value: function mergeRange(cellRange) {
      var _this4 = this;

      var auto = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var preventPopulation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var topLeft = cellRange.getTopLeftCorner();
      var bottomRight = cellRange.getBottomRightCorner();
      var mergeParent = {
        row: topLeft.row,
        col: topLeft.col,
        rowspan: bottomRight.row - topLeft.row + 1,
        colspan: bottomRight.col - topLeft.col + 1
      };
      var clearedData = [];
      var populationInfo = null;

      if (!this.canMergeRange(mergeParent, auto)) {
        return false;
      }

      this.hot.runHooks('beforeMergeCells', cellRange, auto);

      rangeEach(0, mergeParent.rowspan - 1, function (i) {
        rangeEach(0, mergeParent.colspan - 1, function (j) {
          var clearedValue = null;

          if (!clearedData[i]) {
            clearedData[i] = [];
          }

          if (i === 0 && j === 0) {
            clearedValue = _this4.hot.getDataAtCell(mergeParent.row, mergeParent.col);
          } else {
            _this4.hot.setCellMeta(mergeParent.row + i, mergeParent.col + j, 'hidden', true);
          }

          clearedData[i][j] = clearedValue;
        });
      });

      this.hot.setCellMeta(mergeParent.row, mergeParent.col, 'spanned', true);

      var mergedCellAdded = this.mergedCellsCollection.add(mergeParent);

      if (mergedCellAdded) {
        if (preventPopulation) {
          populationInfo = [mergeParent.row, mergeParent.col, clearedData];
        } else {
          this.hot.populateFromArray(mergeParent.row, mergeParent.col, clearedData, void 0, void 0, this.pluginName);
        }

        this.hot.runHooks('afterMergeCells', cellRange, mergeParent, auto);

        return populationInfo;
      }

      return true;
    }

    /**
     * Unmerges the selection provided as a cell range. If no cell range is provided, it uses the current selection.
     *
     * @private
     * @param {CellRange} cellRange Selection cell range.
     * @param {Boolean} [auto=false] `true` if called automatically by the plugin.
     *
     * @fires Hooks#beforeUnmergeCells
     * @fires Hooks#afterUnmergeCells
     */

  }, {
    key: 'unmergeRange',
    value: function unmergeRange(cellRange) {
      var _this5 = this;

      var auto = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var mergedCells = this.mergedCellsCollection.getWithinRange(cellRange);

      if (!mergedCells) {
        return;
      }

      this.hot.runHooks('beforeUnmergeCells', cellRange, auto);

      arrayEach(mergedCells, function (currentCollection) {
        _this5.mergedCellsCollection.remove(currentCollection.row, currentCollection.col);

        rangeEach(0, currentCollection.rowspan - 1, function (i) {
          rangeEach(0, currentCollection.colspan - 1, function (j) {
            _this5.hot.removeCellMeta(currentCollection.row + i, currentCollection.col + j, 'hidden');
          });
        });

        _this5.hot.removeCellMeta(currentCollection.row, currentCollection.col, 'spanned');
      });

      this.hot.render();
      this.hot.runHooks('afterUnmergeCells', cellRange, auto);
    }

    /**
     * Merges or unmerges, based on the cell range provided as `cellRange`.
     *
     * @private
     * @param {CellRange} cellRange The cell range to merge or unmerged.
     */

  }, {
    key: 'toggleMerge',
    value: function toggleMerge(cellRange) {
      var mergedCell = this.mergedCellsCollection.get(cellRange.from.row, cellRange.from.col);
      var mergedCellCoversWholeRange = mergedCell.row === cellRange.from.row && mergedCell.col === cellRange.from.col && mergedCell.row + mergedCell.rowspan - 1 === cellRange.to.row && mergedCell.col + mergedCell.colspan - 1 === cellRange.to.col;

      if (mergedCellCoversWholeRange) {
        this.unmergeRange(cellRange);
      } else {
        this.mergeSelection(cellRange);
      }
    }

    /**
     * Merges the specified range.
     *
     * @param {Number} startRow Start row of the merged cell.
     * @param {Number} startColumn Start column of the merged cell.
     * @param {Number} endRow End row of the merged cell.
     * @param {Number} endColumn End column of the merged cell.
     * @fires Hooks#beforeMergeCells
     * @fires Hooks#afterMergeCells
     */

  }, {
    key: 'merge',
    value: function merge(startRow, startColumn, endRow, endColumn) {
      var start = new CellCoords(startRow, startColumn);
      var end = new CellCoords(endRow, endColumn);

      this.mergeRange(new CellRange(start, start, end));
    }

    /**
     * Unmerges the merged cell in the provided range.
     *
     * @param {Number} startRow Start row of the merged cell.
     * @param {Number} startColumn Start column of the merged cell.
     * @param {Number} endRow End row of the merged cell.
     * @param {Number} endColumn End column of the merged cell.
     * @fires Hooks#beforeUnmergeCells
     * @fires Hooks#afterUnmergeCells
     */

  }, {
    key: 'unmerge',
    value: function unmerge(startRow, startColumn, endRow, endColumn) {
      var start = new CellCoords(startRow, startColumn);
      var end = new CellCoords(endRow, endColumn);

      this.unmergeRange(new CellRange(start, start, end));
    }

    /**
     * `afterInit` hook callback.
     *
     * @private
     */

  }, {
    key: 'onAfterInit',
    value: function onAfterInit() {
      this.generateFromSettings(this.hot.getSettings().mergeCells);
      this.hot.render();
    }

    /**
     * `beforeKeyDown` hook callback.
     *
     * @private
     * @param {KeyboardEvent} event The `keydown` event object.
     */

  }, {
    key: 'onBeforeKeyDown',
    value: function onBeforeKeyDown(event) {
      var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

      if (ctrlDown && event.keyCode === 77) {
        // CTRL + M
        this.toggleMerge(this.hot.getSelectedRangeLast());

        this.hot.render();
        stopImmediatePropagation(event);
      }
    }

    /**
     * Modifies the information on whether the current selection contains multiple cells. The `afterIsMultipleSelection` hook callback.
     *
     * @private
     * @param {Boolean} isMultiple
     * @returns {Boolean}
     */

  }, {
    key: 'onAfterIsMultipleSelection',
    value: function onAfterIsMultipleSelection(isMultiple) {
      if (isMultiple) {
        var mergedCells = this.mergedCellsCollection.mergedCells;
        var selectionRange = this.hot.getSelectedRangeLast();

        for (var group = 0; group < mergedCells.length; group += 1) {
          if (selectionRange.highlight.row === mergedCells[group].row && selectionRange.highlight.col === mergedCells[group].col && selectionRange.to.row === mergedCells[group].row + mergedCells[group].rowspan - 1 && selectionRange.to.col === mergedCells[group].col + mergedCells[group].colspan - 1) {
            return false;
          }
        }
      }

      return isMultiple;
    }

    /**
     * `modifyTransformStart` hook callback.
     *
     * @private
     * @param {Object} delta The transformation delta.
     */

  }, {
    key: 'onModifyTransformStart',
    value: function onModifyTransformStart(delta) {
      var priv = privatePool.get(this);
      var currentlySelectedRange = this.hot.getSelectedRangeLast();
      var newDelta = {
        row: delta.row,
        col: delta.col
      };
      var nextPosition = null;
      var currentPosition = new CellCoords(currentlySelectedRange.highlight.row, currentlySelectedRange.highlight.col);
      var mergedParent = this.mergedCellsCollection.get(currentPosition.row, currentPosition.col);

      if (!priv.lastDesiredCoords) {
        priv.lastDesiredCoords = new CellCoords(null, null);
      }

      if (mergedParent) {
        // only merge selected
        var mergeTopLeft = new CellCoords(mergedParent.row, mergedParent.col);
        var mergeBottomRight = new CellCoords(mergedParent.row + mergedParent.rowspan - 1, mergedParent.col + mergedParent.colspan - 1);
        var mergeRange = new CellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);

        if (!mergeRange.includes(priv.lastDesiredCoords)) {
          priv.lastDesiredCoords = new CellCoords(null, null); // reset outdated version of lastDesiredCoords
        }

        newDelta.row = priv.lastDesiredCoords.row ? priv.lastDesiredCoords.row - currentPosition.row : newDelta.row;
        newDelta.col = priv.lastDesiredCoords.col ? priv.lastDesiredCoords.col - currentPosition.col : newDelta.col;

        if (delta.row > 0) {
          // moving down
          newDelta.row = mergedParent.row + mergedParent.rowspan - 1 - currentPosition.row + delta.row;
        } else if (delta.row < 0) {
          // moving up
          newDelta.row = currentPosition.row - mergedParent.row + delta.row;
        }

        if (delta.col > 0) {
          // moving right
          newDelta.col = mergedParent.col + mergedParent.colspan - 1 - currentPosition.col + delta.col;
        } else if (delta.col < 0) {
          // moving left
          newDelta.col = currentPosition.col - mergedParent.col + delta.col;
        }
      }

      nextPosition = new CellCoords(currentlySelectedRange.highlight.row + newDelta.row, currentlySelectedRange.highlight.col + newDelta.col);

      var nextParentIsMerged = this.mergedCellsCollection.get(nextPosition.row, nextPosition.col);

      if (nextParentIsMerged) {
        // skipping the invisible cells in the merge range
        priv.lastDesiredCoords = nextPosition;
        newDelta = {
          row: nextParentIsMerged.row - currentPosition.row,
          col: nextParentIsMerged.col - currentPosition.col
        };
      }

      if (newDelta.row !== 0) {
        delta.row = newDelta.row;
      }
      if (newDelta.col !== 0) {
        delta.col = newDelta.col;
      }
    }

    /**
     * `modifyTransformEnd` hook callback. Needed to handle "jumping over" merged merged cells, while selecting.
     *
     * @private
     * @param {Object} delta The transformation delta.
     */

  }, {
    key: 'onModifyTransformEnd',
    value: function onModifyTransformEnd(delta) {
      var _this6 = this;

      var currentSelectionRange = this.hot.getSelectedRangeLast();
      var newDelta = clone(delta);
      var newSelectionRange = this.selectionCalculations.getUpdatedSelectionRange(currentSelectionRange, delta);
      var tempDelta = clone(newDelta);

      var mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(newSelectionRange, true);

      do {
        tempDelta = clone(newDelta);
        this.selectionCalculations.getUpdatedSelectionRange(currentSelectionRange, newDelta);

        arrayEach(mergedCellsWithinRange, function (mergedCell) {
          _this6.selectionCalculations.snapDelta(newDelta, currentSelectionRange, mergedCell);
        });
      } while (newDelta.row !== tempDelta.row || newDelta.col !== tempDelta.col);

      delta.row = newDelta.row;
      delta.col = newDelta.col;
    }

    /**
     * `modifyGetCellCoords` hook callback. Swaps the `getCell` coords with the merged parent coords.
     *
     * @private
     * @param {Number} row Row index.
     * @param {Number} column Column index.
     * @returns {Array}
     */

  }, {
    key: 'onModifyGetCellCoords',
    value: function onModifyGetCellCoords(row, column) {
      var mergeParent = this.mergedCellsCollection.get(row, column);

      return mergeParent ? [mergeParent.row, mergeParent.col, mergeParent.row + mergeParent.rowspan - 1, mergeParent.col + mergeParent.colspan - 1] : void 0;
    }

    /**
     * `afterContextMenuDefaultOptions` hook callback.
     *
     * @private
     * @param {Object} defaultOptions The default context menu options.
     */

  }, {
    key: 'addMergeActionsToContextMenu',
    value: function addMergeActionsToContextMenu(defaultOptions) {
      defaultOptions.items.push({
        name: '---------'
      }, toggleMergeItem(this));
    }

    /**
     * `afterRenderer` hook callback.
     *
     * @private
     * @param {HTMLElement} TD The cell to be modified.
     * @param {Number} row Row index.
     * @param {Number} col Column index.
     */

  }, {
    key: 'onAfterRenderer',
    value: function onAfterRenderer(TD, row, col) {
      var mergedCell = this.mergedCellsCollection.get(row, col);

      applySpanProperties(TD, mergedCell, row, col);
    }

    /**
     * `beforeSetRangeEnd` hook callback.
     * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
     *
     * @private
     * @param {Object} coords Cell coords.
     */

  }, {
    key: 'onBeforeSetRangeEnd',
    value: function onBeforeSetRangeEnd(coords) {
      var selRange = this.hot.getSelectedRangeLast();
      selRange.highlight = new CellCoords(selRange.highlight.row, selRange.highlight.col); // clone in case we will modify its reference
      selRange.to = coords;
      var rangeExpanded = false;

      if (selRange.from.row === 0 && selRange.to.row === this.hot.countRows() - 1 || selRange.from.col === 0 && selRange.to.col === this.hot.countCols() - 1) {
        return;
      }

      do {
        rangeExpanded = false;

        for (var i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
          var cellInfo = this.mergedCellsCollection.mergedCells[i];
          var mergedCellRange = cellInfo.getRange();

          if (selRange.expandByRange(mergedCellRange)) {
            coords.row = selRange.to.row;
            coords.col = selRange.to.col;

            rangeExpanded = true;
          }
        }
      } while (rangeExpanded);
    }

    /**
     * The `afterGetCellMeta` hook callback.
     *
     * @private
     * @param {Number} row Row index.
     * @param {Number} col Column index.
     * @param {Object} cellProperties The cell properties object.
     */

  }, {
    key: 'onAfterGetCellMeta',
    value: function onAfterGetCellMeta(row, col, cellProperties) {
      var mergeParent = this.mergedCellsCollection.get(row, col);

      if (mergeParent && (mergeParent.row !== row || mergeParent.col !== col)) {
        cellProperties.copyable = false;
      }
    }

    /**
     * `afterViewportRowCalculatorOverride` hook callback.
     *
     * @private
     * @param {Object} calc The row calculator object.
     */

  }, {
    key: 'onAfterViewportRowCalculatorOverride',
    value: function onAfterViewportRowCalculatorOverride(calc) {
      var _this7 = this;

      var colCount = this.hot.countCols();
      var mergeParent = void 0;

      rangeEach(0, colCount - 1, function (c) {
        mergeParent = _this7.mergedCellsCollection.get(calc.startRow, c);
        if (mergeParent) {
          if (mergeParent.row < calc.startRow) {
            calc.startRow = mergeParent.row;
            return _this7.onAfterViewportRowCalculatorOverride.call(_this7, calc); // recursively search upwards
          }
        }

        mergeParent = _this7.mergedCellsCollection.get(calc.endRow, c);

        if (mergeParent) {
          var mergeEnd = mergeParent.row + mergeParent.rowspan - 1;
          if (mergeEnd > calc.endRow) {
            calc.endRow = mergeEnd;
            return _this7.onAfterViewportRowCalculatorOverride.call(_this7, calc); // recursively search upwards
          }
        }

        return true;
      });
    }

    /**
     * `afterViewportColumnCalculatorOverride` hook callback.
     *
     * @private
     * @param {Object} calc The column calculator object.
     */

  }, {
    key: 'onAfterViewportColumnCalculatorOverride',
    value: function onAfterViewportColumnCalculatorOverride(calc) {
      var _this8 = this;

      var rowCount = this.hot.countRows();
      var mergeParent = void 0;

      rangeEach(0, rowCount - 1, function (r) {
        mergeParent = _this8.mergedCellsCollection.get(r, calc.startColumn);

        if (mergeParent && mergeParent.col < calc.startColumn) {
          calc.startColumn = mergeParent.col;
          return _this8.onAfterViewportColumnCalculatorOverride.call(_this8, calc); // recursively search upwards
        }

        mergeParent = _this8.mergedCellsCollection.get(r, calc.endColumn);

        if (mergeParent) {
          var mergeEnd = mergeParent.col + mergeParent.colspan - 1;
          if (mergeEnd > calc.endColumn) {
            calc.endColumn = mergeEnd;
            return _this8.onAfterViewportColumnCalculatorOverride.call(_this8, calc); // recursively search upwards
          }
        }

        return true;
      });
    }

    /**
     * The `modifyAutofillRange` hook callback.
     *
     * @private
     * @param {Array} drag The drag area coordinates.
     * @param {Array} select The selection information.
     * @return {Array} The new drag area.
     */

  }, {
    key: 'onModifyAutofillRange',
    value: function onModifyAutofillRange(drag, select) {
      this.autofillCalculations.correctSelectionAreaSize(select);
      var dragDirection = this.autofillCalculations.getDirection(select, drag);
      var dragArea = drag;

      if (this.autofillCalculations.dragAreaOverlapsCollections(select, dragArea, dragDirection)) {
        dragArea = select;

        return dragArea;
      }

      var mergedCellsWithinSelectionArea = this.mergedCellsCollection.getWithinRange({
        from: { row: select[0], col: select[1] },
        to: { row: select[2], col: select[3] }
      });

      if (!mergedCellsWithinSelectionArea) {
        return dragArea;
      }

      dragArea = this.autofillCalculations.snapDragArea(select, dragArea, dragDirection, mergedCellsWithinSelectionArea);

      return dragArea;
    }

    /**
     * `afterCreateCol` hook callback.
     *
     * @private
     * @param {Number} column Column index.
     * @param {Number} count Number of created columns.
     */

  }, {
    key: 'onAfterCreateCol',
    value: function onAfterCreateCol(column, count) {
      this.mergedCellsCollection.shiftCollections('right', column, count);
    }

    /**
     * `afterRemoveCol` hook callback.
     *
     * @private
     * @param {Number} column Column index.
     * @param {Number} count Number of removed columns.
     */

  }, {
    key: 'onAfterRemoveCol',
    value: function onAfterRemoveCol(column, count) {
      this.mergedCellsCollection.shiftCollections('left', column, count);
    }

    /**
     * `afterCreateRow` hook callback.
     *
     * @private
     * @param {Number} row Row index.
     * @param {Number} count Number of created rows.
     * @param {String} source Source of change.
     */

  }, {
    key: 'onAfterCreateRow',
    value: function onAfterCreateRow(row, count, source) {
      if (source === 'auto') {
        return;
      }

      this.mergedCellsCollection.shiftCollections('down', row, count);
    }

    /**
     * `afterRemoveRow` hook callback.
     *
     * @private
     * @param {Number} row Row index.
     * @param {Number} count Number of removed rows.
     */

  }, {
    key: 'onAfterRemoveRow',
    value: function onAfterRemoveRow(row, count) {
      this.mergedCellsCollection.shiftCollections('up', row, count);
    }

    /**
     * `afterChange` hook callback. Used to propagate merged cells after using Autofill.
     *
     * @private
     * @param {Array} changes The changes array.
     * @param {String} source Determines the source of the change.
     */

  }, {
    key: 'onAfterChange',
    value: function onAfterChange(changes, source) {
      if (source !== 'Autofill.fill') {
        return;
      }

      this.autofillCalculations.recreateAfterDataPopulation(changes);
    }

    /**
     * `beforeDrawAreaBorders` hook callback.
     *
     * @private
     * @param {Array} corners Coordinates of the area corners.
     * @param {String} className Class name for the area.
     */

  }, {
    key: 'onBeforeDrawAreaBorders',
    value: function onBeforeDrawAreaBorders(corners, className) {
      if (className && className === 'area') {
        var selectedRange = this.hot.getSelectedRangeLast();
        var mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(selectedRange);

        arrayEach(mergedCellsWithinRange, function (mergedCell) {
          if (selectedRange.getBottomRightCorner().row === mergedCell.getLastRow() && selectedRange.getBottomRightCorner().col === mergedCell.getLastColumn()) {
            corners[2] = mergedCell.row;
            corners[3] = mergedCell.col;
          }
        });
      }
    }

    /**
     * `afterModifyTransformStart` hook callback. Fixes a problem with navigating through merged cells at the edges of the table
     * with the ENTER/SHIFT+ENTER/TAB/SHIFT+TAB keys.
     *
     * @private
     * @param {CellCoords} coords Coordinates of the to-be-selected cell.
     * @param {Number} rowTransformDir Row transformation direction (negative value = up, 0 = none, positive value = down)
     * @param {Number} colTransformDir Column transformation direction (negative value = up, 0 = none, positive value = down)
     */

  }, {
    key: 'onAfterModifyTransformStart',
    value: function onAfterModifyTransformStart(coords, rowTransformDir, colTransformDir) {
      if (!this.enabled) {
        return;
      }

      var mergedCellAtCoords = this.mergedCellsCollection.get(coords.row, coords.col);

      if (!mergedCellAtCoords) {
        return;
      }

      var goingDown = rowTransformDir > 0;
      var goingUp = rowTransformDir < 0;
      var goingLeft = colTransformDir < 0;
      var goingRight = colTransformDir > 0;
      var mergedCellOnBottomEdge = mergedCellAtCoords.row + mergedCellAtCoords.rowspan - 1 === this.hot.countRows() - 1;
      var mergedCellOnTopEdge = mergedCellAtCoords.row === 0;
      var mergedCellOnRightEdge = mergedCellAtCoords.col + mergedCellAtCoords.colspan - 1 === this.hot.countCols() - 1;
      var mergedCellOnLeftEdge = mergedCellAtCoords.col === 0;

      if (goingDown && mergedCellOnBottomEdge || goingUp && mergedCellOnTopEdge || goingRight && mergedCellOnRightEdge || goingLeft && mergedCellOnLeftEdge) {
        coords.row = mergedCellAtCoords.row;
        coords.col = mergedCellAtCoords.col;
      }
    }

    /**
     * `afterDrawSelection` hook callback. Used to add the additional class name for the entirely-selected merged cells.
     *
     * @private
     * @param {Number} currentRow Row index of the currently processed cell.
     * @param {Number} currentColumn Column index of the currently cell.
     * @param {Array} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`.
     * @param {Number|undefined} layerLevel Number indicating which layer of selection is currently processed.
     * @returns {String|undefined} A `String`, which will act as an additional `className` to be added to the currently processed cell.
     */

  }, {
    key: 'onAfterDrawSelection',
    value: function onAfterDrawSelection(currentRow, currentColumn, cornersOfSelection, layerLevel) {
      return this.selectionCalculations.getSelectedMergedCellClassName(currentRow, currentColumn, cornersOfSelection, layerLevel);
    }

    /**
     * `beforeRemoveCellClassNames` hook callback. Used to remove additional class name from all cells in the table.
     *
     * @private
     * @returns {String[]} An `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.
     */

  }, {
    key: 'onBeforeRemoveCellClassNames',
    value: function onBeforeRemoveCellClassNames() {
      return this.selectionCalculations.getSelectedMergedCellClassNameToRemove();
    }
  }]);

  return MergeCells;
}(BasePlugin);

registerPlugin('mergeCells', MergeCells);

export default MergeCells;