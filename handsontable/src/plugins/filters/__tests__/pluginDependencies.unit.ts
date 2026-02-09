import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  Filters,
} from 'handsontable/plugins';

describe('Filters', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(Filters.PLUGIN_DEPS).toEqual([
        'plugin:DropdownMenu',
        'plugin:HiddenRows',
        'cell-type:checkbox',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(Filters);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowError(`The Filters plugin requires the following modules:
 - DropdownMenu (plugin)
 - HiddenRows (plugin)
 - checkbox (cell-type)

You have to import and register them manually.`);
      expect(hot).toBeUndefined();
    });
  });
});
