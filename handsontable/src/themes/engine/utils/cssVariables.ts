import { isObject } from '../../../helpers/object';
import { toHyphen } from '../../../helpers/string';

/**
 * The theme prefix.
 *
 * @type {string}
 */
const VAR_PREFIX = '--ht-';

/**
 * List of keys that should not be converted to CSS variable references.
 *
 * @type {string[]}
 */
const CSS_KEY_EXCEPTIONS = ['font-family'];

/**
 * List of prefixes that indicate a value should be converted to a CSS variable reference.
 *
 * @type {string[]}
 */
const VAR_REFERENCE_PREFIXES = ['tokens.', 'colors.', 'sizing.', 'density.'];

/**
 * Checks if a value is a reference to another CSS variable (e.g., 'colors.primary').
 *
 * @param {string} value - The value to check.
 * @returns {boolean} - True if the value is a variable reference.
 */
function isVarReference(value: string): boolean {
  return typeof value === 'string' && VAR_REFERENCE_PREFIXES.some(prefix => value.includes(prefix));
}

/**
 * Converts a dot notation path to a CSS variable reference.
 * Handles special case for 'tokens.' prefix which strips the first segment.
 *
 * @param {string} path - The dot notation path (e.g., 'colors.primary').
 * @returns {string} - The CSS variable reference (e.g., 'var(--ht-colors-primary)').
 */
function toVarReference(path: string): string {
  if (path.includes('tokens.')) {
    return `var(${VAR_PREFIX}${toHyphen(path.split('.').slice(1).join('-'))})`;
  }

  return `var(${VAR_PREFIX}${toHyphen(path.split('.').join('-'))})`;
}

/**
 * Converts a key to a CSS variable key.
 *
 * @param {string} prefix - The prefix to add to the CSS variable.
 * @param {string} key - The key to convert.
 * @returns {string} - The CSS variable key.
 */
function toCssKey(prefix: string, key: string): string {
  return `${VAR_PREFIX}${prefix ? `${prefix}-` : ''}${toHyphen(key)}`;
}

/**
 * Converts a value to a CSS variable value.
 * Handles variable references, light/dark values, and single values.
 *
 * @param {string|object} value - The value to convert.
 * @param {string} [key] - The CSS key name (used for exceptions like font-family).
 * @returns {string} - The CSS value.
 */
function toCssValue(value: unknown, key?: string): string {
  if (typeof value === 'string' && isVarReference(value)) {
    return toVarReference(value);
  }

  if (Array.isArray(value)) {
    if (value.length >= 2) {
      const [light, dark] = value;

      if (typeof light === 'string' && typeof dark === 'string') {
        return `light-dark(${toCssValue(light, key)}, ${toCssValue(dark, key)})`;
      }

      if (typeof light === 'string') {
        return toCssValue(light, key);
      }

      if (typeof dark === 'string') {
        return toCssValue(dark, key);
      }

      return '';
    }

    return toCssValue(value[0], key);
  }

  if (key && CSS_KEY_EXCEPTIONS.includes(key)) {
    return String(value);
  }

  return toHyphen(String(value));
}

/**
 * Converts a key and value to a CSS variable line.
 *
 * @param {string} prefix - The prefix to add to the CSS variable.
 * @param {string} key - The key to convert.
 * @param {string} value - The value to convert.
 * @returns {string} - The CSS variable line.
 */
function toCssLine(prefix: string, key: string, value: unknown): string {
  return `${toCssKey(prefix, key)}: ${toCssValue(value, key)};`;
}

/**
 * Flattens the CSS variables object into a string of CSS variables.
 *
 * @param {object} cssVariables - The CSS variables object to flatten.
 * @param {string} [prefix='colors'] - The prefix to add to the CSS variables.
 * @param {string} [parentKey=''] - The parent key to add to the CSS variables.
 * @returns {string} - The flattened CSS variables.
 */
export function flattenCssVariables(
  cssVariables: Record<string, unknown>, prefix: string = '', parentKey: string = ''): string {
  let cssVars = '';

  Object.entries(cssVariables).forEach(([key, value]) => {
    const normalizedKey = toHyphen(key);
    const fullKey = parentKey ? `${parentKey}-${normalizedKey}` : normalizedKey;

    if (isObject(value)) {
      cssVars += flattenCssVariables(value as Record<string, unknown>, prefix, fullKey);
    } else {
      cssVars += `${toCssLine(prefix, fullKey, value)}\n`;
    }
  });

  return cssVars;
}
