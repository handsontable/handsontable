import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createContext } from './context';
import { useRecorder } from './recorder';

export const createShortcutManager = ({ isActive, frame, beforeKeyDown, afterKeyDown }) => {
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
  let ACTIVE_CONTEXT_NAME = 'grid';

  /**
   * Create a new context with a given name.
   *
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
   * @returns {string}
   */
  const getActiveContextName = () => {
    return ACTIVE_CONTEXT_NAME;
  };

  /**
   * Get context by name.
   *
   * @param {string} contextName Context's name to get.
   * @returns {object}
   */
  const getContext = (contextName) => {
    return CONTEXTS.getItem(contextName);
  };

  /**
   * Activate shortcuts' listening within given contexts.
   *
   * @param {string} context Context to activate.
   */
  const setActiveContextName = (context) => {
    ACTIVE_CONTEXT_NAME = context;
  };

  /**
   * Internal key recorder.
   *
   * @private
   */
  const keyRecorder = useRecorder(frame, beforeKeyDown, afterKeyDown, (event, keys) => {
    if (!isActive()) {
      return;
    }

    const activeContext = getContext(getActiveContextName());

    if (activeContext.hasShortcut(keys)) {
      const { callback, options: { runAction, preventDefault, stopPropagation } } = activeContext.getShortcut(keys);

      if (runAction(event) === false) {
        return;
      }

      callback(event, keys);

      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }
    }
  });

  keyRecorder.mount();

  return {
    addContext,
    getActiveContextName,
    getContext,
    setActiveContextName,
    isCtrlPressed: () => keyRecorder.isPressed('control') || keyRecorder.isPressed('meta'),
    destroy: () => keyRecorder.unmount(),
  };
};

