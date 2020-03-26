/**
 * Parse the error object returned by HyperFormula to readable strings.
 *
 * @param {object} errorObject Error object returned by HyperFormula.
 * @returns {string}
 */
export default function parseErrorObject(errorObject) {
  let parsedErrorValue = '';

  switch (errorObject.type) {
    case 'DIV_BY_ZERO':
      parsedErrorValue = '#DIV/0!';
      break;
    case 'REF':
      parsedErrorValue = '#REF!';
      break;
    case 'NA':
      parsedErrorValue = '#N/A';
      break;
    case 'NAME':
      parsedErrorValue = '#NAME?';
      break;
    case 'NUM':
      parsedErrorValue = '#NUM!';
      break;
    case 'VALUE':
      parsedErrorValue = '#VALUE!';
      break;
    default:
      parsedErrorValue = '#ERROR!';
  }

  return parsedErrorValue;
}
