'use strict';

exports.__esModule = true;
exports.ITEMS = exports.UNDO = exports.SEPARATOR = exports.ROW_BELOW = exports.ROW_ABOVE = exports.REMOVE_ROW = exports.REMOVE_COLUMN = exports.REDO = exports.READ_ONLY = exports.COLUMN_RIGHT = exports.COLUMN_LEFT = exports.CLEAR_COLUMN = exports.ALIGNMENT = undefined;

var _predefinedItems2;

var _alignment = require('./predefinedItems/alignment');

Object.defineProperty(exports, 'ALIGNMENT', {
  enumerable: true,
  get: function get() {
    return _alignment.KEY;
  }
});

var _clearColumn = require('./predefinedItems/clearColumn');

Object.defineProperty(exports, 'CLEAR_COLUMN', {
  enumerable: true,
  get: function get() {
    return _clearColumn.KEY;
  }
});

var _columnLeft = require('./predefinedItems/columnLeft');

Object.defineProperty(exports, 'COLUMN_LEFT', {
  enumerable: true,
  get: function get() {
    return _columnLeft.KEY;
  }
});

var _columnRight = require('./predefinedItems/columnRight');

Object.defineProperty(exports, 'COLUMN_RIGHT', {
  enumerable: true,
  get: function get() {
    return _columnRight.KEY;
  }
});

var _readOnly = require('./predefinedItems/readOnly');

Object.defineProperty(exports, 'READ_ONLY', {
  enumerable: true,
  get: function get() {
    return _readOnly.KEY;
  }
});

var _redo = require('./predefinedItems/redo');

Object.defineProperty(exports, 'REDO', {
  enumerable: true,
  get: function get() {
    return _redo.KEY;
  }
});

var _removeColumn = require('./predefinedItems/removeColumn');

Object.defineProperty(exports, 'REMOVE_COLUMN', {
  enumerable: true,
  get: function get() {
    return _removeColumn.KEY;
  }
});

var _removeRow = require('./predefinedItems/removeRow');

Object.defineProperty(exports, 'REMOVE_ROW', {
  enumerable: true,
  get: function get() {
    return _removeRow.KEY;
  }
});

var _rowAbove = require('./predefinedItems/rowAbove');

Object.defineProperty(exports, 'ROW_ABOVE', {
  enumerable: true,
  get: function get() {
    return _rowAbove.KEY;
  }
});

var _rowBelow = require('./predefinedItems/rowBelow');

Object.defineProperty(exports, 'ROW_BELOW', {
  enumerable: true,
  get: function get() {
    return _rowBelow.KEY;
  }
});

var _separator = require('./predefinedItems/separator');

Object.defineProperty(exports, 'SEPARATOR', {
  enumerable: true,
  get: function get() {
    return _separator.KEY;
  }
});

var _undo = require('./predefinedItems/undo');

Object.defineProperty(exports, 'UNDO', {
  enumerable: true,
  get: function get() {
    return _undo.KEY;
  }
});
exports.predefinedItems = predefinedItems;
exports.addItem = addItem;

var _object = require('./../../helpers/object');

var _alignment2 = _interopRequireDefault(_alignment);

var _clearColumn2 = _interopRequireDefault(_clearColumn);

var _columnLeft2 = _interopRequireDefault(_columnLeft);

var _columnRight2 = _interopRequireDefault(_columnRight);

var _readOnly2 = _interopRequireDefault(_readOnly);

var _redo2 = _interopRequireDefault(_redo);

var _removeColumn2 = _interopRequireDefault(_removeColumn);

var _removeRow2 = _interopRequireDefault(_removeRow);

var _rowAbove2 = _interopRequireDefault(_rowAbove);

var _rowBelow2 = _interopRequireDefault(_rowBelow);

var _separator2 = _interopRequireDefault(_separator);

var _undo2 = _interopRequireDefault(_undo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ITEMS = exports.ITEMS = [_rowAbove.KEY, _rowBelow.KEY, _columnLeft.KEY, _columnRight.KEY, _clearColumn.KEY, _removeRow.KEY, _removeColumn.KEY, _undo.KEY, _redo.KEY, _readOnly.KEY, _alignment.KEY, _separator.KEY];

var _predefinedItems = (_predefinedItems2 = {}, _defineProperty(_predefinedItems2, _separator.KEY, _separator2.default), _defineProperty(_predefinedItems2, _rowAbove.KEY, _rowAbove2.default), _defineProperty(_predefinedItems2, _rowBelow.KEY, _rowBelow2.default), _defineProperty(_predefinedItems2, _columnLeft.KEY, _columnLeft2.default), _defineProperty(_predefinedItems2, _columnRight.KEY, _columnRight2.default), _defineProperty(_predefinedItems2, _clearColumn.KEY, _clearColumn2.default), _defineProperty(_predefinedItems2, _removeRow.KEY, _removeRow2.default), _defineProperty(_predefinedItems2, _removeColumn.KEY, _removeColumn2.default), _defineProperty(_predefinedItems2, _undo.KEY, _undo2.default), _defineProperty(_predefinedItems2, _redo.KEY, _redo2.default), _defineProperty(_predefinedItems2, _readOnly.KEY, _readOnly2.default), _defineProperty(_predefinedItems2, _alignment.KEY, _alignment2.default), _predefinedItems2);

/**
 * Gets new object with all predefined menu items.
 *
 * @returns {Object}
 */
function predefinedItems() {
  var items = {};

  (0, _object.objectEach)(_predefinedItems, function (itemFactory, key) {
    items[key] = itemFactory();
  });

  return items;
}

/**
 * Add new predefined menu item to the collection.
 *
 * @param {String} key Menu command id.
 * @param {Object} item Object command descriptor.
 */
function addItem(key, item) {
  if (ITEMS.indexOf(key) === -1) {
    _predefinedItems[key] = item;
  }
}