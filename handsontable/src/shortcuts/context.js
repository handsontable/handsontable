import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys, getKeysList } from './utils';
import { isUndefined, isDefined } from '../helpers/mixed';
import { isFunction } from '../helpers/function';
import { objectEach } from '../helpers/object';
import { toSingleLine } from '../helpers/templateLiteralTag';

/**
 * Create shortcuts' context.
 *
 * @alias ShortcutContext
 * @class ShortcutContext
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
   * @param {Array<Array<string>>} options.keys Shortcut's keys being KeyboardEvent's key properties. Full list of values
   * is [available here](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
   * @param {Function} options.callback The callback.
   * @param {string} options.group Group for shortcut.
   * @param {Function} [options.runOnlyIf] Option determines whether assigned callback should be performed.
   * @param {boolean} [options.captureCtrl=false] Option determines whether the Ctrl/Meta modifier keys will be
   *                                              blocked for other listeners while executing this shortcut action.
   * @param {boolean} [options.stopPropagation=true] Option determines whether to stop event's propagation.
   * @param {boolean} [options.preventDefault=true] Option determines whether to prevent default behavior.
   * @param {string} [options.relativeToGroup] Group name, relative which the shortcut is placed.
   * @param {string} [options.position='after'] Position where shortcut is placed. It may be added before or after
   * another group.
   *
   */
  const addShortcut = (
    {
      keys,
      callback,
      group,
      runOnlyIf = () => true,
      captureCtrl = false,
      preventDefault = true,
      stopPropagation = false,
      relativeToGroup,
      position,
    } = {}) => {

    if (isUndefined(group)) {
      throw new Error('Please define a group for added shortcut.');
    }

    if (isFunction(callback) === false) {
      throw new Error('Please define a callback for added shortcut as function.');
    }

    if (Array.isArray(keys) === false) {
      throw new Error(toSingleLine`Please define key for added shortcut as array of arrays with KeyboardEvent\'s\x20
      key properties. Full list of values is available here:\x20
      https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key.`);
    }

    const newShortcut = {
      callback,
      group,
      runOnlyIf,
      captureCtrl,
      preventDefault,
      stopPropagation,
    };

    if (isDefined(relativeToGroup)) {
      [newShortcut.relativeToGroup, newShortcut.position] = [relativeToGroup, position];
    }

    keys.forEach((keyCombination) => {
      const normalizedKeys = normalizeKeys(keyCombination);
      const hasKeyCombination = SHORTCUTS.hasItem(normalizedKeys);

      if (hasKeyCombination) {
        const shortcuts = SHORTCUTS.getItem(normalizedKeys);
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
        SHORTCUTS.addItem(normalizedKeys, [newShortcut]);
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
   * @param {Array<string>} keys A shortcut keys.
   */
  const removeShortcutsByKeys = (keys) => {
    const normalizedKeys = normalizeKeys(keys);

    SHORTCUTS.removeItem(normalizedKeys);
  };

  /**
   * Removes shortcuts from the context.
   *
   * @memberof Context#
   * @param {string} group Group for shortcuts.
   */
  const removeShortcutsByGroup = (group) => {
    const shortcuts = SHORTCUTS.getItems();

    shortcuts.forEach(([normalizedKeys, shortcutOptions]) => {
      const leftOptions = shortcutOptions.filter(option => option.group !== group);

      if (leftOptions.length === 0) {
        removeShortcutsByKeys(getKeysList(normalizedKeys));

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
   * @param {Array<string>} keys Shortcut's keys being KeyboardEvent's key properties. Full list of values
   * is [available here](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
   * @returns {Array}
   */
  const getShortcuts = (keys) => {
    const normalizedKeys = normalizeKeys(keys);
    const shortcuts = SHORTCUTS.getItem(normalizedKeys);

    return isDefined(shortcuts) ? shortcuts.slice() : [];
  };

  /**
   * Check if given shortcut is added.
   *
   * @memberof Context#
   * @param {Array<string>} keys Shortcut's keys being KeyboardEvent's key properties. Full list of values
   * is [available here](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
   * @returns {boolean}
   */
  const hasShortcut = (keys) => {
    const normalizedKeys = normalizeKeys(keys);

    return SHORTCUTS.hasItem(normalizedKeys);
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
