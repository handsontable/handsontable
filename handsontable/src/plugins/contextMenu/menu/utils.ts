import { arrayEach, arrayMap } from '../../../helpers/array';
import { hasOwnProperty } from '../../../helpers/object';
import { hasClass } from '../../../helpers/dom/element';
import { SEPARATOR } from './../predefinedItems';

interface CellRangeLike {
  getTopStartCorner(): { row: number; col: number };
  getBottomEndCorner(): { row: number; col: number };
}

interface MenuItemLike {
  name?: string;
  disabled?: boolean | (() => boolean);
  disableSelection?: boolean;
  submenu?: Record<string, unknown>;
  hidden?: boolean | (() => boolean);
  checkable?: boolean;
  [key: string]: unknown;
}

/**
 * @param {CellRange[]} selRanges An array of the cell ranges.
 * @returns {object[]}
 */
export function normalizeSelection(selRanges: CellRangeLike[]) {
  return arrayMap(selRanges, (range: unknown) => ({
    start: (range as CellRangeLike).getTopStartCorner(),
    end: (range as CellRangeLike).getBottomEndCorner(),
  }));
}

/**
 * Check if the provided element is a submenu opener.
 *
 * @param {object} itemToTest Item element.
 * @returns {boolean}
 */
export function isItemSubMenu(itemToTest: MenuItemLike) {
  return hasOwnProperty(itemToTest, 'submenu');
}

/**
 * Check if the provided element is a menu separator.
 *
 * @param {object} itemToTest Item element.
 * @returns {boolean}
 */
export function isItemSeparator(itemToTest: MenuItemLike) {
  return new RegExp(SEPARATOR, 'i').test(itemToTest.name ?? '');
}

/**
 * Check if the provided element presents the disabled menu item.
 *
 * @param {object} itemToTest Item element.
 * @param {object} hot The context for the item function.
 * @returns {boolean}
 */
export function isItemDisabled(itemToTest: MenuItemLike, hot: Record<string, unknown>) {
  return itemToTest.disabled === true ||
         (typeof itemToTest.disabled === 'function' && itemToTest.disabled.call(hot) === true);
}

/**
 * Check if the provided element presents the disabled selection menu item.
 *
 * @param {object} itemToTest Item element.
 * @returns {boolean}
 */
export function isItemSelectionDisabled(itemToTest: MenuItemLike) {
  return hasOwnProperty(itemToTest, 'disableSelection');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function isSeparator(cell: HTMLElement) {
  return hasClass(cell, 'htSeparator');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function hasSubMenu(cell: HTMLElement) {
  return hasClass(cell, 'htSubmenu');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function isDisabled(cell: HTMLElement) {
  return hasClass(cell, 'htDisabled');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function isSelectionDisabled(cell: HTMLElement) {
  return hasClass(cell, 'htSelectionDisabled');
}

/**
 * @param {object} item The object which describes the context menu item properties.
 * @param {Core} instance The Handsontable instance.
 * @returns {boolean}
 */
export function isItemHidden(item: MenuItemLike, instance: Record<string, unknown>) {
  return !item.hidden || !(typeof item.hidden === 'function' && item.hidden.call(instance));
}

/**
 * @param {object[]} items The context menu items collection.
 * @param {string} separator The string which identifies the context menu separator item.
 * @returns {object[]}
 */
function shiftSeparators(items: MenuItemLike[], separator: string) {
  const result = items.slice(0);

  for (let i = 0; i < result.length;) {
    if (result[i].name === separator) {
      result.shift();
    } else {
      break;
    }
  }

  return result;
}

/**
 * @param {object[]} items The context menu items collection.
 * @param {string} separator The string which identifies the context menu separator item.
 * @returns {object[]}
 */
function popSeparators(items: MenuItemLike[], separator: string) {
  let result = items.slice(0);

  result.reverse();
  result = shiftSeparators(result, separator);
  result.reverse();

  return result;
}

/**
 * Removes duplicated menu separators from the context menu items collection.
 *
 * @param {object[]} items The context menu items collection.
 * @returns {object[]}
 */
function removeDuplicatedSeparators(items: MenuItemLike[]) {
  const result: MenuItemLike[] = [];

  arrayEach(items, (value: unknown, index: unknown) => {
    const item = value as MenuItemLike;

    if ((index as number) > 0) {
      if (result[result.length - 1].name !== item.name) {
        result.push(item);
      }
    } else {
      result.push(item);
    }
  });

  return result;
}

/**
 * Removes menu separators from the context menu items collection.
 *
 * @param {object[]} items The context menu items collection.
 * @param {string} separator The string which identifies the context menu separator item.
 * @returns {object[]}
 */
export function filterSeparators(items: MenuItemLike[], separator: string = SEPARATOR) {
  let result = items.slice(0);

  result = shiftSeparators(result, separator);
  result = popSeparators(result, separator);
  result = removeDuplicatedSeparators(result);

  return result;
}

/**
 * Check if the provided element presents the checkboxable menu item.
 *
 * @param {object} itemToTest Item element.
 * @returns {boolean}
 */
export function isItemCheckable(itemToTest: MenuItemLike) {
  return itemToTest.checkable === true;
}
