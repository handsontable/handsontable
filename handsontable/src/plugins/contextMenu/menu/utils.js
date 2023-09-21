import { arrayEach, arrayMap } from '../../../helpers/array';
import { hasClass } from '../../../helpers/dom/element';
import { SEPARATOR } from './../predefinedItems';

/**
 * @param {CellRange[]} selRanges An array of the cell ranges.
 * @returns {object[]}
 */
export function normalizeSelection(selRanges) {
  return arrayMap(selRanges, range => ({
    start: range.getTopStartCorner(),
    end: range.getBottomEndCorner(),
  }));
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function isSeparator(cell) {
  return hasClass(cell, 'htSeparator');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function hasSubMenu(cell) {
  return hasClass(cell, 'htSubmenu');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function isDisabled(cell) {
  return hasClass(cell, 'htDisabled');
}

/**
 * @param {HTMLElement} cell The HTML cell element to check.
 * @returns {boolean}
 */
export function isSelectionDisabled(cell) {
  return hasClass(cell, 'htSelectionDisabled');
}

/**
 * @param {object} item The object which describes the context menu item properties.
 * @param {Core} instance The Handsontable instance.
 * @returns {boolean}
 */
export function isItemHidden(item, instance) {
  return !item.hidden || !(typeof item.hidden === 'function' && item.hidden.call(instance));
}

/**
 * @param {object[]} items The context menu items collection.
 * @param {string} separator The string which identifies the context menu separator item.
 * @returns {object[]}
 */
function shiftSeparators(items, separator) {
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
function popSeparators(items, separator) {
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
function removeDuplicatedSeparators(items) {
  const result = [];

  arrayEach(items, (value, index) => {
    if (index > 0) {
      if (result[result.length - 1].name !== value.name) {
        result.push(value);
      }
    } else {
      result.push(value);
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
export function filterSeparators(items, separator = SEPARATOR) {
  let result = items.slice(0);

  result = shiftSeparators(result, separator);
  result = popSeparators(result, separator);
  result = removeDuplicatedSeparators(result);

  return result;
}
