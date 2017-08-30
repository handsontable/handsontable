import {formattersController as f} from '../formattersController';
import {substitute} from './../../helpers/string';

/**
 * Try to substitute variable inside phrase propositions.
 *
 * @param phrasePropositions List of phrases propositions.
 * @param zippedVariableAndValue Object containing variables and corresponding values.
 *
 * @returns {String} Phrases with substituted variables if it's possible, list of unchanged phrase propositions otherwise.
 */
function substituteVariables(phrasePropositions, zippedVariableAndValue) {
  if (Array.isArray(phrasePropositions)) {
    return phrasePropositions.map((phraseProposition) => substituteVariables(phraseProposition, zippedVariableAndValue));
  }

  return substitute(phrasePropositions, zippedVariableAndValue);
};

f.registerFormatter(substituteVariables);
