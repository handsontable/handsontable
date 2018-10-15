import EventManager from '../eventManager';
import { isCtrlMetaKey, isKey } from '../helpers/unicode';

var eventManager = new EventManager();
var pressedKeys = new Set();
var refCount = 0;

/**
 * Begins observing keyboard keys states.
 */
function startObserving() {
  if (refCount === 0) {
    eventManager.addEventListener(document, 'keydown', function (event) {
      if (!pressedKeys.has(event.keyCode)) {
        pressedKeys.add(event.keyCode);
      }
    });
    eventManager.addEventListener(document, 'keyup', function (event) {
      if (pressedKeys.has(event.keyCode)) {
        pressedKeys.delete(event.keyCode);
      }
    });
    eventManager.addEventListener(document, 'visibilitychange', function () {
      if (document.hidden) {
        pressedKeys.clear();
      }
    });
    eventManager.addEventListener(window, 'blur', function () {
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
 * @param {String} keyCodes The key codes passed as a string defined in helpers/unicode.js file delimited with '|'.
 * @return {Boolean}
 */
function isPressed(keyCodes) {
  return Array.from(pressedKeys.values()).some(function (_keyCode) {
    return isKey(_keyCode, keyCodes);
  });
}

/**
 * Checks if ctrl keys are pressed.
 *
 * @return {Boolean}
 */
function isPressedCtrlKey() {
  var values = Array.from(pressedKeys.values());

  return values.some(function (_keyCode) {
    return isCtrlMetaKey(_keyCode);
  });
}

/**
 * Returns reference count. Useful for debugging and testing purposes.
 *
 * @return {Number}
 */
function _getRefCount() {
  return refCount;
}

export { _getRefCount, _resetState, isPressed, isPressedCtrlKey, startObserving, stopObserving };