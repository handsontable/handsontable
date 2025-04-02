import DOMPurify from 'dompurify';
import { stringify } from './mixed';

/**
 * Convert string to upper case first letter.
 *
 * @param {string} string String to convert.
 * @returns {string}
 */
export function toUpperCaseFirst(string) {
  return string[0].toUpperCase() + string.substr(1);
}

/**
 * Compare strings case insensitively.
 *
 * @param {...string} strings Strings to compare.
 * @returns {boolean}
 */
export function equalsIgnoreCase(...strings) {
  const unique = [];
  let length = strings.length;

  while (length) {
    length -= 1;
    const string = stringify(strings[length]).toLowerCase();

    if (unique.indexOf(string) === -1) {
      unique.push(string);
    }
  }

  return unique.length === 1;
}

/**
 * Generates a random hex string. Used as namespace for Handsontable instance events.
 *
 * @returns {string} Returns 16-long character random string (eq. `'92b1bfc74ec4'`).
 */
export function randomString() {
  /**
   * @returns {string}
   */
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
 * @param {string} value The value to check.
 * @returns {boolean}
 */
export function isPercentValue(value) {
  return /^([0-9][0-9]?%$)|(^100%$)/.test(value);
}

/**
 * Substitute strings placed beetwen square brackets into value defined in `variables` object. String names defined in
 * square brackets must be the same as property name of `variables` object.
 *
 * @param {string} template Template string.
 * @param {object} variables Object which contains all available values which can be injected into template.
 * @returns {string}
 */
export function substitute(template, variables = {}) {
  return (`${template}`).replace(/(?:\\)?\[([^[\]]+)]/g, (match, name) => {
    if (match.charAt(0) === '\\') {
      return match.substr(1, match.length - 1);
    }

    return variables[name] === undefined ? '' : variables[name];
  });
}

/**
 * Strip any HTML tag from the string.
 *
 * @param {string} string String to cut HTML from.
 * @returns {string}
 */
export function stripTags(string) {
  return sanitize(`${string}`, { ALLOWED_TAGS: [] });
}

/**
 * Sanitizes string from potential security vulnerabilities.
 *
 * @param {string} string String to sanitize.
 * @param {object} [options] DOMPurify's configuration object.
 * @returns {string}
 */
export function sanitize(string, options) {
  return DOMPurify.sanitize(string, options);
}
