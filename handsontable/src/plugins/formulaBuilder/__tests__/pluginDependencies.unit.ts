import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  FormulaBuilder,
} from 'handsontable/plugins';

describe('FormulaBuilder', () => {
  describe('plugins dependencies', () => {
    it('should have defined list of dependencies', () => {
      expect(FormulaBuilder.PLUGIN_DEPS).toEqual([
        'plugin:Formulas',
      ]);
    });

    it('should throw an error about the missing dependencies', () => {
      registerPlugin(FormulaBuilder);

      let hot;

      expect(() => {
        hot = new Handsontable(document.createElement('div'), {});
      }).toThrowWithCause(`The FormulaBuilder plugin requires the following modules:
 - Formulas (plugin)

You have to import and register them manually.`, { handsontable: true });
      expect(hot).toBeUndefined();
    });
  });
});
