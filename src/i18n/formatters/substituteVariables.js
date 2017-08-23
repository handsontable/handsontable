import {register as registerFormatter} from '../formattersController';
import {substitute} from './../../helpers/string';
import {clone} from './../../helpers/object';
import {getFormattedObjectValues} from './../utils';

function substituteVariables(phrases, zippedVariableAndValue) {
  zippedVariableAndValue = getFormattedObjectValues(clone(zippedVariableAndValue));

  if (Array.isArray(phrases)) {
    return phrases.map((phrase) => substitute(phrase, zippedVariableAndValue));
  }

  return substitute(phrases, zippedVariableAndValue);
};

registerFormatter(substituteVariables);
