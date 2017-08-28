import {register as registerFormatter} from '../formattersController';
import {isObject} from './../../helpers/object';

function pluralizationFunction(pluralDeterminant) {
  const isRange = /\S+-\S+$/;

  if (isRange.test(pluralDeterminant)) {
    return 1;
  }

  return 0;
}

function pluralize(phrases, zippedVariableAndValue) {
  // TODO: Should be first value our plural determinant?
  const pluralDeterminant = isObject(zippedVariableAndValue) && Object.values(zippedVariableAndValue)[0];
  const isPluralizable = Array.isArray(phrases);

  if (isPluralizable) {
    return phrases[pluralizationFunction(pluralDeterminant)];
  }

  return phrases;
};

registerFormatter(pluralize);
