import EventManager from '../eventManager';
import { KEY_CODES, isCtrlMetaKey, isKey } from '../helpers/unicode';

const eventManager = new EventManager();
const pressedKeys = new Set();
let refCount = 0;

window.pressedKeys = pressedKeys;

/**
 * Begins observing keyboard keys states.
 */
function startObserving() {
  if (refCount === 0) {
    eventManager.addEventListener(document, 'keydown', (event) => {
      if (!pressedKeys.has(event.keyCode) && !isReservedShortcut(event.keyCode)) {
        pressedKeys.add(event.keyCode);
      } else if (isReservedShortcut(event.keyCode)) {
        clearMetaKeys()
      }
    });
    eventManager.addEventListener(document, 'keyup', (event) => {
      if (pressedKeys.has(event.keyCode)) {
        pressedKeys.delete(event.keyCode);
      }
    });
    eventManager.addEventListener(document, 'visibilitychange', () => {
      if (document.hidden) {
        pressedKeys.clear();
      }
    });
  }

  refCount += 1;
}

/**
 * Stops observing keyboard keys states and clear all previously saved states.
 */
function stopObserving() {
  if (refCount > 0) {
    refCount -= 1;
  }

  if (refCount === 0) {
    _resetState();
  }
}

/**
 * Remove all listeners attached to the DOM and clear all previously saved states.
 */
function _resetState() {
  eventManager.clearEvents();
  pressedKeys.clear();
  refCount = 0;
}

/**
 * Checks if provided keyCode or keyCodes are pressed.
 *
 * @param {String} keyCodes The key codes passed as a string defined in helpers/unicode.js file delimited with '|'.
 * @return {Boolean}
 */
function isPressed(keyCodes) {
  return Array.from(pressedKeys.values()).some(_keyCode => isKey(_keyCode, keyCodes));
}

/**
 * Checks if ctrl keys are pressed.
 *
 * @return {Boolean}
 */
function isPressedCtrlKey() {
  const values = Array.from(pressedKeys.values());

  return values.some(_keyCode => isCtrlMetaKey(_keyCode));
}

/**
 * Checks if keys combination is an reserved one.
 *
 * @param {String} keyCode The key code of the keybord event.
 * @return {Boolean}
 */
function isReservedShortcut(keyCode) {
  const { A: KEY_A, C: KEY_C, F: KEY_F, V: KEY_V, X: KEY_X } = KEY_CODES;

  return isPressedCtrlKey() && [KEY_A, KEY_C, KEY_F, KEY_V, KEY_X].includes(keyCode);
}

function clearMetaKeys() {
  pressedKeys.forEach((keyCode) => {
    if (isCtrlMetaKey(keyCode)) {
      pressedKeys.delete(keyCode);
    }
  })
}

/**
 * Returns reference count. Useful for debugging and testing purposes.
 *
 * @return {Number}
 */
function _getRefCount() {
  return refCount;
}

export {
  _getRefCount,
  _resetState,
  isPressed,
  isPressedCtrlKey,
  startObserving,
  stopObserving,
};
