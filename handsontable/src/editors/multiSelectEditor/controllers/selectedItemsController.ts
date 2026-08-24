import { isObjectEqual, isKeyValueObject } from '../../../helpers/object';
import { includesValue } from '../utils/utils';

/**
 * Controller for managing the selected items.
 *
 * @private
 * @class SelectedItemsController
 */
export class SelectedItemsController {
  /**
   * The set holding the currently selected item values.
   */
  selectedItems: Set<unknown>;
  /**
   * The maximum number of items that can be selected simultaneously.
   */
  maxSelectionsCount: number;

  /**
   * Creates a new SelectedItemsController.
   *
   * @param {Array<*>|undefined} selectedItems Array of selected items.
   */
  constructor(selectedItems?: unknown[]) {
    if (Array.isArray(selectedItems)) {
      this.selectedItems = new Set(selectedItems);
    } else {
      this.selectedItems = new Set();
    }
    this.maxSelectionsCount = Infinity;
  }

  /**
   * Sets the maximum number of selections.
   */
  setMaxSelectionCount(maxSelectionsCount: number): void {
    this.maxSelectionsCount = maxSelectionsCount;
  }

  /**
   * Adds selected values (single or array) to the set.
   *
   * @param {string|object|Array<string|object>} items Items to add.
   */
  add(items: unknown | unknown[]): void {
    if (this.selectedItems.size >= this.maxSelectionsCount) {
      return;
    }

    if (Array.isArray(items)) {
      items.forEach(item => this.selectedItems.add(item));
    } else {
      this.selectedItems.add(items);
    }
  }

  /**
   * Removes a selected value from the set.
   *
   * @param {string|object} item Item to remove.
   * @returns {boolean} True if the item was removed, false otherwise.
   */
  remove(item: unknown): boolean {
    if (isKeyValueObject(item)) {
      const itemsArray = Array.from(this.selectedItems);
      const foundItem = itemsArray.find(selectedItem => isObjectEqual(selectedItem as object, item as object));

      if (foundItem !== undefined) {
        this.selectedItems.delete(foundItem);

        return true;
      }
    } else {
      return this.selectedItems.delete(item);
    }

    return false;
  }

  /**
   * Checks if a value is in the set.
   *
   * @param {*} value Value to check.
   * @returns {boolean}
   */
  has(value: unknown): boolean {
    return includesValue(this.getItemsArray(), value);
  }

  /**
   * Clears the set.
   */
  clear(): void {
    this.selectedItems.clear();
  }

  /**
   * Gets the number of selected items.
   *
   * @returns {number}
   */
  getSize(): number {
    return this.selectedItems.size;
  }

  /**
   * Gets the elements of the set.
   *
   * @returns {Array<*>}
   */
  getItemsArray(): unknown[] {
    return Array.from(this.selectedItems);
  }
}
