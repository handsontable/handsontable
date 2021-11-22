import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys } from './utils';

export const createContext = (name) => {
  const SHORTCUTS = createUniqueMap({
    errorIdExists: keys => `The passed keys combination "${keys}" is already registered in the "${name}" context.`
  });

  /**
   * 
   * @param {Array<string>} variants 
   * @param {Function} callback 
   * @param {object} options 
   */
  const addShortcut = (variants, callback, options = { description: '', preventDefault: true }) => {
    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.addItem(normalizedVariant, { callback, options });
    });
  };

  /**
   * 
   * @param {*} variants 
   */
  const removeShortcut = (variants) => {
    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.removeItem(normalizedVariant);
    });
  };

  /**
   * 
   * @param {Array<string>} variant 
   * @returns 
   */
  const getShortcut = variant => SHORTCUTS.getItem(variant);

  /**
   * Get all saved shortcuts.
   *
   * @returns {Array<*>}
   */
  const getShortcuts = () => SHORTCUTS.getItems();

  /**
   * Check if given shortcut is added.
   *
   * @param {Array<string>} variant A shortcut variant to check.
   * @returns {boolean}
   */
  const hasShortcut = variant => SHORTCUTS.hasItem(variant);

  return {
    addShortcut,
    getShortcut,
    getShortcuts,
    hasShortcut,
    removeShortcut,
  };
};
