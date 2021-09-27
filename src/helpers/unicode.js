import { arrayEach } from './array';
import { isMacOS, isFirefox } from './browser';

export const KEY_CODES = {
  ALT: 18,
  ARROW_DOWN: 40,
  ARROW_LEFT: 37,
  ARROW_RIGHT: 39,
  ARROW_UP: 38,
  AUDIO_DOWN: isFirefox() ? 182 : 174,
  AUDIO_MUTE: isFirefox() ? 181 : 173,
  AUDIO_UP: isFirefox() ? 183 : 175,
  BACKSPACE: 8,
  CAPS_LOCK: 20,
  COMMA: 188,
  COMMAND_LEFT: 91,
  COMMAND_RIGHT: 93,
  COMMAND_FIREFOX: 224,
  CONTROL: 17,
  DELETE: 46,
  END: 35,
  ENTER: 13,
  ESCAPE: 27,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  F13: 124,
  F14: 125,
  F15: 126,
  F16: 127,
  F17: 128,
  F18: 129,
  F19: 130,
  HOME: 36,
  INSERT: 45,
  MEDIA_NEXT: 176,
  MEDIA_PLAY_PAUSE: 179,
  MEDIA_PREV: 177,
  MEDIA_STOP: 178,
  NULL: 0,
  NUM_LOCK: 144,
  PAGE_DOWN: 34,
  PAGE_UP: 33,
  PAUSE: 19,
  PERIOD: 190,
  SCROLL_LOCK: 145,
  SHIFT: 16,
  SPACE: 32,
  TAB: 9,
  A: 65,
  C: 67,
  D: 68,
  F: 70,
  L: 76,
  O: 79,
  P: 80,
  S: 83,
  V: 86,
  X: 88,
  Y: 89,
  Z: 90,
};

const FUNCTION_KEYS = [
  KEY_CODES.ALT,
  KEY_CODES.ARROW_DOWN,
  KEY_CODES.ARROW_LEFT,
  KEY_CODES.ARROW_RIGHT,
  KEY_CODES.ARROW_UP,
  KEY_CODES.AUDIO_DOWN,
  KEY_CODES.AUDIO_MUTE,
  KEY_CODES.AUDIO_UP,
  KEY_CODES.BACKSPACE,
  KEY_CODES.CAPS_LOCK,
  KEY_CODES.DELETE,
  KEY_CODES.END,
  KEY_CODES.ENTER,
  KEY_CODES.ESCAPE,
  KEY_CODES.F1,
  KEY_CODES.F2,
  KEY_CODES.F3,
  KEY_CODES.F4,
  KEY_CODES.F5,
  KEY_CODES.F6,
  KEY_CODES.F7,
  KEY_CODES.F8,
  KEY_CODES.F9,
  KEY_CODES.F10,
  KEY_CODES.F11,
  KEY_CODES.F12,
  KEY_CODES.F13,
  KEY_CODES.F14,
  KEY_CODES.F15,
  KEY_CODES.F16,
  KEY_CODES.F17,
  KEY_CODES.F18,
  KEY_CODES.F19,
  KEY_CODES.HOME,
  KEY_CODES.INSERT,
  KEY_CODES.MEDIA_NEXT,
  KEY_CODES.MEDIA_PLAY_PAUSE,
  KEY_CODES.MEDIA_PREV,
  KEY_CODES.MEDIA_STOP,
  KEY_CODES.NULL,
  KEY_CODES.NUM_LOCK,
  KEY_CODES.PAGE_DOWN,
  KEY_CODES.PAGE_UP,
  KEY_CODES.PAUSE,
  KEY_CODES.SCROLL_LOCK,
  KEY_CODES.SHIFT,
  KEY_CODES.TAB,
];

/**
 * Returns true if keyCode represents a printable character.
 *
 * @param {number} keyCode The keyboard key code.
 * @returns {boolean}
 */
export function isPrintableChar(keyCode) {
  return ((keyCode === 32) || // space
      (keyCode >= 48 && keyCode <= 57) || // 0-9
      (keyCode >= 96 && keyCode <= 111) || // numpad
      (keyCode >= 186 && keyCode <= 192) || // ;=,-./`
      (keyCode >= 219 && keyCode <= 222) || // []{}\|"'
      keyCode >= 226 || // special chars (229 for Asian chars)
      (keyCode >= 65 && keyCode <= 90)); // a-z
}

/**
 * @param {number} keyCode The keyboard key code.
 * @returns {boolean}
 */
export function isFunctionKey(keyCode) {
  return FUNCTION_KEYS.includes(keyCode);
}

/**
 * Checks if passed key code is ctrl or cmd key. Depends on what OS the code runs it check key code based on
 * different meta key codes.
 *
 * @param {number} keyCode The keyboard key code.
 * @returns {boolean}
 */
export function isCtrlKey(keyCode) {
  const keys = [];

  if (isMacOS()) {
    keys.push(KEY_CODES.COMMAND_LEFT, KEY_CODES.COMMAND_RIGHT, KEY_CODES.COMMAND_FIREFOX);
  } else {
    keys.push(KEY_CODES.CONTROL);
  }

  return keys.includes(keyCode);
}

/**
 * Checks if passed key code is ctrl or cmd key. This helper checks if the key code matches to meta keys
 * regardless of the OS on which it is running.
 *
 * @param {number} keyCode The keyboard key code.
 * @returns {boolean}
 */
export function isCtrlMetaKey(keyCode) {
  return [
    KEY_CODES.CONTROL,
    KEY_CODES.COMMAND_LEFT,
    KEY_CODES.COMMAND_RIGHT,
    KEY_CODES.COMMAND_FIREFOX
  ].includes(keyCode);
}

/**
 * @param {number} keyCode The keyboard key code.
 * @param {string} baseCode The list of the key codes to compare with.
 * @returns {boolean}
 */
export function isKey(keyCode, baseCode) {
  const keys = baseCode.split('|');
  let result = false;

  arrayEach(keys, (key) => {
    if (keyCode === KEY_CODES[key]) {
      result = true;

      return false;
    }
  });

  return result;
}
