
import {objectEach, isObject, extend} from './../../helpers/object';
import {arrayEach} from './../../helpers/array';
import {
  ROW_ABOVE,
  ROW_BELOW,
  COLUMN_LEFT,
  COLUMN_RIGHT,
  REMOVE_ROW,
  REMOVE_COLUMN,
  UNDO,
  REDO,
  READ_ONLY,
  ALIGNMENT,
  SEPARATOR,
  predefinedItems
    } from './predefinedItems';


class ItemsFactory {
  static get DEFAULT_PATTERN() {
    return [
      ROW_ABOVE, ROW_BELOW,
      SEPARATOR,
      COLUMN_LEFT, COLUMN_RIGHT,
      SEPARATOR,
      REMOVE_ROW, REMOVE_COLUMN,
      SEPARATOR,
      UNDO, REDO,
      SEPARATOR,
      READ_ONLY,
      SEPARATOR,
      ALIGNMENT
    ];
  }

  constructor(hotInstance) {
    this.hot = hotInstance;
    this.predefinedItems = predefinedItems();
    this.defaultOrderPattern = ItemsFactory.DEFAULT_PATTERN;
  }

  /**
   * Set predefined items.
   *
   * @param {Array} predefinedItems
   */
  setPredefinedItems(predefinedItems) {
    let items = {};

    this.defaultOrderPattern.length = 0;

    objectEach(predefinedItems, (value, key) => {
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
   * Get only visible menu items based on pattern.
   *
   * @param {Array|Object|Boolean} pattern
   * @returns {Array}
   */
  getVisibleItems(pattern = null) {
    let visibleItems = {};

    objectEach(this.predefinedItems, (value, key) => {
      if (!value.hidden || value.hidden && !value.hidden.apply(this.hot)) {
        visibleItems[key] = value;
      }
    });

    return getItems(pattern, this.defaultOrderPattern, visibleItems);
  }

  /**
   * Get all menu items based on pattern.
   *
   * @param {Array|Object|Boolean} pattern
   * @returns {Array}
   */
  getItems(pattern = null) {
    return getItems(pattern, this.defaultOrderPattern, this.predefinedItems);
  }
}

function getItems(pattern = null, defaultPattern = ItemsFactory.DEFAULT_PATTERN, items = {}) {
  let result = [];

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
        item = {name: item};
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
      if (!item && ItemsFactory.DEFAULT_PATTERN.indexOf(name) >= 0) {
        return;
      }
      if (!item) {
        item = {name, key: key + ''};
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
  // TODO: Add function which will be cut all separators on the begining
  if (result[0].name === SEPARATOR) {
    result.shift();
  }

  return result;
}

export {ItemsFactory};
