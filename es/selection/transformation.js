var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { CellCoords } from './../3rdparty/walkontable/src';
import { mixin } from './../helpers/object';
import localHooks from './../mixins/localHooks';

/**
 * The Transformation class implements algorithms for transforming coordinates based on current settings
 * passed to the Handsontable.
 *
 * Transformation is always applied relative to the current selection.
 *
 * @class Transformation
 * @util
 */

var Transformation = function () {
  function Transformation(range, options) {
    _classCallCheck(this, Transformation);

    /**
     * Instance of the SelectionRange, holder for coordinates applied to the table.
     *
     * @type {SelectionRange}
     */
    this.range = range;
    /**
     * Additional options which define the state of the settings which can infer transformation.
     *
     * @type {Object}
     */
    this.options = options;
  }

  /**
   * Selects cell relative to current cell (if possible).
   *
   * @param {Number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {Number} colDelta Columns number to move, value can be passed as negative number.
   * @param {Boolean} force If `true` the new rows/columns will be created if necessary. Otherwise, row/column will
   *                        be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   * @returns {CellCoords}
   */


  _createClass(Transformation, [{
    key: 'transformStart',
    value: function transformStart(rowDelta, colDelta, force) {
      var delta = new CellCoords(rowDelta, colDelta);

      this.runLocalHooks('beforeTransformStart', delta);

      var totalRows = this.options.countRows();
      var totalCols = this.options.countCols();
      var fixedRowsBottom = this.options.fixedRowsBottom();
      var minSpareRows = this.options.minSpareRows();
      var minSpareCols = this.options.minSpareCols();
      var autoWrapRow = this.options.autoWrapRow();
      var autoWrapCol = this.options.autoWrapCol();
      var highlightCoords = this.range.current().highlight;

      if (highlightCoords.row + rowDelta > totalRows - 1) {
        if (force && minSpareRows > 0 && !(fixedRowsBottom && highlightCoords.row >= totalRows - fixedRowsBottom - 1)) {
          this.runLocalHooks('insertRowRequire', totalRows);
          totalRows = this.options.countRows();
        } else if (autoWrapCol) {
          delta.row = 1 - totalRows;
          delta.col = highlightCoords.col + delta.col === totalCols - 1 ? 1 - totalCols : 1;
        }
      } else if (autoWrapCol && highlightCoords.row + delta.row < 0 && highlightCoords.col + delta.col >= 0) {
        delta.row = totalRows - 1;
        delta.col = highlightCoords.col + delta.col === 0 ? totalCols - 1 : -1;
      }

      if (highlightCoords.col + delta.col > totalCols - 1) {
        if (force && minSpareCols > 0) {
          this.runLocalHooks('insertColRequire', totalCols);
          totalCols = this.options.countCols();
        } else if (autoWrapRow) {
          delta.row = highlightCoords.row + delta.row === totalRows - 1 ? 1 - totalRows : 1;
          delta.col = 1 - totalCols;
        }
      } else if (autoWrapRow && highlightCoords.col + delta.col < 0 && highlightCoords.row + delta.row >= 0) {
        delta.row = highlightCoords.row + delta.row === 0 ? totalRows - 1 : -1;
        delta.col = totalCols - 1;
      }

      var coords = new CellCoords(highlightCoords.row + delta.row, highlightCoords.col + delta.col);
      var rowTransformDir = 0;
      var colTransformDir = 0;

      if (coords.row < 0) {
        rowTransformDir = -1;
        coords.row = 0;
      } else if (coords.row > 0 && coords.row >= totalRows) {
        rowTransformDir = 1;
        coords.row = totalRows - 1;
      }

      if (coords.col < 0) {
        colTransformDir = -1;
        coords.col = 0;
      } else if (coords.col > 0 && coords.col >= totalCols) {
        colTransformDir = 1;
        coords.col = totalCols - 1;
      }
      this.runLocalHooks('afterTransformStart', coords, rowTransformDir, colTransformDir);

      return coords;
    }

    /**
     * Sets selection end cell relative to current selection end cell (if possible).
     *
     * @param {Number} rowDelta Rows number to move, value can be passed as negative number.
     * @param {Number} colDelta Columns number to move, value can be passed as negative number.
     * @returns {CellCoords}
     */

  }, {
    key: 'transformEnd',
    value: function transformEnd(rowDelta, colDelta) {
      var delta = new CellCoords(rowDelta, colDelta);

      this.runLocalHooks('beforeTransformEnd', delta);

      var totalRows = this.options.countRows();
      var totalCols = this.options.countCols();
      var cellRange = this.range.current();
      var coords = new CellCoords(cellRange.to.row + delta.row, cellRange.to.col + delta.col);
      var rowTransformDir = 0;
      var colTransformDir = 0;

      if (coords.row < 0) {
        rowTransformDir = -1;
        coords.row = 0;
      } else if (coords.row > 0 && coords.row >= totalRows) {
        rowTransformDir = 1;
        coords.row = totalRows - 1;
      }

      if (coords.col < 0) {
        colTransformDir = -1;
        coords.col = 0;
      } else if (coords.col > 0 && coords.col >= totalCols) {
        colTransformDir = 1;
        coords.col = totalCols - 1;
      }
      this.runLocalHooks('afterTransformEnd', coords, rowTransformDir, colTransformDir);

      return coords;
    }
  }]);

  return Transformation;
}();

mixin(Transformation, localHooks);

export default Transformation;