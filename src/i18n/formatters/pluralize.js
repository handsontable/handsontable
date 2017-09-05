import {formattersController as f} from '../formattersController';
import {isObject} from './../../helpers/object';

/**
 * Get plural form by plural determinant.
 *
 * @param {string} pluralDeterminant Value by which we try to determine which plural from will match to sentence.
 *
 * @returns {number} Number representing form which should be used for pluralization.
 */
function getPluralForm(pluralDeterminant) {
  const isRange = /^\S+-\S+$/;

  if (isRange.test(pluralDeterminant)) {
    return 1;
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
  // TODO: Should be first object value our plural determinant?
  const pluralDeterminant = isObject(zippedVariableAndValue) && Object.values(zippedVariableAndValue)[0];
  const isPluralizable = Array.isArray(phrasePropositions);

  if (isPluralizable) {
    return phrasePropositions[getPluralForm(pluralDeterminant)];
  }

  return phrasePropositions;
};

f.registerFormatter(pluralize);
