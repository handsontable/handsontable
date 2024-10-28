import { Selection } from './../../3rdparty/walkontable/src';

class VisualSelection extends Selection {
  /**
   * Range of selection visually. Visual representation may have representation in a rendered selection.
   *
   * @type {null|CellRange}
   */
  visualCellRange = null;

  constructor(settings, visualCellRange) {
    super(settings, null);
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
   * Trims the passed cell range object by removing all coordinates that points to the hidden rows
   * or columns. The result is a new cell range object that points only to the visible indexes or `null`.
   *
   * @private
   * @param {CellRange} cellRange Cells range object to be trimmed.
   * @returns {CellRange} Visual non-hidden cells range coordinates.
   */
  trimToVisibleCellsRangeOnly({ from, to }) {
    let visibleFromCoords = this.getNearestNotHiddenCoords(from, 1);
    let visibleToCoords = this.getNearestNotHiddenCoords(to, -1);

    if (visibleFromCoords === null || visibleToCoords === null) {
      return null;
    }

    if (visibleFromCoords.row > visibleToCoords.row || visibleFromCoords.col > visibleToCoords.col) {
      visibleFromCoords = from;
      visibleToCoords = to;
    }

    return this.settings.createCellRange(visibleFromCoords, visibleFromCoords, visibleToCoords);
  }

  /**
   * Gets nearest coordinates that points to the visible row and column indexes. If there are no visible
   * rows and/or columns the `null` value is returned.
   *
   * @private
   * @param {CellCoords} coords The coords object as starting point for finding the nearest visible coordinates.
   * @param {1|-1} rowSearchDirection The search direction. For value 1, it means searching from top to bottom for
   *                                  rows and from left to right for columns. For -1, it is the other way around.
   * @param {1|-1} columnSearchDirection The same as above but for rows.
   * @returns {CellCoords|null} Visual cell coordinates.
   */
  getNearestNotHiddenCoords(coords, rowSearchDirection, columnSearchDirection = rowSearchDirection) {
    const nextVisibleRow = this.getNearestNotHiddenIndex(
      this.settings.rowIndexMapper, coords.row, rowSearchDirection);

    // There are no more visual rows in the range.
    if (nextVisibleRow === null) {
      return null;
    }

    const nextVisibleColumn = this.getNearestNotHiddenIndex(
      this.settings.columnIndexMapper, coords.col, columnSearchDirection);

    // There are no more visual columns in the range.
    if (nextVisibleColumn === null) {
      return null;
    }

    return this.settings.createCellCoords(nextVisibleRow, nextVisibleColumn);
  }

  /**
   * Gets nearest visual index. If there are no visible rows or columns the `null` value is returned.
   *
   * @private
   * @param {IndexMapper} indexMapper The IndexMapper instance for specific axis.
   * @param {number} visualIndex The index as starting point for finding the nearest visible index.
   * @param {1|-1} searchDirection The search direction. For value 1, it means searching from top to bottom for
   *                               rows and from left to right for columns. For -1, it is the other way around.
   * @returns {number|null} Visual row/column index.
   */
  getNearestNotHiddenIndex(indexMapper, visualIndex, searchDirection) {
    if (visualIndex < 0) {
      return visualIndex;
    }

    return indexMapper.getNearestNotHiddenIndex(visualIndex, searchDirection);
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

    const trimmedCellRange = this.trimToVisibleCellsRangeOnly(this.visualCellRange);

    // There is no visual start point (and also visual end point) in the range.
    if (trimmedCellRange === null) {
      this.cellRange = null;
    } else {
      this.cellRange = this.createRenderableCellRange(trimmedCellRange.from, trimmedCellRange.to);
    }

    return this;
  }

  /**
   * Some selection may be a part of broader cell range. This function sync coordinates of current selection
   * and the broader cell range when needed (current selection can't be presented visually).
   *
   * @param {CellRange} broaderCellRange Visual range. Actual cell range may be contained in the broader cell range.
   * When there is no way to represent some cell range visually we try to find range containing just the first visible cell.
   *
   * Warn: Please keep in mind that this function may change coordinates of the handled broader range.
   *
   * @returns {VisualSelection}
   */
  syncWith(broaderCellRange) {
    const coordsFrom = broaderCellRange.from.clone().normalize();
    const rowDirection = broaderCellRange.getVerticalDirection() === 'N-S' ? 1 : -1;
    const columnDirection = broaderCellRange.getHorizontalDirection() === 'W-E' ? 1 : -1;
    const renderableHighlight = this.settings.visualToRenderableCoords(this.visualCellRange.highlight);
    let cellCoordsVisual = null;

    if (renderableHighlight === null || renderableHighlight.col === null || renderableHighlight.row === null) {
      cellCoordsVisual = this.getNearestNotHiddenCoords(coordsFrom, rowDirection, columnDirection);
    }

    if (cellCoordsVisual !== null && broaderCellRange.overlaps(cellCoordsVisual)) {
      const currentHighlight = broaderCellRange.highlight.clone();

      if (currentHighlight.row >= 0) {
        currentHighlight.row = cellCoordsVisual.row;
      }
      if (currentHighlight.col >= 0) {
        currentHighlight.col = cellCoordsVisual.col;
      }

      // We can't show selection visually now, but we found first visible range in the broader cell range.
      if (this.cellRange === null) {
        const cellCoordsRenderable = this.settings.visualToRenderableCoords(currentHighlight);

        this.cellRange = this.settings.createCellRange(cellCoordsRenderable);
      }

      // TODO
      // We set new highlight as it might change (for example, when showing/hiding some cells from the broader selection range)
      // TODO: It is also handled by the `MergeCells` plugin while adjusting already modified coordinates. Should it?
      broaderCellRange.setHighlight(currentHighlight);
    }

    // TODO
    // Sync the highlight coords from the visual selection layer with logical coords.
    if (this.settings.selectionType === 'focus' && renderableHighlight !== null && cellCoordsVisual === null) {
      broaderCellRange.setHighlight(this.visualCellRange.highlight);
    }

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

    return [
      Math.min(from.row, to.row),
      Math.min(from.col, to.col),
      Math.max(from.row, to.row),
      Math.max(from.col, to.col),
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
   * @returns {CellRange|null}
   */
  createRenderableCellRange(visualFromCoords, visualToCoords) {
    const renderableFromCoords = this.settings.visualToRenderableCoords(visualFromCoords);
    const renderableToCoords = this.settings.visualToRenderableCoords(visualToCoords);

    if (renderableFromCoords.row === null || renderableFromCoords.col === null ||
        renderableToCoords.row === null || renderableToCoords.col === null) {
      return null;
    }

    return this.settings.createCellRange(renderableFromCoords, renderableFromCoords, renderableToCoords);
  }
}

export default VisualSelection;
