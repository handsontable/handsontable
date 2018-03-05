import {hasOwnProperty} from './../../helpers/object';
import {arrayEach} from './../../helpers/array';

/**
 * Create separated class name for borders for each cell.
 *
 * @param {Number} row Visual row index.
 * @param {Number} col Visual column index.
 * @returns {String}
 */
export function createClassName(row, col) {
  return `border_row${row}col${col}`;
}

/**
 * Create default single border for each position (top/right/bottom/left).
 *
 * @returns {Object} `{{width: number, color: string}}`
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
 * @returns {Object} `{{hide: boolean}}`
 */
export function createSingleEmptyBorder() {
  return { hide: true };
}

/**
 * Create default Handsontable border object.
 *
 * @returns {Object} `{{width: number, color: string, cornerVisible: boolean}}`
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
 * @param {Number} row Visual row index.
 * @param {Number} col Visual column index.
 * @returns {Object} `{{className: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}`
 */
export function createEmptyBorders(row, col) {
  return {
    className: createClassName(row, col),
    border: createDefaultHtBorder(),
    row,
    col,
    top: createSingleEmptyBorder(),
    right: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    left: createSingleEmptyBorder(),
  };
}

export function extendDefaultBorder(defaultBorder, customBorder) {
  if (hasOwnProperty(customBorder, 'border')) {
    defaultBorder.border = customBorder.border;
  }

  if (hasOwnProperty(customBorder, 'top')) {
    defaultBorder.top = customBorder.top;
  }

  if (hasOwnProperty(customBorder, 'right')) {
    defaultBorder.right = customBorder.right;
  }

  if (hasOwnProperty(customBorder, 'bottom')) {
    defaultBorder.bottom = customBorder.bottom;
  }

  if (hasOwnProperty(customBorder, 'left')) {
    defaultBorder.left = customBorder.left;
  }

  return defaultBorder;
}

/**
 * Check if selection has border by className
 *
 * @param hot
 * @param direction
 */
export function checkSelectionBorders(hot, direction) {
  let atLeastOneHasBorder = false;

  arrayEach(hot.getSelectedRange(), (range) => {
    range.forAll((r, c) => {
      let metaBorders = hot.getCellMeta(r, c).borders;

      if (metaBorders) {
        if (direction) {
          if (!hasOwnProperty(metaBorders[direction], 'hide')) {
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
 * Mark label in contextMenu as selected
 *
 * @param label
 * @returns {string}
 */
export function markSelected(label) {
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`; // workaround for https://github.com/handsontable/handsontable/issues/1946
}
