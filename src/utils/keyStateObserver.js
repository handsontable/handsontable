import EventManager from '../eventManager';
import {isCtrlKey, isKey} from '../helpers/unicode';
import {arrayEach, arrayReduce} from '../helpers/array';

const eventManager = new EventManager();
const pressedKeys = new Set();
let observeCount = 0;

/**
 * Begins observing keyboard keys states.
 */
function startObserving() {
  if (observeCount === 0) {
    eventManager.addEventListener(document, 'keydown', (event) => {
      if (!pressedKeys.has(event.keyCode)) {
        pressedKeys.add(event.keyCode);
      }
    });
    eventManager.addEventListener(document, 'keyup', (event) => {
      if (pressedKeys.has(event.keyCode)) {
        pressedKeys.delete(event.keyCode);
      }
    });
    eventManager.addEventListener(document, 'visibilitychange', (event) => {
      if (document.hidden) {
        pressedKeys.clear();
      }
    });
  }
  observeCount++;
}

/**
 * Stops observing keyboard keys states and clear all previously saved states.
 */
function stopObserving() {
  observeCount--;

  if (observeCount === 0) {
    eventManager.clearEvents();
    pressedKeys.clear();
  }
}

/**
 * Checks if provided keyCode or keyCodes are pressed.
 *
 * @param {String} keyCodes The key codes passed as a string defined in helpers/unicode.js file delimited with '|'.
 * @return {Boolean}
 */
function isPressed(keyCodes) {
  return Array.from(pressedKeys.values()).some((_keyCode) => isKey(_keyCode, keyCodes));
}

/**
 * Checks if ctrl keys are pressed.
 *
 * @return {Boolean}
 */
function isPressedCtrlKey() {
  return Array.from(pressedKeys.values()).some((_keyCode) => isCtrlKey(_keyCode));
}

export {
  isPressedCtrlKey,
  isPressed,
  startObserving,
  stopObserving,
};
