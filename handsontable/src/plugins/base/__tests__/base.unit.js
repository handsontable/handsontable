import { defaultMainSettingSymbol } from 'handsontable/plugins/base';
import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  BasePlugin,
} from 'handsontable/plugins';

describe('BasePlugin', () => {
  describe('`getSetting()` method', () => {
    it('should return raw value from the plugin\'s setting when the key setting is not passed', () => {
      class Test1Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }

        isEnabled() {
          return true;
        }
      }

      registerPlugin('Test1Plugin', Test1Plugin);

      const hot = new Handsontable(document.createElement('div'), {
        testPlugin: true
      });
      const plugin = hot.getPlugin('Test1Plugin');

      expect(plugin.getSetting()).toBe(true);

      hot.updateSettings({
        testPlugin: false
      });

      expect(plugin.getSetting()).toBe(false);

      hot.updateSettings({
        testPlugin: {
          foo: true,
          bar: 10,
        }
      });

      expect(plugin.getSetting()).toEqual({
        foo: true,
        bar: 10,
      });
    });

    it('should return a specific plugin\'s option by key and return a default one when the option does not exist', () => {
      class Test2Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }

        static get DEFAULT_SETTINGS() {
          return {
            test1: false,
            test2: 10,
            test3: 0,
            test4: [],
            test5: null,
          };
        }

        isEnabled() {
          return true;
        }
      }

      registerPlugin('Test2Plugin', Test2Plugin);

      const hot = new Handsontable(document.createElement('div'), {
        testPlugin: true
      });
      const plugin = hot.getPlugin('Test2Plugin');

      expect(plugin.getSetting('test1')).toBe(false);
      expect(plugin.getSetting('test2')).toBe(10);
      expect(plugin.getSetting('test3')).toBe(0);
      expect(plugin.getSetting('test4')).toEqual([]);
      expect(plugin.getSetting('test5')).toBe(null);
      expect(plugin.getSetting('test6')).toBe(undefined);

      hot.updateSettings({
        testPlugin: {
          test1: true,
          test2: 20,
          test3: 30,
          test4: [1, 2, 3],
          test5: 'foo',
        }
      });

      expect(plugin.getSetting('test1')).toBe(true);
      expect(plugin.getSetting('test2')).toBe(20);
      expect(plugin.getSetting('test3')).toBe(30);
      expect(plugin.getSetting('test4')).toEqual([1, 2, 3]);
      expect(plugin.getSetting('test5')).toBe('foo');
      expect(plugin.getSetting('test6')).toBe(undefined);
    });

    it('should return the plugin\'s option by the main key defined by the `defaultMainSettingSymbol` symbol', () => {
      class Test3Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }

        static get DEFAULT_SETTINGS() {
          return {
            [defaultMainSettingSymbol]: 'cells',
            cells: [],
          };
        }

        isEnabled() {
          return true;
        }
      }

      registerPlugin('Test3Plugin', Test3Plugin);

      const hot = new Handsontable(document.createElement('div'), {
        testPlugin: true
      });
      const plugin = hot.getPlugin('Test3Plugin');

      expect(plugin.getSetting('cells')).toEqual([]);

      hot.updateSettings({
        testPlugin: [1, 2, 3],
      });

      expect(plugin.getSetting('cells')).toEqual([1, 2, 3]);

      hot.updateSettings({
        testPlugin: {
          cells: [3, 4, 5]
        },
      });

      expect(plugin.getSetting('cells')).toEqual([3, 4, 5]);
    });
  });

  describe('`updatePluginSettings()` method', () => {
    it('should update the plugin settings', () => {
      class Test4Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }
      }

      registerPlugin('Test4Plugin', Test4Plugin);

      const hot = new Handsontable(document.createElement('div'), {
        testPlugin: {
          test1: true,
          test2: 20,
          test3: 30,
          test4: [1, 2, 3],
          test5: 'foo',
        }
      });
      const plugin = hot.getPlugin('Test4Plugin');

      expect(plugin.getSetting('test1')).toBe(true);
      expect(plugin.getSetting('test2')).toBe(20);
      expect(plugin.getSetting('test3')).toBe(30);
      expect(plugin.getSetting('test4')).toEqual([1, 2, 3]);
      expect(plugin.getSetting('test5')).toBe('foo');

      plugin.updatePluginSettings({
        test1: false,
        test2: 10,
        test3: 0,
        test4: [],
        test5: undefined,
      });

      expect(plugin.getSetting('test1')).toBe(false);
      expect(plugin.getSetting('test2')).toBe(10);
      expect(plugin.getSetting('test3')).toBe(0);
      expect(plugin.getSetting('test4')).toEqual([]);
      expect(plugin.getSetting('test5')).toBe(undefined);
    });

    it('should update the plugin settings with the default settings', () => {
      class Test5Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }

        static get DEFAULT_SETTINGS() {
          return {
            test1: true,
          };
        }
      }

      registerPlugin('Test5Plugin', Test5Plugin);

      const hot = new Handsontable(document.createElement('div'), {});
      const plugin = hot.getPlugin('Test5Plugin');

      expect(plugin.getSetting('test1')).toBe(true);

      plugin.updatePluginSettings({
        test1: false,
      });

      expect(plugin.getSetting('test1')).toBe(false);
    });

    it('should update the plugin settings with validator function when option object is passed', () => {
      class Test6Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }

        static get SETTINGS_VALIDATORS() {
          return {
            test1: value => typeof value === 'string',
          };
        }
      }

      registerPlugin('Test6Plugin', Test6Plugin);

      const hot = new Handsontable(document.createElement('div'), {
        testPlugin: {
          test1: 'test',
        },
      });
      const plugin = hot.getPlugin('Test6Plugin');

      expect(plugin.getSetting('test1')).toBe('test');

      plugin.updatePluginSettings({
        test1: 'foo',
      });

      expect(plugin.getSetting('test1')).toBe('foo');

      plugin.updatePluginSettings({
        test1: 1,
      });

      expect(plugin.getSetting('test1')).toBe('foo');
    });

    it('should update the plugin settings with validator function when single option is passed', () => {
      class Test7Plugin extends BasePlugin {
        static get PLUGIN_KEY() {
          return 'testPlugin';
        }

        static get SETTINGS_VALIDATORS() {
          return value => typeof value === 'string';
        }
      }

      registerPlugin('Test7Plugin', Test7Plugin);

      const hot = new Handsontable(document.createElement('div'), {
        testPlugin: 'test',
      });
      const plugin = hot.getPlugin('Test7Plugin');

      expect(plugin.getSetting()).toBe('test');

      plugin.updatePluginSettings(3);

      expect(plugin.getSetting()).toBe('test');
    });
  });

  it('should throw an error when the dependencies are missing', () => {
    class SomePlugin extends BasePlugin {}
    class BarPlugin extends BasePlugin {
      static get PLUGIN_DEPS() {
        return [
          'plugin:FooPlugin',
        ];
      }

      isEnabled() {
        return true;
      }

      enablePlugin() {
        this.hot.getPlugin('FooPlugin').test();
      }
    }

    registerPlugin('BarPlugin', BarPlugin);
    registerPlugin('SomePlugin', SomePlugin);

    let hot;

    expect(() => {
      hot = new Handsontable(document.createElement('div'), {});
    }).toThrowWithCause(`The BarPlugin plugin requires the following modules:
 - FooPlugin (plugin)

You have to import and register them manually.`, { handsontable: true });
    expect(hot).toBeUndefined();
  });
});
