import { isFunction } from '../helpers/function';

/**
 * Get the value to be set in the cell.
 *
 * @param {*} value Initial value.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The value to be set in the cell.
 */
export function getValueSetterValue(value, cellMeta) {
  const { instance, visualRow, visualCol } = cellMeta;
  const valueSetter = cellMeta.valueSetter ?? null;

  if (isFunction(valueSetter)) {
    return valueSetter.call(instance, value, visualRow, visualCol);
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
export function getValueGetterValue(value, cellMeta) {
  const { instance, visualRow, visualCol } = cellMeta;
  const valueGetter = cellMeta.valueGetter ?? null;

  if (isFunction(valueGetter)) {
    return valueGetter.call(instance, value, visualRow, visualCol);
  }

  return value;
}
