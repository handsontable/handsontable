import {formattersController as f} from '../formattersController';
import {isNumeric} from './../../helpers/number';

/**
 * Get plural form by plural determinant.
 *
 * @param {string} pluralDeterminant Value by which we try to determine which plural from will match to sentence.
 *
 * @returns {number} Number representing form which should be used for pluralization.
 */
function getPluralForm(pluralProposition) {
  if (isNumeric(pluralProposition)) {
    return pluralProposition;
  }

  return 0;
}

/**
 * Try to choose plural form from available phrase propositions.
 *
 * @param phrasePropositions List of phrases propositions.
 * @param zippedVariableAndValue Object containing variables and corresponding values.
 *
 * @returns {string|Array} One particular phrase if it's possible, list of unchanged phrase propositions otherwise.
 */
function pluralize(phrasePropositions, zippedVariableAndValue) {
  const isPluralizable = Array.isArray(phrasePropositions);

  if (isPluralizable) {
    const pluralDeterminant = getPluralForm(zippedVariableAndValue.pluralForm);

    return phrasePropositions[pluralDeterminant];
  }

  return phrasePropositions;
};

f.registerFormatter(pluralize);
