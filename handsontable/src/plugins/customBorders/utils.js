import {
  hasOwnProperty,
  isObject,
} from '../../helpers/object';
import { isDefined } from '../../helpers/mixed';
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
 * Normalizes the border object to be compatible with the Border API from the Walkontable.
 * The function translates the "left"/"right" properties to "start"/"end" prop names.
 *
 * @param {object} border The configuration object of the border.
 * @returns {object}
 */
export function normalizeBorder(border) {
  return {
    row: border.row,
    col: border.col,
    ...(isDefined(border.id) ? { id: border.id } : null),
    ...(isDefined(border.border) ? { border: border.border } : null),
    ...(isDefined(border.top) ? { top: border.top } : null),
    ...(isDefined(border.bottom) ? { bottom: border.bottom } : null),
    ...(isDefined(border.start) || isDefined(border.left) ? { start: border.start ?? border.left } : null),
    ...(isDefined(border.end) || isDefined(border.right) ? { end: border.end ?? border.right } : null),
  };
}

/**
 * Denormalizes the border object to be backward compatible with the previous version of the CustomBorders
 * plugin API. The function extends the border configuration object for the backward compatible "left"/"right"
 * properties.
 *
 * @param {object} border The configuration object of the border.
 * @returns {object}
 */
export function denormalizeBorder(border) {
  return {
    row: border.row,
    col: border.col,
    ...(isDefined(border.id) ? { id: border.id } : {}),
    ...(isDefined(border.border) ? { border: border.border } : {}),
    ...(isDefined(border.top) ? { top: border.top } : {}),
    ...(isDefined(border.bottom) ? { bottom: border.bottom } : {}),
    ...(isDefined(border.start) ? { start: border.start, left: border.start } : {}),
    ...(isDefined(border.end) ? { end: border.end, right: border.end } : {}),
  };
}

/**
 * Prepare empty border for each cell with all custom borders hidden.
 *
 * @param {number} row Visual row index.
 * @param {number} col Visual column index.
 * @returns {{id: string, border: any, row: number, col: number, top: {hide: boolean}, bottom: {hide: boolean}, start: {hide: boolean}, end: {hide: boolean}}} Returns border configuration containing visual indexes.
 */
export function createEmptyBorders(row, col) {
  return {
    id: createId(row, col),
    border: createDefaultHtBorder(),
    row,
    col,
    top: createSingleEmptyBorder(),
    bottom: createSingleEmptyBorder(),
    start: createSingleEmptyBorder(),
    end: createSingleEmptyBorder(),
  };
}

/**
 * @param {object} defaultBorder The default border object.
 * @param {object} customBorder The border object with custom settings.
 * @returns {object}
 */
export function extendDefaultBorder(defaultBorder, customBorder) {
  if (hasOwnProperty(customBorder, 'border') && customBorder.border) {
    defaultBorder.border = customBorder.border;
  }

  if (hasOwnProperty(customBorder, 'top') && isDefined(customBorder.top)) {
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

  if (hasOwnProperty(customBorder, 'bottom') && isDefined(customBorder.bottom)) {
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

  if (hasOwnProperty(customBorder, 'start') && isDefined(customBorder.start)) {
    if (customBorder.start) {

      if (!isObject(customBorder.start)) {
        customBorder.start = createDefaultCustomBorder();
      }

      defaultBorder.start = customBorder.start;

    } else {
      customBorder.start = createSingleEmptyBorder();
      defaultBorder.start = customBorder.start;
    }
  }

  if (hasOwnProperty(customBorder, 'end') && isDefined(customBorder.end)) {
    if (customBorder.end) {
      if (!isObject(customBorder.end)) {
        customBorder.end = createDefaultCustomBorder();
      }

      defaultBorder.end = customBorder.end;

    } else {
      customBorder.end = createSingleEmptyBorder();
      defaultBorder.end = customBorder.end;
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
  return borders.some(border => isDefined(border.left) || isDefined(border.right));
}

/**
 * Checks if in the borders config there are defined "start" or "end" border properties.
 *
 * @param {object[]} borders The custom border plugin's options.
 * @returns {boolean}
 */
export function hasStartEndTypeOptions(borders) {
  return borders.some(border => isDefined(border.start) || isDefined(border.end));
}

const physicalToInlinePropNames = new Map([
  ['left', 'start'],
  ['right', 'end'],
]);

/**
 * Translates the physical horizontal direction to logical ones. If not known property name is
 * passed it will be returned without modification.
 *
 * @param {string} propName The physical direction property name ("left" or "right").
 * @returns {string}
 */
export function toInlinePropName(propName) {
  return physicalToInlinePropNames.get(propName) ?? propName;
}
