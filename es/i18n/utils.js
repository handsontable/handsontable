var _templateObject = _taggedTemplateLiteral(['Language with code "', '" was not found. You should register particular language \n    before using it. Read more about this issue at: https://docs.handsontable.com/i18n/missing-language-code.'], ['Language with code "', '" was not found. You should register particular language \n    before using it. Read more about this issue at: https://docs.handsontable.com/i18n/missing-language-code.']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

import { isUndefined, isDefined } from './../helpers/mixed';
import { objectEach } from './../helpers/object';
import { error } from './../helpers/console';
import { toSingleLine } from './../helpers/templateLiteralTag';
import { DEFAULT_LANGUAGE_CODE, hasLanguageDictionary } from './dictionariesManager';

/**
 * Perform shallow extend of a target object with only this extension's properties which doesn't exist in the target.
 *
 * @param {Object} target An object that will receive the new properties.
 * @param {Object} extension An object containing additional properties to merge into the target.
 */
// TODO: Maybe it should be moved to global helpers? It's changed `extend` function.
export function extendNotExistingKeys(target, extension) {
  objectEach(extension, function (value, key) {
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
export function createCellHeadersRange(firstRowIndex, nextRowIndex) {
  var fromValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : firstRowIndex;
  var toValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : nextRowIndex;

  // Will swap `fromValue` with `toValue` if it's necessary.
  var from = fromValue,
      to = toValue;


  if (firstRowIndex > nextRowIndex) {
    var _ref = [to, from];
    from = _ref[0];
    to = _ref[1];
  }

  return from + '-' + to;
}

/**
 * Normalize language code. It takes handled languageCode proposition and change it to proper languageCode.
 * For example, when it takes `eN-us` as parameter it return `en-US`
 *
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @returns {String}
 */
export function normalizeLanguageCode(languageCode) {
  var languageCodePattern = /^([a-zA-Z]{2})-([a-zA-Z]{2})$/;
  var partsOfLanguageCode = languageCodePattern.exec(languageCode);

  if (partsOfLanguageCode) {
    return partsOfLanguageCode[1].toLowerCase() + '-' + partsOfLanguageCode[2].toUpperCase();
  }

  return languageCode;
}

/**
 * Set proper start language code. User may set language code which is not proper.
 *
 * @param {Object} settings Settings object.
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @returns {String}
 */
export function applyLanguageSetting(settings, languageCode) {
  var normalizedLanguageCode = normalizeLanguageCode(languageCode);

  if (hasLanguageDictionary(normalizedLanguageCode)) {
    settings.language = normalizedLanguageCode;
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
    error(toSingleLine(_templateObject, languageCode));
  }
}