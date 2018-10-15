import { stringify } from './mixed';

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
 * Compare strings case insensitively.
 *
 * @param {...String} strings Strings to compare.
 * @returns {Boolean}
 */
export function equalsIgnoreCase() {
  var unique = [];

  for (var _len = arguments.length, strings = Array(_len), _key = 0; _key < _len; _key++) {
    strings[_key] = arguments[_key];
  }

  var length = strings.length;

  while (length) {
    length -= 1;
    var string = stringify(strings[length]).toLowerCase();

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
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
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
  return (/^([0-9][0-9]?%$)|(^100%$)/.test(value)
  );
}

/**
 * Substitute strings placed beetwen square brackets into value defined in `variables` object. String names defined in
 * square brackets must be the same as property name of `variables` object.
 *
 * @param {String} template Template string.
 * @param {Object} variables Object which contains all available values which can be injected into template.
 * @returns {String}
 */
export function substitute(template) {
  var variables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  return ('' + template).replace(/(?:\\)?\[([^[\]]+)]/g, function (match, name) {
    if (match.charAt(0) === '\\') {
      return match.substr(1, match.length - 1);
    }

    return variables[name] === void 0 ? '' : variables[name];
  });
}

var STRIP_TAGS_REGEX = /<\/?\w+\/?>|<\w+[\s|/][^>]*>/gi;

/**
 * Strip any HTML tag from the string.
 *
 * @param  {String} string String to cut HTML from.
 * @return {String}
 */
export function stripTags(string) {
  return ('' + string).replace(STRIP_TAGS_REGEX, '');
}