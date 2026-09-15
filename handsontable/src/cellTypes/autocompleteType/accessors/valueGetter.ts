import { isPlainObject } from '../../../helpers/object';

/**
 * Defines the value being displayed in an autocomplete-typed cells.
 *
 * @param {*} value The value to be displayed.
 * @returns {*} The final value of the cell.
 */
export function valueGetter(value: unknown): unknown {
  // Deliberately looser than `isKeyValueEntry()`: an entry carrying only `value` still renders as
  // that value, which is behavior this accessor has always had. The write path is stricter - it
  // resolves a label only against an entry that also carries a `key` - so a `{ value }`-only source
  // renders its label but stores it as a bare string. Aligning the two is a behavior change on an
  // undocumented source shape, so it is left alone here rather than made stricter (DEV-57 review).
  return isPlainObject(value) && value.value !== undefined ? value.value : value;
}
