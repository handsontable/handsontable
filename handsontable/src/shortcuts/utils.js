/**
 * Get single, normalized string from list of KeyboardEvent's key properties.
 *
 * @param {Array<string>} keys List of KeyboardEvent's key properties.
 * @returns {string}
 */
export const normalizeKeys = (keys) => {
  return keys.sort().join('+').toLowerCase();
};

/**
 * Get list of KeyboardEvent's key properties from single, normalized string.
 *
 * @param {string} normalizedKeys Single, normalized string from list of KeyboardEvent's key properties.
 * @returns {Array<string>}
 */
export const getKeysList = (normalizedKeys) => {
  return normalizedKeys.split('+');
};

/**
 * Normalize KeyboardEvent's key property being the basis of keyboard shortcuts.
 *
 * @param {string} key KeyboardEvent's key property.
 * @returns {string}
 */
export const normalizeEventKey = (key) => {
  return key.toLowerCase();
};
