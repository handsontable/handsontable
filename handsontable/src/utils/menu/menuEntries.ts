import type { HookCallback } from '../../core/hooks/bucket';
import { arrayEach } from '../../helpers/array';
import { SEPARATOR } from './predefinedItems';

export type MenuName = 'contextMenu' | 'dropdownMenu';

export interface MenuEntriesPlacement {
  /**
   * Whether the entries join the menu's default item list, the one shown when the menu option is
   * `true`. With `false`, the entries are available only to a menu configuration that lists their
   * keys. Defaults to `true`.
   */
  inDefaults?: boolean;
  /**
   * Order index of the hook callback that adds the entries. See `BasePlugin#addHook`.
   */
  orderIndex?: number;
}

export type MenuEntriesTargets = Partial<Record<MenuName, MenuEntriesPlacement>>;

interface HookOwner {
  addHook(name: string, callback: HookCallback, orderIndex?: number): void;
}

/**
 * The keys of the entries a menu build received without joining the menu's default item list, keyed
 * by the options object that build hands to its default-options hook. The keys are recorded per
 * build, not on the entry objects, so a hook listener that copies `options.items` cannot move an
 * entry into the defaults, and the two menus never share a record.
 */
const keysOutsideDefaults = new WeakMap<object, Set<string>>();

/**
 * An empty record, returned for a build that received no entries outside its defaults.
 */
const NO_KEYS: ReadonlySet<string> = new Set();

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
 * Records the keys of entries that a menu build receives outside its defaults.
 *
 * @param {object} options The options object of the menu build.
 * @param {object[]} entries The entries added outside the defaults.
 */
function recordKeysOutsideDefaults(options: object, entries: Array<{ key: string }>) {
  let keys = keysOutsideDefaults.get(options);

  if (!keys) {
    keys = new Set();
    keysOutsideDefaults.set(options, keys);
  }

  arrayEach(entries, entry => keys.add(entry.key));
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
      const entries = createEntries();

      if (entries.length === 0) {
        return;
      }

      if (inDefaults) {
        options.items.push({ name: SEPARATOR }, ...entries);

        return;
      }

      recordKeysOutsideDefaults(options, entries);
      options.items.push(...entries);
    };

    plugin.addHook(getDefaultOptionsHookName(menuName), onDefaultOptions, orderIndex);
  });
}

/**
 * Returns the keys of the entries a menu build received outside its default item list.
 *
 * @param {object} options The options object the menu build handed to its default-options hook.
 * @returns {Set<string>}
 */
export function getKeysOutsideMenuDefaults(options: object): ReadonlySet<string> {
  return keysOutsideDefaults.get(options) ?? NO_KEYS;
}
