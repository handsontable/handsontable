import { throwWithCause } from '../helpers/errors';
import { hasOwnProperty } from '../helpers/object';

/**
 * The error thrown when one settings object names both `fixedColumnsLeft` and `fixedColumnsStart`.
 */
export const FIXED_COLUMNS_TOGETHER_ERROR = 'The `fixedColumnsLeft` and `fixedColumnsStart` should not be used ' +
  'together. Please use only the option `fixedColumnsStart`.';

/**
 * The error thrown when an RTL grid gets `fixedColumnsLeft`.
 */
export const FIXED_COLUMNS_LEFT_RTL_ERROR = 'The `fixedColumnsLeft` is not supported for RTL. ' +
  'Please use option `fixedColumnsStart`.';

/**
 * Returns the settings with the legacy `fixedColumnsLeft` written as `fixedColumnsStart`, so the rest of
 * the settings flow sees one name. A settings object without `fixedColumnsLeft` is returned as is;
 * otherwise a copy is returned and the caller's object is left unchanged. The two names in one settings
 * object throw, and so does `fixedColumnsLeft` on an RTL grid. Two calls that each use one of the names do
 * not throw: the later value wins, as it does for any other option.
 *
 * @param {object} settings A settings object.
 * @param {boolean} isRtl `true` when the grid is laid out right to left.
 * @returns {object} The settings with `fixedColumnsStart` only.
 */
export function normalizeFixedColumnsAlias<T extends object>(settings: T, isRtl: boolean): T {
  if (!hasOwnProperty(settings, 'fixedColumnsLeft')) {
    return settings;
  }

  if (hasOwnProperty(settings, 'fixedColumnsStart')) {
    throwWithCause(FIXED_COLUMNS_TOGETHER_ERROR);
  }

  if (isRtl) {
    throwWithCause(FIXED_COLUMNS_LEFT_RTL_ERROR);
  }

  return renameFixedColumnsLeft(settings);
}

/**
 * Returns a copy of the settings with `fixedColumnsLeft` written as `fixedColumnsStart`, without the checks
 * of {@link normalizeFixedColumnsAlias}. A `fixedColumnsStart` the object already holds wins. Settings
 * without `fixedColumnsLeft` are returned as is.
 *
 * @param {object} settings A settings object.
 * @returns {object} The settings with `fixedColumnsStart` only.
 */
export function renameFixedColumnsLeft<T extends object>(settings: T): T {
  if (!hasOwnProperty(settings, 'fixedColumnsLeft')) {
    return settings;
  }

  const { fixedColumnsLeft, ...rest } = settings as Record<string, unknown>;

  return {
    ...rest,
    fixedColumnsStart: hasOwnProperty(rest, 'fixedColumnsStart') ? rest.fixedColumnsStart : fixedColumnsLeft,
  } as T;
}
