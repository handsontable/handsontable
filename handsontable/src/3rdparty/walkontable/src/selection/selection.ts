import type CellCoords from '../cell/coords';
import type CellRange from '../cell/range';
import { mixin } from '../../../../helpers/object';
import localHooks from '../../../../mixins/localHooks';

/**
 * The Selection class allows highlighting (by applying CSS class) the table's cells or headers
 * and setting up the borders if defined in the settings.
 *
 * The Selection coordinates may point to the cells (positive numbers) or headers (negative numbers).
 *
 * @class Selection
 */
class Selection {
  declare settings: Record<string, unknown>;
  declare cellRange: CellRange | null;

  // Properties/methods added dynamically by mixin(Selection, localHooks)
  declare _localHooks: Record<string, Function[]>;
  declare addLocalHook: (key: string, callback: (...args: unknown[]) => void) => this;
  declare removeLocalHook: (key: string, callback: Function) => this;
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  declare clearLocalHooks: () => this;

  /**
   * @param {object} settings The selection settings object. @todo type.
   * @param {CellRange} cellRange The cell range instance.
   */
  constructor(settings: Record<string, unknown>, cellRange?: CellRange | null) {
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
  add(coords: CellCoords) {
    if (this.isEmpty()) {
      this.cellRange = (this.settings.createCellRange as (coords: CellCoords) => typeof this.cellRange)(coords);

    } else {
      this.cellRange!.expand(coords);
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
  replace(oldCoords: CellCoords, newCoords: CellCoords) {
    if (!this.isEmpty()) {
      if (this.cellRange!.from.isEqual(oldCoords)) {
        this.cellRange!.from = newCoords;

        return true;
      }
      if (this.cellRange!.to.isEqual(oldCoords)) {
        this.cellRange!.to = newCoords;

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
   * @returns {number[]} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getCorners() {
    const topStart = this.cellRange!.getOuterTopStartCorner();
    const bottomEnd = this.cellRange!.getOuterBottomEndCorner();

    return [
      topStart.row ?? 0,
      topStart.col ?? 0,
      bottomEnd.row ?? 0,
      bottomEnd.col ?? 0,
    ] as [number, number, number, number];
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this.runLocalHooks('destroy');
  }
}

mixin(Selection, localHooks);

export default Selection;
