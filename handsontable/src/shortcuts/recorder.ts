import { createKeysObserver } from './keyObserver';
import { normalizeEventKey, isModifierKey, getPressedModifierKeys } from './utils';
import { isImmediatePropagationStopped } from '../helpers/dom/event';
import { getParentWindow } from '../helpers/dom/element';
import { isMacOS } from '../helpers/browser';
import { isFunction } from '../helpers/function';

const modifierKeysObserver = createKeysObserver();
/**
 * Tracks how many active recorder instances reference each document.
 *
 * The modifier-key listeners (`keydown` / `keyup`) feeding `modifierKeysObserver`
 * must be attached exactly once per document, regardless of how many
 * Handsontable instances live in that document, and regardless of which
 * instance was created first. Using `Map<Document, number>` lets every new
 * `useRecorder` call ensure its document has the listeners installed
 * (cross-iframe safe), and lets the last unmounting instance remove them.
 */
const modKeyDocumentRefCounts = new Map<Document, number>();

/**
 * Module-level `keydown` listener that updates `modifierKeysObserver`.
 * Hoisted out of `useRecorder` so the same function reference can be safely
 * added/removed once per document.
 *
 * @param {KeyboardEvent} event The event object.
 */
function onkeydownForModKeys(event: KeyboardEvent) {
  if (typeof event.key === 'string') {
    const pressedKey = normalizeEventKey(event);

    if (isModifierKey(pressedKey)) {
      modifierKeysObserver.press(pressedKey);
    }
  }
}

/**
 * Module-level `keyup` listener that updates `modifierKeysObserver`.
 * Hoisted out of `useRecorder` so the same function reference can be safely
 * added/removed once per document.
 *
 * @param {KeyboardEvent} event The event object.
 */
function onkeyupForModKeys(event: KeyboardEvent) {
  if (typeof event.key === 'string') {
    const pressedKey = normalizeEventKey(event);

    if (isModifierKey(pressedKey)) {
      modifierKeysObserver.release(pressedKey);
    }
  }
}

/**
 * Ensures the modifier-key listeners are attached to the given document
 * exactly once across every recorder instance using that document.
 *
 * @param {Document} doc The document to install the listeners on.
 */
function attachModKeyListeners(doc: Document) {
  const refCount = modKeyDocumentRefCounts.get(doc) ?? 0;

  if (refCount === 0) {
    doc.documentElement.addEventListener('keydown', onkeydownForModKeys);
    doc.documentElement.addEventListener('keyup', onkeyupForModKeys);
  }

  modKeyDocumentRefCounts.set(doc, refCount + 1);
}

/**
 * Removes the modifier-key listeners from the given document when the last
 * recorder instance using that document unmounts.
 *
 * @param {Document} doc The document to clean up.
 */
function detachModKeyListeners(doc: Document) {
  const refCount = modKeyDocumentRefCounts.get(doc) ?? 0;

  if (refCount <= 1) {
    doc.documentElement.removeEventListener('keydown', onkeydownForModKeys);
    doc.documentElement.removeEventListener('keyup', onkeyupForModKeys);
    modKeyDocumentRefCounts.delete(doc);

  } else {
    modKeyDocumentRefCounts.set(doc, refCount - 1);
  }
}

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
   * Add event listeners to the starting window and its parents' windows.
   */
  const mount = () => {
    let eventTarget: Window | null = ownerWindow;

    while (eventTarget) {
      attachModKeyListeners(eventTarget.document);

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

    while (eventTarget) {
      detachModKeyListeners(eventTarget.document);

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
