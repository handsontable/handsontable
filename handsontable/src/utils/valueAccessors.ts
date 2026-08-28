import { isFunction } from '../helpers/function';

/**
 * Reports whether the cell's own configuration gives an empty string a meaning of its own, which
 * `emptyValue` must then leave alone.
 *
 * Read off the cell's declared `type`, not off whichever template keys happen to be on the cascading
 * meta: an `uncheckedTemplate` set once at grid level would otherwise switch `emptyValue` off for
 * every column in the grid, including the ones that hold no checkboxes.
 *
 * @param {object} cellMeta The cell meta object.
 * @returns {boolean}
 */
function isEmptyStringConfigured(cellMeta: Record<string, unknown>): boolean {
  const { type } = cellMeta;

  if (type === 'checkbox') {
    return cellMeta.checkedTemplate === '' || cellMeta.uncheckedTemplate === '';
  }

  if (type === 'autocomplete' || type === 'dropdown') {
    return Array.isArray(cellMeta.source) && cellMeta.source.includes('');
  }

  return false;
}

/**
 * Get the value to be set in the cell.
 *
 * @param {*} value Initial value.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The value to be set in the cell.
 */
export function getValueSetterValue(value: unknown, cellMeta: Record<string, unknown>, source?: string) {
  const { instance, visualRow, visualCol, valueSetter, emptyValue } = cellMeta;
  let newValue = value;

  if (isFunction(valueSetter)) {
    newValue = valueSetter.call(instance, value, visualRow, visualCol, cellMeta);
  }

  // `emptyValue` spells out what an emptied cell stores. It runs after `valueSetter` so a cell that
  // ends up empty lands on the same value whichever path emptied it - the editor, a paste, a fill or
  // `setDataAtCell()` - and so a custom `valueSetter` returning `''` still means "empty" here.
  if (newValue !== '' || emptyValue === '' || emptyValue === undefined) {
    return newValue;
  }

  // Undo and redo restore what the cell held before, verbatim. Remapping here would make an `''` that
  // legitimately predates the setting - `loadData` never passes through this function - impossible to
  // restore, so the user would watch undo produce a different value than the one they undid to.
  if (typeof source === 'string' && source.startsWith('UndoRedo.')) {
    return newValue;
  }

  // `''` is left alone where the cell's own configuration gives it a meaning: a checkbox storing it
  // as `uncheckedTemplate` would end up matching neither template, rendering `#bad-value#` and
  // refusing to toggle, and a choice list offering it as a blank option would fail its own validator
  // under `strict: true`, because `null` is not in `source`.
  if (isEmptyStringConfigured(cellMeta)) {
    return newValue;
  }

  return emptyValue;
}

/**
 * Get the value to be displayed in the cell.
 *
 * @param {*} value Initial value.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The value to be displayed in the cell.
 */
export function getValueGetterValue(value: unknown, cellMeta: Record<string, unknown>) {
  const { instance, visualRow, visualCol, valueGetter } = cellMeta;

  if (isFunction(valueGetter)) {
    return valueGetter.call(instance, value, visualRow, visualCol, cellMeta);
  }

  return value;
}
