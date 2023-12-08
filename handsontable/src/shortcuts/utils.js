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

/**
 * The regex tests if the event.code matches to the pattern and it's used to extract letters and digits from
 * the string.
 */
const codeToKeyRegExp = new RegExp('^(?:Key|Digit)([A-Z0-9])$');
const keyCodeNames = new Set([
  'Backquote',
  'Minus',
  'Equal',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'Semicolon',
  'Quote',
  'Comma',
  'Period',
  'Slash',
]);

/**
 * Normalizes a keyboard event key value to a key before its modification. When the keyboard event
 * is triggered with Alt, Control or Shift keys the `key` property contains modified key e.g. for Alt+L
 * it will be `ł`. But that value is only valid for polish keyboard layout. To fix that limitations, for
 * letters and digits the value is taken from the `code` property which holds original value before
 * transformation.
 *
 * @param {Event} event The KeyboardEvent object.
 * @returns {string}
 */
export const normalizeEventKey = ({ key, code }) => {
  let normalizedKey = key;

  if (codeToKeyRegExp.test(code)) {
    normalizedKey = code.replace(codeToKeyRegExp, '$1');

  } else if (keyCodeNames.has(code)) {
    normalizedKey = code;
  }

  return normalizedKey.toLowerCase();
};
