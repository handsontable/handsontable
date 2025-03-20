import staticRegister from './../../utils/staticRegister';
import pluralizeFn from './pluralize';
import { PhraseFormatterFn } from '../types';

const {
  register: registerGloballyPhraseFormatter,
  getValues: getGlobalPhraseFormatters,
} = staticRegister('phraseFormatters');

/**
 * Register phrase formatter.
 *
 * @param {string} name Name of formatter.
 * @param {Function} formatterFn Function which will be applied on phrase propositions. It will transform them if it's possible.
 */
export function register(name: string, formatterFn: PhraseFormatterFn): void {
  registerGloballyPhraseFormatter(name, formatterFn);
}

/**
 * Get all registered previously formatters.
 *
 * @returns {Array}
 */
export function getAll(): PhraseFormatterFn[] {
  return getGlobalPhraseFormatters() as PhraseFormatterFn[];
}

export {
  register as registerPhraseFormatter,
  getAll as getPhraseFormatters
};

register('pluralize', pluralizeFn);
