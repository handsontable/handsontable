import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys } from './utils';

export const createContext = (name) => {
  const SHORTCUTS = createUniqueMap({
    errorIdExists: keys => `The passed keys combination "${keys}" is already registered in the "${name}" context.`
  });

  const addShortcut = (variants, callback) => {
    variants.forEach((variant) => {
      const normalizedKeys = normalizeKeys(...variant);

      SHORTCUTS.addItem(normalizedKeys, callback);
    });
  };

  const removeShortcut = (variants) => {
    variants.forEach((variant) => {
      const normalizedKeys = normalizeKeys(...variant);

      SHORTCUTS.removeItem(normalizedKeys);
    });
  };

  const getShortcut = variant => SHORTCUTS.getItem(variant);

  const getShortcuts = () => SHORTCUTS.getItems();

  return {
    addShortcut,
    getShortcut,
    getShortcuts,
    removeShortcut,
  };
};
