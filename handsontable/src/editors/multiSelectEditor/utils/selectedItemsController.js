import { isObjectEqual, isKeyValueObject } from '../../../helpers/object';
import { arrayToString } from '../../../helpers/array';

/**
 * Controller for managing the selected items.
 *
 * @class SelectedItemsController
 */
export class SelectedItemsController {
  /**
   * Creates a new SelectedItemsController.
   *
   * @constructor
   */
  constructor(selectedItems) {
    if (Array.isArray(selectedItems)) {
      this.selectedItems = new Set(selectedItems);

    } else {
      this.selectedItems = new Set();
    }
  }

  /**
   * Adds a selected value to the set.
   *
   * @param {string|{key: string, value: string}} selectedItem
   */
  add(selectedItem) {
    this.selectedItems.add(selectedItem);
  }

  /**
   * Removes a selected value from the set.
   *
   * @param {string|{key: string, value: string}} selectedItem
   */
  remove(item) {
    if (isKeyValueObject(item)) {
      for (const selectedItem of this.selectedItems) {
        if (isObjectEqual(selectedItem, item)) {
          this.selectedItems.delete(selectedItem);
  
          return true;
        }
      }

    } else {
      this.selectedItems.delete(item);
    }

    return false;
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
    return arrayToString(this.getItemsArray().map(item => isKeyValueObject(item) ? item.value : item), ', ');
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