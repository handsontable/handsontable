import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  ContextMenu,
} from 'handsontable/plugins';

describe('ContextMenu', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(ContextMenu.PLUGIN_DEPS).toEqual([
        'plugin:AutoColumnSize',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(ContextMenu);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowWithCause(`The ContextMenu plugin requires the following modules:
 - AutoColumnSize (plugin)

You have to import and register them manually.`, { handsontable: true });
      expect(hot).toBeUndefined();
    });
  });
});
