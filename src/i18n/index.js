import { arrayEach } from './../helpers/array';
import { getLanguageDictionary } from './dictionariesManager';
import { getPhraseFormatters } from './phraseFormatters';
import { isUndefined } from '../helpers/mixed';

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
export function getTranslatedPhrase(languageCode, dictionaryKey, argumentsForFormatters) {
  const languageDictionary = getLanguageDictionary(languageCode);

  if (languageDictionary === null) {
    return null;
  }

  const phrasePropositions = languageDictionary[dictionaryKey];

  if (isUndefined(phrasePropositions)) {
    return null;
  }

  const formattedPhrase = getFormattedPhrase(phrasePropositions, argumentsForFormatters);

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
  let formattedPhrasePropositions = phrasePropositions;

  arrayEach(getPhraseFormatters(), (formatter) => {
    formattedPhrasePropositions = formatter(phrasePropositions, argumentsForFormatters);
  });

  return formattedPhrasePropositions;
}
