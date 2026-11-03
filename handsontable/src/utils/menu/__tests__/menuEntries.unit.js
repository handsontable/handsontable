import { ItemsFactory } from 'handsontable/utils/menu/itemsFactory';
import { registerMenuEntries } from 'handsontable/utils/menu/menuEntries';
import { SEPARATOR } from 'handsontable/utils/menu/predefinedItems';

/**
 * Records every hook a plugin registers, so a test can run the callbacks the way a menu does, and
 * answers `hot.getSettings()` with the given menu options.
 *
 * @param {object} [settings] The `contextMenu` and `dropdownMenu` option values.
 * @returns {object} A plugin stand-in with the registered hooks under `hooks`.
 */
function pluginMock(settings = {}) {
  const hooks = [];

  return {
    hooks,
    settings,
    hot: {
      getSettings: () => settings,
    },
    addHook(name, callback, orderIndex) {
      hooks.push({ name, callback, orderIndex });
    },
  };
}

/**
 * Runs the hooks a plugin registered under the given name on a fresh options object, then the
 * listeners an application added after them.
 *
 * @param {object} plugin The plugin stand-in.
 * @param {string} hookName The hook to run.
 * @param {object[]} [items] The items the menu hands to the hook.
 * @param {Function[]} [appListeners] Listeners that run after the plugin's.
 * @returns {object} The options object after every listener ran.
 */
function runHook(plugin, hookName, items = [], appListeners = []) {
  const options = { items };

  plugin.hooks.filter(hook => hook.name === hookName).forEach(hook => hook.callback(options));
  appListeners.forEach(listener => listener(options));

  return options;
}

/**
 * Builds a menu item the way a plugin's item factory does.
 *
 * @param {string} key The item key.
 * @returns {object}
 */
function entry(key) {
  return { key, name: () => `label of ${key}` };
}

/**
 * Builds a menu's item list the way `ContextMenu` and `DropdownMenu` do: first pass, hook, second pass.
 *
 * @param {object} plugin The plugin stand-in whose hooks contribute entries.
 * @param {string} menuName `contextMenu` or `dropdownMenu`.
 * @param {*} setting The menu option value, also set on the plugin stand-in.
 * @param {string[]} defaultItems The menu's built-in default keys.
 * @param {Function[]} [appListeners] Listeners that run after the plugin's.
 * @returns {string[]} The keys of the built items, with separators reported as `SEPARATOR`.
 */
function buildMenu(plugin, menuName, setting, defaultItems, appListeners = []) {
  const hookName = menuName === 'contextMenu' ? 'afterContextMenuDefaultOptions' : 'afterDropdownMenuDefaultOptions';
  const factory = new ItemsFactory({ rootElement: {} }, defaultItems.slice(), menuName);

  plugin.settings[menuName] = setting;

  const options = runHook(plugin, hookName, factory.getItems(setting), appListeners);

  factory.setPredefinedItems(options.items);

  return factory.getItems(setting).map(item => (item.name === SEPARATOR ? SEPARATOR : item.key));
}

describe('utils/menu/registerMenuEntries', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('hook registration', () => {
    it('registers on the hook of every targeted menu', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { contextMenu: {}, dropdownMenu: {} });

      expect(plugin.hooks.map(hook => hook.name)).toEqual([
        'afterContextMenuDefaultOptions',
        'afterDropdownMenuDefaultOptions',
      ]);
    });

    it('registers nothing for a menu that is not targeted', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: {} });

      expect(plugin.hooks.map(hook => hook.name)).toEqual(['afterDropdownMenuDefaultOptions']);
    });

    it('passes the order index of each menu to its own hook only', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { contextMenu: {}, dropdownMenu: { orderIndex: 1 } });

      expect(plugin.hooks.map(hook => hook.orderIndex)).toEqual([undefined, 1]);
    });

    it('creates new entry objects for every build of the same menu', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: {} });

      const firstBuild = runHook(plugin, 'afterDropdownMenuDefaultOptions').items;
      const secondBuild = runHook(plugin, 'afterDropdownMenuDefaultOptions').items;

      expect(firstBuild[1]).not.toBe(secondBuild[1]);
    });

    it('creates new entry objects for each menu', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { contextMenu: {}, dropdownMenu: {} });

      const fromContextMenu = runHook(plugin, 'afterContextMenuDefaultOptions').items;
      const fromDropdownMenu = runHook(plugin, 'afterDropdownMenuDefaultOptions').items;

      expect(fromContextMenu[1]).not.toBe(fromDropdownMenu[1]);
    });
  });

  describe('a build with no entries', () => {
    it('adds nothing to the defaults, the separator included', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [], { contextMenu: {} });

      expect(runHook(plugin, 'afterContextMenuDefaultOptions', [entry('built_in')]).items.map(item => item.key))
        .toEqual(['built_in']);
    });
  });

  describe('entries that join the defaults', () => {
    it('appends a separator and the entries after the items already there', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a'), entry('b')], { contextMenu: {} });

      const { items } = runHook(plugin, 'afterContextMenuDefaultOptions', [entry('built_in')]);

      expect(items.map(item => item.key ?? item.name)).toEqual(['built_in', SEPARATOR, 'a', 'b']);
    });

    it('shows them in the menu built from the `true` option', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: {} });

      expect(buildMenu(plugin, 'dropdownMenu', true, ['col_left'])).toEqual(['col_left', SEPARATOR, 'a']);
    });
  });

  describe('entries kept outside the defaults', () => {
    it('adds nothing to the hook items under the `true` option', () => {
      const plugin = pluginMock({ dropdownMenu: true });

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(runHook(plugin, 'afterDropdownMenuDefaultOptions', [entry('built_in')]).items.map(item => item.key))
        .toEqual(['built_in']);
    });

    it('leaves the menu built from the `true` option unchanged', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', true, ['col_left', 'col_right'])).toEqual(['col_left', 'col_right']);
    });

    it('keeps an application item with the same key in the `true` list', () => {
      const plugin = pluginMock();
      const addAppItem = (options) => {
        options.items.push({ key: 'a', name: 'Application item' });
      };

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', true, ['col_left'], [addAppItem])).toEqual(['col_left', 'a']);
    });

    it('stays out of the `true` list when a later listener replaces the items with copies', () => {
      const plugin = pluginMock();
      const copyItems = (options) => {
        options.items = options.items.map(item => ({ ...item }));
      };

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', true, ['col_left'], [copyItems])).toEqual(['col_left']);
    });

    it('resolves the key when the array form lists it', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', ['col_left', 'a'], ['col_left'])).toEqual(['col_left', 'a']);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('resolves the key when the array form lists it as an item object', () => {
      const plugin = pluginMock({ dropdownMenu: [{ key: 'a', name: 'Custom' }] });

      registerMenuEntries(plugin, () => [entry('a'), entry('b')], { dropdownMenu: { inDefaults: false } });

      expect(runHook(plugin, 'afterDropdownMenuDefaultOptions').items.map(item => item.key)).toEqual(['a']);
    });

    it('resolves the key when the object form lists it', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', { items: { a: {} } }, ['col_left'])).toEqual(['a']);
    });

    it('resolves the key when the object form lists it as the value of another key', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', { items: { alias: 'a' } }, ['col_left'])).toEqual(['a']);
    });

    it('adds only the entries whose keys the option lists', () => {
      const plugin = pluginMock({ dropdownMenu: ['col_left', 'b'] });

      registerMenuEntries(plugin, () => [entry('a'), entry('b')], { dropdownMenu: { inDefaults: false } });

      expect(runHook(plugin, 'afterDropdownMenuDefaultOptions').items.map(item => item.key)).toEqual(['b']);
    });

    it('adds nothing for an object option without `items`', () => {
      const plugin = pluginMock({ dropdownMenu: { callback() {} } });

      registerMenuEntries(plugin, () => [entry('a')], { dropdownMenu: { inDefaults: false } });

      expect(runHook(plugin, 'afterDropdownMenuDefaultOptions').items).toEqual([]);
    });

    it('keeps the other menu showing the entries in its defaults', () => {
      const plugin = pluginMock();

      registerMenuEntries(plugin, () => [entry('a')], { contextMenu: {}, dropdownMenu: { inDefaults: false } });

      expect(buildMenu(plugin, 'dropdownMenu', true, ['col_left'])).toEqual(['col_left']);
      expect(buildMenu(plugin, 'contextMenu', true, ['row_above'])).toEqual(['row_above', SEPARATOR, 'a']);
    });
  });
});
