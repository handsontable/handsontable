import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  DropdownMenu,
} from 'handsontable/plugins';

describe('DropdownMenu', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(DropdownMenu.PLUGIN_DEPS).toEqual([
        'plugin:AutoColumnSize',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(DropdownMenu);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowError(`The DropdownMenu plugin requires the following modules:
 - AutoColumnSize (plugin)

You have to import and register them manually.`);
      expect(hot).toBeUndefined();
    });
  });
});
