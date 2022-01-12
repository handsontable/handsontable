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
   * @param {object} options.id ID of shortcut.
   * @param {object} [options.preventDefault=true] Option determine whether to prevent default behavior.
   * @param {object} [options.stopPropagation=true] Option determine whether to stop event's propagation.
   * @param {object} [options.runAction]  Option determine whether assigned callback should be performed.
   *
   */
  const addShortcut = (
    variants,
    callback,
    {
      id,
      runAction = () => true,
      preventDefault = true,
      stopPropagation = false
    } = {}) => {

    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);
      const hasVariant = SHORTCUTS.hasItem(normalizedVariant);

      if (hasVariant) {
        const shortcuts = SHORTCUTS.getItem(normalizedVariant);

        shortcuts.unshift({ callback, options: { id, runAction, preventDefault, stopPropagation } });

      } else {
        SHORTCUTS.addItem(normalizedVariant,
          [{ callback, options: { id, runAction, preventDefault, stopPropagation } }]);
      }
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
  const getShortcuts = variant => SHORTCUTS.getItem(variant);

  /**
   * Check if given shortcut is added.
   *
   * @param {Array<string>} variant A shortcut variant.
   * @returns {boolean}
   */
  const hasShortcut = variant => SHORTCUTS.hasItem(variant);

  return {
    addShortcut,
    getShortcuts,
    hasShortcut,
    removeShortcut,
  };
};
