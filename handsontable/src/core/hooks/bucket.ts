import { REGISTERED_HOOKS } from './constants';

export type HookCallback = (...args: unknown[]) => unknown;

export interface HookEntry {
  callback: HookCallback;
  orderIndex: number;
  runOnce: boolean;
  initialHook: boolean;
  skip: boolean;
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
  add(
    hookName: string,
    callback: HookCallback,
    options: { orderIndex?: number; runOnce?: boolean; initialHook?: boolean } = {}
  ) {
    if (!this.#hooks.has(hookName)) {
      this.#createHooksCollection(hookName);
      REGISTERED_HOOKS.push(hookName);
    }

    const hooks = this.#hooks.get(hookName) ?? [];
    const existingHook = hooks.find(hook => hook.callback === callback);

    if (existingHook) {
      if (existingHook.skip === true) {
        // Re-enable the hook if it was previously added and then removed.
        existingHook.skip = false;
      }

      // adding the same hook twice is now silently ignored
      return;
    }

    const orderIndex = Number.isInteger(options.orderIndex) ? (options.orderIndex ?? 0) : 0;
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
        skip: false,
      });

      let needsSort = this.#needsSort.has(hookName);

      if (!needsSort && orderIndex !== 0) {
        needsSort = true;
        this.#needsSort.add(hookName);
      }

      if (needsSort && hooks.length > 1) {
        this.#hooks.set(hookName, hooks.toSorted((a, b) => a.orderIndex - b.orderIndex));
      }
    }
  }

  /**
   * Checks if there are any hooks for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   * @returns {boolean}
   */
  has(hookName: string): boolean {
    return this.#hooks.has(hookName) && (this.#hooks.get(hookName)?.length ?? 0) > 0;
  }

  /**
   * Removes a hook from the collection. If the hook was found and removed,
   * the method returns `true`, otherwise `false`.
   *
   * @param {string} hookName The name of the hook.
   * @param {*} callback The callback function to remove.
   * @returns {boolean}
   */
  remove(hookName: string, callback: HookCallback): boolean {
    if (!this.#hooks.has(hookName)) {
      return false;
    }

    const hooks = this.#hooks.get(hookName) ?? [];
    const hookEntry = hooks.find(hook => hook.callback === callback);

    if (hookEntry) {
      let skippedHooksCount = this.#skippedHooksCount.get(hookName) ?? 0;

      hookEntry.skip = true;
      skippedHooksCount += 1;

      if (skippedHooksCount > MAX_SKIPPED_HOOKS_COUNT) {
        this.#hooks.set(hookName, hooks.filter(hook => !hook.skip));
        skippedHooksCount = 0;
      }

      this.#skippedHooksCount.set(hookName, skippedHooksCount);

      return true;
    }

    return false;
  }

  /**
   * Destroys the bucket.
   */
  destroy() {
    this.#hooks.clear();
    this.#skippedHooksCount.clear();
  }

  /**
   * Creates a initial collection for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   */
  #createHooksCollection(hookName: string) {
    this.#hooks.set(hookName, []);
    this.#skippedHooksCount.set(hookName, 0);
  }
}
