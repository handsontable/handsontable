/* eslint-disable no-unused-vars */
import HyperFormula from 'hyperformula';

describe('Formulas general', () => {
  const debug = false;
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
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

  describe('Altering table should fire callback', () => {
    it('should trigger beforeCreateCol and afterCreateCol hook with proper arguments while inserting column', () => {
      const spyAfter = jasmine.createSpy('after');
      const spyBefore = jasmine.createSpy('before');
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        beforeCreateCol: spyBefore,
        afterCreateCol: spyAfter,
      });

      hot.alter('insert_col', 1, 2, 'customSource');
      expect(spyBefore).toHaveBeenCalledWith(1, 2, 'customSource', undefined, undefined, undefined);
      expect(spyAfter).toHaveBeenCalledWith(1, 2, 'customSource', undefined, undefined, undefined);
    });

    it('should trigger beforeCreateRow and afterCreateRow hook with proper arguments while inserting row', () => {
      const spyAfter = jasmine.createSpy('after');
      const spyBefore = jasmine.createSpy('before');
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        beforeCreateRow: spyBefore,
        afterCreateRow: spyAfter,
      });

      hot.alter('insert_row', 1, 2, 'customSource');
      expect(spyBefore).toHaveBeenCalledWith(1, 2, 'customSource', undefined, undefined, undefined);
      expect(spyAfter).toHaveBeenCalledWith(1, 2, 'customSource', undefined, undefined, undefined);
    });

    it('should trigger beforeRemoveRow and afterRemoveRow hook with proper arguments while removing row', () => {
      const spyAfter = jasmine.createSpy('after');
      const spyBefore = jasmine.createSpy('before');
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        beforeRemoveRow: spyBefore,
        afterRemoveRow: spyAfter,
      });

      hot.alter('remove_row', 1, 3);
      expect(spyBefore).toHaveBeenCalledWith(1, 3, [1, 2, 3], undefined, undefined, undefined);
      expect(spyAfter).toHaveBeenCalledWith(1, 3, [1, 2, 3], undefined, undefined, undefined);
    });

    it('should trigger beforeRemoveCol and afterRemoveCol hook while removing column', () => {
      const spyAfter = jasmine.createSpy('after');
      const spyBefore = jasmine.createSpy('before');
      const hot = handsontable({
        data: getDataSimpleExampleFormulas(),
        formulas: {
          engine: HyperFormula
        },
        beforeRemoveCol: spyBefore,
        afterRemoveCol: spyAfter,
      });

      hot.alter('remove_col', 1, 3);
      expect(spyBefore).toHaveBeenCalledWith(1, 3, [1, 2, 3], undefined, undefined, undefined);
      expect(spyAfter).toHaveBeenCalledWith(1, 3, [1, 2, 3], undefined, undefined, undefined);
    });
  });

  describe('Public API', () => {
    xit('method getCellData should return getCellValue', () => {
      const hfInstance1 = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance1.addSheet('Test Sheet');
      hfInstance1.setSheetContent('Test Sheet', [
        [1, 2, 3],
        [4, 5, 6]
      ]);
      const hot = handsontable({
        data: [
          ['foo']
        ],
        formulas: {
          engine: hfInstance1,
          sheetName: 'Test Sheet'
        }
      });
      const plugin = getPlugin('formulas');

      expect(hot.getDataAtCell(0, 1)).toEqual(
        hfInstance1.getSheetId('Test Sheet').getCellValue(0, 1));
    });

    xit('method getCellSourceData should return getCellFormula', () => {
      const hfInstance = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      hfInstance.addSheet('Test');
      hfInstance.setSheetContent('Test', [
        [1, 2, 3],
        [4, 5, 6]
      ]);
      const hot = handsontable({
        data: [
          ['foo']
        ],
        formulas: {
          engine: hfInstance,
          sheetName: 'Test'
        },
        licenseKey: 'non-commercial-and-evaluation'
      });
      const plugin = getPlugin('formulas');

      expect(hot.getSourceData(0, 1)).toEqual(
        hfInstance.getSheetSerialized(hfInstance.getSheetId('Test').hfInstance.getCellFormula(0, 1)));
    });
  });
});
