// TODO: docs
export function parseHFValue(value) {
  if (value && value.constructor && value.constructor.name.includes('Error')) {
    return parseErrorObject(value);

  } else if (typeof value === 'symbol') { // TODO: parsing `Symbol`s received from HF to `null`, needs to be checked if `Symbol` always means `null`.
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
