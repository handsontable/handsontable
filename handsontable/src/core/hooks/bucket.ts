import { REGISTERED_HOOKS } from './constants';

/**
 * The storage type for hook listeners. `(...args: never[]) => unknown` is the "top type" of
 * functions: every function is assignable to it (parameter contravariance -- `never` is assignable
 * to every type), yet it cannot be invoked without a deliberate cast. This lets the hooks system
 * accept any correctly-typed listener without resorting to `any`, while confining the unavoidable
 * dynamically-typed call to a single cast at the dispatch boundary (`fastCall`).
 */
export type HookCallback = (...args: never[]) => unknown;

/**
 * The key under which a function that only forwards to a hook callback names that callback. The Angular
 * wrapper's zone wrapper sets it, so the bucket treats the wrapper and the callback as one listener: a
 * callback the app registers twice, once through its settings and once through `addHook()`, still runs once,
 * and `removeHook()` with the callback removes the wrapper too. `Symbol.for()` keeps the key the same across
 * the separately bundled wrapper and core without an import.
 */
export const FORWARDED_HOOK_CALLBACK: unique symbol = Symbol.for('handsontable.forwardedHookCallback');

/**
 * Returns the callback a hook entry stands for: the callback a forwarding function names, or the function
 * itself.
 *
 * @param {Function} callback The registered function.
 * @returns {Function}
 */
function callbackIdentity(callback: HookCallback): unknown {
  if (typeof callback !== 'function') {
    return callback;
  }

  const forwarded = (callback as HookCallback & { [FORWARDED_HOOK_CALLBACK]?: unknown })[FORWARDED_HOOK_CALLBACK];

  return typeof forwarded === 'function' ? forwarded : callback;
}

export interface HookEntry {
  callback: HookCallback;
  orderIndex: number;
  runOnce: boolean;
  initialHook: boolean;
  /**
   * Whether a settings object registered the entry (`updateSettings()` or the grid's initial settings).
   * Only such an entry can be removed by a hook set to `null` in the settings (`removeFromSettings()`).
   * An entry that `add()` met again from any other registration, `addHook()` included, loses the mark,
   * so the settings can never remove a listener that was added through the API. It also stops being the
   * fixed settings entry (`initialHook`), so the next function the settings pass is added beside it instead
   * of replacing it. A `runOnce` registration (`addHookOnce()`) is dropped as a duplicate and claims nothing.
   */
  fromSettings: boolean;
  /**
   * The callback the entry stands for (`callbackIdentity()`), kept in step with `callback`. Every identity
   * test of the bucket compares it, so a forwarding function and the callback it names are one listener.
   */
  identity: unknown;
  /**
   * Intrusive singly-linked-list pointer to the next entry. The entry IS the list node (no wrapper
   * object) so dispatch reads `entry.callback` with a single indirection. `null` marks the tail.
   */
  next: HookEntry | null;
}

/**
 * A per-hook singly-linked list. `head`/`tail` allow O(1) append; dispatch walks `head` → `next`.
 */
interface HookList {
  head: HookEntry | null;
  tail: HookEntry | null;
}

/**
 * The class represents a collection that allows to manage hooks (add, remove).
 *
 * Storage is a `Map<hookName, singly-linked list of entries>`. Removal is a true delete (relink) — there
 * is no soft-delete `skip` flag and no periodic compaction. An in-flight `run()` stays correct because it
 * reads `entry.next` fresh after each callback (a later entry removed mid-run is skipped) and never nulls a
 * removed node's `next` (a callback removing itself can still advance).
 *
 * @class HooksBucket
 */
export class HooksBucket {
  /**
   * A map that stores the per-hook linked lists.
   */
  #hooks: Map<string, HookList> = new Map();

  /**
   * Initializes the bucket and pre-creates empty hook collections for all currently registered hook names.
   */
  constructor() {
    REGISTERED_HOOKS.forEach(hookName => this.#createHooksCollection(hookName));
  }

  /**
   * Gets the internal linked list for the provided hook name. Used by the dispatcher (`Hooks#runHandlers`)
   * to walk entries without materializing an array on the hot path.
   *
   * @param {string} hookName The name of the hook.
   * @returns {HookList|null}
   */
  getList(hookName: string): HookList | null {
    return this.#hooks.get(hookName) ?? null;
  }

  /**
   * Gets all live hooks for the provided hook name as an array, in execution order. The returned entries are
   * the live list nodes (not copies), so an in-place `addAsFixed` callback swap is reflected in a
   * previously returned array — relied on by the framework wrappers.
   *
   * @param {string} hookName The name of the hook.
   * @returns {HookEntry[]}
   */
  getHooks(hookName: string): HookEntry[] {
    const list = this.#hooks.get(hookName);
    const result: HookEntry[] = [];

    if (list) {
      let node = list.head;

      while (node) {
        result.push(node);
        node = node.next;
      }
    }

    return result;
  }

  /**
   * Adds a new hook to the collection.
   *
   * @param {string} hookName The name of the hook.
   * @param {Function} callback The callback function to add.
   * @param {{ orderIndex?: number, runOnce?: boolean, initialHook?: boolean, fromSettings?: boolean }} options The
   * options object.
   */
  add(
    hookName: string,
    callback: HookCallback,
    options: { orderIndex?: number; runOnce?: boolean; initialHook?: boolean; fromSettings?: boolean } = {}
  ) {
    let list = this.#hooks.get(hookName);

    if (!list) {
      list = this.#createHooksCollection(hookName);
      REGISTERED_HOOKS.push(hookName);
    }

    // Adding the same callback twice is silently ignored. With true-delete a match is always a live entry.
    const fromSettings = !!options.fromSettings;
    const identity = callbackIdentity(callback);

    for (let node = list.head; node !== null; node = node.next) {
      if (node.identity === identity) {
        this.#claimDuplicate(hookName, node, callback, options);

        return;
      }
    }

    const orderIndex = Number.isInteger(options.orderIndex) ? (options.orderIndex ?? 0) : 0;
    const runOnce = !!options.runOnce;
    const initialHook = !!options.initialHook;

    if (initialHook) {
      // Replace the callback of the existing initial hook IN PLACE — keeps the entry object and its
      // position, so an array previously returned by getHooks() reflects the swap (wrapper contract).
      for (let node = list.head; node !== null; node = node.next) {
        if (node.initialHook) {
          node.callback = callback;
          node.identity = identity;
          node.fromSettings = fromSettings;

          return;
        }
      }
    }

    this.#insertByOrder(list, { callback, orderIndex, runOnce, initialHook, fromSettings, identity, next: null });
  }

  /**
   * Settles an `add()` that meets an entry standing for the same callback, in place of adding a second one.
   *
   * A forwarding function takes the entry's place when the entry holds the plain callback: the Angular
   * wrapper's zone wrapper must stay the function that runs, whichever of the two was registered first. An
   * `addHook()` registration claims the entry from the settings (see `HookEntry#fromSettings`). And a settings
   * function that meets an entry it does not own as the fixed one leaves no fixed entry of an earlier settings
   * function behind: the settings no longer name that function, so it stops running.
   *
   * @param {string} hookName The name of the hook.
   * @param {object} node The entry standing for the same callback.
   * @param {Function} callback The function being added.
   * @param {object} options The options of the `add()` call.
   */
  #claimDuplicate(
    hookName: string,
    node: HookEntry,
    callback: HookCallback,
    options: { runOnce?: boolean; initialHook?: boolean; fromSettings?: boolean },
  ) {
    if (callback !== node.callback && callback !== node.identity) {
      node.callback = callback;
    }

    const replacesFixedEntry = !!options.initialHook && !!options.fromSettings && !node.initialHook;

    if (node.runOnce && !options.runOnce) {
      node.runOnce = false;
      node.fromSettings = !!options.fromSettings;
      node.initialHook = !!options.initialHook;
    }

    if (!options.fromSettings && !options.runOnce) {
      node.fromSettings = false;
      node.initialHook = false;

      return;
    }

    if (replacesFixedEntry) {
      this.#removeSettingsEntries(hookName, other => other === node || !other.initialHook);
    }
  }

  /**
   * Checks if there are any live hooks for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   * @returns {boolean}
   */
  has(hookName: string): boolean {
    const list = this.#hooks.get(hookName);

    return !!list && list.head !== null;
  }

  /**
   * Removes a hook from the collection (true delete). Returns `true` if the callback was found and removed,
   * `false` otherwise.
   *
   * @param {string} hookName The name of the hook.
   * @param {*} callback The callback function to remove.
   * @returns {boolean}
   */
  remove(hookName: string, callback: HookCallback): boolean {
    const identity = callbackIdentity(callback);

    return this.#removeWhere(hookName, node => node.identity === identity);
  }

  /**
   * Removes every entry of a hook that a settings object registered (true delete): the callback the latest
   * settings passed and the callbacks of every array earlier settings passed beside it. An entry an
   * `addHook()` call registered, or claimed by registering the same callback again, stays. Returns how many
   * entries were removed.
   *
   * The entries go in one pass (`#removeSettingsEntries`), so a run that is in progress skips them.
   *
   * @param {string} hookName The name of the hook.
   * @returns {number}
   */
  removeFromSettings(hookName: string): number {
    return this.#removeSettingsEntries(hookName, () => false);
  }

  /**
   * Makes the entries a settings object registered for a hook exactly `callback`, keeping each entry that
   * stays where it is. A function goes into the fixed settings entry (`initialHook`) in place, so it keeps
   * its position among the `addHook()` listeners, and every other settings entry is removed. For an array,
   * the settings entries whose callback the array names stay, the others are removed, and the callbacks
   * missing from the list are added at the end. An entry an `addHook()` call registered is never touched:
   * when it holds the function the settings pass, it keeps that function and no settings entry is added.
   *
   * Core's own settings path cannot do this: a function there replaces only the fixed entry and an array is
   * added beside the earlier callbacks. The sheets bar needs it to replace one sheet's hooks with the
   * next sheet's.
   *
   * @param {string} hookName The name of the hook.
   * @param {Function|Function[]} callback The callback, or the callbacks, the settings now pass.
   */
  replaceFromSettings(hookName: string, callback: HookCallback | HookCallback[]) {
    if (Array.isArray(callback)) {
      const wanted = new Set<unknown>(callback.map(item => callbackIdentity(item)));

      this.#removeSettingsEntries(hookName, node => wanted.has(node.identity));
      callback.forEach(item => this.add(hookName, item, { fromSettings: true }));

      return;
    }

    let fixed: HookEntry | null = null;

    this.#removeSettingsEntries(hookName, (node) => {
      if (fixed === null && node.initialHook) {
        fixed = node;

        return true;
      }

      return false;
    });

    const keptFixed = fixed as HookEntry | null;
    const claimed = this.getHooks(hookName)
      .some(node => node !== keptFixed && node.identity === callbackIdentity(callback));

    if (keptFixed && !claimed) {
      keptFixed.callback = callback;
      keptFixed.identity = callbackIdentity(callback);

      return;
    }

    if (keptFixed) {
      this.#removeSettingsEntries(hookName, node => node !== keptFixed);
    }

    this.add(hookName, callback, { initialHook: true, fromSettings: true });
  }

  /**
   * Removes the entries of a hook that a settings object registered, except the ones `keep` accepts, in one
   * pass (true delete). Each removed entry is pointed at the next entry that stays (or `null`), so a run
   * that is in progress and holds a removed entry moves on to the entries that stay and skips the other
   * removed ones: an array callback that sets its own hook to `null`, for example.
   *
   * @param {string} hookName The name of the hook.
   * @param {Function} keep The predicate a settings entry has to pass to stay.
   * @returns {number} How many entries were removed.
   */
  #removeSettingsEntries(hookName: string, keep: (node: HookEntry) => boolean): number {
    const list = this.#hooks.get(hookName);

    if (!list) {
      return 0;
    }

    const pending: HookEntry[] = [];
    let removed = 0;
    let survivor: HookEntry | null = null;
    let node = list.head;

    list.head = null;

    while (node !== null) {
      const next: HookEntry | null = node.next;

      if (node.fromSettings && !keep(node)) {
        pending.push(node);
        removed += 1;
      } else {
        if (survivor) {
          survivor.next = node;
        } else {
          list.head = node;
        }

        for (let i = 0; i < pending.length; i += 1) {
          pending[i].next = node;
        }

        pending.length = 0;
        survivor = node;
      }

      node = next;
    }

    for (let i = 0; i < pending.length; i += 1) {
      pending[i].next = null;
    }

    if (survivor) {
      survivor.next = null;
    }

    list.tail = survivor;

    return removed;
  }

  /**
   * Removes the first entry of a hook that the predicate accepts (true delete).
   *
   * @param {string} hookName The name of the hook.
   * @param {Function} matches The predicate an entry has to pass.
   * @returns {boolean}
   */
  #removeWhere(hookName: string, matches: (node: HookEntry) => boolean): boolean {
    const list = this.#hooks.get(hookName);

    if (!list) {
      return false;
    }

    let prev: HookEntry | null = null;
    let node = list.head;

    while (node !== null) {
      if (matches(node)) {
        if (prev) {
          prev.next = node.next;
        } else {
          list.head = node.next;
        }

        if (node === list.tail) {
          list.tail = prev;
        }

        // Intentionally do NOT null `node.next`: an in-flight run() may hold this node and needs to advance.
        return true;
      }

      prev = node;
      node = node.next;
    }

    return false;
  }

  /**
   * Destroys the bucket.
   */
  destroy() {
    this.#hooks.clear();
  }

  /**
   * Inserts an entry keeping the list sorted by ascending `orderIndex`. Entries with an equal `orderIndex`
   * keep insertion order (stable). The common case (`orderIndex` 0, appended after equal entries) is an
   * O(1) tail append.
   *
   * @param {HookList} list The list to insert into.
   * @param {HookEntry} entry The entry to insert.
   */
  #insertByOrder(list: HookList, entry: HookEntry) {
    if (list.head === null) {
      list.head = entry;
      list.tail = entry;

      return;
    }

    if (entry.orderIndex >= list.tail!.orderIndex) {
      list.tail!.next = entry;
      list.tail = entry;

      return;
    }

    let prev: HookEntry | null = null;
    let node: HookEntry | null = list.head;

    while (node !== null && node.orderIndex <= entry.orderIndex) {
      prev = node;
      node = node.next;
    }

    if (prev === null) {
      entry.next = list.head;
      list.head = entry;
    } else {
      entry.next = node;
      prev.next = entry;
    }
  }

  /**
   * Creates an initial (empty) collection for the provided hook name.
   *
   * @param {string} hookName The name of the hook.
   * @returns {HookList}
   */
  #createHooksCollection(hookName: string): HookList {
    const list: HookList = { head: null, tail: null };

    this.#hooks.set(hookName, list);

    return list;
  }
}
