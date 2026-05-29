import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { throwWithCause } from '../helpers/errors';
import { stopImmediatePropagation } from '../helpers/dom/event';
import { isMacOS } from '../helpers/browser';
import type { Context } from './context';
import { createContext, isContextObject } from './context';
import { useRecorder } from './recorder';
import { getEventKeyCombinations } from './utils';
import { toSingleLine } from '../helpers/templateLiteralTag';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The `ShortcutManager` API lets you store and manage [keyboard shortcut contexts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#keyboard-shortcut-contexts) ([`ShortcutContext`](@/api/shortcutContext.md)).
 *
 * Each `ShortcutManager` object:
 * - Stores and manages its own set of keyboard shortcut contexts.
 * - Listens to the [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) events and runs actions for them.
 *
 * @alias ShortcutManager
 * @class ShortcutManager
 * @param {object} options The manager's options
 * @param {EventTarget} options.ownerWindow A starting `window` element
 * @param {Function} options.handleEvent `(event, scope) => boolean` -- whether the active context's shortcut pipeline
 *   may run. `scope` is `'table'` or `'global'` from the active {@link ShortcutContext}. Global-scoped contexts are
 *   also evaluated when this returns `false` (see `dispatchGlobalShortcutsWhenTableBlocked` in the recorder).
 * @param {Function} options.beforeKeyDown A hook fired before the `keydown` event is handled. You can use it to [block a keyboard shortcut's actions](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#block-a-keyboard-shortcut-s-actions).
 * @param {Function} options.afterKeyDown A hook fired after the `keydown` event is handled
 */
export interface ShortcutManager {
  addContext(contextName: string, scope?: string): Context;
  getActiveContextName(): string;
  getContext(contextName: string): Context | undefined;
  getOrCreateContext(contextName: string, scope?: string): Context;
  setActiveContextName(contextName: string): void;
  hasEventShortcut(contextName: string, event: KeyboardEvent): boolean;
  isCtrlPressed(): boolean;
  releasePressedKeys(): void;
  destroy(): void;
}

export const createShortcutManager = ({ ownerWindow, handleEvent, beforeKeyDown, afterKeyDown }: {
  ownerWindow: EventTarget;
  handleEvent: (event: KeyboardEvent, scope: string) => boolean;
  beforeKeyDown: (event: KeyboardEvent) => void;
  afterKeyDown: (event: KeyboardEvent) => void;
}): ShortcutManager => {
  /**
   * A unique map that stores keyboard shortcut contexts.
   *
   * @type {UniqueMap}
   */
  const CONTEXTS = createUniqueMap({
    errorIdExists: (keys: string) => `The "${keys}" context name is already registered.`
  });
  /**
   * The name of the active [`ShortcutContext`](@/api/shortcutContext.md).
   *
   * @type {string}
   */
  let activeContextName = 'grid';

  /**
   * Create a new [`ShortcutContext`](@/api/shortcutContext.md) object.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the new shortcut context
   * @param {string} [scope='table'] The scope of the shortcut: `'table'` or `'global'`
   * @returns {object}
   */
  const addContext = (contextName: string, scope: string = 'table'): Context => {
    const context = createContext(contextName, scope);

    CONTEXTS.addItem(contextName, context);

    return context;
  };

  /**
   * Get the ID of the active [`ShortcutContext`](@/api/shortcutContext.md).
   *
   * @memberof ShortcutManager#
   * @returns {string}
   */
  const getActiveContextName = (): string => {
    return activeContextName;
  };

  /**
   * Get a keyboard shortcut context by its name.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the shortcut context.
   * @returns {object|undefined} A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts.
   */
  const getContext = (contextName: string): Context | undefined => {
    return CONTEXTS.getItem(contextName);
  };

  /**
   * Get a keyboard shortcut context by its name, or create it if it doesn't exist.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the shortcut context
   * @param {string} [scope='table'] The scope of the shortcut: `'table'` or `'global'`
   * @returns {object} A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts
   */
  const getOrCreateContext = (contextName: string, scope: string = 'table'): Context => {
    return getContext(contextName) ?? addContext(contextName, scope);
  };

  /**
   * Start listening to keyboard shortcuts within a given [`ShortcutContext`](@/api/shortcutContext.md).
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the shortcut context
   */
  const setActiveContextName = (contextName: string): void => {
    if (!CONTEXTS.hasItem(contextName)) {
      throwWithCause(toSingleLine`You've tried to activate the "${contextName}" shortcut context\x20
        that does not exist. Before activation, register the context using the "addContext" method.`);
    }

    activeContextName = contextName;
  };

  /**
   * This variable relates to the `captureCtrl` shortcut option,
   * which allows for capturing the state of the Control/Meta modifier key.
   * Some of the default keyboard shortcuts related to cell selection need this feature for working properly.
   *
   * @type {boolean}
   */
  let isCtrlKeySilenced = false;

  /**
   * A callback function for listening events from the recorder.
   *
   * @param {KeyboardEvent} event The keyboard event.
   * @param {string[]} keys Names of the shortcut's keys,
   * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
   * in lowercase or uppercase, unified across browsers.
   * @param {object | string} context The context object or name.
   * @returns {boolean}
   */
  const recorderCallback = (
    event: KeyboardEvent, keys: string[], context: string | Context = getActiveContextName()): boolean => {
    const activeContext = isContextObject(context) ? context : getContext(context);
    let isExecutionCancelled = false;

    if (!activeContext?.hasShortcut(keys)) {
      return isExecutionCancelled;
    }

    // Processing just actions being in stack at the moment of shortcut pressing (without respecting additions/removals performed dynamically).
    const shortcuts = activeContext?.getShortcuts(keys) ?? [];

    for (let index = 0; index < shortcuts.length; index++) {
      const {
        callback,
        runOnlyIf,
        preventDefault,
        stopPropagation,
        captureCtrl,
        forwardToContext,
      } = shortcuts[index];

      if (runOnlyIf?.(event) === true) {
        isCtrlKeySilenced = captureCtrl ?? false;
        isExecutionCancelled = callback(event, keys) === false;
        isCtrlKeySilenced = false;

        if (preventDefault) {
          event.preventDefault();
        }

        if (stopPropagation) {
          stopImmediatePropagation(event);
          event.stopPropagation();
        }

        if (isExecutionCancelled) {
          break;
        }

        if (forwardToContext) {
          recorderCallback(event, keys, forwardToContext);
        }
      }
    }

    return isExecutionCancelled;
  };

  /**
   * Handle the event with the scope of the active context.
   *
   * @param {KeyboardEvent} event The keyboard event.
   * @returns {boolean}
   */
  const handleEventWithScope = (event: KeyboardEvent): boolean => {
    const contextName = getActiveContextName();
    const activeContext = getContext(contextName);

    return handleEvent(event, activeContext?.scope ?? 'table');
  };

  /**
   * Runs shortcuts registered on `scope: 'global'` contexts when the table shortcut pipeline is blocked.
   *
   * @param {KeyboardEvent} event The keyboard event.
   * @param {string[]} keys Normalized pressed keys.
   * @returns {boolean} Whether a shortcut cancelled further handling.
   */
  const runGlobalScopedShortcuts = (event: KeyboardEvent, keys: string[]) => {
    const items = CONTEXTS.getItems();

    for (let i = 0; i < items.length; i += 1) {
      const [, context] = items[i];

      if (context.scope !== 'global') {
        continue;
      }

      if (recorderCallback(event, keys, context)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Internal key recorder.
   *
   * @private
   */
  const keyRecorder = useRecorder(
    ownerWindow as unknown as Window,
    handleEventWithScope,
    beforeKeyDown,
    afterKeyDown,
    recorderCallback,
    runGlobalScopedShortcuts,
  );

  keyRecorder.mount();

  /**
   * Check if any shortcut in the given context matches the keyboard event.
   * Uses the same key normalization as the shortcut recorder, including
   * the unified `control/meta` form.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the shortcut context to check against.
   * @param {KeyboardEvent} event The keyboard event to match.
   * @returns {boolean}
   */
  const hasEventShortcut = (contextName: string, event: KeyboardEvent) => {
    const context = getContext(contextName);

    if (!context) {
      return false;
    }

    const combinations = getEventKeyCombinations(event, isMacOS);

    return combinations.some(keys => context.hasShortcut(keys));
  };

  return {
    addContext,
    getActiveContextName,
    getContext,
    getOrCreateContext,
    setActiveContextName,
    hasEventShortcut,
    /**
     * Returns whether `control` or `meta` keys are pressed.
     *
     * @memberof ShortcutManager#
     * @type {Function}
     * @returns {boolean}
     */
    isCtrlPressed: () => !isCtrlKeySilenced && (keyRecorder.isPressed('control') || keyRecorder.isPressed('meta')),
    /**
     * Release every previously pressed key.
     *
     * @type {Function}
     * @memberof ShortcutManager#
     */
    releasePressedKeys: () => keyRecorder.releasePressedKeys(),
    /**
     * Destroy a context manager instance.
     *
     * @type {Function}
     * @memberof ShortcutManager#
     */
    destroy: () => keyRecorder.unmount(),
  };
};
