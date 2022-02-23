import { createKeysObserver } from './keyObserver';
import { normalizeEventKey } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';

const modifierKeysObserver = createKeysObserver();

/**
 * Keys recorder tracking key events.
 *
 * @param {EventTarget} ownerWindow The starting window element.
 * @param {Function} beforeKeyDown Hook fired before keydown event is handled. It can be used to stop default key bindings.
 * @param {Function} afterKeyDown Hook fired after keydown event is handled.
 * @param {Function} callback The KeyEvent's listener callback.
 * @returns {object}
 */
export function useRecorder(ownerWindow, beforeKeyDown, afterKeyDown, callback) {
  const modifierKeys = ['meta', 'alt', 'shift', 'control'];

  /**
   * Get whether pressed key is observed key.
   *
   * @param {string} pressedKey Pressed keyboard key.
   * @returns {boolean}
   */
  const isModifierKey = (pressedKey) => {
    return modifierKeys.includes(pressedKey);
  };

  /**
   * Get every pressed modifier key from performed `KeyboardEvent`.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   * @returns {Array}
   */
  const getModifierKeys = (event) => {
    const pressedModifierKeys = [];

    if (event.altKey) {
      pressedModifierKeys.push('alt');
    }

    if (event.ctrlKey) {
      pressedModifierKeys.push('control');
    }

    if (event.metaKey) {
      pressedModifierKeys.push('meta');
    }

    if (event.shiftKey) {
      pressedModifierKeys.push('shift');
    }

    return pressedModifierKeys;
  };

  /**
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   */
  const onkeydown = (event) => {
    if (event.key === void 0) {
      return;
    }

    const result = beforeKeyDown(event);

    if (result === false || isImmediatePropagationStopped(event)) {
      return;
    }

    const pressedKey = normalizeEventKey(event.key);
    let extraModifierKeys = [];

    if (isModifierKey(pressedKey)) {
      modifierKeysObserver.press(normalizeEventKey(event.key));

    } else {
      extraModifierKeys = getModifierKeys(event);
    }

    const pressedKeys = [pressedKey].concat(extraModifierKeys);

    callback(event, pressedKeys);

    afterKeyDown(event);
  };

  /**
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   */
  const onkeyup = (event) => {
    if (event.key === void 0) {
      return;
    }

    const pressedKey = normalizeEventKey(event.key);

    if (isModifierKey(pressedKey) === false) {
      return;
    }

    modifierKeysObserver.release(pressedKey);
  };

  /**
   * FocusEvent's callback.
   *
   * @private
   */
  const onblur = () => {
    modifierKeysObserver.releaseAll();
  };

  /**
   * Add event listeners to the starting window and its parents' windows.
   */
  const mount = () => {
    let eventTarget = ownerWindow;

    while (eventTarget) {
      eventTarget.addEventListener('keydown', onkeydown);
      eventTarget.addEventListener('keyup', onkeyup);
      eventTarget.addEventListener('blur', onblur);

      eventTarget = eventTarget.frameElement;
    }
  };

  /**
   * Remove event listeners from the starting window and its parents' windows.
   */
  const unmount = () => {
    let eventTarget = ownerWindow;

    while (eventTarget) {
      eventTarget.removeEventListener('keydown', onkeydown);
      eventTarget.removeEventListener('keyup', onkeyup);
      eventTarget.removeEventListener('blur', onblur);

      eventTarget = eventTarget.frameElement;
    }
  };

  return {
    mount,
    unmount,
    isPressed: key => modifierKeysObserver.isPressed(key)
  };
}
