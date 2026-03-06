/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * CellRangeToRenderableMapper is a utility responsible for converting CellRange instances
 * defined in visual coordinates (which may include hidden rows/columns) into renderable
 * coordinates (excluding hidden indices).
 *
 * This class encapsulates the translation logic, allowing other modules to operate
 * on renderable coordinates without needing to be aware of the underlying index mapping implementation.
 *
 * It promotes separation of concerns by decoupling the transformation logic from data structures
 * like CellRange or CellCoords, keeping those classes clean and focused on structural concerns.
 *
 * Example usage:
 *   import { resolveWithInstance } from './utils/staticRegister';
 *
 *   const cellRange = new CellRange(...);
 *   const renderableRange = resolveWithInstance(this.hot, 'cellRangeMapper')
 *     .toRenderable(cellRange);
 */
export class CellRangeToRenderableMapper {
  /**
   * The instance of the IndexMapper class for row indexes.
   *
   * @param {IndexMapper}
   */
  #rowIndexMapper;
  /**
   * The instance of the IndexMapper class for row indexes.
   *
   * @param {IndexMapper}
   */
  #columnIndexMapper;

  constructor({ rowIndexMapper, columnIndexMapper }) {
    this.#rowIndexMapper = rowIndexMapper;
    this.#columnIndexMapper = columnIndexMapper;
  }

  /**
   * Converts the visual coordinates of the CellRange instance to the renderable coordinates.
   *
   * @param {CellRange} range The CellRange instance with defined visual coordinates.
   * @returns {CellRange | null}
   */
  toRenderable(range) {
    const rowDirection = range.getVerticalDirection() === 'N-S' ? 1 : -1;
    const columnDirection = range.getHorizontalDirection() === 'W-E' ? 1 : -1;
    const from = this.#getNearestNotHiddenCoords(range.from, rowDirection, columnDirection);

    if (from === null) {
      return null;
    }

    const to = this.#getNearestNotHiddenCoords(range.to, -rowDirection, -columnDirection);

    if (to === null) {
      return null;
    }

    const newRange = range.clone();

    newRange.from = from;
    newRange.to = to;

    if (!newRange.includes(range.highlight)) {
      newRange.highlight = from;
    }

    return newRange;
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
  #getNearestNotHiddenCoords(coords, rowSearchDirection, columnSearchDirection = rowSearchDirection) {
    const nextVisibleRow = this.#getNearestNotHiddenIndex(
      this.#rowIndexMapper, coords.row, rowSearchDirection);

    if (nextVisibleRow === null) {
      return null;
    }

    const nextVisibleColumn = this.#getNearestNotHiddenIndex(
      this.#columnIndexMapper, coords.col, columnSearchDirection);

    if (nextVisibleColumn === null) {
      return null;
    }

    return coords.clone().assign({
      row: nextVisibleRow,
      col: nextVisibleColumn,
    });
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
  #getNearestNotHiddenIndex(indexMapper, visualIndex, searchDirection) {
    if (visualIndex < 0) {
      return visualIndex;
    }

    return indexMapper.getNearestNotHiddenIndex(visualIndex, searchDirection);
  }
}
