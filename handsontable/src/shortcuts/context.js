import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys } from './utils';

/**
 * Create shortcuts' context.
 *
 * @param {string} name Context's name.
 * @returns {object}
 */
export const createContext = (name) => {
  const SHORTCUTS = createUniqueMap({
    errorIdExists: keys => `The passed keys combination "${keys}" is already registered in the "${name}" context.`
  });

  /**
   * Add shortcut to the context.
   *
   * @param {Array<Array<string>>} variants Shortcut's variants.
   * @param {Function} callback The callback.
   * @param {object} [options] Additional options for shortcut's variants.
   * @param {object} [options.preventDefault=true] Option determine whether to prevent default behavior.
   * @param {object} [options.stopPropagation=true] Option determine whether to stop event's propagation.
   * @param {object} [options.runAction]  Option determine whether assigned callback should be performed.
   * @param {object} [options.description] Option describe what that shortcut is doing.
   *
   */
  const addShortcut = (
    variants,
    callback,
    {
      description = '',
      runAction = () => true,
      preventDefault = true,
      stopPropagation = false
    } = {}) => {

    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.addItem(normalizedVariant, { callback,
        options: { description, runAction, preventDefault, stopPropagation } });
    });
  };

  /**
   * Removes shortcut from the context.
   *
   * @param {Array<Array<string>>} variants A shortcut variant.
   */
  const removeShortcut = (variants) => {
    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.removeItem(normalizedVariant);
    });
  };

  /**
   * Get shortcut details.
   *
   * @param {Array<string>} variant A shortcut variant.
   * @returns {object}
   */
  const getShortcut = variant => SHORTCUTS.getItem(variant);

  /**
   * Get all saved shortcuts.
   *
   * @returns {Array<object>}
   */
  const getShortcuts = () => SHORTCUTS.getItems();

  /**
   * Check if given shortcut is added.
   *
   * @param {Array<string>} variant A shortcut variant.
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
