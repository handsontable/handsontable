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

export const ITEMS = [
  ROW_ABOVE, ROW_BELOW, COLUMN_LEFT, COLUMN_RIGHT, CLEAR_COLUMN, REMOVE_ROW, REMOVE_COLUMN, UNDO, REDO, READ_ONLY,
  ALIGNMENT, SEPARATOR
];

const _predefinedItems = {
  [SEPARATOR]: separatorItem,
  [ROW_ABOVE]: rowAboveItem,
  [ROW_BELOW]: rowBelowItem,
  [COLUMN_LEFT]: columnLeftItem,
  [COLUMN_RIGHT]: columnRightItem,
  [CLEAR_COLUMN]: clearColumnItem,
  [REMOVE_ROW]: removeRowItem,
  [REMOVE_COLUMN]: removeColumnItem,
  [UNDO]: undoItem,
  [REDO]: redoItem,
  [READ_ONLY]: readOnlyItem,
  [ALIGNMENT]: alignmentItem,
};

/**
 * Gets new object with all predefined menu items.
 *
 * @returns {Object}
 */
export function predefinedItems() {
  const items = {};

  objectEach(_predefinedItems, (itemFactory, key) => {
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
