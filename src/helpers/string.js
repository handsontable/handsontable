
import {stringify} from './mixed';
import {rangeEach} from './number';

/**
 * Convert string to upper case first letter.
 *
 * @param {String} string String to convert.
 * @returns {String}
 */
export function toUpperCaseFirst(string) {
  return string[0].toUpperCase() + string.substr(1);
}

/**
 * Checks if given prefix matches to the string.
 *
 * @param {String} string String to check.
 * @param {String} string Needle to search.
 * @returns {Boolean}
 */
export function startsWith(string, needle) {
  let result = true;

  rangeEach(needle.length - 1, (index) => {
    if (string.charAt(index) !== needle.charAt(index)) {
      result = false;

      return false;
    }
  });

  return result;
}

/**
 * Checks if given postfix matches to the string.
 *
 * @param {String} string String to check.
 * @param {String} string Needle to search.
 * @returns {Boolean}
 */
export function endsWith(string, needle) {
  let result = true;
  let needleLength = needle.length - 1;
  let stringLength = string.length - 1;

  rangeEach(needleLength, (index) => {
    let stringIndex = stringLength - index;
    let needleIndex = needleLength - index;

    if (string.charAt(stringIndex) !== needle.charAt(needleIndex)) {
      result = false;

      return false;
    }
  });

  return result;
}

/**
 * Compare strings case insensitively.
 *
 * @param {...String} strings Strings to compare.
 * @returns {Boolean}
 */
export function equalsIgnoreCase(...strings) {
  let unique = [];
  let length = strings.length;

  while (length--) {
    let string = stringify(strings[length]).toLowerCase();

    if (unique.indexOf(string) === -1) {
      unique.push(string);
    }
  }

  return unique.length === 1;
}

/**
 * Generates a random hex string. Used as namespace for Handsontable instance events.
 *
 * @return {String} Returns 16-long character random string (eq. `'92b1bfc74ec4'`).
 */
export function randomString() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return s4() + s4() + s4() + s4();
}

/**
 * Checks if value is valid percent.
 *
 * @param {String} value
 * @returns {Boolean}
 */
export function isPercentValue(value) {
  return /^([0-9][0-9]?\%$)|(^100\%$)/.test(value);
}

/**
 * Substitute strings placed beetwen square brackets into value defined in `variables` object. String names defined in
 * square brackets must be the same as property name of `variables` object.
 *
 * @param {String} template Template string.
 * @param {Object} variables Object which contains all available values which can be injected into template.
 * @returns {String}
 */
export function substitute(template, variables = {}) {
  return (template + '').replace(/(?:\\)?\[([^\[\]]+)]/g, function(match, name) {
    if (match.charAt(0) === '\\') {
      return match.substr(1, match.length - 1);
    }

    return variables[name] === void 0 ? '' : variables[name];
  });
}

/**
 * Pad a string to a certain length with another string.
 *
 * @param {String} string The input string.
 * @param {Number} maxLength If the value of `maxLength` is negative, less than, or equal to the length of the input string,
 *                           no padding takes place.
 * @param {String} fillString String to be fill.
 * @returns {String}
 */
export function padStart(string, maxLength, fillString = ' ') {
  string = string + '';

  if (string.length >= maxLength) {
    return string;
  }
  fillString = String(fillString);

  let fillStringLength = fillString.length;

  if (!fillStringLength) {
    fillString = ' ';
  }
  let fillLen = maxLength - string.length;
  let timesToRepeat = Math.ceil(fillLen / fillString.length);
  let truncatedString = '';

  rangeEach(timesToRepeat, (index) => {
    truncatedString += fillString;
  });
  truncatedString = truncatedString.slice(0, fillLen);

  return truncatedString + string;
};
