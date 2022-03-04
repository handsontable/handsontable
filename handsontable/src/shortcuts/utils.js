// This file contains key mappings that help Handsontable handle browser differences.
// For the list of browser differences, go to: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values.
const mappings = new Map([
  [' ', 'space'], // custom mapping
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
 * Get a single, normalized string from the list of `KeyboardEvent`'s `key` properties.
 *
 * @param {Array<string>} keys The list of `KeyboardEvent`'s `key` properties.
 * @returns {string}
 */
export const normalizeKeys = (keys) => {
  return keys.sort().map((key) => {
    const lowercaseKey = key.toLowerCase();

    if (mappings.has(lowercaseKey)) {
      return mappings.get(lowercaseKey);
    }

    return lowercaseKey;
  }).join('+');
};

/**
 * Get the list of `KeyboardEvent`'s `key` properties from a single, normalized string.
 *
 * @param {string} normalizedKeys A single, normalized string that contains the list of `KeyboardEvent`'s `key` properties
 * @returns {Array<string>}
 */
export const getKeysList = (normalizedKeys) => {
  return normalizedKeys.split('+');
};

/**
 * Normalize a `KeyboardEvent`'s `key` property, to use it for keyboard shortcuts.
 *
 * @param {string} key KeyboardEvent's key property.
 * @returns {string}
 */
export const normalizeEventKey = (key) => {
  return key.toLowerCase();
};
