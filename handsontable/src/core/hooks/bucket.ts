import { REGISTERED_HOOKS } from './constants';

export type HookCallback = (...args: unknown[]) => unknown;

export interface HookEntry {
  callback: HookCallback;
  orderIndex: number;
  runOnce: boolean;
  initialHook: boolean;
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
   * @param {{ orderIndex?: number, runOnce?: boolean, initialHook?: boolean }} options The options object.
   */
  add(
    hookName: string,
    callback: HookCallback,
    options: { orderIndex?: number; runOnce?: boolean; initialHook?: boolean } = {}
  ) {
    let list = this.#hooks.get(hookName);

    if (!list) {
      list = this.#createHooksCollection(hookName);
      REGISTERED_HOOKS.push(hookName);
    }

    // Adding the same callback twice is silently ignored. With true-delete a match is always a live entry.
    for (let node = list.head; node !== null; node = node.next) {
      if (node.callback === callback) {
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

          return;
        }
      }
    }

    this.#insertByOrder(list, { callback, orderIndex, runOnce, initialHook, next: null });
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
    const list = this.#hooks.get(hookName);

    if (!list) {
      return false;
    }

    let prev: HookEntry | null = null;
    let node = list.head;

    while (node !== null) {
      if (node.callback === callback) {
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
