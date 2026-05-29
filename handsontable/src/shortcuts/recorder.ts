import { createKeysObserver } from './keyObserver';
import { normalizeEventKey, isModifierKey, getPressedModifierKeys } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';
import { getParentWindow } from '../helpers/dom/element';
import { isMacOS } from '../helpers/browser';
import { isFunction } from '../helpers/function';

const modifierKeysObserver = createKeysObserver();
const modKeyListeners: Array<{event: 'keydown' | 'keyup'; listener: (event: KeyboardEvent) => void}> = [];
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
 * @param {Function} [dispatchGlobalShortcutsWhenTableBlocked] When `handleEvent` blocks the normal shortcut pipeline,
 *   if set, it is called as `(event, pressedKeys)` after the same IME / `key` guards as the table path, so
 *   `scope: 'global'` shortcut contexts can still run (for example **F6** into the Notification region while the
 *   instance is not listening).
 * @returns {object}
 */
export function useRecorder(
  ownerWindow: Window,
  handleEvent: (event: KeyboardEvent) => boolean,
  beforeKeyDown: (event: KeyboardEvent) => void | boolean,
  afterKeyDown: (event: KeyboardEvent) => void,
  callback: (event: KeyboardEvent, keys: string[]) => boolean,
  dispatchGlobalShortcutsWhenTableBlocked: ((event: KeyboardEvent, keys: string[]) => boolean) | null = null,
) {
  /**
   * `KeyboardEvent`'s callback function
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeydown = (event: KeyboardEvent) => {
    const tableShortcutsAllowed = handleEvent(event) !== false;

    if (tableShortcutsAllowed) {
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
      let extraModifierKeys: string[] = [];

      if (!isModifierKey(pressedKey)) {
        extraModifierKeys = getPressedModifierKeys(event);
      }

      const pressedKeys = [pressedKey].concat(extraModifierKeys);
      let isExecutionCancelled = callback(event, pressedKeys);

      if (!isExecutionCancelled &&
        (isMacOS() && extraModifierKeys.includes('meta') || !isMacOS() && extraModifierKeys.includes('control'))) {
        // Trigger the callback for the virtual OS-dependent "control/meta" key
        isExecutionCancelled = callback(event, [pressedKey].concat(getPressedModifierKeys(event, true)));
      }

      afterKeyDown(event);

      return;
    }

    if (isFunction(dispatchGlobalShortcutsWhenTableBlocked) === false) {
      return;
    }

    if (
      event.keyCode === 229 ||
      typeof event.key !== 'string' ||
      isImmediatePropagationStopped(event)
    ) {
      return;
    }

    const pressedKey = normalizeEventKey(event);
    let extraModifierKeys: string[] = [];

    if (!isModifierKey(pressedKey)) {
      extraModifierKeys = getPressedModifierKeys(event);
    }

    const pressedKeys = [pressedKey].concat(extraModifierKeys);
    let isExecutionCancelled = dispatchGlobalShortcutsWhenTableBlocked(event, pressedKeys);

    if (!isExecutionCancelled &&
      (isMacOS() && extraModifierKeys.includes('meta') || !isMacOS() && extraModifierKeys.includes('control'))) {
      isExecutionCancelled = dispatchGlobalShortcutsWhenTableBlocked(
        event,
        [pressedKey].concat(getPressedModifierKeys(event, true)),
      );
    }

    afterKeyDown(event);
  };

  /**
   * `KeyboardEvent`'s callback function for observing the pressed state of the mod keys.
   *
   * @private
   * @param {KeyboardEvent} event The event object
   */
  const onkeydownForModKeys = (event: KeyboardEvent) => {
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
  const onkeyupForModKeys = (event: KeyboardEvent) => {
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
    let eventTarget: Window | null = ownerWindow;

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
    let eventTarget: Window | null = ownerWindow;

    instanceCounter -= 1;

    while (eventTarget) {
      if (instanceCounter === 0) {
        for (let i = 0; i < modKeyListeners.length; i++) {
          const { event: eventType, listener } = modKeyListeners[i];

          if (eventType === 'keydown') {
            eventTarget.document.documentElement.removeEventListener('keydown', listener);
          } else {
            eventTarget.document.documentElement.removeEventListener('keyup', listener);
          }
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
    isPressed: (key: string) => modifierKeysObserver.isPressed(key),
    releasePressedKeys: () => modifierKeysObserver.releaseAll(),
  };
}
