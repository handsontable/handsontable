/**
 * List of prefixes that indicate a value should be converted to a CSS variable reference.
 *
 * @type {string[]}
 */
const VAR_REFERENCE_PREFIXES = ['themes.', 'colors.', 'sizing.', 'density.'];

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
    return `var(--ht-${path.split('.').slice(1).join('-')})`;
  }

  return `var(--ht-${path.split('.').join('-')})`;
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

  return value;
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
    const fullKey = parentKey ? `${parentKey}-${key}` : key;

    if (isObject(value) && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects
      cssVars += flattenColors(value, prefix, fullKey);
    } else {
      const cssKey = `--ht-${prefix}-${fullKey}`;

      cssVars += `${cssKey}: ${value};\n`;
    }
  });

  return cssVars;
}
