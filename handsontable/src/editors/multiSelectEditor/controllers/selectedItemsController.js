import { isObjectEqual, isKeyValueObject } from '../../../helpers/object';
import { arrayToString } from '../../../helpers/array';
import { includesValue } from '../utils/utils';

/**
 * Controller for managing the selected items.
 *
 * @class SelectedItemsController
 */
export class SelectedItemsController {
  /**
   * Set of selected items.
   *
   * @private
   * @type {Set<*>}
   */
  selectedItems = this.selectedItems ?? new Set();

  /**
   * Creates a new SelectedItemsController.
   *
   * @param {Array<*>|undefined} selectedItems Array of selected items.
   */
  constructor(selectedItems) {
    if (Array.isArray(selectedItems)) {
      this.selectedItems = new Set(selectedItems);

    } else {
      this.selectedItems = new Set();
    }
  }

  /**
   * Adds selected values (single or array) to the set.
   *
   * @param {string|object|Array<string|object>} items Items to add.
   */
  add(items) {
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
  remove(item) {
    if (isKeyValueObject(item)) {
      const itemsArray = Array.from(this.selectedItems);
      const foundItem = itemsArray.find(selectedItem => isObjectEqual(selectedItem, item));

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
  has(value) {
    return includesValue(this.getItemsArray(), value);
  }

  /**
   * Clears the set.
   */
  clear() {
    this.selectedItems.clear();
  }

  /**
   * Gets the elements of the set.
   *
   * @returns {Array<*>}
   */
  getItemsArray() {
    return Array.from(this.selectedItems);
  }

  /**
   * Stringifies the selected items.
   *
   * @returns {string}
   */
  stringifyValues() {
    return arrayToString(this.getItemsArray().map((item) => {
      return isKeyValueObject(item) ? item.value : item;
    }), ', ');
  }

  /**
   * Stringifies the selected items.
   *
   * @returns {string}
   */
  stringifyItems() {
    return JSON.stringify(this.getItemsArray());
  }
}
