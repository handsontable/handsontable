import {isUndefined, isDefined} from './../helpers/mixed';
import {objectEach} from './../helpers/object';
import {toSingleLine} from './../helpers/templateLiteralTag';
import {DEFAULT_LANGUAGE_CODE, hasLanguageDictionary} from './dictionariesManager';

/**
 * Perform shallow extend of a target object with only this extension's properties which doesn't exist in the target.
 *
 * @param {Object} target An object that will receive the new properties.
 * @param {Object} extension An object containing additional properties to merge into the target.
 */
// TODO: Maybe it should be moved to global helpers? It's changed `extend` function.
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
 * createCellHeadersRange(4, 0, 'D', 'A') => `A-D`
 *
 * @param {number} firstRowIndex Index of "first" cell
 * @param {number} nextRowIndex Index of "next" cell
 * @param {*} fromValue Value which will represent "first" cell
 * @param {*} toValue Value which will represent "next" cell
 * @returns {String} Value representing range i.e. A-Z, 11-15.
 */
export function createCellHeadersRange(firstRowIndex, nextRowIndex, fromValue = firstRowIndex, toValue = nextRowIndex) {
  // Will swap `fromValue` with `toValue` if it's necessary.
  if (firstRowIndex > nextRowIndex) {
    [fromValue, toValue] = [toValue, fromValue];
  }

  return `${fromValue}-${toValue}`;
}

/**
 * Get parsed language code. It take part of language code after dash and transform it to upper case.
 * For example, when it takes `en-us` as parameter it return `en-US`
 *
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @returns {String}
 */
export function getParsedLanguageCode(languageCode) {
  const languageCodePattern = /([a-zA-Z]{2})-([a-zA-Z]{2})/;
  const partsOfLanguageCode = languageCodePattern.exec(languageCode);

  if (partsOfLanguageCode) {
    return `${partsOfLanguageCode[1]}-${partsOfLanguageCode[2].toUpperCase()}`;
  }

  return languageCode;
}

/**
 * Set proper start language code. User may set language code which is not proper.
 *
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @param {Object} settings Settings object.
 * @returns {String}
 */
export function initProperLanguage(languageCode, settings) {
  const parsedLanguageCode = getParsedLanguageCode(languageCode);

  if (hasLanguageDictionary(parsedLanguageCode)) {
    settings.language = parsedLanguageCode;

  } else {
    settings.language = DEFAULT_LANGUAGE_CODE;

    warnUserAboutLanguageRegistration(languageCode);
  }
}

/**
 *
 * Warn user if there is no registered language.
 *
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 */
export function warnUserAboutLanguageRegistration(languageCode) {
  if (isDefined(languageCode)) {
    console.error(toSingleLine`Language with code "${languageCode}" should be registered earlier. 
      Please take a look at: https://docs.handsontable.com/pro/tutorial-features.html for more information.`);
  }
}
