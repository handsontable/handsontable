import { isObjectEqual, isKeyValueObject } from '../../helpers/object';

export const VALIDATOR_TYPE = 'multiselect';

type CellMeta = Record<string, unknown> & {
  allowEmpty?: boolean;
  source?: unknown[] | ((value: unknown[], fn: (source: unknown[]) => void) => void);
};

/**
 *
 */
export function multiSelectValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void): void {
  let valueToValidate = value;

  if (valueToValidate === null || valueToValidate === undefined) {
    valueToValidate = '';
  }

  if (this.allowEmpty && valueToValidate === '') {
    callback(true);

    return;
  }
  if (!this.allowEmpty && valueToValidate === '') {
    callback(false);

    return;
  }

  if (!Array.isArray(valueToValidate)) {
    callback(false);

    return;
  }

  if (valueToValidate.length === 0) {
    callback(true);

    return;
  }

  if (this.source) {
    if (typeof this.source === 'function') {
      type SourceFn = (value: unknown[], fn: (source: unknown[]) => void) => void;
      (this.source as SourceFn)(valueToValidate, process(valueToValidate, callback));
    } else {
      process(valueToValidate, callback)(this.source as unknown[]);
    }
  } else {
    callback(true);
  }
}

multiSelectValidator.VALIDATOR_TYPE = VALIDATOR_TYPE;

/**
 *
 */
function process(value: unknown[], callback: (valid: boolean) => void): (source: unknown[]) => void {
  const originalVal = value;

  return function(source: unknown[]) {
    let allValid = true;

    for (let i = 0, len = originalVal.length; i < len; i++) {
      let found = false;

      for (let s = 0, slen = source.length; s < slen; s++) {
        if (
          (isKeyValueObject(originalVal[i]) && !isKeyValueObject(source[s])) ||
          (!isKeyValueObject(originalVal[i]) && isKeyValueObject(source[s]))
        ) {
          found = false;
          break;
        } else if (
          isKeyValueObject(originalVal[i]) && isKeyValueObject(source[s]) &&
          isObjectEqual(originalVal[i] as Record<string, unknown>, source[s] as Record<string, unknown>)
        ) {
          found = true;
        } else if (
          typeof originalVal[i] === 'string' &&
          typeof source[s] === 'string' &&
          originalVal[i] === source[s]
        ) {
          found = true;
        }
      }

      if (!found) {
        allValid = false;
        break;
      }
    }

    callback(allValid);
  };
}
