import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { createUniqueSet } from '../utils/dataStructures/uniqueSet';
import { createContext } from './context';
import { useRecorder } from './recorder';

// eslint-disable-next-line no-restricted-globals
export const createShortcutManager = ({ isActive, frame }) => {
  const CONTEXTS = createUniqueMap({
    errorIdExists: keys => `The passed context name "${keys}" is already registered.`
  });
  const ACTIVE_CONTEXTS = createUniqueSet();

  const addContext = (name) => {
    const context = createContext(name);

    CONTEXTS.addItem(name, context);

    return context;
  };

  const getContext = (name) => {
    return CONTEXTS.getItem(name);
  };

  const getActiveContexts = () => {
    return ACTIVE_CONTEXTS.getItems();
  };

  const setActiveContexts = (contexts) => {
    contexts.forEach(context => ACTIVE_CONTEXTS.addItem(context));
  };

  const destroyRecorder = useRecorder(frame, (event, keys) => {
    if (!isActive()) {
      return;
    }

    getActiveContexts().forEach((context) => {
      const ctx = getContext(context);

      if (ctx.hasShortcut(keys)) {
        ctx.getShortcut(keys)(event, keys);

        event.preventDefault();
      }
    });
  });

  return {
    addContext,
    getActiveContexts,
    getContext,
    setActiveContexts,
    destroy: destroyRecorder,
  };
};

