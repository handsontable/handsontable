/**
 * Checks if a value is a plain object (and not null/array).
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deeply merges two objects.
 * For every key:
 *  - If both source and target values are plain objects, they are merged recursively.
 *  - Otherwise, the source value replaces the target value.
 *
 * @param {object} target The target object.
 * @param {object} source The source object.
 * @returns {object} The merged object.
 */
export function deepMerge(target = {}, source = {}) {
  const result = {
    ...target,
  };

  Object.keys(source).forEach((key) => {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }

    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  });

  return result;
}

/**
 * Clones an object using structuredClone.
 *
 * @param {object} object The object to clone.
 * @returns {object} The cloned object.
 */
export function cloneObject(object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * Valid color scheme values.
 *
 * @type {Set<string>}
 */
const VALID_COLOR_SCHEMES = new Set(['light', 'dark', 'auto']);

/**
 * Validates user-provided theme parameters.
 * The input must be an object. Each top-level key is optional but if provided must be of the correct type.
 *
 * @param {*} userInput The user-provided value to validate.
 * @param {string} context The context name for error messages (e.g., 'baseTheme', 'paramsObject').
 * @throws {Error} If the input is not an object or any provided value has an invalid type.
 */
export function validateInput(userInput, context) {
  if (typeof userInput !== 'object' || userInput === null) {
    throw new Error(`[ThemeBuilder] ${context} must be an object.`);
  }

  const {
    sizing,
    density,
    icons,
    colors,
    tokens,
    colorScheme,
  } = userInput;

  if (sizing !== undefined && (typeof sizing !== 'object' || sizing === null)) {
    throw new Error(`[ThemeBuilder] ${context}.sizing must be an object.`);
  }

  if (density !== undefined && typeof density !== 'string' && (typeof density !== 'object' || density === null)) {
    throw new Error(`[ThemeBuilder] ${context}.density must be a string or an object.`);
  }

  if (icons !== undefined && (typeof icons !== 'object' || icons === null)) {
    throw new Error(`[ThemeBuilder] ${context}.icons must be an object.`);
  }

  if (colors !== undefined && (typeof colors !== 'object' || colors === null)) {
    throw new Error(`[ThemeBuilder] ${context}.colors must be an object.`);
  }

  if (colors !== undefined) {
    validateColorsStructure(colors, `${context}.colors`);
  }

  if (tokens !== undefined && (typeof tokens !== 'object' || tokens === null)) {
    throw new Error(`[ThemeBuilder] ${context}.tokens must be an object.`);
  }

  if (colorScheme !== undefined && typeof colorScheme !== 'string') {
    throw new Error(`[ThemeBuilder] ${context}.colorScheme must be a string.`);
  }
}

/**
 * Validates and returns a density type.
 *
 * @param {string} type The density type to validate.
 * @param {object} availableSizes The available density sizes object.
 * @returns {string} The validated density type.
 * @throws {Error} If the density type is invalid.
 */
export function validateDensityType(type, availableSizes) {
  if (!Object.prototype.hasOwnProperty.call(availableSizes, type)) {
    const validTypes = Object.keys(availableSizes).join(', ');

    throw new Error(`[ThemeBuilder] Invalid density: "${type}". Must be one of: ${validTypes}.`);
  }

  return type;
}

/**
 * Validates a color scheme value.
 *
 * @param {string} mode The color scheme to validate.
 * @returns {string} The validated color scheme.
 * @throws {Error} If the color scheme is invalid.
 */
export function validateColorScheme(mode) {
  if (!VALID_COLOR_SCHEMES.has(mode)) {
    const validModes = [...VALID_COLOR_SCHEMES].join(', ');

    throw new Error(`[ThemeBuilder] Invalid color scheme: "${mode}". Must be one of: ${validModes}.`);
  }

  return mode;
}

/**
 * Validates the structure of the colors object.
 * Colors can be either strings or nested objects containing strings.
 *
 * @param {object} colors The colors object to validate.
 * @param {string} context The context path for error messages.
 * @throws {Error} If the colors structure is invalid.
 */
export function validateColorsStructure(colors, context) {
  Object.entries(colors).forEach(([key, value]) => {
    const currentPath = `${context}.${key}`;

    if (typeof value === 'string') {
      return;
    }

    if (isObject(value)) {
      validateColorsStructure(value, currentPath);
    } else {
      throw new Error(`[ThemeBuilder] ${currentPath} must be a string or an object.`);
    }
  });
}
