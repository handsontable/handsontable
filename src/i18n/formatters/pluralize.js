import {register as registerFormatter} from '../formattersController';
import {hasArrayRangeOfNextNumbers} from './../utils';
import {isObject} from './../../helpers/object';

function pluralizationFunction(pluralDeterminant) {
  if (pluralDeterminant.length <= 1) {
    return 0;

  } else if (hasArrayRangeOfNextNumbers(pluralDeterminant)) {
    return 1;
  }

  return 2;
}

function pluralize(phrases, zippedVariableAndValue) {
  // TODO: Should be first value which is an Array our plural determinant?
  const pluralDeterminant = isObject(zippedVariableAndValue)
    && Object.values(zippedVariableAndValue).find((value) => Array.isArray(value));

  if (Array.isArray(phrases) && Array.isArray(pluralDeterminant)) {
    return phrases[pluralizationFunction(pluralDeterminant)];
  }

  return phrases;
};

registerFormatter(pluralize);
