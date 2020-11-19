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

export {
  register as registerValidator,
  _getItem as getValidator,
  hasItem as hasValidator,
  getNames as getRegisteredValidatorNames,
  getValues as getRegisteredValidators,
};
