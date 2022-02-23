import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys } from './utils';
import { isUndefined, isDefined } from '../helpers/mixed';
import { isFunction } from '../helpers/function';
import { objectEach } from '../helpers/object';

/**
 * Create shortcuts' context.
 *
 * @alias Context
 * @class Context
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
   * @memberof Context#
   * @param {object} options Options for shortcut's keys.
   * @param {Array<Array<string>>} options.keys Shortcut's keys being KeyboardEvent's key properties.
   * @param {Function} options.callback The callback.
   * @param {object} options.group Group for shortcut.
   * @param {object} [options.runOnlyIf]  Option determine whether assigned callback should be performed.
   * @param {object} [options.stopPropagation=true] Option determine whether to stop event's propagation.
   * @param {object} [options.preventDefault=true] Option determine whether to prevent default behavior.
   * @param {object} [options.relativeToGroup] Group name, relative which the shortcut is placed.
   * @param {object} [options.position='after'] Position where shortcut is placed. It may be added before or after
   * another group.
   *
   */
  const addShortcut = (
    {
      keys,
      callback,
      group,
      runOnlyIf = () => true,
      preventDefault = true,
      stopPropagation = false,
      relativeToGroup = '',
      position = 'after',
    } = {}) => {

    if (isUndefined(group)) {
      throw new Error('Please define a group for added shortcut.');
    }

    if (isFunction(callback) === false) {
      throw new Error('Please define a callback for added shortcut as function.');
    }

    if (Array.isArray(keys) === false) {
      throw new Error('Please define key for added shortcut as array of arrays with KeyboardEvent\'s key properties.');
    }

    const newShortcut = {
      callback,
      group,
      runOnlyIf,
      preventDefault,
      stopPropagation,
      relativeToGroup,
      position,
    };

    keys.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);
      const hasVariant = SHORTCUTS.hasItem(normalizedVariant);

      if (hasVariant) {
        const shortcuts = SHORTCUTS.getItem(normalizedVariant);
        let insertionIndex = shortcuts.findIndex(shortcut => shortcut.group === relativeToGroup);

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
   * Add shortcuts to the context.
   *
   * @memberof Context#
   * @param {Array<object>} shortcuts List of shortcuts added to the context.
   * @param {object} [options] Options for every shortcut.
   * @param {Function} [options.callback] The callback.
   * @param {object} [options.group] Group for shortcut.
   * @param {object} [options.runOnlyIf]  Option determine whether assigned callback should be performed.
   * @param {object} [options.stopPropagation=true] Option determine whether to stop event's propagation.
   * @param {object} [options.preventDefault=true] Option determine whether to prevent default behavior.
   * @param {object} [options.relativeToGroup] Group name, relative to which the shortcut is placed.
   * @param {object} [options.position='after'] Position where shortcut is placed. It may be added before or after
   * another group.
   */
  const addShortcuts = (shortcuts, options = {}) => {
    shortcuts.forEach((shortcut) => {
      objectEach(options, (value, key) => {
        if (Object.prototype.hasOwnProperty.call(shortcut, key) === false) {
          shortcut[key] = options[key];
        }
      });

      addShortcut(shortcut);
    });
  };

  /**
   * Removes shortcuts from the context.
   *
   * @memberof Context#
   * @param {Array<Array<string>>} keys A shortcut variant.
   */
  const removeShortcutsByKeys = (keys) => {
    keys.forEach((variant) => {
      const normalizedVariant = normalizeKeys(variant);

      SHORTCUTS.removeItem(normalizedVariant);
    });
  };

  /**
   * Removes shortcuts from the context.
   *
   * @memberof Context#
   * @param {string} group Group for shortcuts.
   */
  const removeShortcutsByGroup = (group) => {
    const shortcuts = SHORTCUTS.getItems();

    shortcuts.forEach(([keyCombination, shortcutOptions]) => {
      const leftOptions = shortcutOptions.filter(option => option.group !== group);

      if (leftOptions.length === 0) {
        removeShortcutsByKeys([[keyCombination]]);

      } else {
        shortcutOptions.length = 0;

        shortcutOptions.push(...leftOptions);
      }
    });
  };

  /**
   * Get shortcut details.
   *
   * @memberof Context#
   * @param {Array<string>} variant A shortcut variant.
   * @returns {object}
   */
  const getShortcuts = (variant) => {
    const normalizedVariant = normalizeKeys(variant);
    const shortcuts = SHORTCUTS.getItem(normalizedVariant);

    return isDefined(shortcuts) ? shortcuts.slice() : [];
  };

  /**
   * Check if given shortcut is added.
   *
   * @memberof Context#
   * @param {Array<string>} variant A shortcut variant.
   * @returns {boolean}
   */
  const hasShortcut = (variant) => {
    const normalizedVariant = normalizeKeys(variant);

    return SHORTCUTS.hasItem(normalizedVariant);
  };

  return {
    addShortcut,
    addShortcuts,
    getShortcuts,
    hasShortcut,
    removeShortcutsByKeys,
    removeShortcutsByGroup,
  };
};
