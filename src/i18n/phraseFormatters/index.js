import staticRegister from './../../utils/staticRegister';
import pluralizeFn from './pluralize';

const {
  register: registerGloballyPhraseFormatter,
  getValues: getGlobalFormatters,
} = staticRegister('phraseFormatters');

/**
 * Register formatter.
 *
 * @param {Function} formatter Function which will be applied on phrase propositions.
 * It will transform them if it's possible.
 */

/**
 * Register formatter.
 *
 * @param {string} name Name of formatter.
 * @param {Function} formatterFn Function which will be applied on phrase propositions.
 * It will transform them if it's possible.
 */
export function registerPhraseFormatter(name, formatterFn) {
  registerGloballyPhraseFormatter(name, formatterFn);
}

/**
 * Get all registered previously formatters.
 *
 * @returns {Array}
 */
export function getPhraseFormatters() {
  return getGlobalFormatters();
}

registerPhraseFormatter('pluralize', pluralizeFn);
