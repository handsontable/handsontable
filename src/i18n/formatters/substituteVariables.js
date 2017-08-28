import {register as registerFormatter} from '../formattersController';
import {substitute} from './../../helpers/string';

function substituteVariables(phrases, zippedVariableAndValue) {
  if (Array.isArray(phrases)) {
    return phrases.map((phrase) => substituteVariables(phrase, zippedVariableAndValue));
  }

  return substitute(phrases, zippedVariableAndValue);
};

registerFormatter(substituteVariables);
