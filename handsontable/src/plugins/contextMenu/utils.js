import { arrayEach, arrayMap } from '../../helpers/array';
import { hasClass } from '../../helpers/dom/element';
import { KEY as SEPARATOR } from './predefinedItems/separator';

/**
 * @param {CellRange[]} selRanges An array of the cell ranges.
 * @returns {object[]}
 */
export function normalizeSelection(selRanges) {
  return arrayMap(selRanges, range => ({
    start: range.getTopLeftCorner(),
    end: range.getBottomRightCorner(),
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
 * @param {Core} hot The Handsontable instance.
 * @returns {Array[]|null}
 */
export function getValidSelection(hot) {
  const selected = hot.getSelected();

  if (!selected) {
    return null;
  }
  if (selected[0] < 0) {
    return null;
  }

  return selected;
}

/**
 * @param {string} className The full element class name to process.
 * @param {string} alignment The slignment class name to compare with.
 * @returns {string}
 */
export function prepareVerticalAlignClass(className, alignment) {
  if (className.indexOf(alignment) !== -1) {
    return className;
  }

  const replacedClassName = className
    .replace('htTop', '')
    .replace('htMiddle', '')
    .replace('htBottom', '')
    .replace('  ', '');

  return `${replacedClassName} ${alignment}`;
}

/**
 * @param {string} className The full element class name to process.
 * @param {string} alignment The slignment class name to compare with.
 * @returns {string}
 */
export function prepareHorizontalAlignClass(className, alignment) {
  if (className.indexOf(alignment) !== -1) {
    return className;
  }
  const replacedClassName = className
    .replace('htLeft', '')
    .replace('htCenter', '')
    .replace('htRight', '')
    .replace('htJustify', '')
    .replace('  ', '');

  return `${replacedClassName} ${alignment}`;
}

/**
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {Function} callback The callback function.
 * @returns {object}
 */
export function getAlignmentClasses(ranges, callback) {
  const classes = {};

  arrayEach(ranges, (range) => {
    range.forAll((row, col) => {
      // Alignment classes should only collected within cell ranges. We skip header coordinates.
      if (row >= 0 && col >= 0) {
        if (!classes[row]) {
          classes[row] = [];
        }

        classes[row][col] = callback(row, col);
      }
    });
  });

  return classes;
}

/**
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {string} type The type of the alignment axis ('horizontal' or 'vertical').
 * @param {string} alignment CSS class name to add.
 * @param {Function} cellDescriptor The function which fetches the cell meta object based in passed coordinates.
 * @param {Function} propertySetter The function which contains logic for added/removed alignment.
 */
export function align(ranges, type, alignment, cellDescriptor, propertySetter) {
  arrayEach(ranges, (range) => {
    range.forAll((row, col) => {
      // Alignment classes should only collected within cell ranges. We skip header coordinates.
      if (row >= 0 && col >= 0) {
        applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter);
      }
    });
  });
}

/**
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {string} type The type of the alignment axis ('horizontal' or 'vertical').
 * @param {string} alignment CSS class name to add.
 * @param {Function} cellDescriptor The function which fetches the cell meta object based in passed coordinates.
 * @param {Function} propertySetter The function which contains logic for added/removed alignment.
 */
function applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter) {
  const cellMeta = cellDescriptor(row, col);
  let className = alignment;

  if (cellMeta.className) {
    if (type === 'vertical') {
      className = prepareVerticalAlignClass(cellMeta.className, alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className, alignment);
    }
  }

  propertySetter(row, col, 'className', className);
}

/**
 * @param {CellRange[]} ranges An array of the cell ranges.
 * @param {Function} comparator The comparator function.
 * @returns {boolean}
 */
export function checkSelectionConsistency(ranges, comparator) {
  let result = false;

  if (Array.isArray(ranges)) {
    arrayEach(ranges, (range) => {
      range.forAll((row, col) => {
        // Selection consistency should only check within cell ranges. We skip header coordinates.
        if (row >= 0 && col >= 0 && comparator(row, col)) {
          result = true;

          return false;
        }
      });

      return result;
    });
  }

  return result;
}

/**
 * @param {string} label The label text.
 * @returns {string}
 */
export function markLabelAsSelected(label) {
  // workaround for https://github.com/handsontable/handsontable/issues/1946
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`;
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
