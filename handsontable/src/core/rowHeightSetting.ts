import { isObject } from '../helpers/object';

/**
 * Resolves one row's value out of a `rowHeights` or `minRowHeights` setting.
 *
 * A number and a numeric string apply to every row, an array is read by the given row index,
 * and a function is called with it. Core passes the physical row index (for an array, the index of
 * the entry the row was declared at), so a height stays with its row. A string is read as a pixel size (`'100px'` is `100`). Anything else the setting or
 * the function returns gives the row no height.
 *
 * @param {*} setting The value of the `rowHeights` or `minRowHeights` option.
 * @param {number} row The index to read: a physical row index or a declared entry index, or a negative
 * header index.
 * @returns {number|undefined|null} The height, or `undefined`/`null` when the setting gives the row none.
 */
export function resolveRowHeightSetting(setting: unknown, row: number): number | undefined | null {
  if (setting === undefined || setting === null) {
    return setting;
  }

  let height: unknown = setting;

  if (typeof setting === 'function') {
    height = setting(row);
  } else if (typeof setting === 'object') {
    height = Reflect.get(setting, row);
  }

  if (typeof height === 'string') {
    return Number.parseInt(height, 10);
  }

  return typeof height === 'number' || height === null ? height : undefined;
}

/**
 * Whether a resolved `rowHeights` value makes its row render at exactly that height. Only a positive
 * number does: `0`, `NaN`, a negative number and a missing value mean "no height of its own", the same
 * way the rendering engine reads them, so those rows keep the theme's default height.
 *
 * @param {*} height The value `resolveRowHeightSetting()` returned.
 * @returns {boolean}
 */
export function isExactRowHeight(height: unknown): height is number {
  return typeof height === 'number' && height > 0;
}

/**
 * Whether the `autoRowSize` option turns the AutoRowSize plugin on. While it is on, `rowHeights` is a
 * minimum the measured content can grow past, so no row is exact. `AutoRowSize#isEnabled()` answers
 * through this helper, so the plugin and the row-height read cannot disagree, and the read needs no
 * plugin lookup: it runs for every rendered row on every draw.
 *
 * @param {*} autoRowSize The value of the `autoRowSize` option.
 * @returns {boolean}
 */
export function isAutoRowSizeOn(autoRowSize: unknown): boolean {
  return autoRowSize === true || isObject(autoRowSize);
}
