'use strict';

exports.__esModule = true;
exports.getTranslatedPhrase = getTranslatedPhrase;

var _array = require('./../helpers/array');

var _dictionariesManager = require('./dictionariesManager');

var _phraseFormatters = require('./phraseFormatters');

var _mixed = require('../helpers/mixed');

/**
 * Get phrase for specified dictionary key.
 *
 * @param {String} languageCode Language code for specific language i.e. 'en-US', 'pt-BR', 'de-DE'.
 * @param {String} dictionaryKey Constant which is dictionary key.
 * @param {*} argumentsForFormatters Arguments which will be handled by formatters.
 *
 * @returns {String}
 */
// eslint-disable-next-line import/prefer-default-export
function getTranslatedPhrase(languageCode, dictionaryKey, argumentsForFormatters) {
  var languageDictionary = (0, _dictionariesManager.getLanguageDictionary)(languageCode);

  if (languageDictionary === null) {
    return null;
  }

  var phrasePropositions = languageDictionary[dictionaryKey];

  if ((0, _mixed.isUndefined)(phrasePropositions)) {
    return null;
  }

  var formattedPhrase = getFormattedPhrase(phrasePropositions, argumentsForFormatters);

  if (Array.isArray(formattedPhrase)) {
    return formattedPhrase[0];
  }

  return formattedPhrase;
}

/**
 * Get formatted phrase from phrases propositions for specified dictionary key.
 *
 * @private
 * @param {Array|string} phrasePropositions List of phrase propositions.
 * @param {*} argumentsForFormatters Arguments which will be handled by formatters.
 *
 * @returns {Array|string}
 */
function getFormattedPhrase(phrasePropositions, argumentsForFormatters) {
  var formattedPhrasePropositions = phrasePropositions;

  (0, _array.arrayEach)((0, _phraseFormatters.getPhraseFormatters)(), function (formatter) {
    formattedPhrasePropositions = formatter(phrasePropositions, argumentsForFormatters);
  });

  return formattedPhrasePropositions;
}