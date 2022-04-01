import { createKeysObserver } from './keyObserver';
import { normalizeEventKey } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';
import { isMacOS } from '../helpers/browser';

const MODIFIER_KEYS = ['meta', 'alt', 'shift', 'control'];
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
  /**
   * Get whether pressed key is observed key.
   *
   * @param {string} pressedKey Pressed keyboard key.
   * @returns {boolean}
   */
  const isModifierKey = (pressedKey) => {
    return MODIFIER_KEYS.includes(pressedKey);
  };

  /**
   * Get every pressed modifier key from performed `KeyboardEvent`.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   * @param {boolean} [mergeOSDependentKeys=false] If `true,` the function will describe the "control" and "meta"
   *                                               modifiers keys with the same "mod" name. This allows creating
   *                                               keyboard shortcuts with modifier keys independently of the OS.
   * @returns {string[]}
   */
  const getPressedModifierKeys = (event, mergeOSDependentKeys = false) => {
    const pressedModifierKeys = [];

    if (event.altKey) {
      pressedModifierKeys.push('alt');
    }

    if (mergeOSDependentKeys && (event.ctrlKey || event.metaKey)) {
      pressedModifierKeys.push('mod');

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
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
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
      extraModifierKeys = getPressedModifierKeys(event);
    }

    const pressedKeys = [pressedKey].concat(extraModifierKeys);

    callback(event, pressedKeys);

    if (isMacOS() && extraModifierKeys.includes('meta') || !isMacOS() && extraModifierKeys.includes('control')) {
      // Trigger the callback for the virtual OS-dependent "mod" key
      callback(event, [pressedKey].concat(getPressedModifierKeys(event, true)));
    }

    afterKeyDown(event);
  };

  /**
   * KeyboardEvent's callback.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   */
  const onkeyup = (event) => {
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
