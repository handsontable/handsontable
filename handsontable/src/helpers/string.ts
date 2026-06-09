import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';
import { stringify } from './mixed';

/**
 * Convert string to upper case first letter.
 *
 * @param {string} string String to convert.
 * @returns {string}
 */
export function toUpperCaseFirst(string: string): string {
  return string[0].toUpperCase() + string.substr(1);
}

/**
 * Compare strings case insensitively.
 *
 * @param {...string} strings Strings to compare.
 * @returns {boolean}
 */
export function equalsIgnoreCase(...strings: string[]): boolean {
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
export function randomString(): string {
  const buf = new Uint16Array(4);

  globalThis.crypto.getRandomValues(buf);

  return Array.from(buf, v => v.toString(16).padStart(4, '0')).join('');
}

/**
 * Checks if a string is a valid JSON object.
 *
 * @param {string} string The string to check.
 * @returns {boolean}
 */
export function isJSON(string: string) {
  if (typeof string !== 'string') {
    return false;
  }

  try {
    const parsed: unknown = JSON.parse(string);

    return typeof parsed === 'object' && parsed !== null;

  } catch {
    return false;
  }
}

/**
 * Checks if value is valid percent.
 *
 * @param {string} value The value to check.
 * @returns {boolean}
 */
export function isPercentValue(value: string): boolean {
  return /^(?:\d\d?%|100%)$/.test(value);
}

/**
 * Substitute strings placed between square brackets into value defined in `variables` object. String names defined in
 * square brackets must be the same as property name of `variables` object.
 *
 * @param {string} template Template string.
 * @param {object} variables Object which contains all available values which can be injected into template.
 * @returns {string}
 */
export function substitute(template: string, variables: Record<string, unknown> = {}): string {
  return (`${template}`).replace(/(?:\\)?\[([^[\]]+)]/g, (match, name) => {
    if (match.charAt(0) === '\\') {
      return match.substr(1, match.length - 1);
    }

    return variables[name] === undefined ? '' : String(variables[name]);
  });
}

/**
 * Strip any HTML tag from the string.
 *
 * @param {string} string String to cut HTML from.
 * @returns {string}
 */
export function stripTags(string: string): string {
  return sanitize(`${string}`, { ALLOWED_TAGS: [] });
}

/**
 * Sanitizes string from potential security vulnerabilities.
 *
 * @param {string} string String to sanitize.
 * @param {object} [options] DOMPurify's configuration object.
 * @returns {string}
 */
export function sanitize(string: string, options?: DOMPurifyConfig): string {
  return DOMPurify.sanitize(string, options) as unknown as string;
}

/**
 * Converts camel case to hyphens in a string.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The converted string.
 */
export function toHyphen(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  return str.replace(/([A-Z])/g, '-$1').replaceAll('_', '-').toLowerCase();
}
