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
 * The named character references a message string may carry, plus numeric ones handled below.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: '\xA0',
};

/**
 * Decodes HTML character references in a string.
 *
 * UI copy that carries tags used to be stripped with `stripTags()` and then assigned to
 * `innerHTML`, so the HTML parser decoded any character references on the way in: a title written
 * as `&lt;` displayed as `<`. Those surfaces now build DOM and write through `textContent`, which
 * decodes nothing, so this reproduces that step and keeps what those messages render unchanged.
 *
 * Covers the named references that appear in prose plus decimal and hexadecimal numeric ones. The
 * full HTML entity table is roughly two thousand names, and reproducing it would mean shipping the
 * table; a reference outside this set is left as written.
 *
 * @param {string} string String to decode.
 * @returns {string}
 */
export function decodeHtmlEntities(string: string): string {
  // One pass, so a decoded `&` cannot start a second reference - `&amp;lt;` decodes to `&lt;`,
  // which is what the parser produced, not to `<`.
  return String(string).replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g, (match, reference: string) => {
    if (reference[0] === '#') {
      const codePoint = reference[1] === 'x' || reference[1] === 'X'
        ? parseInt(reference.slice(2), 16)
        : parseInt(reference.slice(1), 10);

      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10FFFF) {
        return match;
      }

      return String.fromCodePoint(codePoint);
    }

    return NAMED_ENTITIES[reference] ?? match;
  });
}

/**
 * Strips HTML tags from a string and decodes any character references left behind.
 *
 * This is what a surface needs when it renders authored copy as text: it reproduces what assigning
 * the string to `innerHTML` and reading `textContent` back used to produce, without going near a
 * sink. Use it wherever `stripTags()` output is written through `textContent`.
 *
 * @param {string} string String to convert.
 * @returns {string}
 */
export function htmlToPlainText(string: string): string {
  return decodeHtmlEntities(stripTags(string));
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
 * Most languages use the same uppercase-to-lowercase rules as plain English — for
 * example, `'A'` always becomes `'a'`, `'Ö'` always becomes `'ö'`. Only three locales
 * diverge: Turkish and Azeri treat dotted `'İ'` and dotless `'I'` as separate letters
 * (so `'I'` lowercases to `'ı'`, not `'i'`), and Lithuanian inserts an extra dot when
 * lowercasing `'Ì'`, `'Í'`, and `'Ĩ'`. These five characters are therefore the only
 * ones in Unicode where locale matters for lowercasing, which makes them a reliable
 * probe: if a locale changes how they lowercase, it needs special handling; every other
 * locale can use the much faster `toLowerCase()`.
 */
const LOCALE_LOWERCASE_PROBE = 'IİÌÍĨ';
const LOCALE_LOWERCASE_PROBE_DEFAULT = LOCALE_LOWERCASE_PROBE.toLowerCase();
const localeLowerCaseTailoringCache = new Map<string | undefined, boolean>();

/**
 * Returns `true` when the given locale changes how letters are lowercased compared
 * with the standard rules. This is only true for Turkish, Azeri, and Lithuanian.
 *
 * The result is cached the first time a locale is seen because the answer never
 * changes — it is a fixed property of the JavaScript engine, not of the data. Calling
 * `updateSettings({ locale: 'tr-TR' })` does not invalidate the cache; it simply means
 * the next call passes `'tr-TR'` as the locale string, which is already cached.
 *
 * An invalid or empty locale tag (e.g. `''` or `'en_US'` with an underscore) is treated
 * as "does not change lowercasing" so the function never throws.
 *
 * @param {string} [locale] A BCP 47 locale tag such as `'tr-TR'`, or `undefined` to use
 *   the host default.
 * @returns {boolean} `true` for Turkish (`tr`), Azeri (`az`), and Lithuanian (`lt`);
 *   `false` for everything else.
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
 * Lowercases a string in a locale-aware and performant way.
 *
 * The built-in `toLocaleLowerCase(locale)` is correct but slow — passing an explicit
 * locale forces the JavaScript engine to use its full international library on every
 * call, even for languages like German or French where the result would be exactly the
 * same as plain `toLowerCase()`. This function checks first whether the given locale
 * actually changes anything, and falls back to the faster `toLowerCase()` when it does
 * not. The check result is cached, so the overhead is paid only once per locale.
 *
 * Invalid or empty locale tags (such as `''` or `'en_US'` with an underscore instead
 * of a hyphen) are handled gracefully instead of throwing an error.
 *
 * @param {string} value The string to lowercase.
 * @param {string} [locale] A BCP 47 locale tag such as `'tr-TR'` or `'en-US'`,
 *   or `undefined` to use the host default.
 * @returns {string} The lowercased string.
 */
export function localeLowerCase(value: string, locale?: string): string {
  // eslint-disable-next-line no-restricted-syntax
  return localeAffectsLowerCase(locale) ? value.toLocaleLowerCase(locale) : value.toLowerCase();
}
