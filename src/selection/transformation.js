import { CellCoords } from './../3rdparty/walkontable/src';
import { mixin } from '../helpers/object';
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
     * Instance of the SelectionRange, holder for visual coordinates applied to the table.
     *
     * @type {SelectionRange}
     */
    this.range = range;
    /**
     * Additional options which define the state of the settings which can infer transformation and
     * give the possibility to translate indexes.
     *
     * @type {object}
     */
    this.options = options;
  }

  /**
   * Selects cell relative to current cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   * @param {boolean} force If `true` the new rows/columns will be created if necessary. Otherwise, row/column will
   *                        be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   * @returns {CellCoords} Visual coordinates after transformation.
   */
  transformStart(rowDelta, colDelta, force) {
    const delta = new CellCoords(rowDelta, colDelta);
    const highlightCoords = this.range.current().highlight;
    const { row: renderableRow, col: renderableColumn } = this.options.visualToRenderableCoords(highlightCoords);
    let visualCoords = highlightCoords;
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformStart', delta);

    if (renderableRow !== null && renderableColumn !== null) {
      let totalRows = this.options.countRows();
      let totalCols = this.options.countCols();
      const fixedRowsBottom = this.options.fixedRowsBottom();
      const minSpareRows = this.options.minSpareRows();
      const minSpareCols = this.options.minSpareCols();
      const autoWrapRow = this.options.autoWrapRow();
      const autoWrapCol = this.options.autoWrapCol();

      if (renderableRow + rowDelta > totalRows - 1) {
        if (force && minSpareRows > 0 && !(fixedRowsBottom && renderableRow >= totalRows - fixedRowsBottom - 1)) {
          this.runLocalHooks('insertRowRequire', totalRows);
          totalRows = this.options.countRows();

        } else if (autoWrapCol) {
          delta.row = 1 - totalRows;
          delta.col = renderableColumn + delta.col === totalCols - 1 ? 1 - totalCols : 1;
        }
      } else if (autoWrapCol && renderableRow + delta.row < 0 && renderableColumn + delta.col >= 0) {
        delta.row = totalRows - 1;
        delta.col = renderableColumn + delta.col === 0 ? totalCols - 1 : -1;
      }

      if (renderableColumn + delta.col > totalCols - 1) {
        if (force && minSpareCols > 0) {
          this.runLocalHooks('insertColRequire', totalCols);
          totalCols = this.options.countCols();

        } else if (autoWrapRow) {
          delta.row = renderableRow + delta.row === totalRows - 1 ? 1 - totalRows : 1;
          delta.col = 1 - totalCols;
        }
      } else if (autoWrapRow && renderableColumn + delta.col < 0 && renderableRow + delta.row >= 0) {
        delta.row = renderableRow + delta.row === 0 ? totalRows - 1 : -1;
        delta.col = totalCols - 1;
      }

      const coords = new CellCoords(renderableRow + delta.row, renderableColumn + delta.col);

      rowTransformDir = 0;
      colTransformDir = 0;

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

      visualCoords = this.options.renderableToVisualCoords(coords);
    }

    this.runLocalHooks('afterTransformStart', visualCoords, rowTransformDir, colTransformDir);

    return visualCoords;
  }

  /**
   * Sets selection end cell relative to current selection end cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   * @returns {CellCoords} Visual coordinates after transformation.
   */
  transformEnd(rowDelta, colDelta) {
    const delta = new CellCoords(rowDelta, colDelta);
    const cellRange = this.range.current();
    let visualCoords = cellRange.to;
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformEnd', delta);

    const { row: rowHighlight, col: colHighlight } = this.options.visualToRenderableCoords(cellRange.highlight);

    // We have highlight (start point for the selection).
    if (rowHighlight !== null && colHighlight !== null) {
      const totalRows = this.options.countRows();
      const totalCols = this.options.countCols();
      const { row: rowTo, col: colTo } = this.options.visualToRenderableCoords(cellRange.to);
      const coords = new CellCoords(rowTo + delta.row, colTo + delta.col);

      rowTransformDir = 0;
      colTransformDir = 0;

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

      visualCoords = this.options.renderableToVisualCoords(coords);
    }

    this.runLocalHooks('afterTransformEnd', visualCoords, rowTransformDir, colTransformDir);

    return visualCoords;
  }
}

mixin(Transformation, localHooks);

export default Transformation;
