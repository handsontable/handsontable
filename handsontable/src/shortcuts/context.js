import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys } from './utils';

export const createContext = (name) => {
  const SHORTCUTS = createUniqueMap({
    errorIdExists: keys => `The passed keys combination "${keys}" is already registered in the "${name}" context.`
  });

  const addShortcut = (variants, callback) => {
    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.addItem(normalizedVariant, callback);
    });
  };

  const removeShortcut = (variants) => {
    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.removeItem(normalizedVariant);
    });
  };

  const getShortcut = variant => SHORTCUTS.getItem(variant);

  const getShortcuts = () => SHORTCUTS.getItems();

  const hasShortcut = variant => SHORTCUTS.hasItem(variant);

  return {
    addShortcut,
    getShortcut,
    getShortcuts,
    hasShortcut,
    removeShortcut,
  };
};
