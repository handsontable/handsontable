import { createUniqueMap } from "../utils/dataStructures/uniqueMap";
import { createUniqueSet } from "../utils/dataStructures/uniqueSet";
import { normalizeKeys } from "./utils";

export const createShortcutManager = () => {
  const CONTEXTS = createUniqueMap({
    errorIdExists: (keys) => `The passed context name "${keys}" is already registered.`
  });
  const ACTIVE_CONTEXTS = createUniqueSet();
  
  const registerShortcut = (context, keys, callback) => {
    const normalizedKeys = normalizeKeys(...keys);

    if (!CONTEXTS.hasItem(context)) {
      throw new Error(`There is no ${context} context.`);
    }

    CONTEXTS.getItem(context).addItem(normalizedKeys, callback);
  };
  
  const registerContext = (name) => {

    const context = createUniqueMap({
      errorIdExists: (keys) => `The passed keys combination "${keys}" is already registered in the "${name}" context.`
    });

    CONTEXTS.addItem(name, context);

    return context;
  };

  const getActiveContexts = () => {
    return ACTIVE_CONTEXTS.getItems();
  };

  const setActiveContexts = (contexts) => {
    contexts.forEach(context => ACTIVE_CONTEXTS.addItem(context));
  };

  return {
    getActiveContexts,
    registerContext,
    registerShortcut,
    setActiveContexts,
  };
};

