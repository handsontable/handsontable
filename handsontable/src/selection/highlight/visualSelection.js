import { Selection } from './../../3rdparty/walkontable/src';

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
      this.visualCellRange = this.settings.createCellRange(coords);

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
   * @param {CellCoords} coords Starting point for finding destination coordinates
   * with visible coordinates (we are going from the starting coordinates to the end coordinates until the criteria are met).
   * @param {number} incrementByRow We are searching for a next visible rows by increasing (to be precise, or decreasing) indexes.
   * This variable represent indexes shift. We are looking for an index:
   * - for rows: from the left to the right (increasing indexes, then variable should have value 1) or
   * other way around (decreasing indexes, then variable should have the value -1)
   * - for columns: from the top to the bottom (increasing indexes, then variable should have value 1)
   * or other way around (decreasing indexes, then variable should have the value -1).
   * @param {number} incrementByColumn As above, just indexes shift for columns.
   * @returns {null|CellCoords} Visual cell coordinates.
   */
  findVisibleCoordsInRange(coords, incrementByRow, incrementByColumn = incrementByRow) {
    const nextVisibleRow = coords.row < 0 ? coords.row : this.settings
      .rowIndexMapper()
      .getNearestNotHiddenIndex(coords.row, incrementByRow);

    // There are no more visual rows in the range.
    if (nextVisibleRow === null) {
      return null;
    }

    const nextVisibleColumn = coords.col < 0 ? coords.col : this.settings
      .columnIndexMapper()
      .getNearestNotHiddenIndex(coords.col, incrementByColumn)

    // There are no more visual columns in the range.
    if (nextVisibleColumn === null) {
      return null;
    }

    return this.settings.createCellCoords(coords.row, coords.col);
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
    const rowIndexMapper = this.settings.rowIndexMapper();
    const columnIndexMapper = this.settings.columnIndexMapper();
    const fromRangeVisualRow = visualFromCoords.row < 0 ? visualFromCoords.row : rowIndexMapper
      .getNearestNotHiddenIndex(visualFromCoords.row, incrementByRow);
    const toRangeVisualRow =  visualToCoords.row < 0 ?  visualToCoords.row : rowIndexMapper
      .getNearestNotHiddenIndex(visualToCoords.row, -incrementByRow);
    const fromRangeVisualColumn = visualFromCoords.col < 0 ? visualFromCoords.col : columnIndexMapper
      .getNearestNotHiddenIndex(visualFromCoords.col, incrementByColumn);
    const toRangeVisualColumn = visualToCoords.col < 0 ? visualToCoords.col : columnIndexMapper
      .getNearestNotHiddenIndex(visualToCoords.col, -incrementByColumn);

    // All rows and columns ranges are hidden.
    if (fromRangeVisualRow === null && toRangeVisualRow === null &&
        fromRangeVisualColumn === null && toRangeVisualColumn === null) {
      return null;
    }

    return [
      this.settings.createCellCoords(fromRangeVisualRow, fromRangeVisualColumn),
      this.settings.createCellCoords(toRangeVisualRow, toRangeVisualColumn),
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
      incrementByRow,
      incrementByColumn
    );
    const toRangeVisual = this.findVisibleCoordsInRange(
      visualToCoords,
      -incrementByRow,
      -incrementByColumn
    );

    // There is no visual start point (and also visual end point) in the range.
    // We are looking for the first visible cell in a broader range.
    if (fromRangeVisual === null || toRangeVisual === null) {
      const isHeaderSelectionType = this.settings.type === 'header' || this.settings.type === 'active-header';
      let cellRange = null;

      // For the "header" selection type, find rows and column indexes, which should be
      // highlighted, although one of the axes is completely hidden.
      // if (isHeaderSelectionType) {
      //   const [fromRangeVisualHeader, toRangeVisualHeader] = this.findVisibleHeaderRange(
      //     visualFromCoords,
      //     visualToCoords,
      //     incrementByRow,
      //     incrementByColumn
      //   );

      //   cellRange = this.createRenderableCellRange(fromRangeVisualHeader, toRangeVisualHeader);
      // }

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
    const singleCellRangeVisual =
      this.findVisibleCoordsInRange(normFromCoords, incrementByRow, incrementByColumn);

    if (singleCellRangeVisual !== null) {
      // We can't show selection visually now, but we found fist visible range in the broader cell range.
      if (this.cellRange === null) {
        const singleCellRangeRenderable = this.settings.visualToRenderableCoords(singleCellRangeVisual);

        this.cellRange = this.settings.createCellRange(singleCellRangeRenderable);
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
    const topLeftCorner = this.settings.createCellCoords(
      isRowUndefined ? null : Math.min(from.row, to.row),
      isColumnUndefined ? null : Math.min(from.col, to.col),
    );
    const bottomRightCorner = this.settings.createCellCoords(
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
   * Returns the top left (or top right in RTL) and bottom right (or bottom left in RTL) selection
   * coordinates (visual indexes).
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getVisualCorners() {
    const topStart = this.settings.renderableToVisualCoords(this.cellRange.getTopStartCorner());
    const bottomEnd = this.settings.renderableToVisualCoords(this.cellRange.getBottomEndCorner());

    return [
      topStart.row,
      topStart.col,
      bottomEnd.row,
      bottomEnd.col,
    ];
  }

  /**
   * Creates a new CellRange object based on visual coordinates which before object creation are
   * translated to renderable indexes.
   *
   * @param {CellCoords} visualFromCoords The CellCoords object which contains coordinates that
   *                                      points to the beginning of the selection.
   * @param {CellCoords} visualToCoords The CellCoords object which contains coordinates that
   *                                    points to the end of the selection.
   * @returns {CellRange}
   */
  createRenderableCellRange(visualFromCoords, visualToCoords) {
    const renderableFromCoords = this.settings.visualToRenderableCoords(visualFromCoords);
    const renderableToCoords = this.settings.visualToRenderableCoords(visualToCoords);

    return this.settings.createCellRange(renderableFromCoords, renderableFromCoords, renderableToCoords);
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
