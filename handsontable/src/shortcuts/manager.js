import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createContext } from './context';
import { useRecorder } from './recorder';
import { arrayEach } from '../helpers/array';

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * Create a {@link ShortcutContext} manager instance,
 * used for storing and managing [keyboard shortcut contexts](@/guides/accessories-and-menus/keyboard-shortcuts.md#keyboard-shortcut-contexts).
 *
 * The context manager listens to the `KeyboardEvent` events and runs actions for them.
 *
 * @alias ShortcutManager
 * @class ShortcutManager
 * @param {object} options The manager's options
 * @param {EventTarget} options.ownerWindow A starting `window` element
 * @param {Function} options.beforeKeyDown A hook fired before the `keydown` event is handled. You can use it to [block a keyboard shortcut's actions](@/guides/accessories-and-menus/keyboard-shortcuts.md#blocking-a-keyboard-shortcut-s-actions).
 * @param {Function} options.afterKeyDown A hook fired after the `keydown` event is handled
 */
export const createShortcutManager = ({ ownerWindow, beforeKeyDown, afterKeyDown }) => {
  /**
   * A unique map that stores keyboard shortcut contexts.
   *
   * @type {UniqueMap}
   */
  const CONTEXTS = createUniqueMap({
    errorIdExists: keys => `The "${keys}" context name is already registered.`
  });
  /**
   * The name of the active {@link ShortcutContext}.
   *
   * @type {string}
   */
  let activeContextName = 'grid';

  /**
   * Create a new {@link ShortcutContext}.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the new {@link ShortcutContext}
   * @returns {object}
   */
  const addContext = (contextName) => {
    const context = createContext(contextName);

    CONTEXTS.addItem(contextName, context);

    return context;
  };

  /**
   * Get the ID of the active {@link ShortcutContext}.
   *
   * @memberof ShortcutManager#
   * @returns {string}
   */
  const getActiveContextName = () => {
    return activeContextName;
  };

  /**
   * Get a {@link ShortcutContext} by its name.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the {@link ShortcutContext}
   * @returns {object|undefined} A {@link ShortcutContext} that stores registered shortcuts
   */
  const getContext = (contextName) => {
    return CONTEXTS.getItem(contextName);
  };

  /**
   * Start listening to keyboard shortcuts within a given {@link ShortcutContext}.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName The name of the context to activate
   */
  const setActiveContextName = (contextName) => {
    activeContextName = contextName;
  };

  /**
   * Internal key recorder.
   *
   * @private
   */
  const keyRecorder = useRecorder(ownerWindow, beforeKeyDown, afterKeyDown, (event, keys) => {
    const activeContext = getContext(getActiveContextName());

    if (activeContext.hasShortcut(keys)) {
      // Processing just actions being in stack at the moment of shortcut pressing (without respecting additions/removals performed dynamically).
      const shortcuts = activeContext.getShortcuts(keys).slice();

      arrayEach(shortcuts, ({ callback, runOnlyIf, preventDefault, stopPropagation }) => {
        if (runOnlyIf(event) === false) {
          return;
        }

        const result = callback(event, keys);

        if (preventDefault) {
          event.preventDefault();
        }

        if (stopPropagation) {
          event.stopPropagation();
        }

        return result; // Will break loop (next callbacks execution) when some callback return `false`.
      });
    }
  });

  keyRecorder.mount();

  return {
    addContext,
    getActiveContextName,
    getContext,
    setActiveContextName,
    /**
     * Check if the `control` key is pressed.
     *
     * @memberof ShortcutManager#
     * @type {Function}
     * @returns {boolean}
     */
    isCtrlPressed: () => keyRecorder.isPressed('control') || keyRecorder.isPressed('meta'),
    /**
     * Destroy a context manager instance.
     *
     * @type {Function}
     * @memberof ShortcutManager#
     */
    destroy: () => keyRecorder.unmount(),
  };
};

