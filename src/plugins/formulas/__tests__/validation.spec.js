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
      keyDown('enter');
      // Closing the editor and saving changes.
      keyDown('enter');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);

      selectCell(0, 2);
      // Opening an editor
      keyDown('enter');
      // Closing the editor and saving changes.
      keyDown('enter');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
    });

    it('should validate result of formula for dependant cells properly (formula returns text)', async() => {
      const hot = handsontable({
        data: [
          [0, '=A1', '=B1', '=C1']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric'
      });

      hot.setDataAtCell(0, 0, 'text');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 1)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
    });

    it('should validate result of formula and dependant cells properly (formula returns error)', async() => {
      const hot = handsontable({
        data: [
          ['=B1+5', 2, '=A1', '=C1']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric'
      });

      hot.setDataAtCell(0, 0, '=B1+5a');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);

      hot.setDataAtCell(0, 0, '=B1+5');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
    });

    it('should validate result of formula and dependant cells properly (formula create circular dependency)', async() => {
      const hot = handsontable({
        data: [
          ['=B1+5', 2, '=A1', '=C1']
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric'
      });

      hot.setDataAtCell(0, 0, '=C1');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);

      hot.setDataAtCell(0, 0, '=B1+5');

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(false);
    });

    it('should validate result of formula and dependant cells properly (formula create #REF! error)', async() => {
      const hot = handsontable({
        data: [
          ['=E1', 2, '=A1', '=C1', 22]
        ],
        formulas: {
          engine: HyperFormula
        },
        type: 'numeric'
      });

      hot.alter('remove_col', 4);

      await sleep(100); // Validator is asynchronous.

      expect($(getCell(0, 0)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 2)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
      expect($(getCell(0, 3)).hasClass(hot.getSettings().invalidCellClassName)).toBe(true);
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

      hot.validateCells();
      await sleep(100); // Validator is asynchronous.

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
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 0, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(false, 'text', 0, 1, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 2, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 3, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(true, 22, 0, 4, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(false, '23', 0, 5, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(false, '=A1', 0, 6, 'validateCells', void 0);
      expect(afterValidate).toHaveBeenCalledWith(false, '12/1/2016', 0, 7, 'validateCells', void 0);
    });
  });
});
