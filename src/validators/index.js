import staticRegister from './../utils/staticRegister';

import autocompleteValidator from './autocompleteValidator';
import dateValidator from './dateValidator';
import numericValidator from './numericValidator';
import timeValidator from './timeValidator';

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('validators');

register('autocomplete', autocompleteValidator);
register('date', dateValidator);
register('numeric', numericValidator);
register('time', timeValidator);

/**
 * Retrieve validator function.
 *
 * @param {String} name Validator identification.
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
