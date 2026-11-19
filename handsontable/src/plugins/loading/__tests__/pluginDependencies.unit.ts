import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  Loading,
} from 'handsontable/plugins';

describe('Loading', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(Loading.PLUGIN_DEPS).toEqual([
        'plugin:Dialog',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(Loading);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowWithCause(`The Loading plugin requires the following modules:
 - Dialog (plugin)

You have to import and register them manually.`, { handsontable: true });
      expect(hot).toBeUndefined();
    });
  });
});
