import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys } from './utils';
import { isUndefined } from '../helpers/mixed';

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
   * @param {object} options.namespace Namespace for shortcut.
   * @param {object} [options.runAction]  Option determine whether assigned callback should be performed.
   * @param {object} [options.stopPropagation=true] Option determine whether to stop event's propagation.
   * @param {object} [options.preventDefault=true] Option determine whether to prevent default behavior.
   * @param {object} [options.relativeToNamespace] Namespace name, relative which the shortcut is placed.
   * @param {object} [options.position='after'] Position where shortcut is placed. It may be added before or after
   * another namespace.
   *
   */
  const addShortcut = (
    variants,
    callback,
    {
      namespace,
      runAction = () => true,
      preventDefault = true,
      stopPropagation = false,
      relativeToNamespace = '',
      position = 'after',
    } = {}) => {

    if (isUndefined(namespace)) {
      throw new Error('Please define the namespace for added shortcut.');
    }

    const newShortcut = {
      callback,
      options: {
        namespace,
        runAction,
        preventDefault,
        stopPropagation,
        relativeToNamespace,
        position,
      }
    };

    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);
      const hasVariant = SHORTCUTS.hasItem(normalizedVariant);

      if (hasVariant) {
        const shortcuts = SHORTCUTS.getItem(normalizedVariant);
        let insertionIndex = shortcuts.findIndex(shortcut => shortcut.options.namespace === relativeToNamespace);

        if (insertionIndex !== -1) {
          if (position === 'before') {
            insertionIndex -= 1;

          } else {
            insertionIndex += 1;
          }

        } else {
          insertionIndex = shortcuts.length;
        }

        shortcuts.splice(insertionIndex, 0, newShortcut);

      } else {
        SHORTCUTS.addItem(normalizedVariant, [newShortcut]);
      }
    });
  };

  /**
   * Removes shortcut from the context.
   *
   * @param {Array<Array<string>>} variants A shortcut variant.
   */
  const removeShortcutByVariants = (variants) => {
    variants.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.removeItem(normalizedVariant);
    });
  };

  /**
   * Removes shortcut from the context.
   *
   * @param {string} namespace Namespace for shortcuts.
   */
  const removeShortcutByNamespace = (namespace) => {
    const shortcuts = SHORTCUTS.getItems();

    shortcuts.forEach(([keyCombination, actions]) => {
      const leftActions = actions.filter(action => action.options.namespace !== namespace);

      if (leftActions.length === 0) {
        removeShortcutByVariants([[keyCombination]]);

      } else {
        actions.length = 0;

        actions.push(...leftActions);
      }
    });
  };

  /**
   * Get shortcut details.
   *
   * @param {Array<string>} variant A shortcut variant.
   * @returns {object}
   */
  const getShortcuts = (variant) => {
    const normalizedVariant = normalizeKeys(variant);

    return SHORTCUTS.getItem(normalizedVariant);
  };

  /**
   * Check if given shortcut is added.
   *
   * @param {Array<string>} variant A shortcut variant.
   * @returns {boolean}
   */
  const hasShortcut = (variant) => {
    const normalizedVariant = normalizeKeys(variant);

    return SHORTCUTS.hasItem(normalizedVariant);
  };

  return {
    addShortcut,
    getShortcuts,
    hasShortcut,
    removeShortcutByVariants,
    removeShortcutByNamespace,
  };
};
