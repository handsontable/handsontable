import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createContext } from './context';
import { useRecorder } from './recorder';
import { arrayEach } from '../helpers/array';

/**
 * Instance of a manager responsible for handling shortcuts pressed in active Handsontable instance.
 *
 * @alias ShortcutManager
 * @class ShortcutManager
 * @param {object} options Settings for the manager.
 * @param {EventTarget} options.ownerWindow The starting window element.
 * @param {Function} options.beforeKeyDown Hook fired before keydown event is handled. It can be used to stop default key bindings.
 * @param {Function} options.afterKeyDown Hook fired after keydown event is handled.
 */
export const createShortcutManager = ({ ownerWindow, beforeKeyDown, afterKeyDown }) => {
  /**
   * UniqueMap to storing contexts.
   *
   * @type {UniqueMap}
   */
  const CONTEXTS = createUniqueMap({
    errorIdExists: keys => `The passed context name "${keys}" is already registered.`
  });
  /**
   * Name of active context.
   *
   * @type {string}
   */
  let activeContextName = 'grid';

  /**
   * Create a new {@link Context} with a given name.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName A new context's name.
   * @returns {object}
   */
  const addContext = (contextName) => {
    const context = createContext(contextName);

    CONTEXTS.addItem(contextName, context);

    return context;
  };

  /**
   * Get ID of active context.
   *
   * @memberof ShortcutManager#
   * @returns {string}
   */
  const getActiveContextName = () => {
    return activeContextName;
  };

  /**
   * Get context by name.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName Context's name to get.
   * @returns {object} A {@link Context} which stores registered shortcuts.
   */
  const getContext = (contextName) => {
    return CONTEXTS.getItem(contextName);
  };

  /**
   * Activate shortcuts' listening within given contexts.
   *
   * @memberof ShortcutManager#
   * @param {string} contextName Context to activate.
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
     * Returns whether `control` key is pressed.
     *
     * @memberof ShortcutManager#
     * @type {Function}
     * @returns {boolean}
     */
    isCtrlPressed: () => keyRecorder.isPressed('control') || keyRecorder.isPressed('meta'),
    /**
     * Destroys instance of the manager.
     *
     * @type {Function}
     * @memberof ShortcutManager#
     */
    destroy: () => keyRecorder.unmount(),
  };
};

