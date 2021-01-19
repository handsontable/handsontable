import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  BasePlugin,
} from 'handsontable/plugins';

describe('BasePlugin', () => {
  describe(`should collect all missing plugin's dependencies and throw exception before the plugins
            are enabled`, () => {
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
      }).toThrowError(`The BarPlugin plugin requires the following modules:
 - FooPlugin (plugin)

You have to import and register them manually.`);
      expect(hot).toBeUndefined();
    });
  });
});
