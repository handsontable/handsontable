import { arrayEach, arrayMap } from '../../../helpers/array';
import { hasOwnProperty } from '../../../helpers/object';
import { hasClass } from '../../../helpers/dom/element';
import { SEPARATOR } from './../predefinedItems';
import { MENU_ITEM_MIXED, type MenuItemCheckedState } from '../utils';

interface CellRangeLike {
  getTopStartCorner(): { row: number | null; col: number | null };
  getBottomEndCorner(): { row: number | null; col: number | null };
}

export { MENU_ITEM_MIXED, type MenuItemCheckedState };

export interface MenuItemLike {
  name?: string;
  disabled?: boolean | (() => boolean);
  disableSelection?: boolean;
  submenu?: Record<string, unknown>;
  hidden?: boolean | (() => boolean);
  checkable?: boolean;
  checked?: MenuItemCheckedState | (() => MenuItemCheckedState);
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
 * Declaring `checked` is enough. An item that draws a check mark has to be announced as a
 * checkbox, or the mark is visible with nothing behind it: `aria-checked` is only valid on
 * `menuitemcheckbox`, so leaving such an item as a plain `menuitem` makes its two states
 * indistinguishable to a screen reader.
 *
 * @param {object} itemToTest Item element.
 * @returns {boolean}
 */
export function isItemCheckable(itemToTest: MenuItemLike) {
  const { checked } = itemToTest;

  // Tested by type rather than by presence, and not by the resolved value. By presence, a custom
  // item carrying an unrelated property named `checked` (a string, say) would change role on
  // upgrade; by resolved value, an item would be a checkbox only while it happened to be checked,
  // so unchecking it would drop the `aria-checked="false"` that conveys the state.
  //
  // `MENU_ITEM_MIXED` is matched as that one literal rather than as "any string", which keeps the
  // rule above intact while closing the hole it would otherwise leave: a static `checked: 'mixed'`
  // draws a mark, and a mark on a plain `menuitem` is a mark a screen reader cannot explain.
  return itemToTest.checkable === true ||
         typeof checked === 'boolean' ||
         checked === MENU_ITEM_MIXED ||
         typeof checked === 'function';
}

/**
 * Check if the provided element presents the menu item that is currently checked.
 *
 * @param {object} itemToTest Item element.
 * @param {object} hot The context for the item function.
 * @returns {boolean}
 */
export function isItemChecked(itemToTest: MenuItemLike, hot: Record<string, unknown>) {
  return getItemCheckedState(itemToTest, hot) === true;
}

/**
 * Resolves the check-mark state of the provided menu item.
 *
 * Three states, not two: an item whose selection is partly on reports `MENU_ITEM_MIXED`, which the
 * renderer draws as a dash and passes to `aria-checked` verbatim. Anything other than `true` or
 * that one literal is `false`, so an item written against the two-state API is unaffected.
 *
 * @param {object} itemToTest Item element.
 * @param {object} hot The context for the item function.
 * @returns {boolean|string}
 */
export function getItemCheckedState(
  itemToTest: MenuItemLike, hot: Record<string, unknown>
): MenuItemCheckedState {
  const { checked } = itemToTest;
  const state = typeof checked === 'function' ? checked.call(hot) : checked;

  if (state === MENU_ITEM_MIXED) {
    return MENU_ITEM_MIXED;
  }

  return state === true;
}
