import { EmptyValue, CellError } from 'hyperformula/dist/unoptimized-full/bundle.js';

// TODO: docs
export function parseHFValue(value) {
  if (value instanceof CellError) {
    return parseErrorObject(value);

  } else if (value === EmptyValue) {
    return null;
  }

  return value.toString(); // TODO: currently parsing everything to strings
}

// TODO: docs
export function parseErrorObject(errorObject) {
  let parsedErrorValue = '';

  if (errorObject.type === 'DIV_BY_ZERO') {
    parsedErrorValue = '#DIV/0!';
  } else if (errorObject.type === 'REF') {
    parsedErrorValue = '#REF!';
  } else if (errorObject.type === 'NA') {
    parsedErrorValue = '#N/A';
  } else if (errorObject.type === 'NAME') {
    parsedErrorValue = '#NAME?';
  } else {
    parsedErrorValue = '#ERROR!';
  }

  return parsedErrorValue;
}
