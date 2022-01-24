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
 * @param {object} inlinePropMap The map that gives the translation for horizontal direction naming.
 * @returns {object} Returns border configuration containing visual indexes. Example of an object defining it:
 * `{{id: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}`.
 */
export function createEmptyBorders(row, col, { start: startProp, end: endProp }) {
  return {
    id: createId(row, col),
    border: createDefaultHtBorder(),
    row,
    col,
    top: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    [startProp]: createSingleEmptyBorder(),
    [endProp]: createSingleEmptyBorder(),
  };
}

/**
 * @param {object} defaultBorder The default border object.
 * @param {object} customBorder The border object with custom settings.
 * @param {object} inlinePropMap The map that gives the translation for horizontal direction naming.
 * @returns {object}
 */
export function extendDefaultBorder(defaultBorder, customBorder, { start: startProp, end: endProp }) {
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

  if (hasOwnProperty(customBorder, endProp)) {
    if (customBorder[endProp]) {

      if (!isObject(customBorder[endProp])) {
        customBorder[endProp] = createDefaultCustomBorder();
      }


      defaultBorder[endProp] = customBorder[endProp];

    } else {
      customBorder[endProp] = createSingleEmptyBorder();
      defaultBorder[endProp] = customBorder[endProp];
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

  if (hasOwnProperty(customBorder, startProp)) {
    if (customBorder[startProp]) {
      if (!isObject(customBorder[startProp])) {
        customBorder[startProp] = createDefaultCustomBorder();
      }

      defaultBorder[startProp] = customBorder[startProp];

    } else {
      customBorder[startProp] = createSingleEmptyBorder();
      defaultBorder[startProp] = customBorder[startProp];
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

/**
 * Checks if in the borders config there are defined "left" or "right" border properties.
 *
 * @param {object[]} borders The custom border plugin's options.
 * @returns {boolean}
 */
export function hasLeftRightTypeOptions(borders) {
  return borders.some(border => hasOwnProperty(border, 'left') || hasOwnProperty(border, 'right'));
}

/**
 * Checks if in the borders config there are defined "start" or "end" border properties.
 *
 * @param {object[]} borders The custom border plugin's options.
 * @returns {boolean}
 */
export function hasStartEndTypeOptions(borders) {
  return borders.some(border => hasOwnProperty(border, 'start') || hasOwnProperty(border, 'end'));
}

/**
 * Creates an object that allows translating the border inline direction names to names that are
 * backward compatible ("left"/"right") or non-backward compatible ("start"/"end").
 *
 * @param {boolean} [backwardCompatibleMode=true] If `true` the direction will be translated to physical values.
 * @returns {{start: string, end: string}}
 */
export function createInlinePropNamesMap(backwardCompatibleMode = true) {
  return {
    start: backwardCompatibleMode ? 'left' : 'start',
    end: backwardCompatibleMode ? 'right' : 'end',
  };
}

const physicalToInlinePropNames = new Map([
  ['left', 'start'],
  ['right', 'end'],
]);

/**
 * Translates the physical horizontal direction to logical ones.
 *
 * @param {string} propName The physical direction property name ("left" or "right").
 * @returns {string}
 */
export function toInlinePropName(propName) {
  return physicalToInlinePropNames.get(propName) ?? propName;
}
