import { mixin } from '../../../../helpers/object';
import localHooks from '../../../../mixins/localHooks';

/**
 * @class Selection
 */
class Selection {
  /**
   * @param {object} settings The selection settings object. @todo type.
   * @param {CellRange} cellRange The cell range instance.
   */
  constructor(settings, cellRange) {
    this.settings = settings;
    this.cellRange = cellRange || null;
  }

  /**
   * Checks if selection is empty.
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.cellRange === null;
  }

  /**
   * Adds a cell coords to the selection.
   *
   * @param {CellCoords} coords The cell coordinates to add.
   * @returns {Selection}
   */
  add(coords) {
    if (this.isEmpty()) {
      this.cellRange = this.settings.createCellRange(coords);

    } else {
      this.cellRange.expand(coords);
    }

    return this;
  }

  /**
   * If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean
   * information about success.
   *
   * @param {CellCoords} oldCoords An old cell coordinates to replace.
   * @param {CellCoords} newCoords The new cell coordinates.
   * @returns {boolean}
   */
  replace(oldCoords, newCoords) {
    if (!this.isEmpty()) {
      if (this.cellRange.from.isEqual(oldCoords)) {
        this.cellRange.from = newCoords;

        return true;
      }
      if (this.cellRange.to.isEqual(oldCoords)) {
        this.cellRange.to = newCoords;

        return true;
      }
    }

    return false;
  }

  /**
   * Clears selection.
   *
   * @returns {Selection}
   */
  clear() {
    this.cellRange = null;

    return this;
  }

  /**
   * Returns the top left (or top right in RTL) and bottom right (or bottom left in RTL) selection coordinates.
   *
   * @returns {Array} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getCorners() {
    const topStart = this.cellRange.getOuterTopStartCorner();
    const bottomEnd = this.cellRange.getOuterBottomEndCorner();

    return [
      topStart.row,
      topStart.col,
      bottomEnd.row,
      bottomEnd.col,
    ];
  }

  destroy() {
    this.runLocalHooks('destroy');
  }
}

mixin(Selection, localHooks);

export default Selection;
