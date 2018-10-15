'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['The merged cell declared at [', ', ', '], overlaps with the other declared merged \n    cell. The overlapping merged cell was not added to the table, please fix your setup.'], ['The merged cell declared at [', ', ', '], overlaps with the other declared merged \n    cell. The overlapping merged cell was not added to the table, please fix your setup.']);

var _cellCoords = require('./cellCoords');

var _cellCoords2 = _interopRequireDefault(_cellCoords);

var _index = require('../../3rdparty/walkontable/src/index');

var _number = require('../../helpers/number');

var _console = require('../../helpers/console');

var _array = require('../../helpers/array');

var _utils = require('./utils');

var _templateLiteralTag = require('./../../helpers/templateLiteralTag');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Defines a container object for the merged cells.
 *
 * @class MergedCellsCollection
 * @plugin MergeCells
 */
var MergedCellsCollection = function () {
  function MergedCellsCollection(plugin) {
    _classCallCheck(this, MergedCellsCollection);

    /**
     * Reference to the Merge Cells plugin.
     *
     * @type {MergeCells}
     */
    this.plugin = plugin;
    /**
     * Array of merged cells.
     *
     * @type {Array}
     */
    this.mergedCells = [];
    /**
     * The Handsontable instance.
     *
     * @type {Handsontable}
     */
    this.hot = plugin.hot;
  }

  /**
   * Get a warning message for when the declared merged cell data overlaps already existing merged cells.
   *
   * @param {Object} newMergedCell Object containg information about the merged cells that was about to be added.
   * @return {String}
   */


  _createClass(MergedCellsCollection, [{
    key: 'get',


    /**
     * Get a merged cell from the container, based on the provided arguments. You can provide either the "starting coordinates"
     * of a merged cell, or any coordinates from the body of the merged cell.
     *
     * @param {Number} row Row index.
     * @param {Number} column Column index.
     * @returns {MergedCellCoords|Boolean} Returns a wanted merged cell on success and `false` on failure.
     */
    value: function get(row, column) {
      var mergedCells = this.mergedCells;
      var result = false;

      (0, _array.arrayEach)(mergedCells, function (mergedCell) {
        if (mergedCell.row <= row && mergedCell.row + mergedCell.rowspan - 1 >= row && mergedCell.col <= column && mergedCell.col + mergedCell.colspan - 1 >= column) {
          result = mergedCell;
          return false;
        }

        return true;
      });

      return result;
    }

    /**
     * Get a merged cell containing the provided range.
     *
     * @param {CellRange|Object} range The range to search merged cells for.
     * @return {MergedCellCoords|Boolean}
     */

  }, {
    key: 'getByRange',
    value: function getByRange(range) {
      var mergedCells = this.mergedCells;
      var result = false;

      (0, _array.arrayEach)(mergedCells, function (mergedCell) {
        if (mergedCell.row <= range.from.row && mergedCell.row + mergedCell.rowspan - 1 >= range.to.row && mergedCell.col <= range.from.col && mergedCell.col + mergedCell.colspan - 1 >= range.to.col) {
          result = mergedCell;
          return result;
        }

        return true;
      });

      return result;
    }

    /**
     * Get a merged cell contained in the provided range.
     *
     * @param {CellRange|Object} range The range to search merged cells in.
     * @param [countPartials=false] If set to `true`, all the merged cells overlapping the range will be taken into calculation.
     * @return {Array|Boolean} Array of found merged cells of `false` if none were found.
     */

  }, {
    key: 'getWithinRange',
    value: function getWithinRange(range) {
      var countPartials = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var mergedCells = this.mergedCells;
      var foundMergedCells = [];
      var testedRange = range;

      if (!testedRange.includesRange) {
        var from = new _index.CellCoords(testedRange.from.row, testedRange.from.col);
        var to = new _index.CellCoords(testedRange.to.row, testedRange.to.col);
        testedRange = new _index.CellRange(from, from, to);
      }

      (0, _array.arrayEach)(mergedCells, function (mergedCell) {
        var mergedCellTopLeft = new _index.CellCoords(mergedCell.row, mergedCell.col);
        var mergedCellBottomRight = new _index.CellCoords(mergedCell.row + mergedCell.rowspan - 1, mergedCell.col + mergedCell.colspan - 1);
        var mergedCellRange = new _index.CellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);

        if (countPartials) {
          if (testedRange.overlaps(mergedCellRange)) {
            foundMergedCells.push(mergedCell);
          }
        } else if (testedRange.includesRange(mergedCellRange)) {
          foundMergedCells.push(mergedCell);
        }
      });

      return foundMergedCells.length ? foundMergedCells : false;
    }

    /**
     * Add a merged cell to the container.
     *
     * @param {Object} mergedCellInfo The merged cell information object. Has to contain `row`, `col`, `colspan` and `rowspan` properties.
     * @return {MergedCellCoords|Boolean} Returns the new merged cell on success and `false` on failure.
     */

  }, {
    key: 'add',
    value: function add(mergedCellInfo) {
      var mergedCells = this.mergedCells;
      var row = mergedCellInfo.row;
      var column = mergedCellInfo.col;
      var rowspan = mergedCellInfo.rowspan;
      var colspan = mergedCellInfo.colspan;
      var newMergedCell = new _cellCoords2.default(row, column, rowspan, colspan);
      var alreadyExists = this.get(row, column);
      var isOverlapping = this.isOverlapping(newMergedCell);

      if (!alreadyExists && !isOverlapping) {
        if (this.hot) {
          newMergedCell.normalize(this.hot);
        }

        mergedCells.push(newMergedCell);

        return newMergedCell;
      }

      (0, _console.warn)(MergedCellsCollection.IS_OVERLAPPING_WARNING(newMergedCell));

      return false;
    }

    /**
     * Remove a merged cell from the container. You can provide either the "starting coordinates"
     * of a merged cell, or any coordinates from the body of the merged cell.
     *
     * @param {Number} row Row index.
     * @param {Number} column Column index.
     * @return {MergedCellCoords|Boolean} Returns the removed merged cell on success and `false` on failure.
     */

  }, {
    key: 'remove',
    value: function remove(row, column) {
      var mergedCells = this.mergedCells;
      var wantedCollection = this.get(row, column);
      var wantedCollectionIndex = wantedCollection ? this.mergedCells.indexOf(wantedCollection) : null;

      if (wantedCollection && wantedCollectionIndex !== false) {
        mergedCells.splice(wantedCollectionIndex, 1);
        return wantedCollection;
      }

      return false;
    }

    /**
     * Clear all the merged cells.
     */

  }, {
    key: 'clear',
    value: function clear() {
      var _this = this;

      var mergedCells = this.mergedCells;
      var mergedCellParentsToClear = [];
      var hiddenCollectionElements = [];

      (0, _array.arrayEach)(mergedCells, function (mergedCell) {
        var TD = _this.hot.getCell(mergedCell.row, mergedCell.col);

        if (TD) {
          mergedCellParentsToClear.push([TD, _this.get(mergedCell.row, mergedCell.col), mergedCell.row, mergedCell.col]);
        }
      });

      this.mergedCells.length = 0;

      (0, _array.arrayEach)(mergedCellParentsToClear, function (mergedCell, i) {
        (0, _number.rangeEach)(0, mergedCell.rowspan - 1, function (j) {
          (0, _number.rangeEach)(0, mergedCell.colspan - 1, function (k) {
            if (k !== 0 || j !== 0) {
              var TD = _this.hot.getCell(mergedCell.row + j, mergedCell.col + k);

              if (TD) {
                hiddenCollectionElements.push([TD, null, null, null]);
              }
            }
          });
        });

        mergedCellParentsToClear[i][1] = null;
      });

      (0, _array.arrayEach)(mergedCellParentsToClear, function (mergedCellParents) {
        _utils.applySpanProperties.apply(undefined, _toConsumableArray(mergedCellParents));
      });

      (0, _array.arrayEach)(hiddenCollectionElements, function (hiddenCollectionElement) {
        _utils.applySpanProperties.apply(undefined, _toConsumableArray(hiddenCollectionElement));
      });
    }

    /**
     * Check if the provided merged cell overlaps with the others in the container.
     *
     * @param {MergedCellCoords} mergedCell The merged cell to check against all others in the container.
     * @return {Boolean} `true` if the provided merged cell overlaps with the others, `false` otherwise.
     */

  }, {
    key: 'isOverlapping',
    value: function isOverlapping(mergedCell) {
      var mergedCellRange = new _index.CellRange(null, new _index.CellCoords(mergedCell.row, mergedCell.col), new _index.CellCoords(mergedCell.row + mergedCell.rowspan - 1, mergedCell.col + mergedCell.colspan - 1));
      var result = false;

      (0, _array.arrayEach)(this.mergedCells, function (col) {
        var currentRange = new _index.CellRange(null, new _index.CellCoords(col.row, col.col), new _index.CellCoords(col.row + col.rowspan - 1, col.col + col.colspan - 1));

        if (currentRange.overlaps(mergedCellRange)) {
          result = true;
          return false;
        }

        return true;
      });

      return result;
    }

    /**
     * Check whether the provided row/col coordinates direct to a merged parent.
     *
     * @param {Number} row Row index.
     * @param {Number} column Column index.
     * @return {Boolean}
     */

  }, {
    key: 'isMergedParent',
    value: function isMergedParent(row, column) {
      var mergedCells = this.mergedCells;
      var result = false;

      (0, _array.arrayEach)(mergedCells, function (mergedCell) {
        if (mergedCell.row === row && mergedCell.col === column) {
          result = true;
          return false;
        }

        return true;
      });

      return result;
    }

    /**
     * Shift the merged cell in the direction and by an offset defined in the arguments.
     *
     * @param {String} direction `right`, `left`, `up` or `down`.
     * @param {Number} index Index where the change, which caused the shifting took place.
     * @param {Number} count Number of rows/columns added/removed in the preceding action.
     */

  }, {
    key: 'shiftCollections',
    value: function shiftCollections(direction, index, count) {
      var _this2 = this;

      var shiftVector = [0, 0];

      switch (direction) {
        case 'right':
          shiftVector[0] += count;
          break;

        case 'left':
          shiftVector[0] -= count;
          break;

        case 'down':
          shiftVector[1] += count;
          break;

        case 'up':
          shiftVector[1] -= count;
          break;

        default:
      }

      (0, _array.arrayEach)(this.mergedCells, function (currentMerge) {
        currentMerge.shift(shiftVector, index);
      });

      (0, _number.rangeEachReverse)(this.mergedCells.length - 1, 0, function (i) {
        var currentMerge = _this2.mergedCells[i];

        if (currentMerge && currentMerge.removed) {
          _this2.mergedCells.splice(_this2.mergedCells.indexOf(currentMerge), 1);
        }
      });
    }
  }], [{
    key: 'IS_OVERLAPPING_WARNING',
    value: function IS_OVERLAPPING_WARNING(newMergedCell) {
      return (0, _templateLiteralTag.toSingleLine)(_templateObject, newMergedCell.row, newMergedCell.col);
    }
  }]);

  return MergedCellsCollection;
}();

exports.default = MergedCellsCollection;