import { objectEach } from '../../../helpers/object';
import alignmentItem, { KEY as ALIGNMENT } from './alignment';
import clearColumnItem, { KEY as CLEAR_COLUMN } from './clearColumn';
import columnLeftItem, { KEY as COLUMN_LEFT } from './columnLeft';
import columnRightItem, { KEY as COLUMN_RIGHT } from './columnRight';
import readOnlyItem, { KEY as READ_ONLY } from './readOnly';
import redoItem, { KEY as REDO } from './redo';
import removeColumnItem, { KEY as REMOVE_COLUMN } from './removeColumn';
import removeRowItem, { KEY as REMOVE_ROW } from './removeRow';
import rowAboveItem, { KEY as ROW_ABOVE } from './rowAbove';
import rowBelowItem, { KEY as ROW_BELOW } from './rowBelow';
import separatorItem, { KEY as SEPARATOR } from './separator';
import noItemsItem, { KEY as NO_ITEMS } from './noItems';
import undoItem, { KEY as UNDO } from './undo';

export { KEY as ALIGNMENT } from './alignment';
export { KEY as CLEAR_COLUMN } from './clearColumn';
export { KEY as COLUMN_LEFT } from './columnLeft';
export { KEY as COLUMN_RIGHT } from './columnRight';
export { KEY as READ_ONLY } from './readOnly';
export { KEY as REDO } from './redo';
export { KEY as REMOVE_COLUMN } from './removeColumn';
export { KEY as REMOVE_ROW } from './removeRow';
export { KEY as ROW_ABOVE } from './rowAbove';
export { KEY as ROW_BELOW } from './rowBelow';
export { KEY as SEPARATOR } from './separator';
export { KEY as NO_ITEMS } from './noItems';
export { KEY as UNDO } from './undo';

export const ITEMS = [
  ROW_ABOVE, ROW_BELOW, COLUMN_LEFT, COLUMN_RIGHT, CLEAR_COLUMN, REMOVE_ROW, REMOVE_COLUMN, UNDO, REDO, READ_ONLY,
  ALIGNMENT, SEPARATOR, NO_ITEMS
];

const _predefinedItems = {
  [SEPARATOR]: separatorItem,
  [NO_ITEMS]: noItemsItem,
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
 * @returns {object}
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
 * @param {string} key Menu command id.
 * @param {object} item Object command descriptor.
 */
export function addItem(key, item) {
  if (ITEMS.indexOf(key) === -1) {
    _predefinedItems[key] = item;
  }
}
