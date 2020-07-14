import { Selection, CellCoords, CellRange } from './../../3rdparty/walkontable/src';

class VisualSelection extends Selection {
  constructor(settings, visualCellRange) {
    super(settings, null);
    /**
     * Range of selection visually. Visual representation may have representation in a rendered selection.
     *
     * @type {null|CellRange}
     */
    this.visualCellRange = visualCellRange || null;

    this.commit();
  }
  /**
   * Adds a cell coords to the selection.
   *
   * @param {CellCoords} coords Visual coordinates of a cell.
   * @returns {VisualSelection}
   */
  add(coords) {
    if (this.visualCellRange === null) {
      this.visualCellRange = new CellRange(coords);

    } else {
      this.visualCellRange.expand(coords);
    }

    return this;
  }

  /**
   * Clears visual and renderable selection.
   *
   * @returns {VisualSelection}
   */
  clear() {
    this.visualCellRange = null;

    return super.clear();
  }

  /**
   * Search for the first visible coordinates in the range as range may start and/or end with the hidden index.
   *
   * @private
   * @param {CellCoords} startCoords Visual start coordinates for the range. Starting point for finding destination coordinates
   * with visible coordinates (we are going from the starting coordinates to the end coordinates until the criteria are met).
   * @param {CellCoords} endCoords Visual end coordinates for the range.
   * @param {number} incrementByRow We are searching for a next visible rows by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @param {number} incrementByColumn As above, just indexes shift for columns.
   * @returns {null|CellCoords} Visual cell coordinates.
   */
  findVisibleCoordsInRange(startCoords, endCoords, incrementByRow, incrementByColumn = incrementByRow) {
    const nextVisibleRow = this.findVisibleCoordsInRowsRange(startCoords.row, endCoords.row, incrementByRow);

    // There are no more visual rows in the range.
    if (nextVisibleRow === null) {
      return null;
    }

    const nextVisibleColumn = this.findVisibleCoordsInColumnsRange(startCoords.col, endCoords.col, incrementByColumn);

    // There are no more visual columns in the range.
    if (nextVisibleColumn === null) {
      return null;
    }

    return new CellCoords(nextVisibleRow, nextVisibleColumn);
  }

  /**
   * Searches the nearest visible row index, which is not hidden (is renderable).
   *
   * @private
   * @param {CellCoords} startVisibleRow Visual row index which starts the range. Starting point for finding
   * destination coordinates with visible coordinates (we are going from the starting coordinates to the end
   * coordinates until the criteria are met).
   * @param {CellCoords} endVisibleRow Visual row index which ends the range.
   * @param {number} incrementBy We are searching for a next visible rows by increasing (to be precise, or decreasing)
   * indexes. This variable represent indexes shift. From the left to the right (increasing indexes, then variable
   * should have value 1) or other way around (decreasing indexes, then variable should have the value -1).
   * @returns {number|null} The visual row index.
   */
  findVisibleCoordsInRowsRange(startVisibleRow, endVisibleRow, incrementBy) {
    const {
      row: startRowRenderable,
    } = this.settings.visualToRenderableCoords({ row: startVisibleRow, col: -1 });

    // There are no more visual rows in the range.
    if (endVisibleRow === startVisibleRow && startRowRenderable === null) {
      return null;
    }

    // We are looking for a next visible row in the range.
    if (startRowRenderable === null) {
      return this.findVisibleCoordsInRowsRange(startVisibleRow + incrementBy, endVisibleRow, incrementBy);
    }

    // We found visible row index in the range.
    return startVisibleRow;
  }

  /**
   * Searches the nearest visible column index, which is not hidden (is renderable).
   *
   * @private
   * @param {CellCoords} startVisibleColumn Visual column index which starts the range. Starting point for finding
   * destination coordinates with visible coordinates (we are going from the starting coordinates to the end
   * coordinates until the criteria are met).
   * @param {CellCoords} endVisibleColumn Visual column index which ends the range.
   * @param {number} incrementBy We are searching for a next visible columns by increasing (to be precise, or decreasing)
   * indexes. This variable represent indexes shift. From the top to the bottom (increasing indexes, then variable
   * should have value 1) or other way around (decreasing indexes, then variable should have the value -1).
   * @returns {number|null} The visual column index.
   */
  findVisibleCoordsInColumnsRange(startVisibleColumn, endVisibleColumn, incrementBy) {
    const {
      col: startColumnRenderable,
    } = this.settings.visualToRenderableCoords({ row: -1, col: startVisibleColumn });

    // There are no more visual columns in the range.
    if (endVisibleColumn === startVisibleColumn && startColumnRenderable === null) {
      return null;
    }

    // We are looking for a next visible column in the range.
    if (startColumnRenderable === null) {
      return this.findVisibleCoordsInColumnsRange(startVisibleColumn + incrementBy, endVisibleColumn, incrementBy);
    }

    // We found visible column index in the range.
    return startVisibleColumn;
  }

  /**
   * Searches the nearest visible column and row index, which is not hidden (is renderable). If one
   * of the axes' range is entirely hidden, then created CellCoords object will hold the `null` value
   * under a specific axis. For example, when we select the hidden column, then the calculated `col`
   * prop will be `null`. In that case, rows are calculated further (regardless of the column result)
   * to make rows header highlightable.
   *
   * @private
   * @param {CellCoords} visualFromCoords Visual start coordinates for the range. Starting point for finding destination coordinates
   * with visible coordinates (we are going from the starting coordinates to the end coordinates until the criteria are met).
   * @param {CellCoords} visualToCoords Visual end coordinates for the range.
   * @param {number} incrementByRow We are searching for a next visible rows by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @param {number} incrementByColumn As above, just indexes shift for columns.
   * @returns {CellCoords[]|null} Visual cell coordinates.
   */
  findVisibleHeaderRange(visualFromCoords, visualToCoords, incrementByRow, incrementByColumn) {
    const fromRangeVisualRow = this.findVisibleCoordsInRowsRange(
      visualFromCoords.row,
      visualToCoords.row,
      incrementByRow
    );
    const toRangeVisualRow = this.findVisibleCoordsInRowsRange(
      visualToCoords.row,
      visualFromCoords.row,
      -incrementByRow
    );
    const fromRangeVisualColumn = this.findVisibleCoordsInColumnsRange(
      visualFromCoords.col,
      visualToCoords.col,
      incrementByColumn
    );
    const toRangeVisualColumn = this.findVisibleCoordsInColumnsRange(
      visualToCoords.col,
      visualFromCoords.col,
      -incrementByColumn
    );

    // All rows and columns ranges are hidden.
    if (fromRangeVisualRow === null && toRangeVisualRow === null &&
        fromRangeVisualColumn === null && toRangeVisualColumn === null) {
      return null;
    }

    return [
      new CellCoords(fromRangeVisualRow, fromRangeVisualColumn),
      new CellCoords(toRangeVisualRow, toRangeVisualColumn),
    ];
  }

  /**
   * Override internally stored visual indexes added by the Selection's `add` function. It should be executed
   * at the end of process of adding visual selection coordinates.
   *
   * @returns {VisualSelection}
   */
  commit() {
    // There is no information about visual ranges, thus no selection may be displayed.
    if (this.visualCellRange === null) {
      return this;
    }

    const {
      from: visualFromCoords,
      to: visualToCoords,
    } = this.visualCellRange;

    // We may move in two different directions while searching for visible rows and visible columns.
    const incrementByRow = this.getRowSearchDirection(this.visualCellRange);
    const incrementByColumn = this.getColumnSearchDirection(this.visualCellRange);
    const fromRangeVisual = this.findVisibleCoordsInRange(
      visualFromCoords,
      visualToCoords,
      incrementByRow,
      incrementByColumn
    );
    const toRangeVisual = this.findVisibleCoordsInRange(
      visualToCoords,
      visualFromCoords,
      -incrementByRow,
      -incrementByColumn
    );

    // There is no visual start point (and also visual end point) in the range.
    // We are looking for the first visible cell in a broader range.
    if (fromRangeVisual === null || toRangeVisual === null) {
      const isHeaderSelectionType = this.settings.type === 'header';
      let cellRange = null;

      // For the "header" selection type, find rows and column indexes, which should be
      // highlighted, although one of the axes is completely hidden.
      if (isHeaderSelectionType) {
        const [fromRangeVisualHeader, toRangeVisualHeader] = this.findVisibleHeaderRange(
          visualFromCoords,
          visualToCoords,
          incrementByRow,
          incrementByColumn
        );

        cellRange = this.createRenderableCellRange(fromRangeVisualHeader, toRangeVisualHeader);
      }

      this.cellRange = cellRange;

    } else {
      this.cellRange = this.createRenderableCellRange(fromRangeVisual, toRangeVisual);
    }

    return this;
  }

  /**
   * Some selection may be a part of broader cell range. This function adjusting coordinates of current selection
   * and the broader cell range when needed (current selection can't be presented visually).
   *
   * @param {CellRange} broaderCellRange Visual range. Actual cell range may be contained in the broader cell range.
   * When there is no way to represent some cell range visually we try to find range containing just the first visible cell.
   *
   * Warn: Please keep in mind that this function may change coordinates of the handled broader range.
   *
   * @returns {VisualSelection}
   */
  adjustCoordinates(broaderCellRange) {
    // We may move in two different directions while searching for visible rows and visible columns.
    const incrementByRow = this.getRowSearchDirection(broaderCellRange);
    const incrementByColumn = this.getColumnSearchDirection(broaderCellRange);
    const normFromCoords = broaderCellRange.from.clone().normalize();
    const normToCoords = broaderCellRange.to.clone().normalize();
    const singleCellRangeVisual =
      this.findVisibleCoordsInRange(normFromCoords, normToCoords, incrementByRow, incrementByColumn);

    if (singleCellRangeVisual !== null) {
      // We can't show selection visually now, but we found fist visible range in the broader cell range.
      if (this.cellRange === null) {
        const singleCellRangeRenderable = this.settings.visualToRenderableCoords(singleCellRangeVisual);

        this.cellRange = new CellRange(singleCellRangeRenderable);
      }

      // We set new highlight as it might change (for example, when showing/hiding some cells from the broader selection range)
      // TODO: It is also handled by the `MergeCells` plugin while adjusting already modified coordinates. Should it?
      broaderCellRange.setHighlight(singleCellRangeVisual);

      return this;
    }

    // Fallback to the start of the range. It resets the previous highlight (for example, when all columns have been hidden).
    broaderCellRange.setHighlight(broaderCellRange.from);

    return this;
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates (renderable indexes).
   * The method overwrites the original method to support header selection for hidden cells.
   * To make the header selection working, the CellCoords and CellRange have to support not
   * complete coordinates (`null` values for example, `row: null`, `col: 2`).
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getCorners() {
    const { from, to } = this.cellRange;

    const isRowUndefined = from.row === null || to.row === null;
    const isColumnUndefined = from.col === null || to.col === null;
    const topLeftCorner = new CellCoords(
      isRowUndefined ? null : Math.min(from.row, to.row),
      isColumnUndefined ? null : Math.min(from.col, to.col),
    );
    const bottomRightCorner = new CellCoords(
      isRowUndefined ? null : Math.max(from.row, to.row),
      isColumnUndefined ? null : Math.max(from.col, to.col),
    );

    return [
      topLeftCorner.row,
      topLeftCorner.col,
      bottomRightCorner.row,
      bottomRightCorner.col,
    ];
  }

  /**
   * Returns the top left (TL) and bottom right (BR) selection coordinates (visual indexes).
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getVisualCorners() {
    const topLeft = this.settings.renderableToVisualCoords(this.cellRange.getTopLeftCorner());
    const bottomRight = this.settings.renderableToVisualCoords(this.cellRange.getBottomRightCorner());

    return [
      topLeft.row,
      topLeft.col,
      bottomRight.row,
      bottomRight.col,
    ];
  }

  /**
   * Creates a new CellRange object based on visual coordinates which before object creation are
   * translated to renderable indexes.
   *
   * @param {CellCoords} visualFromCoords The CellCoords object which contains coordinates that
   *                                      points to the begining of the selection.
   * @param {CellCoords} visualToCoords The CellCoords object which contains coordinates that
   *                                    points to the end of the selection.
   * @returns {CellRange}
   */
  createRenderableCellRange(visualFromCoords, visualToCoords) {
    const renderableFromCoords = this.settings.visualToRenderableCoords(visualFromCoords);
    const renderableToCoords = this.settings.visualToRenderableCoords(visualToCoords);

    return new CellRange(renderableFromCoords, renderableFromCoords, renderableToCoords);
  }

  /**
   * It returns rows shift needed for searching visual row.
   *
   * @private
   * @param {CellRange} cellRange Selection range.
   * @returns {number} Rows shift. It return 1 when we should increase indexes (moving from the top to the bottom) or
   * -1 when we should decrease indexes (moving other way around).
   */
  getRowSearchDirection(cellRange) {
    if (cellRange.from.row < cellRange.to.row) {
      return 1; // Increasing row indexes.
    }

    return -1; // Decreasing row indexes.
  }

  /**
   * It returns columns shift needed for searching visual column.
   *
   * @private
   * @param {CellRange} cellRange Selection range.
   * @returns {number} Columns shift. It return 1 when we should increase indexes (moving from the left to the right) or
   * -1 when we should decrease indexes (moving other way around).
   */
  getColumnSearchDirection(cellRange) {
    if (cellRange.from.col < cellRange.to.col) {
      return 1; // Increasing column indexes.
    }

    return -1; // Decreasing column indexes.
  }
}

export default VisualSelection;
