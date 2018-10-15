'use strict';

exports.__esModule = true;
exports.default = substituteVariables;

var _string = require('./../../helpers/string');

/**
 * Try to substitute variable inside phrase propositions.
 *
 * @param {Array} phrasePropositions List of phrases propositions.
 * @param {Object} zippedVariablesAndValues Object containing variables and corresponding values.
 *
 * @returns {String} Phrases with substituted variables if it's possible, list of unchanged phrase propositions otherwise.
 */
function substituteVariables(phrasePropositions, zippedVariablesAndValues) {
  if (Array.isArray(phrasePropositions)) {
    return phrasePropositions.map(function (phraseProposition) {
      return substituteVariables(phraseProposition, zippedVariablesAndValues);
    });
  }

  return (0, _string.substitute)(phrasePropositions, zippedVariablesAndValues);
}