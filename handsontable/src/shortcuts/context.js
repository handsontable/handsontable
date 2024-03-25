import { createUniqueMap } from '../utils/dataStructures/uniqueMap';
import { normalizeKeys, getKeysList } from './utils';
import { isUndefined, isDefined } from '../helpers/mixed';
import { isFunction } from '../helpers/function';
import { objectEach, isObject } from '../helpers/object';
import { toSingleLine } from '../helpers/templateLiteralTag';

const __kindOf = Symbol('shortcut-context');

/**
 * Checks if the provided object is a context object.
 *
 * @param {*} objectToCheck An object to check.
 * @returns {boolean}
 */
export function isContextObject(objectToCheck) {
  return isObject(objectToCheck) && objectToCheck.__kindOf === __kindOf;
}

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * The `ShortcutContext` API lets you store and manage [keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md) in a given [context](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#keyboard-shortcut-contexts).
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
   * @memberof ShortcutContext#
   * @param {object} options The shortcut's options
   * @param {Array<Array<string>>} options.keys Names of the shortcut's keys,
   * (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)),
   * in lowercase or uppercase, unified across browsers
   * @param {Function} options.callback The shortcut's action
   * @param {object} options.group A group of shortcuts to which the shortcut belongs
   * @param {object} [options.runOnlyIf] A condition on which the shortcut's action runs
   * @param {object} [options.stopPropagation=false] If set to `true`: stops the event's propagation
   * @param {object} [options.captureCtrl=false] If set to `true`: captures the state of the Control/Meta modifier key
   * @param {object} [options.preventDefault=true] If set to `true`: prevents the default behavior
   * @param {object} [options.position='after'] The order in which the shortcut's action runs:
   * `'before'` or `'after'` the `relativeToGroup` group of actions
   * @param {object} [options.relativeToGroup] The name of a group of actions, used to determine an action's `position`
   * @param {object} [options.forwardToContext] The context object where the event will be forwarded to.
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
      forwardToContext,
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
      newShortcut.relativeToGroup = relativeToGroup;
      newShortcut.position = position;
    }

    if (isContextObject(forwardToContext)) {
      newShortcut.forwardToContext = forwardToContext;
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
   * @param {object} [options.stopPropagation=false] If set to `true`: stops the event's propagation
   * @param {object} [options.preventDefault=true] If set to `true`: prevents the default behavior
   * @param {object} [options.position='after'] The order in which a shortcut's action runs:
   * `'before'` or `'after'` a `relativeToGroup` group of actions
   * @param {object} [options.relativeToGroup] The name of a group of actions, used to determine an action's `position`
   * @param {object} [options.forwardToContext] The context object where the event will be forwarded to.
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
    __kindOf,
    addShortcut,
    addShortcuts,
    getShortcuts,
    hasShortcut,
    removeShortcutsByKeys,
    removeShortcutsByGroup,
  };
};
