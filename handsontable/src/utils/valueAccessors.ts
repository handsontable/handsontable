import { isFunction } from '../helpers/function';

/**
 * Get the value to be set in the cell.
 *
 * @param {*} value Initial value.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The value to be set in the cell.
 */
export function getValueSetterValue(value: unknown, cellMeta: Record<string, unknown>) {
  const { instance, visualRow, visualCol, valueSetter } = cellMeta;

  if (isFunction(valueSetter)) {
    return (valueSetter as Function).call(instance, value, visualRow, visualCol, cellMeta);
  }

  return value;
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
    return (valueGetter as Function).call(instance, value, visualRow, visualCol, cellMeta);
  }

  return value;
}
