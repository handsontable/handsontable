import staticRegister from '../utils/staticRegister';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('validators');

/**
 * Retrieve validator function.
 *
 * @param {string} name Validator identification.
 * @returns {Function} Returns validator function.
 */
function _getItem(name) {
  if (typeof name === 'function') {
    return name;
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
function _register(name, validator) {
  if (typeof name !== 'string') {
    validator = name;
    name = validator.VALIDATOR_TYPE;
  }

  register(name, validator);
}

export {
  _register as registerValidator,
  _getItem as getValidator,
  hasItem as hasValidator,
  getNames as getRegisteredValidatorNames,
  getValues as getRegisteredValidators,
};
