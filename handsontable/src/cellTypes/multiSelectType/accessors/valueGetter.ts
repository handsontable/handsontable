import { isKeyValueObject } from '../../../helpers/object';
import { arrayToString } from '../../../helpers/array';

/**
 * Defines the value being displayed in an multiSelect-typed cells.
 */
export function valueGetter(value: unknown): unknown {
  if (Array.isArray(value)) {
    return arrayToString(value.map((val) => {
      return isKeyValueObject(val) ? (val as Record<string, unknown>).value : val;
    }), ', ');
  }

  return value;
}
