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
  [96, 'numpad0'],
  [97, 'numpad1'],
  [98, 'numpad2'],
  [99, 'numpad3'],
  [100, 'numpad4'],
  [101, 'numpad5'],
  [102, 'numpad6'],
  [103, 'numpad7'],
  [104, 'numpad8'],
  [105, 'numpad9'],
  [106, 'multiply'],
  [107, 'add'],
  [108, 'decimal'], // firefox
  [109, 'subtract'],
  [110, 'decimal'],
  [111, 'divide'],
  [112, 'f1'],
  [113, 'f2'],
  [114, 'f3'],
  [115, 'f4'],
  [116, 'f5'],
  [117, 'f6'],
  [118, 'f7'],
  [119, 'f8'],
  [120, 'f9'],
  [121, 'f10'],
  [122, 'f11'],
  [123, 'f12'],
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

export const MODIFIER_KEYS = ['meta', 'alt', 'shift', 'control'];

/**
 * Check if a pressed key is a modifier key.
 *
 * @param {string} pressedKey A pressed key.
 * @returns {boolean}
 */
export const isModifierKey = (pressedKey) => {
  return MODIFIER_KEYS.includes(pressedKey);
};

/**
 * Get every pressed modifier key from the performed `KeyboardEvent`.
 *
 * @param {KeyboardEvent} event The event object.
 * @param {boolean} [mergeMetaKeys=false] If `true`, the function returns "control" and "meta"
 *                                        modifiers keys as the "control/meta" name. This allows creating
 *                                        keyboard shortcuts with modifier key that trigger the shortcut
 *                                        actions depend on the OS keyboard layout (the Meta key for macOS
 *                                        and Control for non macOS system).
 * @returns {string[]}
 */
export const getPressedModifierKeys = (event, mergeMetaKeys = false) => {
  const pressedModifierKeys = [];

  if (event.altKey) {
    pressedModifierKeys.push('alt');
  }

  if (mergeMetaKeys && (event.ctrlKey || event.metaKey)) {
    pressedModifierKeys.push('control/meta');

  } else {
    if (event.ctrlKey) {
      pressedModifierKeys.push('control');
    }

    if (event.metaKey) {
      pressedModifierKeys.push('meta');
    }
  }

  if (event.shiftKey) {
    pressedModifierKeys.push('shift');
  }

  return pressedModifierKeys;
};

/**
 * Get all key combinations that a keyboard event can match against registered shortcuts.
 * Returns an array of key arrays: the literal form and -- when the OS-native modifier
 * is pressed (Meta on macOS, Control on other systems) -- the unified `control/meta` form.
 * This mirrors the matching logic used by the shortcut recorder.
 *
 * @param {KeyboardEvent} event The keyboard event.
 * @param {Function} platformCheck A function that returns `true` on macOS.
 *                                 Defaults to `isMacOS` from `helpers/browser`.
 * @returns {Array<string[]>}
 */
export const getEventKeyCombinations = (event, platformCheck) => {
  if (typeof event.key !== 'string') {
    return [];
  }

  const pressedKey = normalizeEventKey(event);
  const modifier = isModifierKey(pressedKey);
  const modifiers = modifier ? [] : getPressedModifierKeys(event);
  const literal = [pressedKey].concat(modifiers);
  const combinations = [literal];

  if (!modifier) {
    const isMac = typeof platformCheck === 'function' ? platformCheck() : false;
    const hasOsNativeModifier = isMac ? modifiers.includes('meta') : modifiers.includes('control');

    if (hasOsNativeModifier) {
      combinations.push([pressedKey].concat(getPressedModifierKeys(event, true)));
    }
  }

  return combinations;
};
