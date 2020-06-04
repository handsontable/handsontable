import { substitute } from './../../helpers/string';

/**
 * Try to substitute variable inside phrase propositions.
 *
 * @param {Array} phrasePropositions List of phrases propositions.
 * @param {object} zippedVariablesAndValues Object containing variables and corresponding values.
 *
 * @returns {string} Phrases with substituted variables if it's possible, list of unchanged phrase propositions otherwise.
 */
export default function substituteVariables(phrasePropositions, zippedVariablesAndValues) {
  if (Array.isArray(phrasePropositions)) {
    return phrasePropositions
      .map(phraseProposition => substituteVariables(phraseProposition, zippedVariablesAndValues));
  }

  return substitute(phrasePropositions, zippedVariablesAndValues);
}
