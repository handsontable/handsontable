import {formattersController as f} from '../formattersController';
import {isNumeric} from './../../helpers/number';

/**
 * Get plural form by plural determinant.
 *
 * @param {Object} zippedVariableAndValues Object containing variables and corresponding values.
 *
 * @returns {number} Number representing form which should be used for pluralization.
 */
function getPluralForm(zippedVariableAndValues) {
  const pluralDeterminant = zippedVariableAndValues.pluralForm;

  if (isNumeric(pluralDeterminant)) {
    return pluralDeterminant;
  }

  return 0;
}

/**
 * Try to choose plural form from available phrase propositions.
 *
 * @param {Array} phrasePropositions List of phrases propositions.
 * @param {Object} zippedVariableAndValues Object containing variables and corresponding values.
 *
 * @returns {string|Array} One particular phrase if it's possible, list of unchanged phrase propositions otherwise.
 */
function pluralize(phrasePropositions, zippedVariableAndValues) {
  const isPluralizable = Array.isArray(phrasePropositions);

  if (isPluralizable) {
    const pluralForm = getPluralForm(zippedVariableAndValues);

    return phrasePropositions[pluralForm];
  }

  return phrasePropositions;
};

f.registerFormatter(pluralize);
