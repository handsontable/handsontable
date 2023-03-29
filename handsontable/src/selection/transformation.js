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
   * @param {boolean} [createMissingRecords=false] If `true` the new rows/columns will be created if necessary. Otherwise, row/column will
   *                        be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   * @returns {CellCoords} Visual coordinates after transformation.
   */
  transformStart(rowDelta, colDelta, createMissingRecords = false) {
    const delta = this.options.createCellCoords(rowDelta, colDelta);
    let visualCoords = this.range.current().highlight;
    const zeroBasedPosition = this.#getVisualCoordsZeroBasedPosition(visualCoords);
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformStart', delta);

    if (zeroBasedPosition !== null) {
      const { width, height } = this.#getTableCanvasSize();
      const { x, y } = zeroBasedPosition;
      const fixedRowsBottom = this.options.fixedRowsBottom();
      const minSpareRows = this.options.minSpareRows();
      const minSpareCols = this.options.minSpareCols();
      const autoWrapRow = this.options.autoWrapRow();
      const autoWrapCol = this.options.autoWrapCol();

      const rawCoords = {
        row: y + rowDelta,
        col: x + colDelta,
      };

      if (y + rowDelta >= height) {
        if (createMissingRecords && minSpareRows > 0 && fixedRowsBottom === 0) {
          this.runLocalHooks('insertRowRequire', this.options.countRows());

        } else if (autoWrapCol) {
          rawCoords.row = 0;
          rawCoords.col = x + 1 >= width ? 0 : x + 1;
        }

      } else if (y + rowDelta < 0) {
        if (autoWrapCol) {
          rawCoords.row = height - 1;
          rawCoords.col = x - 1 < 0 ? width - 1 : x - 1;
        }
      }

      if (x + colDelta >= width) {
        if (createMissingRecords && minSpareCols > 0) {
          this.runLocalHooks('insertColRequire', this.options.countCols());

        } else if (autoWrapRow) {
          rawCoords.row = y + 1 >= height ? 0 : y + 1;
          rawCoords.col = 0;
        }

      } else if (x + colDelta < 0) {
        if (autoWrapRow) {
          rawCoords.row = y - 1 < 0 ? height - 1 : y - 1;
          rawCoords.col = width - 1;
        }
      }

      const coords = this.options.createCellCoords(rawCoords.row, rawCoords.col);
      const { rowDir, colDir } = this.#clampCoords(coords);

      rowTransformDir = rowDir;
      colTransformDir = colDir;
      visualCoords = this.#zeroBasedToVisualCoords(coords);
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
    const delta = this.options.createCellCoords(rowDelta, colDelta);
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
      const coords = this.options.createCellCoords(rowTo + delta.row, colTo + delta.col);

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

  /**
   * Clamps the coords to make sure they points to the cell (or header) in the table range.
   *
   * @param {CellCoords} zeroBasedCoords The coords object to clamp.
   * @returns {{rowDir: 1|0|-1, colDir: 1|0|-1}}
   */
  #clampCoords(zeroBasedCoords) {
    const { width, height } = this.#getTableCanvasSize();
    let rowDir = 0;
    let colDir = 0;

    if (zeroBasedCoords.row < 0) {
      rowDir = -1;
      zeroBasedCoords.row = 0;

    } else if (zeroBasedCoords.row > 0 && zeroBasedCoords.row >= height) {
      rowDir = 1;
      zeroBasedCoords.row = height - 1;
    }

    if (zeroBasedCoords.col < 0) {
      colDir = -1;
      zeroBasedCoords.col = 0;

    } else if (zeroBasedCoords.col > 0 && zeroBasedCoords.col >= width) {
      colDir = 1;
      zeroBasedCoords.col = width - 1;
    }

    return { rowDir, colDir };
  }

  /**
   * Gets the table size in number of rows with headers as "height" and number of columns with
   * headers as "width".
   *
   * @returns {{width: number, height: number}}
   */
  #getTableCanvasSize() {
    return {
      width: this.options.countCols() + this.options.countRowHeaders(),
      height: this.options.countRows() + this.options.countColHeaders(),
    };
  }

  /**
   * Gets the zero-based highlight position.
   *
   * @param {CellCoords} visualCoords The visual coords to process.
   * @returns {{x: number, y: number}}
   */
  #getVisualCoordsZeroBasedPosition(visualCoords) {
    const { row, col } = this.options.visualToRenderableCoords(visualCoords);

    if (row === null || col === null) {
      return null;
    }

    return {
      x: col + this.options.countRowHeaders(),
      y: row + this.options.countColHeaders(),
    };
  }

  /**
   * Translates the zero-based coordinates to visual ones.
   *
   * @param {CellCoords} coords The coordinates to process.
   * @returns {CellCoords}
   */
  #zeroBasedToVisualCoords(coords) {
    coords.row = coords.row - this.options.countColHeaders();
    coords.col = coords.col - this.options.countRowHeaders();

    return this.options.renderableToVisualCoords(coords);
  }
}

mixin(Transformation, localHooks);

export default Transformation;
