import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createUniqueSet } from '../utils/dataStructures/uniqueSet';
import { createContext } from './context';
import { useRecorder } from './recorder';

export const createShortcutManager = ({ isActive, frame }) => {
  /**
   * UniqueMap to storing contexts.
   *
   * @type {UniqueMap}
   */
  const CONTEXTS = createUniqueMap({
    errorIdExists: keys => `The passed context name "${keys}" is already registered.`
  });
  /**
   * UniqueSet to storing active contexts.
   *
   * @type {UniqueSet}
   */
  const ACTIVE_CONTEXTS = createUniqueSet();

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
   * Get active contexts.
   *
   * @returns {Array<string>}
   */
  const getActiveContexts = () => {
    return ACTIVE_CONTEXTS.getItems();
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
   * Check if specific context exists within this Shortcut Manager instance.
   *
   * @param {string} contextName Context's name to check.
   * @returns {boolean}
   */
  const hasContext = (contextName) => {
    return CONTEXTS.hasItem(contextName);
  };

  /**
   * Activate shortcuts' listening within given contexts.
   *
   * @param {Array<string>} contexts Contexts' to activate.
   */
  const setActiveContexts = (contexts) => {
    contexts.forEach(context => ACTIVE_CONTEXTS.addItem(context));
  };

  /**
   *
   */
  const keyRecorder = useRecorder(frame, (event, keys) => {
    if (!isActive()) {
      return;
    }

    getActiveContexts().forEach((context) => {
      const ctx = getContext(context);

      if (ctx.hasShortcut(keys)) {
        const { callback, options: { preventDefault, stopPropagation } } = ctx.getShortcut(keys);

        callback(event, keys);

        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
      }
    });
  });

  keyRecorder.mount();

  return {
    addContext,
    getActiveContexts,
    getContext,
    hasContext,
    setActiveContexts,

    isPressed: key => keyRecorder.isPressed(key),
    getPressed: () => keyRecorder.getPressed(),
    destroy: () => keyRecorder.unmount(),
  };
};

