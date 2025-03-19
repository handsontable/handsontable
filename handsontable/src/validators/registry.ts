import staticRegister from '../utils/staticRegister';
import { ValidatorFunction, TypedValidator, ValidatorRegistry } from './types';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
}: ValidatorRegistry = staticRegister('validators');

/**
 * Retrieve validator function.
 *
 * @param {string} name Validator identification.
 * @returns {Function} Returns validator function.
 */
function _getItem(name: string | ValidatorFunction): ValidatorFunction {
  if (typeof name === 'function') {
    return name as ValidatorFunction;
  }
  if (!hasItem(name)) {
    throw Error(`No registered validator found under "${name}" name`);
  }

  return getItem(name);
}

/**
 * Register validator under its alias.
 *
 * @param {string|Function} name Validator's alias or validator function with its descriptor.
 * @param {Function} [validator] Validator function.
 */
function _register(name: string | TypedValidator, validator?: ValidatorFunction): void {
  if (typeof name !== 'string') {
    // Treating the TypedValidator as both a validator function and an object with VALIDATOR_TYPE
    validator = name as unknown as ValidatorFunction;
    name = (name as TypedValidator).VALIDATOR_TYPE;
  }

  register(name, validator as ValidatorFunction);
}

export {
  _register as registerValidator,
  _getItem as getValidator,
  hasItem as hasValidator,
  getNames as getRegisteredValidatorNames,
  getValues as getRegisteredValidators,
};
