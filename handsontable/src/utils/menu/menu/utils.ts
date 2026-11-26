import { arrayEach, arrayMap } from '../../../helpers/array';
import { hasOwnProperty } from '../../../helpers/object';
import type { HotInstance } from '../../../core/types';
import { getDeepActiveElement, hasClass } from '../../../helpers/dom/element';
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
  /**
   * Marks a checkable item as one of a set the user picks exactly one of, so it is announced as
   * `menuitemradio`. Internal: the sheets bar's all-sheets menu sets it.
   */
  radio?: boolean;
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
 * Only a separator that follows another separator is dropped. Items are never compared by their
 * display name, so two neighboring items may share one label.
 *
 * @param {object[]} items The context menu items collection.
 * @param {string} separator The string which identifies the context menu separator item.
 * @returns {object[]}
 */
function removeDuplicatedSeparators(items: MenuItemLike[], separator: string) {
  const result: MenuItemLike[] = [];

  arrayEach(items, (value: unknown) => {
    const item = value as MenuItemLike;
    const previous = result[result.length - 1];
    const isRepeatedSeparator = previous !== undefined && item.name === separator && previous.name === separator;

    if (!isRepeatedSeparator) {
      result.push(item);
    }
  });

  return result;
}

interface MenuItemPositions {
  /**
   * The 1-based position of each visual row, `0` for a row that is not an item.
   */
  positions: number[];
  /**
   * The number of items the menu draws.
   */
  setSize: number;
}

/**
 * The positions of each menu grid's items, counted once per render. Dropped on the menu grid's
 * `beforeRender`, which runs before every render that can change the rows or hide some of them.
 */
const itemPositionsCache = new WeakMap<HotInstance, MenuItemPositions>();
/**
 * The menu grids that already drop their cached positions on `beforeRender`, so the hook is added
 * once per grid.
 */
const gridsDroppingPositions = new WeakSet<HotInstance>();

/**
 * Counts the position of every item a menu grid draws, in one walk over its rows.
 *
 * @param {Core} menuHot The menu's own Handsontable instance.
 * @returns {MenuItemPositions}
 */
function countMenuItemPositions(menuHot: HotInstance): MenuItemPositions {
  const rowCount = menuHot.countRows();
  const positions = new Array<number>(rowCount).fill(0);
  let setSize = 0;

  for (let row = 0; row < rowCount; row++) {
    const physicalRow = menuHot.toPhysicalRow(row);

    if (physicalRow === null || menuHot.rowIndexMapper.isHidden(physicalRow)) {
      continue;
    }

    const item = menuHot.getSourceDataAtRow(physicalRow) as MenuItemLike | undefined;

    if (!item || isItemSeparator(item)) {
      continue;
    }

    setSize += 1;
    positions[row] = setSize;
  }

  return { positions, setSize };
}

/**
 * Where a menu row sits among the items its menu draws, as `aria-posinset` and `aria-setsize` give it.
 *
 * Both count the rows a user can reach: a separator is not an item, and a row the menu grid hides
 * (the Filters plugin hides its second condition and the operators while the first condition is
 * "None") is not drawn. A disabled item still counts. Without both attributes each browser derived
 * the position from the table markup its own way, so screen readers disagreed on it (DEV-4172).
 *
 * The renderer asks for every cell, so the whole menu is counted once, on the first call of a render,
 * and the result is kept until the menu grid's next `beforeRender`.
 *
 * @param {Core} menuHot The menu's own Handsontable instance.
 * @param {number} visualRow The visual index of the row.
 * @returns {{position: number, setSize: number} | null} The 1-based position and the item count, or
 * `null` for a row that is not an item (a separator, a hidden row).
 */
export function getMenuItemPosition(
  menuHot: HotInstance,
  visualRow: number,
): { position: number; setSize: number } | null {
  let cached = itemPositionsCache.get(menuHot);

  if (!cached) {
    cached = countMenuItemPositions(menuHot);
    itemPositionsCache.set(menuHot, cached);

    if (!gridsDroppingPositions.has(menuHot)) {
      gridsDroppingPositions.add(menuHot);
      menuHot.addHook('beforeRender', () => itemPositionsCache.delete(menuHot));
    }
  }

  const position = cached.positions[visualRow] ?? 0;

  return position > 0 ? { position, setSize: cached.setSize } : null;
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
  result = removeDuplicatedSeparators(result, separator);

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

/**
 * Gives the browser focus to the highlighted cell of a grid once a menu opened from it has closed.
 *
 * Closing a menu destroys the menu's own grid together with the element that held the focus, so the
 * browser drops the focus to the document. A keyboard or screen reader user then loses their place
 * until the next key press. The focus moves only when it fell to the document or sits on the closed menu's
 * container: a command that put it on a real element (a comment editor, an outside field) keeps it. It does nothing for a grid that is
 * being destroyed or is detached from the page, and for a highlighted cell that is not rendered.
 *
 * @param {Core} hot The grid whose highlighted cell receives the focus.
 * @param {HTMLElement} [menuContainer] The closed menu's container. A focus left on it counts as fallen to
 * the document.
 */
export function returnFocusToGrid(hot: HotInstance, menuContainer?: HTMLElement | null) {
  // `isDestroyed` turns true at the very end of `destroy()`, after the grid emptied its root. A menu
  // closed by that teardown reaches here with no cell left to focus, and the root is already detached.
  if (hot.isDestroyed || !hot.rootElement.isConnected) {
    return;
  }

  const { rootDocument } = hot;
  const activeElement = getDeepActiveElement(rootDocument);

  // A menu opened with the mouse leaves the focus on its container. The container is hidden and emptied
  // on close but stays in the document, so the focus is still on it here: count that as fallen.
  const fellToDocument = !activeElement || activeElement === rootDocument.body ||
    (menuContainer?.contains(activeElement) ?? false);

  if (!fellToDocument) {
    return;
  }

  const highlight = hot.getSelectedRangeActive()?.highlight;

  if (!highlight || highlight.row === null || highlight.col === null) {
    return;
  }

  const cell = hot.getCell(highlight.row, highlight.col, true);

  // A cell that is not rendered would make the focus manager wait for the next scroll and then take
  // the focus, even from a field the user clicked in the meantime. The focus stays on the document.
  if (!cell) {
    return;
  }

  hot.getFocusManager().focusOnHighlightedCell(cell);
}
