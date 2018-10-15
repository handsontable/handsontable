import staticRegister from './../../utils/staticRegister';
import pluralizeFn from './pluralize';

var _staticRegister = staticRegister('phraseFormatters'),
    registerGloballyPhraseFormatter = _staticRegister.register,
    getGlobalPhraseFormatters = _staticRegister.getValues;

/**
 * Register phrase formatter.
 *
 * @param {String} name Name of formatter.
 * @param {Function} formatterFn Function which will be applied on phrase propositions. It will transform them if it's possible.
 */


export function register(name, formatterFn) {
  registerGloballyPhraseFormatter(name, formatterFn);
}

/**
 * Get all registered previously formatters.
 *
 * @returns {Array}
 */
export function getAll() {
  return getGlobalPhraseFormatters();
}

export { register as registerPhraseFormatter, getAll as getPhraseFormatters };

register('pluralize', pluralizeFn);