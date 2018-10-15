var _predefinedItems2;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { objectEach } from './../../helpers/object';
import alignmentItem, { KEY as ALIGNMENT } from './predefinedItems/alignment';
import clearColumnItem, { KEY as CLEAR_COLUMN } from './predefinedItems/clearColumn';
import columnLeftItem, { KEY as COLUMN_LEFT } from './predefinedItems/columnLeft';
import columnRightItem, { KEY as COLUMN_RIGHT } from './predefinedItems/columnRight';
import readOnlyItem, { KEY as READ_ONLY } from './predefinedItems/readOnly';
import redoItem, { KEY as REDO } from './predefinedItems/redo';
import removeColumnItem, { KEY as REMOVE_COLUMN } from './predefinedItems/removeColumn';
import removeRowItem, { KEY as REMOVE_ROW } from './predefinedItems/removeRow';
import rowAboveItem, { KEY as ROW_ABOVE } from './predefinedItems/rowAbove';
import rowBelowItem, { KEY as ROW_BELOW } from './predefinedItems/rowBelow';
import separatorItem, { KEY as SEPARATOR } from './predefinedItems/separator';
import undoItem, { KEY as UNDO } from './predefinedItems/undo';

export { KEY as ALIGNMENT } from './predefinedItems/alignment';
export { KEY as CLEAR_COLUMN } from './predefinedItems/clearColumn';
export { KEY as COLUMN_LEFT } from './predefinedItems/columnLeft';
export { KEY as COLUMN_RIGHT } from './predefinedItems/columnRight';
export { KEY as READ_ONLY } from './predefinedItems/readOnly';
export { KEY as REDO } from './predefinedItems/redo';
export { KEY as REMOVE_COLUMN } from './predefinedItems/removeColumn';
export { KEY as REMOVE_ROW } from './predefinedItems/removeRow';
export { KEY as ROW_ABOVE } from './predefinedItems/rowAbove';
export { KEY as ROW_BELOW } from './predefinedItems/rowBelow';
export { KEY as SEPARATOR } from './predefinedItems/separator';
export { KEY as UNDO } from './predefinedItems/undo';

export var ITEMS = [ROW_ABOVE, ROW_BELOW, COLUMN_LEFT, COLUMN_RIGHT, CLEAR_COLUMN, REMOVE_ROW, REMOVE_COLUMN, UNDO, REDO, READ_ONLY, ALIGNMENT, SEPARATOR];

var _predefinedItems = (_predefinedItems2 = {}, _defineProperty(_predefinedItems2, SEPARATOR, separatorItem), _defineProperty(_predefinedItems2, ROW_ABOVE, rowAboveItem), _defineProperty(_predefinedItems2, ROW_BELOW, rowBelowItem), _defineProperty(_predefinedItems2, COLUMN_LEFT, columnLeftItem), _defineProperty(_predefinedItems2, COLUMN_RIGHT, columnRightItem), _defineProperty(_predefinedItems2, CLEAR_COLUMN, clearColumnItem), _defineProperty(_predefinedItems2, REMOVE_ROW, removeRowItem), _defineProperty(_predefinedItems2, REMOVE_COLUMN, removeColumnItem), _defineProperty(_predefinedItems2, UNDO, undoItem), _defineProperty(_predefinedItems2, REDO, redoItem), _defineProperty(_predefinedItems2, READ_ONLY, readOnlyItem), _defineProperty(_predefinedItems2, ALIGNMENT, alignmentItem), _predefinedItems2);

/**
 * Gets new object with all predefined menu items.
 *
 * @returns {Object}
 */
export function predefinedItems() {
  var items = {};

  objectEach(_predefinedItems, function (itemFactory, key) {
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
export function addItem(key, item) {
  if (ITEMS.indexOf(key) === -1) {
    _predefinedItems[key] = item;
  }
}