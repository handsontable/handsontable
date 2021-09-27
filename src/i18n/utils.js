import { isUndefined, isDefined } from './../helpers/mixed';
import { objectEach } from './../helpers/object';
import { error } from './../helpers/console';
import { toSingleLine } from './../helpers/templateLiteralTag';

/**
 * Perform shallow extend of a target object with only this extension's properties which doesn't exist in the target.
 *
 * TODO: Maybe it should be moved to global helpers? It's changed `extend` function.
 *
 * @param {object} target An object that will receive the new properties.
 * @param {object} extension An object containing additional properties to merge into the target.
 * @returns {object}
 */
export function extendNotExistingKeys(target, extension) {
  objectEach(extension, (value, key) => {
    if (isUndefined(target[key])) {
      target[key] = value;
    }
  });

  return target;
}

/**
 * Create range of values basing on cell indexes. For example, it will create below ranges for specified function arguments:
 *
 * createCellHeadersRange(2, 7) => `2-7`
 * createCellHeadersRange(7, 2) => `2-7`
 * createCellHeadersRange(0, 4, 'A', 'D') => `A-D`
 * createCellHeadersRange(4, 0, 'D', 'A') => `A-D`.
 *
 * @param {number} firstRowIndex Index of "first" cell.
 * @param {number} nextRowIndex Index of "next" cell.
 * @param {*} fromValue Value which will represent "first" cell.
 * @param {*} toValue Value which will represent "next" cell.
 * @returns {string} Value representing range i.e. A-Z, 11-15.
 */
export function createCellHeadersRange(firstRowIndex, nextRowIndex, fromValue = firstRowIndex, toValue = nextRowIndex) {
  // Will swap `fromValue` with `toValue` if it's necessary.
  let [from, to] = [fromValue, toValue];

  if (firstRowIndex > nextRowIndex) {
    [from, to] = [to, from];
  }

  return `${from}-${to}`;
}

/**
 * Normalize language code. It takes handled languageCode proposition and change it to proper languageCode.
 * For example, when it takes `eN-us` as parameter it return `en-US`.
 *
 * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @returns {string}
 */
export function normalizeLanguageCode(languageCode) {
  const languageCodePattern = /^([a-zA-Z]{2})-([a-zA-Z]{2})$/;
  const partsOfLanguageCode = languageCodePattern.exec(languageCode);

  if (partsOfLanguageCode) {
    return `${partsOfLanguageCode[1].toLowerCase()}-${partsOfLanguageCode[2].toUpperCase()}`;
  }

  return languageCode;
}

/**
 *
 * Warn user if there is no registered language.
 *
 * @param {string} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 */
export function warnUserAboutLanguageRegistration(languageCode) {
  if (isDefined(languageCode)) {
    error(toSingleLine`Language with code "${languageCode}" was not found. You should register particular language\x20
    before using it. Read more about this issue at: https://docs.handsontable.com/i18n/missing-language-code.`);
  }
}
