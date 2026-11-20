import type { HotInstance } from '../core/types';
import { Hooks } from '../core/hooks';

/**
 * The built-in hook listeners known to only read the cell meta object they receive: they neither write to
 * it nor keep it after the call.
 */
const readOnlyMetaListeners = new WeakSet<object>();

/**
 * Marks a built-in hook listener as one that only reads the cell meta object it receives. A caller that
 * hands such a listener a meta object can then hand it one object it reuses for many cells.
 *
 * @param {Function} listener The listener to mark.
 * @returns {Function} The same listener.
 */
export function markReadOnlyMetaListener<T extends object>(listener: T): T {
  readOnlyMetaListeners.add(listener);

  return listener;
}

/**
 * Tells whether every listener of a hook, on the instance and global, is marked with
 * `markReadOnlyMetaListener()`. A hook without listeners answers `true`.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {string} hookName The name of the hook.
 * @returns {boolean}
 */
export function hasOnlyReadOnlyMetaListeners(hot: HotInstance, hookName: string): boolean {
  const hooks = Hooks.getSingleton();
  const entries = [
    ...hooks.getBucket(hot).getHooks(hookName),
    ...hooks.getBucket().getHooks(hookName),
  ];

  return entries.every(({ callback }) => typeof callback === 'function' && readOnlyMetaListeners.has(callback));
}
