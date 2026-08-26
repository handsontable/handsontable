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
    it('should store the sheet name using the engine\'s casing', async() => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.addSheet('Test Sheet');

      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: hfInstance1,
          // The engine matches names without regard to case, so this points at `Test Sheet`.
          sheetName: 'test sheet',
        },
      });

      expect(getPlugin('formulas').sheetName).toBe('Test Sheet');
    });

    it('should not switch sheets on `updateSettings` when `sheetName` differs only in case', async() => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.addSheet('Test Sheet');

      handsontable({
        data: [['1', '2', '=A1+B1']],
        formulas: {
          engine: hfInstance1,
          sheetName: 'test sheet',
        },
      });

      let switchCount = 0;

      addHook('afterLoadData', (_data, _initialLoad, source) => {
        if (source === 'Formulas.switchSheet') {
          switchCount += 1;
        }
      });

      // Passing the same lowercase name again must not count as a change of sheet.
      await updateSettings({
        formulas: {
          engine: hfInstance1,
          sheetName: 'test sheet',
        },
      });

      // The configured name and the stored name point at the same sheet, so nothing should switch.
      expect(switchCount).toBe(0);
      expect(getPlugin('formulas').sheetName).toBe('Test Sheet');
      expect(getDataAtCell(0, 2)).toBe(3);
    });

    it('should allow switching sheets stored in HF by modifying the `sheetName` property in `updateSettings`', async() => {
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

      await updateSettings({
        formulas: {
          sheetName: 'Test Sheet 2'
        }
      });

      const plugin = getPlugin('formulas');

      expect(plugin.sheetName).toEqual('Test Sheet 2');
      expect(plugin.sheetId).toEqual(hfInstance1.getSheetId(plugin.sheetName));
      expect(getData()).toEqual(hfInstance1.getSheetSerialized(hfInstance1.getSheetId('Test Sheet 2')));
    });

    it('should allow switching sheets stored in HF using the plugin\'s `switchSheet` method', async() => {
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

    it('should allow adding new HF sheets using the plugin\'s `addSheet` method', async() => {
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
