import { createKeysObserver } from './keyObserver';
import { normalizeEventKey, isModifierKey, getPressedModifierKeys } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';
import { getParentWindow } from '../helpers/dom/element';
import { isMacOS } from '../helpers/browser';
import { isFunction } from '../helpers/function';

const modifierKeysObserver = createKeysObserver();

/**
 * Tracks how many recorder instances reference the shared modifier-key listeners on a given
 * `documentElement`. The listeners are attached on the first reference and removed on the last,
 * so every document that hosts a Handsontable instance feeds the shared observer - not only the
 * document of the first instance created in the realm.
 */
const modKeyListenerRefs = new WeakMap<HTMLElement, number>();

/**
 * `KeyboardEvent`'s callback function for observing the pressed state of the mod keys.
 *
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
 * `KeyboardEvent`'s callback function for observing the released state of the mod keys.
 *
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
   * `FocusEvent`'s callback function
   *
   * @private
   */
  const onblur = () => {
    modifierKeysObserver.releaseAll();
  };

  /**
   * Add event listeners to the starting window and its parents' windows. The shared modifier-key
   * listeners are attached once per `documentElement` (reference-counted), so every document that
   * hosts an instance - including documents of instances that are not the first one created -
   * feeds the shared observer.
   */
  const mount = () => {
    let eventTarget: Window | null = ownerWindow;

    while (eventTarget) {
      const { documentElement } = eventTarget.document;
      const refCount = modKeyListenerRefs.get(documentElement) ?? 0;

      if (refCount === 0) {
        documentElement.addEventListener('keydown', onkeydownForModKeys);
        documentElement.addEventListener('keyup', onkeyupForModKeys);
      }

      modKeyListenerRefs.set(documentElement, refCount + 1);

      documentElement.addEventListener('keydown', onkeydown);
      documentElement.addEventListener('blur', onblur);

      eventTarget = getParentWindow(eventTarget);
    }
  };

  /**
   * Remove event listeners from the starting window and its parents' windows. The shared
   * modifier-key listeners are removed from a `documentElement` only once the last instance
   * referencing it is unmounted.
   */
  const unmount = () => {
    let eventTarget: Window | null = ownerWindow;

    while (eventTarget) {
      const { documentElement } = eventTarget.document;
      const refCount = modKeyListenerRefs.get(documentElement) ?? 0;

      if (refCount <= 1) {
        documentElement.removeEventListener('keydown', onkeydownForModKeys);
        documentElement.removeEventListener('keyup', onkeyupForModKeys);
        modKeyListenerRefs.delete(documentElement);
      } else {
        modKeyListenerRefs.set(documentElement, refCount - 1);
      }

      documentElement.removeEventListener('keydown', onkeydown);
      documentElement.removeEventListener('blur', onblur);

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
