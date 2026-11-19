import type { HookCallback } from '../../core/hooks/bucket';
import type { HotInstance } from '../../core/types';
import { arrayEach } from '../../helpers/array';
import { objectEach } from '../../helpers/object';
import { SEPARATOR } from './predefinedItems';

export type MenuName = 'contextMenu' | 'dropdownMenu';

export interface MenuEntriesPlacement {
  /**
   * Whether the entries join the menu's default item list, the one shown when the menu option is
   * `true`. With `false`, an entry reaches the menu only when the menu option lists its key, in the
   * array form or the object form, and nothing is added otherwise. Defaults to `true`.
   */
  inDefaults?: boolean;
  /**
   * Order index of the hook callback that adds the entries. See `BasePlugin#addHook`.
   */
  orderIndex?: number;
}

export type MenuEntriesTargets = Partial<Record<MenuName, MenuEntriesPlacement>>;

interface HookOwner {
  hot: HotInstance;
  addHook(name: string, callback: HookCallback, orderIndex?: number): void;
}

/**
 * Returns the hook through which the given menu collects its plugin entries.
 *
 * @param {string} menuName The menu name, `contextMenu` or `dropdownMenu`.
 * @returns {string}
 */
function getDefaultOptionsHookName(menuName: MenuName) {
  return menuName === 'contextMenu' ? 'afterContextMenuDefaultOptions' : 'afterDropdownMenuDefaultOptions';
}

/**
 * Returns the item keys a menu option lists, read the way `ItemsFactory#getItems()` reads the option:
 * the `items` of an object, then an array of keys or item objects, or an object keyed by item key,
 * where a string value names an item key too.
 * The `true` option, and any value that falls back to the default list, lists nothing.
 *
 * @param {*} setting The value of the `contextMenu` or `dropdownMenu` option.
 * @returns {Set<string>}
 */
function getListedKeys(setting: unknown) {
  const keys = new Set<string>();
  const pattern = typeof setting === 'object' && setting !== null && 'items' in setting && setting.items
    ? setting.items
    : setting;

  if (Array.isArray(pattern)) {
    arrayEach(pattern, (entry: unknown) => {
      if (typeof entry === 'string') {
        keys.add(entry);

      } else if (typeof entry === 'object' && entry !== null && 'key' in entry && typeof entry.key === 'string') {
        keys.add(entry.key);
      }
    });

  } else if (typeof pattern === 'object' && pattern !== null && pattern !== setting) {
    objectEach(pattern, (value: unknown, key: string) => {
      keys.add(key);

      if (typeof value === 'string') {
        keys.add(value);
      }
    });
  }

  return keys;
}

/**
 * Registers a plugin's menu entries in the context menu, the dropdown menu, or both, from one
 * definition. Each targeted menu calls `createEntries` on every build of its items, so `createEntries`
 * must return new objects on every call. Entries that join the default list are preceded by a
 * separator. An empty list adds nothing, the separator included.
 *
 * Call it from `enablePlugin()`. The hooks go through the plugin's `addHook()`, so disabling the
 * plugin removes the entries from both menus.
 *
 * @param {BasePlugin} plugin The plugin that owns the entries.
 * @param {Function} createEntries Returns new menu entries, each with its `key`.
 * @param {object} targets The menus to add the entries to, keyed by menu name, each with its placement.
 */
export function registerMenuEntries(
  plugin: HookOwner,
  createEntries: () => Array<{ key: string }>,
  targets: MenuEntriesTargets,
) {
  arrayEach(['contextMenu', 'dropdownMenu'], (menuName: MenuName) => {
    const placement = targets[menuName];

    if (!placement) {
      return;
    }

    const { inDefaults = true, orderIndex } = placement;
    const onDefaultOptions = (options: { items: unknown[] }) => {
      if (inDefaults) {
        const entries = createEntries();

        if (entries.length > 0) {
          options.items.push({ name: SEPARATOR }, ...entries);
        }

        return;
      }

      const listedKeys = getListedKeys(plugin.hot.getSettings()[menuName]);

      if (listedKeys.size === 0) {
        return;
      }

      arrayEach(createEntries(), (entry) => {
        if (listedKeys.has(entry.key)) {
          options.items.push(entry);
        }
      });
    };

    plugin.addHook(getDefaultOptionsHookName(menuName), onDefaultOptions, orderIndex);
  });
}
