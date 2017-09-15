import {substitute} from './../../helpers/string';

/**
 * Try to substitute variable inside phrase propositions.
 *
 * @param {Array} phrasePropositions List of phrases propositions.
 * @param {Object} zippedVariableAndValues Object containing variables and corresponding values.
 *
 * @returns {String} Phrases with substituted variables if it's possible, list of unchanged phrase propositions otherwise.
 */
export default function substituteVariables(phrasePropositions, zippedVariableAndValues) {
  if (Array.isArray(phrasePropositions)) {
    return phrasePropositions.map((phraseProposition) => substituteVariables(phraseProposition, zippedVariableAndValues));
  }

  return substitute(phrasePropositions, zippedVariableAndValues);
};
