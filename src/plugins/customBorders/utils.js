import {
  hasOwnProperty,
  isObject } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';

/**
 * Create separated id for borders for each cell.
 *
 * @param {number} row Visual row index.
 * @param {number} col Visual column index.
 * @returns {string}
 */
export function createId(row, col) {
  return `border_row${row}col${col}`;
}

/**
 * Create default single border for each position (top/right/bottom/left).
 *
 * @returns {object} `{{width: number, color: string}}`.
 */
export function createDefaultCustomBorder() {
  return {
    width: 1,
    color: '#000',
  };
}

/**
 * Create default object for empty border.
 *
 * @returns {object} `{{hide: boolean}}`.
 */
export function createSingleEmptyBorder() {
  return { hide: true };
}

/**
 * Create default Handsontable border object.
 *
 * @returns {object} `{{width: number, color: string, cornerVisible: boolean}}`.
 */
export function createDefaultHtBorder() {
  return {
    width: 1,
    color: '#000',
    cornerVisible: false,
  };
}

/**
 * Prepare empty border for each cell with all custom borders hidden.
 *
 * @param {number} row Visual row index.
 * @param {number} col Visual column index.
 * @returns {object} Returns border configuration containing visual indexes. Example of an object defining it:
 * `{{id: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}`.
 */
export function createEmptyBorders(row, col) {
  return {
    id: createId(row, col),
    border: createDefaultHtBorder(),
    row,
    col,
    top: createSingleEmptyBorder(),
    right: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    left: createSingleEmptyBorder(),
  };
}

/**
 * @param {object} defaultBorder The default border object.
 * @param {object} customBorder The border object with custom settings.
 * @returns {object}
 */
export function extendDefaultBorder(defaultBorder, customBorder) {
  if (hasOwnProperty(customBorder, 'border')) {
    defaultBorder.border = customBorder.border;
  }

  if (hasOwnProperty(customBorder, 'top')) {
    if (customBorder.top) {
      if (!isObject(customBorder.top)) {
        customBorder.top = createDefaultCustomBorder();
      }

      defaultBorder.top = customBorder.top;

    } else {
      customBorder.top = createSingleEmptyBorder();
      defaultBorder.top = customBorder.top;
    }
  }

  if (hasOwnProperty(customBorder, 'right')) {
    if (customBorder.right) {
      if (!isObject(customBorder.right)) {
        customBorder.right = createDefaultCustomBorder();
      }

      defaultBorder.right = customBorder.right;

    } else {
      customBorder.right = createSingleEmptyBorder();
      defaultBorder.right = customBorder.right;
    }
  }

  if (hasOwnProperty(customBorder, 'bottom')) {
    if (customBorder.bottom) {
      if (!isObject(customBorder.bottom)) {
        customBorder.bottom = createDefaultCustomBorder();
      }

      defaultBorder.bottom = customBorder.bottom;

    } else {
      customBorder.bottom = createSingleEmptyBorder();
      defaultBorder.bottom = customBorder.bottom;
    }
  }

  if (hasOwnProperty(customBorder, 'left')) {
    if (customBorder.left) {
      if (!isObject(customBorder.left)) {
        customBorder.left = createDefaultCustomBorder();
      }

      defaultBorder.left = customBorder.left;

    } else {
      customBorder.left = createSingleEmptyBorder();
      defaultBorder.left = customBorder.left;
    }
  }

  return defaultBorder;
}

/**
 * Check if selection has border.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {string} [direction] If set ('left' or 'top') then only the specified border side will be checked.
 * @returns {boolean}
 */
export function checkSelectionBorders(hot, direction) {
  let atLeastOneHasBorder = false;

  arrayEach(hot.getSelectedRange(), (range) => {
    range.forAll((r, c) => {
      if (r < 0 || c < 0) {
        return;
      }

      const metaBorders = hot.getCellMeta(r, c).borders;

      if (metaBorders) {
        if (direction) {
          if (!hasOwnProperty(metaBorders[direction], 'hide') || metaBorders[direction].hide === false) {
            atLeastOneHasBorder = true;

            return false; // breaks forAll
          }
        } else {
          atLeastOneHasBorder = true;

          return false; // breaks forAll
        }
      }
    });
  });

  return atLeastOneHasBorder;
}

/**
 * Mark label in contextMenu as selected.
 *
 * @param {string} label The label text.
 * @returns {string}
 */
export function markSelected(label) {
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`; // workaround for https://github.com/handsontable/handsontable/issues/1946
}
