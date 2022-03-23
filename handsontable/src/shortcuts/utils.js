// Please keep in mind that there are some key discrepancies in browsers. That's why there are some mappings.
// There is a list which show some exceptions: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values.
const mappings = new Map([
  [' ', 'space'], // Custom mapping.
  ['spacebar', 'space'],
  ['scroll', 'scrolllock'],
  ['del', 'delete'],
  ['esc', 'escape'],
  ['medianexttrack', 'mediatracknext'],
  ['mediaprevioustrack', 'mediatrackprevious'],
  ['volumeup', 'audiovolumeup'],
  ['volumedown', 'audiovolumedown'],
  ['volumemute', 'audiovolumemute'],
  ['multiply', '*'],
  ['add', '+'],
  ['divide', '/'],
  ['subtract', '-'],
  ['left', 'arrowleft'],
  ['right', 'arrowright'],
  ['up', 'arrowup'],
  ['down', 'arrowdown'],
]);

/**
 * Get single, normalized string from list of KeyboardEvent's key properties.
 *
 * @param {Array<string>} keys List of KeyboardEvent's key properties.
 * @returns {string}
 */
export const normalizeKeys = (keys) => {
  return keys.map((key) => {
    const lowercaseKey = key.toLowerCase();

    if (mappings.has(lowercaseKey)) {
      return mappings.get(lowercaseKey);
    }

    return lowercaseKey;
  }).sort().join('+');
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
