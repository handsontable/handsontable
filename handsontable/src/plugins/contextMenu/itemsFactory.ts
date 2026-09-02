import type { HotInstance } from '../../core/types';
import { objectEach, isObject, extend } from '../../helpers/object';
import { arrayEach } from '../../helpers/array';
import { warnOnce } from '../../helpers/console';
import {
  SEPARATOR,
  ITEMS,
  predefinedItems
} from './predefinedItems';

/**
 * Predefined items class factory for menu items.
 *
 * @private
 * @class ItemsFactory
 */
export class ItemsFactory {
  /**
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * @type {object}
   */
  predefinedItems: Record<string, Record<string, unknown>> = predefinedItems();
  /**
   * @type {Array}
   */
  declare defaultOrderPattern: string[];
  /**
   * Whether `setPredefinedItems()` has already run. Until it has, the registry holds only the
   * built-in items, so a key contributed by a plugin is legitimately still unresolvable.
   *
   * @type {boolean}
   */
  #predefinedItemsSet = false;

  /**
   * Initializes the items factory with a Handsontable instance and an optional default ordering pattern for menu items.
   */
  constructor(hotInstance: HotInstance, orderPattern: string[] | null = null) {
    this.hot = hotInstance;
    this.defaultOrderPattern = orderPattern || [];
  }

  /**
   * Set predefined items.
   *
   * @param {Array} predefinedItemsCollection Array of predefined items.
   */
  setPredefinedItems(predefinedItemsCollection: Record<string, unknown>[] | Record<string, Record<string, unknown>>) {
    const items: Record<string, Record<string, unknown>> = {};

    this.defaultOrderPattern.length = 0;

    objectEach(predefinedItemsCollection, (val: unknown, key: string) => {
      const value = val as Record<string, unknown>;
      let menuItemKey = '';

      if (value.name === SEPARATOR) {
        items[SEPARATOR] = value;
        menuItemKey = SEPARATOR;

        // Menu item added as a property to array
      } else if (isNaN(parseInt(key, 10))) {
        value.key = value.key === undefined ? key : value.key;
        items[key] = value;
        menuItemKey = String(value.key ?? '');

      } else {
        // Object-form `contextMenu.items` keys that name a plugin-provided
        // entry (e.g. `add_child` from nestedRows) are unknown to the registry
        // on the first `getItems` pass, so a bare placeholder is emitted.
        // Plugins later splice their rich entries into the same array via
        // `afterContextMenuDefaultOptions`. Merging preserves both contributions
        // regardless of iteration order: rich properties (callback, submenu,
        // disabled, renderer, name function, etc.) survive when the other side
        // does not define them, and user overrides still take effect via the
        // final `getItems` pass that extends the user pattern onto the predefined
        // entry. See issue #9894.
        const itemKey = String(value.key ?? '');

        if (items[itemKey]) {
          extend(items[itemKey], value);

          return;
        }

        items[itemKey] = value;
        menuItemKey = itemKey;
      }
      this.defaultOrderPattern.push(menuItemKey);
    });
    this.predefinedItems = items;
    this.#predefinedItemsSet = true;
  }

  /**
   * Get all menu items based on pattern.
   *
   * @param {Array|object|boolean} pattern Pattern which you can define by displaying menu items order. If `true` default
   *                                       pattern will be used.
   * @returns {Array}
   */
  getItems(pattern: unknown = null) {
    return getItems(
      pattern,
      this.defaultOrderPattern,
      this.predefinedItems,
      this.#predefinedItemsSet ? (name: string) => this.#warnUnresolvedKey(name) : null
    );
  }

  /**
   * Reports a menu item key that names nothing, once per grid instance per key.
   *
   * @param {string} name The unresolved menu item key.
   */
  #warnUnresolvedKey(name: string) {
    warnOnce(
      this.hot.rootElement,
      `menu-unresolved-item-key:${name}`,
      `Handsontable: the menu item key "${name}" does not match any available menu item, so it ` +
      'was skipped. Check the key for typos, and make sure the plugin that provides it is ' +
      'enabled and contributes items to this menu.'
    );
  }
}

/**
 * @param {object[]} itemsPattern The user defined menu items collection.
 * @param {object[]} defaultPattern The menu default items collection.
 * @param {object} items Additional options.
 * @param {Function|null} reportUnresolvedKey When given, a string key that names no available item
 *                                            is skipped and passed to this callback instead of
 *                                            being turned into a placeholder item.
 * @returns {object[]} Returns parsed and merged menu items collection ready to render.
 */
function getItems(
  itemsPattern: unknown = null,
  defaultPattern: string[] = [],
  items: Record<string, Record<string, unknown>> = {},
  reportUnresolvedKey: ((name: string) => void) | null = null
) {
  const result: Record<string, unknown>[] = [];
  let pattern: unknown = itemsPattern;

  if (pattern && (pattern as Record<string, unknown>).items) {
    pattern = (pattern as Record<string, unknown>).items;

  } else if (!Array.isArray(pattern)) {
    pattern = defaultPattern;
  }
  if (isObject(pattern)) {
    objectEach(pattern as object, (value: unknown, key: string) => {
      let item: Record<string, unknown> = items[typeof value === 'string' ? value : key];

      if (!item) {
        item = value as Record<string, unknown>;
      }
      if (isObject(value)) {
        extend(item, value as Record<string, unknown>);

      } else if (typeof item === 'string') {
        item = { name: item };
      }
      if (item.key === undefined) {
        item.key = key;
      }
      result.push(item);
    });
  } else {
    arrayEach(pattern as string[], (name: string, key: number) => {
      let item: Record<string, unknown> = items[name];

      // An array entry may be a full item definition object instead of a key. It is merged in
      // below, so it must never be treated as an unresolved key.
      if (!item && !isObject(name)) {
        // A predefined item name with no entry in the items map. The `allowInsert*`/`allowRemove*`
        // options do not reach here – they hide their items at render time via `hidden()`.
        if (ITEMS.indexOf(name) >= 0) {
          return;
        }

        // The key names nothing available. Before the default-options hook has run that is
        // expected – plugin entries are still missing and need a placeholder to merge into (see
        // `setPredefinedItems` and issue #9894) – so only the post-hook pass skips them. Emitting
        // a placeholder there is what rendered the raw key string as a dead menu row (issue #5429).
        if (reportUnresolvedKey) {
          reportUnresolvedKey(name);

          return;
        }
      }
      if (!item) {
        item = { name, key: `${key}` };
      }
      if (isObject(name)) {
        extend(item, name as unknown as Record<string, unknown>);
      }
      if (item.key === undefined) {
        item.key = key;
      }
      result.push(item);
    });
  }

  return result;
}
