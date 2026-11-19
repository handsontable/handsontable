import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  CheckboxHeader,
} from 'handsontable/plugins';

describe('CheckboxHeader', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(CheckboxHeader.PLUGIN_DEPS).toEqual([
        'cell-type:checkbox',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(CheckboxHeader);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowWithCause(`The CheckboxHeader plugin requires the following modules:
 - checkbox (cell-type)

You have to import and register them manually.`, { handsontable: true });
      expect(hot).toBeUndefined();
    });
  });
});
