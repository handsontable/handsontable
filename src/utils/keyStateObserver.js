import EventManager from '../eventManager';
import { isCtrlMetaKey, isKey } from '../helpers/unicode';

const eventManager = new EventManager();
const pressedKeys = new Set();
let refCount = 0;

/**
 * Begins observing keyboard keys states.
 *
 * @param {Document} rootDocument The document owner.
 */
function startObserving(rootDocument) {
  if (refCount === 0) {
    eventManager.addEventListener(rootDocument, 'keydown', (event) => {
      if (!pressedKeys.has(event.keyCode)) {
        pressedKeys.add(event.keyCode);
      }
    });
    eventManager.addEventListener(rootDocument, 'keyup', (event) => {
      if (pressedKeys.has(event.keyCode)) {
        pressedKeys.delete(event.keyCode);
      }
    });
    eventManager.addEventListener(rootDocument, 'visibilitychange', () => {
      if (rootDocument.hidden) {
        pressedKeys.clear();
      }
    });
    eventManager.addEventListener(rootDocument.defaultView, 'blur', () => {
      pressedKeys.clear();
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
 * @param {string} keyCodes The key codes passed as a string defined in helpers/unicode.js file delimited with '|'.
 * @returns {boolean}
 */
function isPressed(keyCodes) {
  return Array.from(pressedKeys.values()).some(_keyCode => isKey(_keyCode, keyCodes));
}

/**
 * Checks if ctrl keys are pressed.
 *
 * @returns {boolean}
 */
function isPressedCtrlKey() {
  const values = Array.from(pressedKeys.values());

  return values.some(_keyCode => isCtrlMetaKey(_keyCode));
}

/**
 * Returns reference count. Useful for debugging and testing purposes.
 *
 * @returns {number}
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
