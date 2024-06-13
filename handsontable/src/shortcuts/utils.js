// This file handles key-name discrepancies between browsers.
// For the list of discrepancies, go to: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values.
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

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * Get a single, normalized string from the list of the `KeyboardEvent.key` properties.
 *
 * @param {Array<string>} keys The list of the `KeyboardEvent.key` properties
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
 * Get the list of the `KeyboardEvent.key` properties from a single, normalized string.
 *
 * @param {string} normalizedKeys A single, normalized string that contains the list of the `KeyboardEvent.key` properties
 * @returns {Array<string>}
 */
export const getKeysList = (normalizedKeys) => {
  return normalizedKeys.split('+');
};

const specialCharactersSet = new Map([
  [186, 'semicolon'],
  [187, 'equal'],
  [188, 'comma'],
  [189, 'minus'],
  [190, 'period'],
  [191, 'slash'],
  [192, 'backquote'],
  [219, 'bracketleft'],
  [220, 'backslash'],
  [221, 'bracketright'],
  [222, 'quote'],
]);

/**
 * Normalizes a keyboard event key value to a key before its modification.
 *
 * Keep in mind that there is difference between `key` and `code` properties of the KeyboardEvent object.
 * The `key` property represents the logical key on the keyboard (after applying modifiers and taking
 * the keyboard layout into account), where the `code` property represents the physical key
 * (regardless of what is printed on the key). Using the `keyCode` for alphanumeric keys,
 * solves the problem and allows to get the correct key value. The value that takes the keyboard layout
 * into account but is not modified by the modifiers (e.g. Alt + L would give polish "ł" we want "l").
 *
 * @param {Event} event The KeyboardEvent object.
 * @returns {string}
 */
export const normalizeEventKey = ({ which, key }) => {
  if (specialCharactersSet.has(which)) {
    return specialCharactersSet.get(which);
  }

  const normalizedKey = String.fromCharCode(which).toLowerCase();

  if (/^[a-z0-9]$/.test(normalizedKey)) {
    return normalizedKey;
  }

  return key.toLowerCase();
};
