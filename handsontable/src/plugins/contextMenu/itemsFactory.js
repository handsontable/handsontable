import { objectEach, isObject, extend } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import {
  SEPARATOR,
  ITEMS,
  predefinedItems
} from './predefinedItems';

/**
 * Predefined items class factory for menu items.
 *
 * @class ItemsFactory
 * @plugin ContextMenu
 */
class ItemsFactory {
  constructor(hotInstance, orderPattern = null) {
    this.hot = hotInstance;
    this.predefinedItems = predefinedItems();
    this.defaultOrderPattern = orderPattern;
  }

  /**
   * Set predefined items.
   *
   * @param {Array} predefinedItemsCollection Array of predefined items.
   */
  setPredefinedItems(predefinedItemsCollection) {
    const items = {};

    this.defaultOrderPattern.length = 0;

    objectEach(predefinedItemsCollection, (value, key) => {
      let menuItemKey = '';

      if (value.name === SEPARATOR) {
        items[SEPARATOR] = value;
        menuItemKey = SEPARATOR;

        // Menu item added as a property to array
      } else if (isNaN(parseInt(key, 10))) {
        value.key = value.key === void 0 ? key : value.key;
        items[key] = value;
        menuItemKey = value.key;

      } else {
        items[value.key] = value;
        menuItemKey = value.key;
      }
      this.defaultOrderPattern.push(menuItemKey);
    });
    this.predefinedItems = items;
  }

  /**
   * Get all menu items based on pattern.
   *
   * @param {Array|object|boolean} pattern Pattern which you can define by displaying menu items order. If `true` default
   *                                       pattern will be used.
   * @returns {Array}
   */
  getItems(pattern = null) {
    return getItems(pattern, this.defaultOrderPattern, this.predefinedItems);
  }
}

/**
 * @param {object[]} itemsPattern The user defined menu items collection.
 * @param {object[]} defaultPattern The menu default items collection.
 * @param {object} items Additional options.
 * @returns {object[]} Returns parsed and merged menu items collection ready to render.
 */
function getItems(itemsPattern = null, defaultPattern = [], items = {}) {
  const result = [];
  let pattern = itemsPattern;

  if (pattern && pattern.items) {
    pattern = pattern.items;

  } else if (!Array.isArray(pattern)) {
    pattern = defaultPattern;
  }
  if (isObject(pattern)) {
    objectEach(pattern, (value, key) => {
      let item = items[typeof value === 'string' ? value : key];

      if (!item) {
        item = value;
      }
      if (isObject(value)) {
        extend(item, value);

      } else if (typeof item === 'string') {
        item = { name: item };
      }
      if (item.key === void 0) {
        item.key = key;
      }
      result.push(item);
    });
  } else {
    arrayEach(pattern, (name, key) => {
      let item = items[name];

      // Item deleted from settings `allowInsertRow: false` etc.
      if (!item && ITEMS.indexOf(name) >= 0) {
        return;
      }
      if (!item) {
        item = { name, key: `${key}` };
      }
      if (isObject(name)) {
        extend(item, name);
      }
      if (item.key === void 0) {
        item.key = key;
      }
      result.push(item);
    });
  }

  return result;
}

export default ItemsFactory;
