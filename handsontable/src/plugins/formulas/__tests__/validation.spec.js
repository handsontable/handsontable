import HyperFormula from 'hyperformula';

describe('Formulas general', () => {
  const debug = false;

  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.$container2 = $('<div id="testContainer-2"></div>').appendTo('body');
  });

  afterEach(function() {
    if (debug) {
      return;
    }

    if (this.$container) {
      try {
        if (this.$container.handsontable('getInstance')) {
          destroy();
        }
      } catch (e) {
        // In some of the test cases we're manually destroying the Handsontable instances, so 'getInstance' may
        // throw a post-mortem error.
        if (!e.message.includes('instance has been destroyed')) {
          throw e;
        }
      }

      this.$container.remove();
    }

    if (this.$container2) {
      try {
        if (this.$container2.handsontable('getInstance')) {
          this.$container2.handsontable('getInstance').destroy();
        }
      } catch (e) {
        // In some of the test cases we're manually destroying the Handsontable instances, so 'getInstance' may
        // throw a post-mortem error.
        if (!e.message.includes('instance has been destroyed')) {
          throw e;
        }
      }
      this.$container2.remove();
    }
  });

  describe('cooperation with validation', () => {
    it('should validate result of formula properly (opening and closing an editor)', async() => {
      const hot = handsontable({
        data: [
          ['=B1+5', 2, '=D1', 'text']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric',
      });

      selectCell(0, 0);
      // Opening an editor
      keyDownUp('enter');
      // Closing the editor and saving changes.
      keyDownUp('enter');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);

      selectCell(0, 2);
      // Opening an editor
      keyDownUp('enter');
      // Closing the editor and saving changes.
      keyDownUp('enter');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
    });

    it('should validate result of formula for dependant cells properly (formula returns text)', async() => {
      const beforeValidate = jasmine.createSpy('beforeValidate');

      handsontable({
        data: [
          [0, '=A1', '=B1', '=C1']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric',
        beforeValidate,
      });

      setDataAtCell(0, 0, 'text');

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).toHaveBeenCalledWith('text', 0, 0);
      expect(beforeValidate).toHaveBeenCalledWith('text', 0, 1);
      expect(beforeValidate).toHaveBeenCalledWith('text', 0, 2);
      expect(beforeValidate).toHaveBeenCalledWith('text', 0, 3);
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 1)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(true);
    });

    it('should validate result of formula and dependant cells properly (formula returns error)', async() => {
      const beforeValidate = jasmine.createSpy('beforeValidate');

      handsontable({
        data: [
          ['=B1+5', 2, '=A1', '=C1']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric',
        beforeValidate,
      });

      setDataAtCell(0, 0, '=B1+5a');

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).toHaveBeenCalledWith('#ERROR!', 0, 0);
      expect(beforeValidate).toHaveBeenCalledWith('#ERROR!', 0, 2);
      expect(beforeValidate).toHaveBeenCalledWith('#ERROR!', 0, 3);
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(true);

      setDataAtCell(0, 0, '=B1+5');

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).toHaveBeenCalledWith(7, 0, 0);
      expect(beforeValidate).toHaveBeenCalledWith(7, 0, 2);
      expect(beforeValidate).toHaveBeenCalledWith(7, 0, 3);
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(false);
    });

    it('should validate result of formula and dependant cells properly (formula create circular dependency)', async() => {
      const beforeValidate = jasmine.createSpy('beforeValidate');

      handsontable({
        data: [
          ['=B1+5', 2, '=A1', '=C1']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric',
        beforeValidate,
      });

      setDataAtCell(0, 0, '=C1');

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).toHaveBeenCalledWith('#CYCLE!', 0, 0);
      expect(beforeValidate).toHaveBeenCalledWith('#CYCLE!', 0, 2);
      expect(beforeValidate).toHaveBeenCalledWith('#CYCLE!', 0, 3);
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(true);

      setDataAtCell(0, 0, '=B1+5');

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).toHaveBeenCalledWith(7, 0, 0);
      expect(beforeValidate).toHaveBeenCalledWith(7, 0, 2);
      expect(beforeValidate).toHaveBeenCalledWith(7, 0, 3);
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(false);
    });

    it('should validate result of formula and dependant cells properly (formula create #REF! error)', async() => {
      const beforeValidate = jasmine.createSpy('beforeValidate');

      handsontable({
        data: [
          ['=E1', 2, '=A1', '=C1', 22]
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric',
        beforeValidate,
      });

      alter('remove_col', 4);

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).not.toHaveBeenCalled();
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(false);

      await new Promise(resolve => validateCells(resolve));

      expect(beforeValidate).toHaveBeenCalledWith('#REF!', 0, 0, 'validateCells');
      expect(beforeValidate).toHaveBeenCalledWith('#REF!', 0, 2, 'validateCells');
      expect(beforeValidate).toHaveBeenCalledWith('#REF!', 0, 3, 'validateCells');
      expect($(getCell(0, 0)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(getSettings().invalidCellClassName)).toBe(true);
    });

    it('should not automatically validate changes when the engine is modified from the outside code', async() => {
      const hot = handsontable({
        data: [
          ['=E1', 'text', '=A1', '=C1', 22]
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric'
      });

      hot.getPlugin('formulas').engine.setCellContents({ sheet: 0, row: 0, col: 0 }, '=B1');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);

      await new Promise(resolve => hot.validateCells(resolve));

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
    });

    it('should change the value type passed to the validator only when it is a formula', async() => {
      const afterValidate = jasmine.createSpy('afterValidate');
      const hot = handsontable({
        data: [
          ['=E1', 'text', '=A1', '=C1', 22, '23', '\'=A1', '12/1/2016']
        ],
        formulas: {
          engine: HyperFormula
        },
        validator: (value, callback) => callback(typeof value === 'number'),
        afterValidate,
      });

      await new Promise(resolve => hot.validateCells(resolve));

      expect(afterValidate).toHaveBeenCalledTimes(8);
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 0, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(false, 'text', 0, 1, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 2, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 3, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 4, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(false, '23', 0, 5, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(false, '=A1', 0, 6, 'validateCells');
      expect(afterValidate).toHaveBeenCalledWith(false, '12/1/2016', 0, 7, 'validateCells');
    });

    it('should only call the validator once for modified cells', async() => {
      const validator1 = jasmine.createSpy('validator1').and.callFake((value, callback) => callback(true));
      const validator2 = jasmine.createSpy('validator2').and.callFake((value, callback) => callback(true));

      handsontable({
        data: [
          ['=B1+5', 2, '=D1', 'text', 'foo']
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        validator: validator1,
      });
      spec().$container2.handsontable({
        data: [
          ['=Sheet1!A1', 2, '=D1', 'D', '=A1+1']
        ],
        formulas: {
          engine: getPlugin('formulas').engine,
          sheetName: 'Sheet2'
        },
        validator: validator2,
      });

      setDataAtCell(0, 1, 6);

      await sleep(100); // Validator is asynchronous.

      expect(validator1).toHaveBeenCalledTimes(2);
      expect(validator1).toHaveBeenCalledWith(6, jasmine.any(Function));
      expect(validator1).toHaveBeenCalledWith(11, jasmine.any(Function));
      expect(validator2).toHaveBeenCalledTimes(2);
      expect(validator2).toHaveBeenCalledWith(11, jasmine.any(Function));
      expect(validator2).toHaveBeenCalledWith(12, jasmine.any(Function));

      setDataAtCell(0, 4, 'bar');

      await sleep(100); // Validator is asynchronous.

      expect(validator1).toHaveBeenCalledTimes(3);
      expect(validator1).toHaveBeenCalledWith('bar', jasmine.any(Function));
      expect(validator2).toHaveBeenCalledTimes(2);
    });

    it('should validate correct visual cells', async() => {
      const beforeValidate = jasmine.createSpy('beforeValidate');
      const hot = handsontable({
        data: [
          ['1', 2, '=D1', 'text1', 'foo1'],
          ['2', 2, '=D2', 'text2', 'foo2'],
          ['3', 2, '=D3', 'text3', 'foo3'],
          ['4', 2, '=D4', 'text4', 'foo4'],
          ['5', 2, '=D5', 'text5', '=B5+3'],
        ],
        formulas: {
          engine: HyperFormula
        },
        validator(value, callback) {
          callback(false);
        },
        beforeValidate,
      });

      hot.columnIndexMapper.setIndexesSequence([0, 2, 3, 4, 1]);
      hot.rowIndexMapper.setIndexesSequence([0, 2, 3, 4, 1]);

      render();
      setDataAtCell(3, 0, 6);

      await sleep(100); // Validator is asynchronous.

      expect(beforeValidate).toHaveBeenCalledTimes(2);
      expect(beforeValidate).toHaveBeenCalledWith(6, 3, 0);
      expect(beforeValidate).toHaveBeenCalledWith(9, 3, 4);
    });

    it('should not try to validate cells outside of the table boundaries', () => {
      let validatorCallsCount = 0;
      const hot = handsontable({
        data: [
          [100, '=A1'],
          ['=A1', '=A1', '=A1'],
        ],
        formulas: {
          engine: HyperFormula
        },
        validator: () => {},
        beforeValidate: () => {
          validatorCallsCount += 1;
        }
      });
      const errorList = [];

      try {
        hot.setDataAtCell(0, 0, 1);

      } catch (e) {
        errorList.push(e);
      }

      expect(errorList.length).toEqual(0);
      // 3 from the visible cells + 1 from setDataAtCell
      expect(validatorCallsCount).toEqual(4);
    });

    it('should not throw type error while validating sheets added through the HyperFormula instance', () => {
      const hf = HyperFormula.buildEmpty();

      handsontable({
        data: [
          ['1', '2', '= mainSheet!A1 * mainSheet!B1']
        ],
        formulas: {
          engine: hf,
          sheetName: 'mainSheet'
        },
      });

      const sheetId = hf.getSheetId(hf.addSheet('sheet2'));

      hf.setSheetContent(sheetId, [
        ['1', '2', '= mainSheet!A1 * mainSheet!B1']
      ]);

      expect(() => {
        setDataAtCell(0, 1, 'test');
      }).not.toThrowError();
    });
  });
});
