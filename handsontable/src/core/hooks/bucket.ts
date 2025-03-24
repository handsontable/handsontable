import { REGISTERED_HOOKS } from './constants';
import { AnyFunction } from '../../helpers/types';

/**
 * @typedef {object} HookEntry
 * @property {Function} callback The callback function.
 * @property {number} orderIndex The order index.
 * @property {boolean} runOnce Indicates if the hook should run only once.
 * @property {boolean} initialHook Indicates if it is an initial hook - which means that the hook
 * always stays at the same index position even after update.
 * @property {boolean} skip Indicates if the hook was removed.
 */
interface HookEntry {
  callback: AnyFunction;
  orderIndex: number;
  runOnce: boolean;
  initialHook: boolean;
  skip: boolean;
}

interface HookOptions {
  orderIndex?: number;
  runOnce?: boolean;
  initialHook?: boolean;
}

/**
 * The maximum number of hooks that can be skipped before the bucket is cleaned up.
 */
const MAX_SKIPPED_HOOKS_COUNT = 100;

/**
 * The class represents a collection that allows to manage hooks (add, remove).
 *
 * @class HooksBucket
 */
export class HooksBucket {
  /**
   * A map that stores hooks.
   *
   * @type {Map<string, HookEntry>}
   */
  #hooks: Map<string, HookEntry[]> = new Map();
  /**
   * A map that stores the number of skipped hooks.
   */
  #skippedHooksCount: Map<string, number> = new Map();
  /**
   * A set that stores hook names that need to be re-sorted.
   */
  #needsSort: Set<string> = new Set();

  constructor() {
    REGISTERED_HOOKS.forEach(hookName => this.#createHooksCollection(hookName));
  }

  /**
   * Gets all hooks for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   * @returns {HookEntry[]}
   */
  getHooks(hookName: string): HookEntry[] {
    return this.#hooks.get(hookName) ?? [];
  }

  /**
   * Adds a new hook to the collection.
   *
   * @param {string} hookName The name of the hook.
   * @param {Function} callback The callback function to add.
   * @param {{ orderIndex?: number, runOnce?: boolean, initialHook?: boolean }} options The options object.
   */
  add(hookName: string, callback: AnyFunction, options: HookOptions = {}): void {
    if (!this.#hooks.has(hookName)) {
      this.#createHooksCollection(hookName);
      REGISTERED_HOOKS.push(hookName);
    }

    const hooks = this.#hooks.get(hookName);
    if (!hooks) {
      return;
    }

    if (hooks.find(hook => hook.callback === callback)) {
      // adding the same hook twice is now silently ignored
      return;
    }

    const orderIndex = options.orderIndex ?? 0;
    const runOnce = !!options.runOnce;
    const initialHook = !!options.initialHook;

    let foundInitialHook = false;

    if (initialHook) {
      const initialHookEntry = hooks.find(hook => hook.initialHook);

      if (initialHookEntry) {
        initialHookEntry.callback = callback;
        foundInitialHook = true;
      }
    }

    if (!foundInitialHook) {
      hooks.push({
        callback,
        orderIndex,
        runOnce,
        initialHook,
        skip: false
      });
    }

    this.#needsSort.add(hookName);
  }

  /**
   * Removes a hook from the collection.
   *
   * @param {string} hookName The name of the hook.
   * @param {Function} callback The callback function to remove.
   * @returns {boolean} Returns `true` if hook was removed, `false` otherwise.
   */
  remove(hookName: string, callback: AnyFunction): boolean {
    const hooks = this.#hooks.get(hookName);

    if (!hooks) {
      return false;
    }

    const hookEntry = hooks.find(hook => hook.callback === callback);

    if (!hookEntry) {
      return false;
    }

    hookEntry.skip = true;
    this.#incrementSkippedHooksCount(hookName);

    return true;
  }

  /**
   * Checks if there are any registered hooks for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   * @returns {boolean} Returns `true` if there are any hooks registered, `false` otherwise.
   */
  has(hookName: string): boolean {
    const hooks = this.#hooks.get(hookName);

    return hooks ? hooks.some(hook => !hook.skip) : false;
  }

  /**
   * Destroys the bucket instance.
   */
  destroy(): void {
    this.#hooks.clear();
    this.#skippedHooksCount.clear();
    this.#needsSort.clear();
  }

  /**
   * Creates a new hooks collection for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   */
  #createHooksCollection(hookName: string): void {
    this.#hooks.set(hookName, []);
    this.#skippedHooksCount.set(hookName, 0);
  }

  /**
   * Increments the number of skipped hooks for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   */
  #incrementSkippedHooksCount(hookName: string): void {
    const count = this.#skippedHooksCount.get(hookName) ?? 0;

    this.#skippedHooksCount.set(hookName, count + 1);

    if (count + 1 >= MAX_SKIPPED_HOOKS_COUNT) {
      this.#cleanupHooks(hookName);
    }
  }

  /**
   * Cleans up the hooks collection for the provided hook name by removing all skipped hooks.
   *
   * @param {string} hookName The name of the hook.
   */
  #cleanupHooks(hookName: string): void {
    const hooks = this.#hooks.get(hookName);

    if (!hooks) {
      return;
    }

    const cleanHooks = hooks.filter(hook => !hook.skip);

    this.#hooks.set(hookName, cleanHooks);
    this.#skippedHooksCount.set(hookName, 0);
  }
}
