import { isObject } from '../../../helpers/object';

/**
 * Defines the value being displayed in an autocomplete-typed cells.
 *
 * @param {*} value The value to be displayed.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(value: unknown): unknown {
  const rec = value as Record<string, unknown>;

  return isObject(value) && rec.value !== undefined ? rec.value : value;
}
