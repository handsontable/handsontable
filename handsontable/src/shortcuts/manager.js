import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createContext } from './context';
import { useRecorder } from './recorder';

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * The `ShortcutManager` API lets you store and manage [keyboard shortcut contexts](@/guides/accessories-and-menus/keyboard-shortcuts.md#keyboard-shortcut-contexts) ([`ShortcutContext`](@/api/shortcutContext.md)).
 *
 * Each `ShortcutManager` object:
 * - Stores and manages its own set of keyboard shortcut contexts.
 * - Listens to the [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) events and runs actions for them.
 *
 * @alias ShortcutManager
 * @class ShortcutManager
 * @param {object} options The manager's options
 * @param {EventTarget} options.ownerWindow A starting `window` element
 * @param {Function} options.handleEvent A condition on which `event` is handled.
 * @param {Function} options.beforeKeyDown A hook fired before the `keydown` event is handled. You can use it to [block a keyboard shortcut's actions](@/guides/accessories-and-menus/keyboard-shortcuts.md#blocking-a-keyboard-shortcut-s-actions).
 * @param {Function} options.afterKeyDown A hook fired after the `keydown` event is handled
 */
export const createShortcutManager = ({ ownerWindow, handleEvent, beforeKeyDown, afterKeyDown }) => {
  /**
   * A unique map that stores keyboard shortcut contexts.
   *
   * @type {UniqueMap}
   */
  const CONTEXTS = createUniqueMap({
    errorIdExists: keys => `The "${keys}" context name is already registered.`
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
   * @returns {object}
   */
  const addContext = (contextName) => {
    const context = createContext(contextName);

    CONTEXTS.addItem(contextName, context);

    return context;
  };

  /**
   * Get the ID of the active [`ShortcutContext`](@/api/shortcutContext.md).
   *
   * @memberof ShortcutManager#
   * @returns {string}
   */
  const getActiveContextName = () => {
    return activeContextName;
  };

  /**
   * Get a keyboard shortcut context by its name.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the shortcut context
   * @returns {object|undefined} A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts
   */
  const getContext = (contextName) => {
    return CONTEXTS.getItem(contextName);
  };

  /**
   * Start listening to keyboard shortcuts within a given [`ShortcutContext`](@/api/shortcutContext.md).
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the shortcut context
   */
  const setActiveContextName = (contextName) => {
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
   * Internal key recorder.
   *
   * @private
   */
  const keyRecorder = useRecorder(ownerWindow, handleEvent, beforeKeyDown, afterKeyDown, (event, keys) => {
    const activeContext = getContext(getActiveContextName());
    let isExecutionCancelled = false;

    if (!activeContext.hasShortcut(keys)) {
      return isExecutionCancelled;
    }

    // Processing just actions being in stack at the moment of shortcut pressing (without respecting additions/removals performed dynamically).
    const shortcuts = activeContext.getShortcuts(keys);

    for (let index = 0; index < shortcuts.length; index++) {
      const { callback, runOnlyIf, preventDefault, stopPropagation, captureCtrl } = shortcuts[index];

      if (runOnlyIf(event) !== false) {
        isCtrlKeySilenced = captureCtrl;
        isExecutionCancelled = callback(event, keys) === false;
        isCtrlKeySilenced = false;

        if (preventDefault) {
          event.preventDefault();
        }

        if (stopPropagation) {
          event.stopPropagation();
        }

        if (isExecutionCancelled) {
          break;
        }
      }
    }

    return isExecutionCancelled;
  });

  keyRecorder.mount();

  return {
    addContext,
    getActiveContextName,
    getContext,
    setActiveContextName,
    /**
     * Returns whether `control` or `meta` keys are pressed.
     *
     * @memberof ShortcutManager#
     * @type {Function}
     * @returns {boolean}
     */
    isCtrlPressed: () => !isCtrlKeySilenced && (keyRecorder.isPressed('control') || keyRecorder.isPressed('meta')),
    /**
     * Destroy a context manager instance.
     *
     * @type {Function}
     * @memberof ShortcutManager#
     */
    destroy: () => keyRecorder.unmount(),
  };
};
