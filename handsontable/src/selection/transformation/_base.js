import { mixin, createObjectPropListener } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';

/**
 * The BaseTransformation class implements algorithms for transforming coordinates based on current settings
 * passed to the Handsontable. The class performs the calculations based on the renderable indexes.
 *
 * Transformation is always applied relative to the currently active selection layer.
 *
 * The class operates on a table size defined by the renderable indexes. If the `navigableHeaders`
 * option is enabled, the table size is increased by the number of row and/or column headers.
 * Because the headers are treated as cells as part of the table size (indexes always go from 0 to N),
 * the algorithm can be written as simply as possible (without new if's that distinguish the headers
 * logic).
 *
 * @class BaseTransformation
 * @private
 */
export class BaseTransformation {
  /**
   * Instance of the SelectionRange, holder for visual coordinates applied to the table.
   *
   * @type {SelectionRange}
   */
  #range;
  /**
   * Index of the currently active selection layer.
   *
   * @type {number}
   */
  #activeLayerIndex = 0;
  /**
   * Increases the table size by applying the offsets. The option is used by the `navigableHeaders`
   * option.
   *
   * @type {{ x: number, y: number }}
   */
  #offset = { x: 0, y: 0 };
  /**
   * An object containing the table API methods and settings.
   *
   * @type {object}
   */
  tableApi;

  constructor(range, tableApi) {
    this.#range = range;
    this.tableApi = tableApi;
  }

  /**
   * Sets the currently active selection layer index.
   *
   * @param {number} layerIndex The layer index to set as active.
   */
  setActiveLayerIndex(layerIndex) {
    this.#activeLayerIndex = layerIndex;
  }

  /**
   * Gets the currently active selection layer range.
   *
   * @returns {CellRange}
   */
  getCurrentSelection() {
    return this.#range.peekByIndex(this.#activeLayerIndex);
  }

  /**
   * Selects cell relative to the current cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   * @param {boolean} [createMissingRecords=false] If `true` the new rows/columns will be created if necessary. Otherwise, row/column will
   *                        be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   * @returns {{selectionLayer: number, visualCoords: CellCoords}} Visual coordinates with selection layer after transformation.
   */
  transformStart(rowDelta, colDelta, createMissingRecords = false) {
    this.#offset = this.calculateOffset();

    const delta = this.tableApi.createCellCoords(rowDelta, colDelta);
    let visualCoords = this.getCurrentSelection().highlight;
    const highlightRenderableCoords = this.tableApi.visualToRenderableCoords(visualCoords);
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformStart', delta);

    if (highlightRenderableCoords.row !== null && highlightRenderableCoords.col !== null) {
      let { width, height } = this.#getTableSize();
      const { row, col } = this.#visualToZeroBasedCoords(visualCoords);

      const fixedRowsBottom = this.tableApi.fixedRowsBottom();
      const minSpareRows = this.tableApi.minSpareRows();
      const minSpareCols = this.tableApi.minSpareCols();
      const autoWrapRow = this.tableApi.autoWrapRow();
      const autoWrapCol = this.tableApi.autoWrapCol();

      const zeroBasedCoords = this.tableApi.createCellCoords(
        row + delta.row,
        col + delta.col,
      );

      if (zeroBasedCoords.row >= height) {
        const isActionInterrupted = createObjectPropListener(
          createMissingRecords && minSpareRows > 0 && fixedRowsBottom === 0
        );
        const nextColumn = zeroBasedCoords.col + 1;
        const isColumnOutOfRange = nextColumn >= width;
        const newCoords = this.tableApi.createCellCoords(
          zeroBasedCoords.row - height,
          isColumnOutOfRange ? nextColumn - width : nextColumn,
        );

        this.runLocalHooks(
          'beforeColumnWrap',
          isActionInterrupted,
          this.#zeroBasedToVisualCoords(newCoords),
          isColumnOutOfRange,
        );

        if (isActionInterrupted.value) {
          this.runLocalHooks('insertRowRequire', this.countRenderableRows());

        } else if (autoWrapCol) {
          if (this.shouldSwitchSelectionLayer() && isColumnOutOfRange && this.#range.size() > 1) {
            this.#chooseNextSelectionLayer();

            const nextLayerCoords = this.#findNonHiddenZeroBasedCoordsInSelection('forward');

            if (nextLayerCoords !== null) {
              newCoords.assign(nextLayerCoords);
            }
          }

          zeroBasedCoords.assign(newCoords);
        }

      } else if (zeroBasedCoords.row < 0) {
        const isActionInterrupted = createObjectPropListener(autoWrapCol);
        const previousColumn = zeroBasedCoords.col - 1;
        const isColumnOutOfRange = previousColumn < 0;
        const newCoords = this.tableApi.createCellCoords(
          height + zeroBasedCoords.row,
          isColumnOutOfRange ? width + previousColumn : previousColumn,
        );

        this.runLocalHooks(
          'beforeColumnWrap',
          isActionInterrupted,
          this.#zeroBasedToVisualCoords(newCoords),
          isColumnOutOfRange,
        );

        if (autoWrapCol) {
          if (this.shouldSwitchSelectionLayer() && isColumnOutOfRange && this.#range.size() > 1) {
            this.#choosePreviousSelectionLayer();

            const nextLayerCoords = this.#findNonHiddenZeroBasedCoordsInSelection('backward');

            if (nextLayerCoords !== null) {
              newCoords.assign(nextLayerCoords);
            }
          }

          zeroBasedCoords.assign(newCoords);
        }
      }

      // the range size may be changed after the column wrap, so we need to recalculate it for row wrap
      ({ width, height } = this.#getTableSize());

      if (zeroBasedCoords.col >= width) {
        const isActionInterrupted = createObjectPropListener(
          createMissingRecords && minSpareCols > 0
        );
        const nextRow = zeroBasedCoords.row + 1;
        const isRowOutOfRange = nextRow >= height;
        const newCoords = this.tableApi.createCellCoords(
          isRowOutOfRange ? nextRow - height : nextRow,
          zeroBasedCoords.col - width,
        );

        this.runLocalHooks(
          'beforeRowWrap',
          isActionInterrupted,
          this.#zeroBasedToVisualCoords(newCoords),
          isRowOutOfRange,
        );

        if (isActionInterrupted.value) {
          this.runLocalHooks('insertColRequire', this.countRenderableColumns());

        } else if (autoWrapRow) {
          if (this.shouldSwitchSelectionLayer() && isRowOutOfRange && this.#range.size() > 1) {
            this.#chooseNextSelectionLayer();

            const nextLayerCoords = this.#findNonHiddenZeroBasedCoordsInSelection('forward');

            if (nextLayerCoords !== null) {
              newCoords.assign(nextLayerCoords);
            }
          }

          zeroBasedCoords.assign(newCoords);
        }

      } else if (zeroBasedCoords.col < 0) {
        const isActionInterrupted = createObjectPropListener(autoWrapRow);
        const previousRow = zeroBasedCoords.row - 1;
        const isRowOutOfRange = previousRow < 0;
        const newCoords = this.tableApi.createCellCoords(
          isRowOutOfRange ? height + previousRow : previousRow,
          width + zeroBasedCoords.col,
        );

        this.runLocalHooks(
          'beforeRowWrap',
          isActionInterrupted,
          this.#zeroBasedToVisualCoords(newCoords),
          isRowOutOfRange,
        );

        if (autoWrapRow) {
          if (this.shouldSwitchSelectionLayer() && isRowOutOfRange && this.#range.size() > 1) {
            this.#choosePreviousSelectionLayer();

            const nextLayerCoords = this.#findNonHiddenZeroBasedCoordsInSelection('backward');

            if (nextLayerCoords !== null) {
              newCoords.assign(nextLayerCoords);
            }
          }

          zeroBasedCoords.assign(newCoords);
        }
      }

      const { rowDir, colDir } = this.#clampCoords(zeroBasedCoords);

      rowTransformDir = rowDir;
      colTransformDir = colDir;
      visualCoords = this.#zeroBasedToVisualCoords(zeroBasedCoords);
    }

    this.runLocalHooks('afterTransformStart', visualCoords, rowTransformDir, colTransformDir);

    return {
      selectionLayer: this.#activeLayerIndex,
      visualCoords,
    };
  }

  /**
   * Sets selection end cell relative to the current selection end cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   * @returns {{selectionLayer: number, visualCoords: CellCoords}} Visual coordinates with selection layer after transformation.
   */
  transformEnd(rowDelta, colDelta) {
    this.#offset = this.calculateOffset();

    const delta = this.tableApi.createCellCoords(rowDelta, colDelta);
    const cellRange = this.getCurrentSelection();
    const highlightRenderableCoords = this.tableApi.visualToRenderableCoords(cellRange.highlight);
    const toRow = this.#findFirstNonHiddenZeroBasedRow(cellRange.to.row, cellRange.from.row);
    const toColumn = this.#findFirstNonHiddenZeroBasedColumn(cellRange.to.col, cellRange.from.col);
    const visualCoords = cellRange.to.clone();
    let rowTransformDir = 0;
    let colTransformDir = 0;

    this.runLocalHooks('beforeTransformEnd', delta);

    if (
      highlightRenderableCoords.row !== null && highlightRenderableCoords.col !== null &&
      toRow !== null && toColumn !== null
    ) {
      const {
        row: highlightRow,
        col: highlightColumn,
      } = this.#visualToZeroBasedCoords(cellRange.highlight);
      const coords = this.tableApi.createCellCoords(toRow + delta.row, toColumn + delta.col);
      const topStartCorner = cellRange.getTopStartCorner();
      const topEndCorner = cellRange.getTopEndCorner();
      const bottomEndCorner = cellRange.getBottomEndCorner();

      if (delta.col < 0 && toColumn >= highlightColumn && coords.col < highlightColumn) {
        const columnRestDelta = coords.col - highlightColumn;

        coords.col = this.#findFirstNonHiddenZeroBasedColumn(topStartCorner.col, topEndCorner.col) + columnRestDelta;

      } else if (delta.col > 0 && toColumn <= highlightColumn && coords.col > highlightColumn) {
        const endColumnIndex = this.#findFirstNonHiddenZeroBasedColumn(topEndCorner.col, topStartCorner.col);
        const columnRestDelta = Math.max(coords.col - endColumnIndex, 1);

        coords.col = endColumnIndex + columnRestDelta;
      }

      if (delta.row < 0 && toRow >= highlightRow && coords.row < highlightRow) {
        const rowRestDelta = coords.row - highlightRow;

        coords.row = this.#findFirstNonHiddenZeroBasedRow(topStartCorner.row, bottomEndCorner.row) + rowRestDelta;

      } else if (delta.row > 0 && toRow <= highlightRow && coords.row > highlightRow) {
        const bottomRowIndex = this.#findFirstNonHiddenZeroBasedRow(bottomEndCorner.row, topStartCorner.row);
        const rowRestDelta = Math.max(coords.row - bottomRowIndex, 1);

        coords.row = bottomRowIndex + rowRestDelta;
      }

      const { rowDir, colDir } = this.#clampCoords(coords);

      rowTransformDir = rowDir;
      colTransformDir = colDir;

      const newVisualCoords = this.#zeroBasedToVisualCoords(coords);

      if (delta.row === 0 && delta.col !== 0) {
        visualCoords.col = newVisualCoords.col;

      } else if (delta.row !== 0 && delta.col === 0) {
        visualCoords.row = newVisualCoords.row;

      } else {
        visualCoords.row = newVisualCoords.row;
        visualCoords.col = newVisualCoords.col;
      }
    }

    this.runLocalHooks('afterTransformEnd', visualCoords, rowTransformDir, colTransformDir);

    return {
      selectionLayer: this.#activeLayerIndex,
      visualCoords,
    };
  }

  /**
   * Abstract method that child classes must implement to calculate offset coordinates based on
   * the current processed selection layer.
   */
  calculateOffset() {
    throw new Error('`calculateOffset` is not implemented', { cause: { handsontable: true } });
  }

  /**
   * Abstract method that child classes must implement to provide the count of renderable rows
   * based on their specific transformation logic.
   */
  countRenderableRows() {
    throw new Error('`countRenderableRows` is not implemented', { cause: { handsontable: true } });
  }

  /**
   * Abstract method that child classes must implement to provide the count of renderable columns
   * based on their specific transformation logic.
   */
  countRenderableColumns() {
    throw new Error('`countRenderableColumns` is not implemented', { cause: { handsontable: true } });
  }

  /**
   * Determines whether selection layer switching should occur during transformation.
   * Child classes can override this method to control the behavior.
   */
  shouldSwitchSelectionLayer() {
    throw new Error('`shouldSwitchSelectionLayer` is not implemented', { cause: { handsontable: true } });
  }

  /**
   * Chooses the next selection layer as active one.
   */
  #chooseNextSelectionLayer() {
    const layerIndex = this.#activeLayerIndex + 1;

    this.setActiveLayerIndex(layerIndex >= this.#range.size() ? 0 : layerIndex);

    this.#offset = this.calculateOffset();
  }

  /**
   * Chooses the previous selection layer as active one.
   */
  #choosePreviousSelectionLayer() {
    const layerIndex = this.#activeLayerIndex - 1;

    this.setActiveLayerIndex(layerIndex < 0 ? this.#range.size() - 1 : layerIndex);

    this.#offset = this.calculateOffset();
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
  #getTableSize() {
    return {
      width: this.#offset.x + this.countRenderableColumns(),
      height: this.#offset.y + this.countRenderableRows(),
    };
  }

  /**
   * Finds non-hidden zero-based coordinates in the current selection range.
   *
   * @param {'forward' | 'backward'} direction The direction to search within the selection.
   * @returns {CellCoords | null} Zero-based coordinates or null if not found.
   */
  #findNonHiddenZeroBasedCoordsInSelection(direction) {
    if (!['forward', 'backward'].includes(direction)) {
      return null;
    }

    const topStartCoords = this.getCurrentSelection().getTopStartCorner();
    const bottomEndCoords = this.getCurrentSelection().getBottomEndCorner();
    const [
      visualRowFrom,
      visualRowTo,
      visualColumnFrom,
      visualColumnTo,
    ] = direction === 'forward'
      ? [topStartCoords.row, bottomEndCoords.row, topStartCoords.col, bottomEndCoords.col]
      : [bottomEndCoords.row, topStartCoords.row, bottomEndCoords.col, topStartCoords.col];

    const zeroBasedRow = this.#findFirstNonHiddenZeroBasedRow(visualRowFrom, visualRowTo);
    const zeroBasedCol = this.#findFirstNonHiddenZeroBasedColumn(visualColumnFrom, visualColumnTo);

    if (zeroBasedRow === null || zeroBasedCol === null) {
      return null;
    }

    return this.tableApi.createCellCoords(zeroBasedRow, zeroBasedCol);
  }

  /**
   * Finds the first non-hidden zero-based row in the table range.
   *
   * @param {number} visualRowFrom The visual row from which the search should start.
   * @param {number} visualRowTo The visual row to which the search should end.
   * @returns {number | null}
   */
  #findFirstNonHiddenZeroBasedRow(visualRowFrom, visualRowTo) {
    const row = this.tableApi.findFirstNonHiddenRenderableRow(visualRowFrom, visualRowTo);

    if (row === null) {
      return null;
    }

    return this.#offset.y + row;
  }

  /**
   * Finds the first non-hidden zero-based column in the table range.
   *
   * @param {number} visualColumnFrom The visual column from which the search should start.
   * @param {number} visualColumnTo The visual column to which the search should end.
   * @returns {number | null}
   */
  #findFirstNonHiddenZeroBasedColumn(visualColumnFrom, visualColumnTo) {
    const column = this.tableApi.findFirstNonHiddenRenderableColumn(visualColumnFrom, visualColumnTo);

    if (column === null) {
      return null;
    }

    return this.#offset.x + column;
  }

  /**
   * Translates the visual coordinates to zero-based ones.
   *
   * @param {CellCoords} visualCoords The visual coords to process.
   * @returns {CellCoords}
   */
  #visualToZeroBasedCoords(visualCoords) {
    const { row, col } = this.tableApi.visualToRenderableCoords(visualCoords);

    if (row === null || col === null) {
      throw new Error('Renderable coords are not visible.', { cause: { handsontable: true } });
    }

    return this.tableApi.createCellCoords(this.#offset.y + row, this.#offset.x + col);
  }

  /**
   * Translates the zero-based coordinates to visual ones.
   *
   * @param {CellCoords} zeroBasedCoords The coordinates to process.
   * @returns {CellCoords}
   */
  #zeroBasedToVisualCoords(zeroBasedCoords) {
    const coords = zeroBasedCoords.clone();

    coords.col = zeroBasedCoords.col - this.#offset.x;
    coords.row = zeroBasedCoords.row - this.#offset.y;

    return this.tableApi.renderableToVisualCoords(coords);
  }
}

mixin(BaseTransformation, localHooks);
