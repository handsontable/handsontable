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
class Transformation {
  constructor(range, options) {
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
  transformStart(rowDelta, colDelta, force) {
    const delta = new CellCoords(rowDelta, colDelta);

    this.runLocalHooks('beforeTransformStart', delta);

    let totalRows = this.options.countRows();
    let totalCols = this.options.countCols();
    const fixedRowsBottom = this.options.fixedRowsBottom();
    const minSpareRows = this.options.minSpareRows();
    const minSpareCols = this.options.minSpareCols();
    const autoWrapRow = this.options.autoWrapRow();
    const autoWrapCol = this.options.autoWrapCol();
    const highlightCoords = this.range.current().highlight;
    const { row, col } = this.options.translateCoords(highlightCoords);

    if (row + rowDelta > totalRows - 1) {
      if (force && minSpareRows > 0 && !(fixedRowsBottom && row >= totalRows - fixedRowsBottom - 1)) {
        this.runLocalHooks('insertRowRequire', totalRows);
        totalRows = this.options.countRows();

      } else if (autoWrapCol) {
        delta.row = 1 - totalRows;
        delta.col = col + delta.col === totalCols - 1 ? 1 - totalCols : 1;
      }
    } else if (autoWrapCol && row + delta.row < 0 && col + delta.col >= 0) {
      delta.row = totalRows - 1;
      delta.col = col + delta.col === 0 ? totalCols - 1 : -1;
    }

    if (col + delta.col > totalCols - 1) {
      if (force && minSpareCols > 0) {
        this.runLocalHooks('insertColRequire', totalCols);
        totalCols = this.options.countCols();

      } else if (autoWrapRow) {
        delta.row = row + delta.row === totalRows - 1 ? 1 - totalRows : 1;
        delta.col = 1 - totalCols;
      }
    } else if (autoWrapRow && col + delta.col < 0 && row + delta.row >= 0) {
      delta.row = row + delta.row === 0 ? totalRows - 1 : -1;
      delta.col = totalCols - 1;
    }

    const coords = new CellCoords(row + delta.row, col + delta.col);
    let rowTransformDir = 0;
    let colTransformDir = 0;

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

    const untransformedCoords = this.options.untranslateCoords(coords);

    this.runLocalHooks('afterTransformStart', untransformedCoords, rowTransformDir, colTransformDir);

    return untransformedCoords;
  }

  /**
   * Sets selection end cell relative to current selection end cell (if possible).
   *
   * @param {Number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {Number} colDelta Columns number to move, value can be passed as negative number.
   * @returns {CellCoords}
   */
  transformEnd(rowDelta, colDelta) {
    const delta = new CellCoords(rowDelta, colDelta);

    this.runLocalHooks('beforeTransformEnd', delta);

    const totalRows = this.options.countRows();
    const totalCols = this.options.countCols();
    const cellRange = this.range.current();
    const { row, col } = this.options.translateCoords(cellRange.to);

    const coords = new CellCoords(row + delta.row, col + delta.col);

    let rowTransformDir = 0;
    let colTransformDir = 0;

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

    const untransformedCoords = this.options.untranslateCoords(coords);

    this.runLocalHooks('afterTransformEnd', untransformedCoords, rowTransformDir, colTransformDir);

    return untransformedCoords;
  }
}

mixin(Transformation, localHooks);

export default Transformation;
