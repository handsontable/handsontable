import { createKeysController } from './keyController';
import { normalizeEventKey } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';

const observedKeysController = createKeysController();

/**
 * Keys recorder tracking key events.
 *
 * @param {EventTarget} ownerWindow The starting window element.
 * @param {Function} beforeKeyDown Callback triggered AFTER key down, but BEFORE handling callback.
 * @param {Function} afterKeyDown Callback triggered after handling callback.
 * @param {Function} callback The KeyEvent's listener callback.
 * @returns {object}
 */
export function useRecorder(ownerWindow, beforeKeyDown, afterKeyDown, callback) {
  const observedKeys = ['meta', 'alt', 'shift', 'control']; // some modifier keys

  /**
   * Get whether pressed key is observed key.
   *
   * @param {string} pressedKey Pressed keyboard key.
   * @returns {boolean}
   */
  const isObservedKey = (pressedKey) => {
    return observedKeys.includes(pressedKey);
  };

  /**
   * Get every pressed modifier key from performed KeyboardEvent.
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

    // Don't duplicate observed keys in the stack.
    if (isObservedKey(pressedKey) === false) {
      extraModifierKeys = getModifierKeys(event);

    } else {
      // We store observed keys in the stack.
      observedKeysController.press(normalizeEventKey(event.key));
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

    if (isObservedKey(pressedKey) === false) {
      return;
    }

    observedKeysController.release(pressedKey);
  };

  /**
   * FocusEvent's callback.
   *
   * @private
   */
  const onblur = () => {
    observedKeysController.releaseAll();
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
    isPressed: key => observedKeysController.isPressed(key)
  };
}
