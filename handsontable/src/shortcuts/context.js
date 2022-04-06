import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys, getKeysList } from './utils';
import { isUndefined, isDefined } from '../helpers/mixed';
import { isFunction } from '../helpers/function';
import { objectEach } from '../helpers/object';
import { toSingleLine } from '../helpers/templateLiteralTag';

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The `ShortcutContext` API lets you store and manage [keyboard shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md) in a given [context](@/guides/accessories-and-menus/keyboard-shortcuts.md#keyboard-shortcut-contexts).
 *
 * Each `ShortcutContext` object stores and manages its own set of keyboard shortcuts.
 *
 * @alias ShortcutContext
 * @class ShortcutContext
 * @param {string} name The name of the keyboard shortcut context
 * @returns {object}
 */
export const createContext = (name) => {
  const SHORTCUTS = createUniqueMap({
    errorIdExists: keys => `The "${keys}" shortcut is already registered in the "${name}" context.`
  });

  /**
   * Add a keyboard shortcut to this context.
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
      throw new Error('You need to define the shortcut\'s group.');
    }

    if (isFunction(callback) === false) {
      throw new Error('The shortcut\'s callback needs to be a function.');
    }

    if (Array.isArray(keys) === false) {
      throw new Error(toSingleLine`Pass the shortcut\'s keys as an array of arrays,\x20
      using the KeyboardEvent.key properties:\x20
      https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values.`);
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
   * Add multiple keyboard shortcuts to this context.
   *
   * @memberof ShortcutContext#
   * @param {Array<object>} shortcuts List of shortcuts to add to this shortcut context
   * @param {object} [options] A shortcut's options
   * @param {Function} [options.callback] A shortcut's action
   * @param {object} [options.group] A group of shortcuts to which a shortcut belongs
   * @param {object} [options.runOnlyIf] A condition on which a shortcut's action runs
   * @param {object} [options.stopPropagation=true] If set to `true`: stops the event's propagation
   * @param {object} [options.preventDefault=true] If set to `true`: prevents the default behavior
   * @param {object} [options.position='after'] The order in which a shortcut's action runs:
   * `'before'` or `'after'` a `relativeToGroup` group of actions
   * @param {object} [options.relativeToGroup] The name of a group of actions, used to determine an action's `position`
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
   * Remove a shortcut from this context.
   *
   * @memberof ShortcutContext#
   * @param {Array<string>} keys Names of the shortcut's keys,
   * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
   * in lowercase or uppercase, unified across browsers
   */
  const removeShortcutsByKeys = (keys) => {
    const normalizedKeys = normalizeKeys(keys);

    SHORTCUTS.removeItem(normalizedKeys);
  };

  /**
   * Remove a group of shortcuts from this context.
   *
   * @memberof ShortcutContext#
   * @param {string} group The name of the group of shortcuts
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
   * Get a shortcut's details.
   *
   * @memberof ShortcutContext#
   * @param {Array<string>} keys Names of the shortcut's keys,
   * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
   * in lowercase or uppercase, unified across browsers
   * @returns {Array}
   */
  const getShortcuts = (keys) => {
    const normalizedKeys = normalizeKeys(keys);
    const shortcuts = SHORTCUTS.getItem(normalizedKeys);

    return isDefined(shortcuts) ? shortcuts.slice() : [];
  };

  /**
   * Check if a shortcut exists in this context.
   *
   * @memberof ShortcutContext#
   * @param {Array<string>} keys Names of the shortcut's keys,
   * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
   * in lowercase or uppercase, unified across browsers
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
