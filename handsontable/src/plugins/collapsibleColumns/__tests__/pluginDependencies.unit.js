import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  CollapsibleColumns,
} from 'handsontable/plugins';

describe('CollapsibleColumns', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(CollapsibleColumns.PLUGIN_DEPS).toEqual([
        'plugin:NestedHeaders',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(CollapsibleColumns);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowError(`The CollapsibleColumns plugin requires the following modules:
 - NestedHeaders (plugin)

You have to import and register them manually.`);
      expect(hot).toBeUndefined();
    });
  });
});
