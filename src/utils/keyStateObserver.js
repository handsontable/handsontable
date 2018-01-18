/* eslint-disable import/prefer-default-export */
import EventManager from '../eventManager';
import {isCtrlKey, isKey} from '../helpers/unicode';
import {arrayEach, arrayReduce} from '../helpers/array';

const eventManager = new EventManager();
const pressedKeys = new Set();
let observeCount = 0;

function startObserving() {
  if (observeCount === 0) {
    eventManager.addEventListener(document.documentElement, 'keydown', (event) => {
      if (!pressedKeys.has(event.keyCode)) {
        pressedKeys.add(event.keyCode);
      }
    });
    eventManager.addEventListener(document.documentElement, 'keyup', (event) => {
      if (pressedKeys.has(event.keyCode)) {
        pressedKeys.delete(event.keyCode);
      }
    });
  }
  observeCount++;
}

function stopObserving() {
  observeCount--;

  if (observeCount === 0) {
    eventManager.clearEvents();
    pressedKeys.clear();
  }
}

function isPressed(keyCodes) {
  return Array.from(pressedKeys.values()).some((_keyCode) => isKey(_keyCode, keyCodes));
}

export {
  isPressed,
  startObserving,
  stopObserving,
};
