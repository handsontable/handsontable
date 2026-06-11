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
  const str = String(string);
  let result = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (depth > 0 && !inQuote && (ch === '"' || ch === '\'')) {
      inQuote = true;
      quoteChar = ch;
    } else if (inQuote && ch === quoteChar) {
      inQuote = false;
    } else if (!inQuote && ch === '<') {
      depth += 1;
    } else if (!inQuote && ch === '>' && depth > 0) {
      depth -= 1;
    } else if (depth === 0) {
      result += ch;
    }
  }

  return result;
}

/**
 * Returns the string unchanged.
 *
 * @deprecated Default sanitization is now a pass-through. Use the sanitizer
 * configuration option to supply a custom sanitizer function.
 * @param {string} string String to return.
 * @returns {string}
 */
export function sanitize(string: string): string {
  return string;
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

/**
 * Characters whose lowercase mapping is tailored only by the Turkish, Azeri, and
 * Lithuanian locales. Used to detect at runtime — without a hardcoded locale list —
 * whether a locale changes the result of lowercasing.
 */
const LOCALE_LOWERCASE_PROBE = 'IİÌÍĨ';
const LOCALE_LOWERCASE_PROBE_DEFAULT = LOCALE_LOWERCASE_PROBE.toLowerCase();
const localeLowerCaseTailoringCache = new Map<string | undefined, boolean>();

/**
 * Checks whether a locale changes the result of lowercasing compared with the
 * language-neutral Unicode mapping. The answer is immutable for a given JavaScript
 * engine, so it is cached per locale. Invalid or empty locale tags resolve to `false`.
 *
 * @param {string} [locale] A BCP 47 locale tag, or `undefined` for the host default.
 * @returns {boolean} `true` when the locale tailors lowercasing (Turkish, Azeri, Lithuanian).
 */
function localeAffectsLowerCase(locale?: string): boolean {
  const cached = localeLowerCaseTailoringCache.get(locale);

  if (cached !== undefined) {
    return cached;
  }

  let affects: boolean;

  try {
    // eslint-disable-next-line no-restricted-syntax
    affects = LOCALE_LOWERCASE_PROBE.toLocaleLowerCase(locale) !== LOCALE_LOWERCASE_PROBE_DEFAULT;
  } catch {
    affects = false;
  }

  localeLowerCaseTailoringCache.set(locale, affects);

  return affects;
}

/**
 * Lowercases a string, honoring the locale only when the locale actually changes the
 * result (Turkish, Azeri, Lithuanian). For every other locale it uses the fast,
 * language-neutral `toLowerCase`, which is byte-identical to `toLocaleLowerCase` for
 * those locales but avoids the expensive Intl path. Invalid locale tags never throw.
 *
 * @param {string} value The string to lowercase.
 * @param {string} [locale] A BCP 47 locale tag, or `undefined` for the host default.
 * @returns {string} The lowercased string.
 */
export function localeLowerCase(value: string, locale?: string): string {
  // eslint-disable-next-line no-restricted-syntax
  return localeAffectsLowerCase(locale) ? value.toLocaleLowerCase(locale) : value.toLowerCase();
}
