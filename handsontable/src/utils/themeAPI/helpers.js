/**
 * List of prefixes that indicate a value should be converted to a CSS variable reference.
 *
 * @type {string[]}
 */
const VAR_REFERENCE_PREFIXES = ['themes.', 'colors.', 'sizing.', 'density.'];

/**
 * Converts underscores to hyphens in a string.
 *
 * @param {string} str - The string to convert.
 * @returns {string} - The converted string.
 */
export function toHyphen(str) {
  return str.replace(/_/g, '-');
}

/**
 * Checks if the given object is an object.
 *
 * @param {object} object - The object to check.
 * @returns {boolean} - True if the object is an object, false otherwise.
 */
export function isObject(object) {
  return Object.prototype.toString.call(object) === '[object Object]';
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

  if (isObject(value) && value !== null && !Array.isArray(value)) {
    if (value.light && value.dark) {
      return `light-dark(${toCssValue(value.light)}, ${toCssValue(value.dark)})`;
    }

    if (value.light) {
      return toCssValue(value.light);
    }

    if (value.dark) {
      return toCssValue(value.dark);
    }

    return '';
  }

  return typeof value === 'string' ? toHyphen(value) : value;
}

/**
 * Flattens the colors object into a string of CSS variables.
 *
 * @param {object} obj - The object to flatten.
 * @param {string} [prefix='colors'] - The prefix to add to the CSS variables.
 * @param {string} [parentKey=''] - The parent key to add to the CSS variables.
 * @returns {string} - The flattened CSS variables.
 */
export function flattenColors(obj, prefix = 'colors', parentKey = '') {
  let cssVars = '';

  Object.entries(obj).forEach(([key, value]) => {
    const normalizedKey = toHyphen(key);
    const fullKey = parentKey ? `${parentKey}-${normalizedKey}` : normalizedKey;

    if (isObject(value) && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      cssVars += flattenColors(value, prefix, fullKey);
    } else {
      const cssKey = `--ht-${prefix}-${fullKey}`;
      const cssValue = typeof value === 'string' ? toHyphen(value) : value;

      cssVars += `${cssKey}: ${cssValue};\n`;
    }
  });

  return cssVars;
}
