var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import { objectEach, isObject, extend } from './../../helpers/object';
import { arrayEach } from './../../helpers/array';
import { SEPARATOR, ITEMS, predefinedItems } from './predefinedItems';

/**
 * Predefined items class factory for menu items.
 *
 * @class ItemsFactory
 * @plugin ContextMenu
 */

var ItemsFactory = function () {
  function ItemsFactory(hotInstance) {
    var orderPattern = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, ItemsFactory);

    this.hot = hotInstance;
    this.predefinedItems = predefinedItems();
    this.defaultOrderPattern = orderPattern;
  }

  /**
   * Set predefined items.
   *
   * @param {Array} predefinedItemsCollection Array of predefined items.
   */


  _createClass(ItemsFactory, [{
    key: 'setPredefinedItems',
    value: function setPredefinedItems(predefinedItemsCollection) {
      var _this = this;

      var items = {};

      this.defaultOrderPattern.length = 0;

      objectEach(predefinedItemsCollection, function (value, key) {
        var menuItemKey = '';

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
        _this.defaultOrderPattern.push(menuItemKey);
      });
      this.predefinedItems = items;
    }

    /**
     * Get all menu items based on pattern.
     *
     * @param {Array|Object|Boolean} pattern Pattern which you can define by displaying menu items order. If `true` default
     *                                       pattern will be used.
     * @returns {Array}
     */

  }, {
    key: 'getItems',
    value: function getItems() {
      var pattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      return _getItems(pattern, this.defaultOrderPattern, this.predefinedItems);
    }
  }]);

  return ItemsFactory;
}();

function _getItems() {
  var itemsPattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var defaultPattern = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var items = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var result = [];
  var pattern = itemsPattern;

  if (pattern && pattern.items) {
    pattern = pattern.items;
  } else if (!Array.isArray(pattern)) {
    pattern = defaultPattern;
  }
  if (isObject(pattern)) {
    objectEach(pattern, function (value, key) {
      var item = items[typeof value === 'string' ? value : key];

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
    arrayEach(pattern, function (name, key) {
      var item = items[name];

      // Item deleted from settings `allowInsertRow: false` etc.
      if (!item && ITEMS.indexOf(name) >= 0) {
        return;
      }
      if (!item) {
        item = { name: name, key: '' + key };
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