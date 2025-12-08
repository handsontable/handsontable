import { isObject } from '../../../helpers/object';
import { isDefined } from '../../../helpers/mixed';

/**
 * Defines what value is set to an multiSelect-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue) {
  const isKeyValueObject = obj => isObject(obj) && isDefined(obj.key) && isDefined(obj.value);

  if (Array.isArray(newValue)) {
    return newValue.map((val) => {
      return isKeyValueObject(val) ? val : { key: val, value: val };
    });
  }

  return newValue;
}
