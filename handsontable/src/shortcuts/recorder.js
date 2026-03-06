import { createKeysObserver } from './keyObserver';
import { normalizeEventKey } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';
import { getParentWindow } from '../helpers/dom/element';
import { isMacOS } from '../helpers/browser';

const MODIFIER_KEYS = ['meta', 'alt', 'shift', 'control'];
const modifierKeysObserver = createKeysObserver();
const modKeyListeners = [];
let instanceCounter = 0;

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * A key recorder, used for tracking key events.
 *
 * @param {EventTarget} ownerWindow A starting `window` element
 * @param {Function} handleEvent A condition on which event is handled.
 * @param {Function} beforeKeyDown A hook fired before the `keydown` event is handled.
 * @param {Function} afterKeyDown A hook fired after the `keydown` event is handled
 * @param {Function} callback `KeyEvent`'s listener's callback function
 * @returns {object}
 */
export function useRecorder(ownerWindow, handleEvent, beforeKeyDown, afterKeyDown, callback) {
  /**
   * Check if a pressed key is tracked or not.
   *
   * @param {string} pressedKey A pressed key
   * @returns {boolean}
   */
  const isModifierKey = (pressedKey) => {
    return MODIFIER_KEYS.includes(pressedKey);
  };

  /**
   * Get every pressed modifier key from the performed `KeyboardEvent`.
   *
   * @private
   * @param {KeyboardEvent} event The event object.
   * @param {boolean} [mergeMetaKeys=false] If `true,` the function will return the "control" and "meta"
   *                                        modifiers keys as the "control/meta" name. This allows creating
   *                                        keyboard shortcuts with modifier key that trigger the shortcut
   *                                        actions depend on the OS keyboard layout (the Meta key for macOS
   *                                        and Control for non macOS system).
   * @returns {string[]}
   */
  const getPressedModifierKeys = (event, mergeMetaKeys = false) => {
    const pressedModifierKeys = [];

    if (event.altKey) {
      pressedModifierKeys.push('alt');
    }

    if (mergeMetaKeys && (event.ctrlKey || event.metaKey)) {
      pressedModifierKeys.push('control/meta');

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
   * `KeyboardEvent`'s callback function
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeydown = (event) => {
    if (handleEvent(event) === false) {
      return;
    }

    const result = beforeKeyDown(event);

    // keyCode 229 aka 'uninitialized' doesn't take into account with editors. This key code is
    // produced when unfinished character is entering using the IME editor. It is fired on macOS,
    // Windows and linux (ubuntu) with installed ibus-pinyin package.
    if (
      result === false ||
      event.keyCode === 229 ||
      typeof event.key !== 'string' ||
      isImmediatePropagationStopped(event)
    ) {
      return;
    }

    const pressedKey = normalizeEventKey(event);
    let extraModifierKeys = [];

    if (!isModifierKey(pressedKey)) {
      extraModifierKeys = getPressedModifierKeys(event);
    }

    const pressedKeys = [pressedKey].concat(extraModifierKeys);
    const isExecutionCancelled = callback(event, pressedKeys);

    if (!isExecutionCancelled &&
      (isMacOS() && extraModifierKeys.includes('meta') || !isMacOS() && extraModifierKeys.includes('control'))) {
      // Trigger the callback for the virtual OS-dependent "control/meta" key
      callback(event, [pressedKey].concat(getPressedModifierKeys(event, true)));
    }

    afterKeyDown(event);
  };

  /**
   * `KeyboardEvent`'s callback function for observing the pressed state of the mod keys.
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeydownForModKeys = (event) => {
    if (typeof event.key === 'string') {
      const pressedKey = normalizeEventKey(event);

      if (isModifierKey(pressedKey)) {
        modifierKeysObserver.press(pressedKey);
      }
    }
  };

  /**
   * `KeyboardEvent`'s callback function for observing the pressed state of the mod keys.
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeyupForModKeys = (event) => {
    if (typeof event.key === 'string') {
      const pressedKey = normalizeEventKey(event);

      if (isModifierKey(pressedKey)) {
        modifierKeysObserver.release(pressedKey);
      }
    }
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

    instanceCounter += 1;

    while (eventTarget) {
      if (instanceCounter === 1) {
        eventTarget.document.documentElement.addEventListener('keydown', onkeydownForModKeys);
        modKeyListeners.push({ event: 'keydown', listener: onkeydownForModKeys });

        eventTarget.document.documentElement.addEventListener('keyup', onkeyupForModKeys);
        modKeyListeners.push({ event: 'keyup', listener: onkeyupForModKeys });
      }

      eventTarget.document.documentElement.addEventListener('keydown', onkeydown);
      eventTarget.document.documentElement.addEventListener('blur', onblur);

      eventTarget = getParentWindow(eventTarget);
    }
  };

  /**
   * Remove event listeners from the starting window and its parents' windows.
   */
  const unmount = () => {
    let eventTarget = ownerWindow;

    instanceCounter -= 1;

    while (eventTarget) {
      if (instanceCounter === 0) {
        for (let i = 0; i < modKeyListeners.length; i++) {
          const { event, listener } = modKeyListeners[i];

          eventTarget.document.documentElement.removeEventListener(event, listener);
        }

        modKeyListeners.length = 0;
      }

      eventTarget.document.documentElement.removeEventListener('keydown', onkeydown);
      eventTarget.document.documentElement.removeEventListener('blur', onblur);

      eventTarget = getParentWindow(eventTarget);
    }
  };

  return {
    mount,
    unmount,
    isPressed: key => modifierKeysObserver.isPressed(key),
    releasePressedKeys: () => modifierKeysObserver.releaseAll(),
  };
}
