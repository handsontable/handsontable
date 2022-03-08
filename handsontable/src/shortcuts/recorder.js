import { createKeysObserver } from './keyObserver';
import { normalizeEventKey } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';

const modifierKeysObserver = createKeysObserver();

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * A key recorder, used for tracking key events.
 *
 * @param {EventTarget} ownerWindow A starting `window` element
 * @param {Function} beforeKeyDown A hook fired before the `keydown` event is handled. You can use it to [block a keyboard shortcut's actions](@/guides/accessories-and-menus/keyboard-shortcuts.md#blocking-a-keyboard-shortcut-s-actions).
 * @param {Function} afterKeyDown A hook fired after the `keydown` event is handled
 * @param {Function} callback `KeyEvent`'s listener's callback function
 * @returns {object}
 */
export function useRecorder(ownerWindow, beforeKeyDown, afterKeyDown, callback) {
  const modifierKeys = ['meta', 'alt', 'shift', 'control'];

  /**
   * Check if a pressed key is tracked or not.
   *
   * @param {string} pressedKey A pressed key
   * @returns {boolean}
   */
  const isModifierKey = (pressedKey) => {
    return modifierKeys.includes(pressedKey);
  };

  /**
   * Get every pressed modifier key from the performed `KeyboardEvent`.
   *
   * @private
   * @param {KeyboardEvent} event The event object
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
   * `KeyboardEvent`'s callback function
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeydown = (event) => {
    const result = beforeKeyDown(event);

    if (result === false || isImmediatePropagationStopped(event)) {
      return;
    }

    const pressedKey = normalizeEventKey(event.key);
    let extraModifierKeys = [];

    if (isModifierKey(pressedKey)) {
      modifierKeysObserver.press(pressedKey);

    } else {
      extraModifierKeys = getModifierKeys(event);
    }

    const pressedKeys = [pressedKey].concat(extraModifierKeys);

    callback(event, pressedKeys);

    afterKeyDown(event);
  };

  /**
   * `KeyboardEvent`'s callback function
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeyup = (event) => {
    const pressedKey = normalizeEventKey(event.key);

    if (isModifierKey(pressedKey) === false) {
      return;
    }

    modifierKeysObserver.release(pressedKey);
  };

  /**
   * `FocusEvent`'s callback function
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
