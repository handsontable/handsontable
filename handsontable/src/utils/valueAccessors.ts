import { isFunction } from '../helpers/function';

/**
 * Get the value to be set in the cell.
 *
 * @param {*} value Initial value.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The value to be set in the cell.
 */
export function getValueSetterValue(value: unknown, cellMeta: Record<string, unknown>) {
  const { instance, visualRow, visualCol, valueSetter, emptyValue } = cellMeta;
  let newValue = value;

  if (isFunction(valueSetter)) {
    newValue = valueSetter.call(instance, value, visualRow, visualCol, cellMeta);
  }

  // `emptyValue` spells out what an emptied cell stores. It runs after `valueSetter` so a cell that
  // ends up empty lands on the same value whichever path emptied it - the editor, a paste, a fill or
  // `setDataAtCell()` - and so a custom `valueSetter` returning `''` still means "empty" here.
  if (newValue === '' && emptyValue === null) {
    return null;
  }

  return newValue;
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
