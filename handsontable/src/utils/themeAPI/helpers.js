/**
 * List of prefixes that indicate a value should be converted to a CSS variable reference.
 *
 * @type {string[]}
 */
const VAR_REFERENCE_PREFIXES = ['themes.', 'colors.', 'sizing.', 'density.'];

/**
 * Converts camel case to hyphens in a string.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The converted string.
 */
export function toHyphen(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return str.replace(/([A-Z])/g, '-$1').replace(/_/g, '-').toLowerCase();
}

/**
 * Checks if the given object is an object.
 *
 * @param {object} object - The object to check.
 * @returns {boolean} - True if the object is an object, false otherwise.
 */
export function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]' && object !== null && !Array.isArray(object);
}

/**
 * Checks if a value is a reference to another CSS variable (e.g., 'colors.primary').
 *
 * @param {string} value - The value to check.
 * @returns {boolean} - True if the value is a variable reference.
 */
export function isVarReference(value) {
  return typeof value === 'string' && VAR_REFERENCE_PREFIXES.some(prefix => value.includes(prefix));
}

/**
 * Converts a dot notation path to a CSS variable reference.
 * Handles special case for 'themes.' prefix which strips the first segment.
 *
 * @param {string} path - The dot notation path (e.g., 'colors.primary' or 'themes.dark.background').
 * @returns {string} - The CSS variable reference (e.g., 'var(--ht-colors-primary)').
 */
function toVarReference(path) {
  if (path.includes('themes.')) {
    return `var(--ht-${toHyphen(path.split('.').slice(1).join('-'))})`;
  }

  return `var(--ht-${toHyphen(path.split('.').join('-'))})`;
}

/**
 * Converts a key to a CSS variable key.
 *
 * @param {string} prefix - The prefix to add to the CSS variable.
 * @param {string} key - The key to convert.
 * @returns {string} - The CSS variable key.
 */
export function toCssKey(prefix, key) {
  return `--ht-${prefix ? `${prefix}-` : ''}${toHyphen(key)}`;
}

/**
 * Converts a value to a CSS variable declaration value.
 * Handles variable references, light/dark objects, and plain values.
 *
 * @param {string|object} value - The value to convert.
 * @returns {string} - The CSS value.
 */
export function toCssValue(value) {
  if (isVarReference(value)) {
    return toVarReference(value);
  }

  if (Array.isArray(value)) {
    if (value.length >= 2) {
      const [light, dark] = value;

      if (typeof light === 'string' && typeof dark === 'string') {
        return `light-dark(${toCssValue(light)}, ${toCssValue(dark)})`;
      }

      if (typeof light === 'string') {
        return toCssValue(light);
      }

      if (typeof dark === 'string') {
        return toCssValue(dark);
      }

      return '';
    }

    return toCssValue(value[0]);
  }

  return toHyphen(value);
}

/**
 * Converts a key and value to a CSS variable line.
 *
 * @param {string} prefix - The prefix to add to the CSS variable.
 * @param {string} key - The key to convert.
 * @param {string} value - The value to convert.
 * @returns {string} - The CSS variable line.
 */
export function toCssLine(prefix, key, value) {
  return `${toCssKey(prefix, key)}: ${toCssValue(value)};`;
}

/**
 * Flattens the css variables object into a string of CSS variables.
 *
 * @param {object} cssVariables - The css variables object to flatten.
 * @param {string} [prefix='colors'] - The prefix to add to the CSS variables.
 * @param {string} [parentKey=''] - The parent key to add to the CSS variables.
 * @returns {string} - The flattened css variables.
 */
export function flattenCssVariables(cssVariables, prefix = '', parentKey = '') {
  let cssVars = '';

  Object.entries(cssVariables).forEach(([key, value]) => {
    const normalizedKey = toHyphen(key);
    const fullKey = parentKey ? `${parentKey}-${normalizedKey}` : normalizedKey;

    if (isObject(value)) {
      cssVars += flattenCssVariables(value, prefix, fullKey);
    } else {
      cssVars += `${toCssLine(prefix, fullKey, value)}\n`;
    }
  });

  return cssVars;
}
