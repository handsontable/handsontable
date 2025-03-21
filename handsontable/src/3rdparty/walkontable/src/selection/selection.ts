import { mixin } from '../../../../helpers/object';
import localHooks from '../../../../mixins/localHooks';
import { SelectionSettings, CellRange, CellCoords, SelectionInterface } from './interfaces';

/**
 * The Selection class allows highlighting (by applying CSS class) the table's cells or headers
 * and setting up the borders if defined in the settings.
 *
 * The Selection coordinates may point to the cells (positive numbers) or headers (negative numbers).
 *
 * @class Selection
 */
class Selection implements SelectionInterface {
  /**
   * @param {object} settings The selection settings object. @todo type.
   * @param {CellRange} cellRange The cell range instance.
   */
  constructor(
    public settings: SelectionSettings,
    public cellRange: CellRange | null = null
  ) {
  }

  /**
   * Checks if selection is empty.
   *
   * @returns {boolean}
   */
  isEmpty(): boolean {
    return this.cellRange === null;
  }

  /**
   * Adds a cell coords to the selection.
   *
   * @param {CellCoords} coords The cell coordinates to add.
   * @returns {Selection}
   */
  add(coords: CellCoords): Selection {
    if (this.isEmpty()) {
      this.cellRange = this.settings.createCellRange(coords);

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
  replace(oldCoords: CellCoords, newCoords: CellCoords): boolean {
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
  clear(): Selection {
    this.cellRange = null;

    return this;
  }

  /**
   * Returns the top left (or top right in RTL) and bottom right (or bottom left in RTL) selection coordinates.
   *
   * @returns {number[]} Returns array of coordinates for example `[1, 1, 5, 5]`.
   */
  getCorners(): number[] {
    const topStart = this.cellRange!.getOuterTopStartCorner();
    const bottomEnd = this.cellRange!.getOuterBottomEndCorner();

    return [
      topStart.row,
      topStart.col,
      bottomEnd.row,
      bottomEnd.col,
    ];
  }

  /**
   * Destroys the instance.
   */
  destroy(): void {
    this.runLocalHooks('destroy');
  }

  /**
   * Adds a local hook to the component.
   *
   * @param {string} hookName The hook name.
   * @param {Function} callback The hook callback.
   */
  addLocalHook(hookName: string, callback: (...args: any[]) => void): void {
    // This method is added via mixin, but needs to be declared for TypeScript
  }

  /**
   * Runs the local hook registered under the hook name.
   *
   * @param {string} hookName The hook name.
   * @param {*} params Additional parameters passed to the hook callback.
   */
  runLocalHooks(hookName: string, ...params: any[]): void {
    // This method is added via mixin, but needs to be declared for TypeScript
  }
}

mixin(Selection, localHooks);

export default Selection;
