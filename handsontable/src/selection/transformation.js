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
  /**
   * Instance of the SelectionRange, holder for visual coordinates applied to the table.
   *
   * @type {SelectionRange}
   */
  #range;
  /**
   * Additional options which define the state of the settings which can infer transformation and
   * give the possibility to translate indexes.
   *
   * @type {object}
   */
  #options;
  /**
   * Increases the table size by applying the offsets. The option is used by the `navigableHeaders`
   * option.
   *
   * @type {{ x: number, y: number }}
   */
  #offset = { x: 0, y: 0 };

  constructor(range, options) {
    this.#range = range;
    this.#options = options;
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
    this.#setOffsetSize({
      x: this.#options.navigableHeaders() ? this.#options.countRowHeaders() : 0,
      y: this.#options.navigableHeaders() ? this.#options.countColHeaders() : 0,
    });

    const delta = this.#options.createCellCoords(rowDelta, colDelta);
    let visualCoords = this.#range.current().highlight;
    const zeroBasedPosition = this.#getVisualCoordsZeroBasedPosition(visualCoords);
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformStart', delta);

    if (zeroBasedPosition !== null) {
      const { width, height } = this.#getTableSize();
      const { x, y } = zeroBasedPosition;
      const fixedRowsBottom = this.#options.fixedRowsBottom();
      const minSpareRows = this.#options.minSpareRows();
      const minSpareCols = this.#options.minSpareCols();
      const autoWrapRow = this.#options.autoWrapRow();
      const autoWrapCol = this.#options.autoWrapCol();

      const rawCoords = {
        row: y + delta.row,
        col: x + delta.col,
      };

      // if (delta.col > 0) {
      //   rawCoords.col = this.#options.columnIndexMapper.getNearestNotHiddenIndex(rawCoords.col, 1) ?? rawCoords.col;

      // } else if (delta.col < 0) {
      //   rawCoords.col = this.#options.columnIndexMapper.getNearestNotHiddenIndex(rawCoords.col, -1) ?? rawCoords.col;
      // }

      // if (delta.row > 0) {
      //   rawCoords.row = this.#options.rowIndexMapper.getNearestNotHiddenIndex(rawCoords.row, 1) ?? rawCoords.row;

      // } else if (delta.row < 0) {
      //   rawCoords.row = this.#options.rowIndexMapper.getNearestNotHiddenIndex(rawCoords.row, -1) ?? rawCoords.row;
      // }

      // console.log('rawCoords', rawCoords.row, rawCoords.col);

      if (rawCoords.row >= height) {
        if (createMissingRecords && minSpareRows > 0 && fixedRowsBottom === 0) {
          this.runLocalHooks('insertRowRequire', this.#options.countRenderableRows());

        } else if (autoWrapCol) {
          const nextColumn = rawCoords.col + 1;

          rawCoords.row = rawCoords.row - height;
          rawCoords.col = nextColumn >= width ? nextColumn - width : nextColumn;
        }

      } else if (rawCoords.row < 0) {
        if (autoWrapCol) {
          const previousColumn = rawCoords.col - 1;

          rawCoords.row = height + rawCoords.row;
          rawCoords.col = previousColumn < 0 ? width + previousColumn : previousColumn;
        }
      }

      if (rawCoords.col >= width) {
        if (createMissingRecords && minSpareCols > 0) {
          this.runLocalHooks('insertColRequire', this.#options.countRenderableColumns());

        } else if (autoWrapRow) {
          const nextRow = rawCoords.row + 1;

          rawCoords.row = nextRow >= height ? nextRow - height : nextRow;
          rawCoords.col = rawCoords.col - width;
        }

      } else if (rawCoords.col < 0) {
        if (autoWrapRow) {
          const previousRow = rawCoords.row - 1;

          rawCoords.row = previousRow < 0 ? height + previousRow : previousRow;
          rawCoords.col = width + rawCoords.col;
        }
      }

      const coords = this.#options.createCellCoords(rawCoords.row, rawCoords.col);
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
    this.#setOffsetSize({
      x: 0,
      y: 0,
    });

    const delta = this.#options.createCellCoords(rowDelta, colDelta);
    const cellRange = this.#range.current();
    let visualCoords = cellRange.to;
    const zeroBasedPosition = this.#getVisualCoordsZeroBasedPosition(cellRange.highlight);
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformEnd', delta);

    if (zeroBasedPosition !== null) {
      const { x, y } = this.#getVisualCoordsZeroBasedPosition(cellRange.to);
      const rawCoords = {
        row: y + delta.row,
        col: x + delta.col,
      };
      const coords = this.#options.createCellCoords(rawCoords.row, rawCoords.col);
      const { rowDir, colDir } = this.#clampCoords(coords);

      rowTransformDir = rowDir;
      colTransformDir = colDir;
      visualCoords = this.#zeroBasedToVisualCoords(coords);
    }

    this.runLocalHooks('afterTransformEnd', visualCoords, rowTransformDir, colTransformDir);

    return visualCoords;
  }

  /**
   * Sets the additional offset in table size that may occur when the `navigableHeaders` option
   * is enabled.
   *
   * @param {{x: number, y: number}} offset Offset as x and y properties.
   */
  #setOffsetSize({ x, y }) {
    this.#offset = { x, y };
  }

  /**
   * Clamps the coords to make sure they points to the cell (or header) in the table range.
   *
   * @param {CellCoords} zeroBasedCoords The coords object to clamp.
   * @returns {{rowDir: 1|0|-1, colDir: 1|0|-1}}
   */
  #clampCoords(zeroBasedCoords) {
    const { width, height } = this.#getTableSize();
    let rowDir = 0;
    let colDir = 0;

    if (zeroBasedCoords.row < 0) {
      rowDir = -1;
      zeroBasedCoords.row = 0;
      // zeroBasedCoords.row = this.#options.rowIndexMapper.getNearestNotHiddenIndex(0, 1) ?? 0;

    } else if (zeroBasedCoords.row > 0 && zeroBasedCoords.row >= height) {
      rowDir = 1;
      zeroBasedCoords.row = height - 1;
      // zeroBasedCoords.row = this.#options.rowIndexMapper.getNearestNotHiddenIndex(height - 1, -1) ?? height - 1;

    } else {
      // zeroBasedCoords.row = this.#options.rowIndexMapper.getNearestNotHiddenIndex(zeroBasedCoords.row, 1);
    }

    if (zeroBasedCoords.col < 0) {
      colDir = -1;
      zeroBasedCoords.col = 0;
      // zeroBasedCoords.col = this.#options.columnIndexMapper.getNearestNotHiddenIndex(0, 1) ?? 0;

    } else if (zeroBasedCoords.col > 0 && zeroBasedCoords.col >= width) {
      colDir = 1;
      zeroBasedCoords.col = width - 1;
      // zeroBasedCoords.col = this.#options.columnIndexMapper.getNearestNotHiddenIndex(width - 1, -1) ?? width - 1;

    } else {
      // console.log('zeroBasedCoords.col', zeroBasedCoords.col);
      // zeroBasedCoords.col = this.#options.columnIndexMapper.getNearestNotHiddenIndex(zeroBasedCoords.col, 1);
      // console.log('zeroBasedCoords.col2', zeroBasedCoords.col);
    }

    return { rowDir, colDir };
  }

  /**
   * Gets the table size in number of rows with headers as "height" and number of columns with
   * headers as "width".
   *
   * @returns {{width: number, height: number}}
   */
  #getTableSize() {
    return {
      width: this.#offset.x + this.#options.countRenderableColumns(),
      height: this.#offset.y + this.#options.countRenderableRows(),
    };
  }

  /**
   * Gets the zero-based highlight position.
   *
   * @param {CellCoords} visualCoords The visual coords to process.
   * @returns {{x: number, y: number}}
   */
  #getVisualCoordsZeroBasedPosition(visualCoords) {
    const { row, col } = this.#options.visualToRenderableCoords(visualCoords);
    // const { row, col } = visualCoords;

    if (row === null || col === null) {
      return null;
    }

    return {
      x: this.#offset.x + col,
      y: this.#offset.y + row,
    };
  }

  /**
   * Translates the zero-based coordinates to visual ones.
   *
   * @param {CellCoords} coords The coordinates to process.
   * @returns {CellCoords}
   */
  #zeroBasedToVisualCoords(coords) {
    coords.col = coords.col - this.#offset.x;
    coords.row = coords.row - this.#offset.y;

    // return coords;
    return this.#options.renderableToVisualCoords(coords);
  }
}

mixin(Transformation, localHooks);

export default Transformation;
