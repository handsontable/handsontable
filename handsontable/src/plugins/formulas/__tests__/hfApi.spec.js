import HyperFormula from 'hyperformula';

describe('Formulas general', () => {
  const debug = false;

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (debug) {
      return;
    }

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Sheet switching', () => {
    it('should allow switching sheets stored in HF by modifying the `sheetName` property in `updateSettings`', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.addSheet('Test Sheet');
      hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet'), [[1, 2, 3], [4, 5, 6]]);
      hfInstance1.addSheet('Test Sheet 2');
      hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet 2'), [[12, 22, 32], [42, 52, 62]]);

      handsontable({
        data: [['foo']],
        formulas: {
          engine: hfInstance1,
          sheetName: 'Test Sheet'
        },
      });

      updateSettings({
        formulas: {
          sheetName: 'Test Sheet 2'
        }
      });

      const plugin = getPlugin('formulas');

      expect(plugin.sheetName).toEqual('Test Sheet 2');
      expect(plugin.sheetId).toEqual(hfInstance1.getSheetId(plugin.sheetName));
      expect(getData()).toEqual(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet 2')));
    });

    it('should allow switching sheets stored in HF using the plugin\'s `switchSheet` method', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.addSheet('Test Sheet');
      hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet'), [[1, 2, 3], [4, 5, 6]]);
      hfInstance1.addSheet('Test Sheet 2');
      hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet 2'), [[12, 22, 32], [42, 52, 62]]);

      handsontable({
        data: [['foo']],
        formulas: {
          engine: hfInstance1,
          sheetName: 'Test Sheet'
        },
      });

      const plugin = getPlugin('formulas');

      plugin.switchSheet('Test Sheet 2');

      expect(plugin.sheetName).toEqual('Test Sheet 2');
      expect(plugin.sheetId).toEqual(hfInstance1.getSheetId(plugin.sheetName));
      expect(getData()).toEqual(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet 2')));
    });

    it('should allow adding new HF sheets using the plugin\'s `addSheet` method', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.addSheet('Test Sheet');
      hfInstance1.setSheetContent(hfInstance1.getSheetId('Test Sheet'), [[1, 2, 3], [4, 5, 6]]);

      handsontable({
        data: [['foo']],
        formulas: {
          engine: hfInstance1,
          sheetName: 'Test Sheet'
        },
      });

      const plugin = getPlugin('formulas');

      plugin.addSheet('Test Sheet 2', [[1, 2, 3]]);

      expect(hfInstance1.doesSheetExist('Test Sheet 2')).toBe(true);
      expect(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet 2'))).toEqual([[1, 2, 3]]);
    });
  });
});
