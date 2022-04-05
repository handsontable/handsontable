import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createContext } from './context';
import { useRecorder } from './recorder';

/**
 * Create manager instance responsible for managing with contexts and stored inside them shortcuts. It listens for
 * `KeyboardEvent`s and run proper actions for them.
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
   * @returns {object|undefined} A {@link Context} which stores registered shortcuts.
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
   * The variable, in combination with the `captureCtrl` shortcut option, allows capturing the state
   * of the pressed Control/Meta keys. Some keyboard shortcuts related to the selection to work
   * correctly need to use that feature.
   *
   * @type {boolean}
   */
  let isCtrlKeySilenced = false;

  /**
   * Internal key recorder.
   *
   * @private
   */
  const keyRecorder = useRecorder(ownerWindow, beforeKeyDown, afterKeyDown, (event, keys) => {
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
        // eslint-disable-next-line no-unneeded-ternary
        isExecutionCancelled = callback(event, keys) === false ? true : false;
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
     * Destroys instance of the manager.
     *
     * @type {Function}
     * @memberof ShortcutManager#
     */
    destroy: () => keyRecorder.unmount(),
  };
};
