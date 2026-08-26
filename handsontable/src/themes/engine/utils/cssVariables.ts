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
 * Options that change how a value list is turned into a CSS value.
 */
export interface FlattenOptions {
  /**
   * Resolves a `[light, dark]` value list to that one branch instead of emitting
   * `light-dark()`. The scheme override has to win over the stylesheet, and a
   * stylesheet built below the `light-dark()` floor carries class-switched
   * variables that a bare `color-scheme` flip cannot beat. See
   * `ThemeManager#buildResolvedColorVariables`.
   */
  resolveScheme?: 'light' | 'dark';
  /**
   * Emits only the variables whose value is a `[light, dark]` list. Values that
   * are the same in both schemes do not need to be repeated in an override block.
   */
  lightDarkOnly?: boolean;
}

/**
 * Checks whether a value is a `[light, dark]` value list.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - True when the value carries a separate light and dark value.
 */
function isLightDarkValue(value: unknown): boolean {
  return Array.isArray(value) && value.length >= 2 &&
    typeof value[0] === 'string' && typeof value[1] === 'string';
}

/**
 * Converts a value to a CSS variable value.
 * Handles variable references, light/dark values, and single values.
 *
 * @param {string|object} value - The value to convert.
 * @param {string} [key] - The CSS key name (used for exceptions like font-family).
 * @param {object} [options] - The flattening options.
 * @returns {string} - The CSS value.
 */
function toCssValue(value: unknown, key?: string, options: FlattenOptions = {}): string {
  if (typeof value === 'string' && isVarReference(value)) {
    return toVarReference(value);
  }

  if (Array.isArray(value)) {
    if (value.length >= 2) {
      const [light, dark]: [unknown, unknown] = value as [unknown, unknown];

      if (typeof light === 'string' && typeof dark === 'string') {
        if (options.resolveScheme === 'light') {
          return toCssValue(light, key, options);
        }

        if (options.resolveScheme === 'dark') {
          return toCssValue(dark, key, options);
        }

        return `light-dark(${toCssValue(light, key, options)}, ${toCssValue(dark, key, options)})`;
      }

      if (typeof light === 'string') {
        return toCssValue(light, key, options);
      }

      if (typeof dark === 'string') {
        return toCssValue(dark, key, options);
      }

      return '';
    }

    return toCssValue(value[0], key, options);
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
 * @param {object} [options] - The flattening options.
 * @returns {string} - The CSS variable line.
 */
function toCssLine(prefix: string, key: string, value: unknown, options: FlattenOptions = {}): string {
  return `${toCssKey(prefix, key)}: ${toCssValue(value, key, options)};`;
}

/**
 * Flattens the CSS variables object into a string of CSS variables.
 *
 * @param {object} cssVariables - The CSS variables object to flatten.
 * @param {string} [prefix='colors'] - The prefix to add to the CSS variables.
 * @param {string} [parentKey=''] - The parent key to add to the CSS variables.
 * @param {object} [options] - The flattening options.
 * @returns {string} - The flattened CSS variables.
 */
export function flattenCssVariables(
  cssVariables: Record<string, unknown>,
  prefix: string = '',
  parentKey: string = '',
  options: FlattenOptions = {}
): string {
  let cssVars = '';

  Object.entries(cssVariables).forEach(([key, value]) => {
    const normalizedKey = toHyphen(key);
    const fullKey = parentKey ? `${parentKey}-${normalizedKey}` : normalizedKey;

    if (isObject(value)) {
      cssVars += flattenCssVariables(value as Record<string, unknown>, prefix, fullKey, options);
    } else if (!options.lightDarkOnly || isLightDarkValue(value)) {
      cssVars += `${toCssLine(prefix, fullKey, value, options)}\n`;
    }
  });

  return cssVars;
}
