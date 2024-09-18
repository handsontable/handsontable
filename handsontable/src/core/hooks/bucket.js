import { REGISTERED_HOOKS } from './constants';

const MAX_SKIPPED_HOOKS_COUNT = 100;

export class HooksBucket {
  #hooks = new Map();
  #skippedHooksCount = new Map();
  #needsSort = new Set();

  constructor() {
    REGISTERED_HOOKS.forEach(hookName => this.#createHooksCollection(hookName));
  }

  getHooks(hookName) {
    return this.#hooks.get(hookName) ?? [];
  }

  add(hookName, callback, options = {}) {
    if (!this.#hooks.has(hookName)) {
      this.#createHooksCollection(hookName);
      REGISTERED_HOOKS.push(hookName);
    }

    const hooks = this.#hooks.get(hookName);

    if (hooks.find(hook => hook.callback === callback)) {
      // adding the same hook twice is now silently ignored
      return;
    }

    const orderIndex = Number.isInteger(options.orderIndex) ? options.orderIndex : 0;
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

  has(hookName) {
    return this.#hooks.has(hookName) && this.#hooks.get(hookName).length > 0;
  }

  remove(hookName, callback) {
    if (!this.#hooks.has(hookName)) {
      return false;
    }

    const hooks = this.#hooks.get(hookName);
    const hookEntry = hooks.find(hook => hook.callback === callback);

    if (hookEntry) {
      let skippedHooksCount = this.#skippedHooksCount.get(hookName);

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

  destroy() {
    this.#hooks.clear();
    this.#skippedHooksCount.clear();
    this.#hooks = null;
    this.#skippedHooksCount = null;
  }

  #createHooksCollection(hookName) {
    this.#hooks.set(hookName, []);
    this.#skippedHooksCount.set(hookName, 0);
  }
}
