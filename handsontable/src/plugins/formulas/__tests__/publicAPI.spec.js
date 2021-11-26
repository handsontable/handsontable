import HyperFormula from 'hyperformula';

describe('Formulas public API', () => {
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

  describe('isFormulaCellType()', () => {
    it('should return `true` when under the cell is formula', () => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          ['', ''],
          ['', ''],
          ['=A1', '\'=A1'],
          [0, true],
          [null, void 0],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

      const formulas = getPlugin('formulas');

      expect(formulas.isFormulaCellType(0, 0)).toBe(false);
      expect(formulas.isFormulaCellType(0, 1)).toBe(false);
      expect(formulas.isFormulaCellType(1, 0)).toBe(false);
      expect(formulas.isFormulaCellType(2, 0)).toBe(true);
      expect(formulas.isFormulaCellType(3, 0)).toBe(false);
      expect(formulas.isFormulaCellType(4, 0)).toBe(true);
      expect(formulas.isFormulaCellType(4, 1)).toBe(false);
      expect(formulas.isFormulaCellType(5, 0)).toBe(false);
      expect(formulas.isFormulaCellType(5, 1)).toBe(false);
      expect(formulas.isFormulaCellType(6, 0)).toBe(false);
      expect(formulas.isFormulaCellType(6, 1)).toBe(false);
    });
  });

  describe('getCellType()', () => {
    it('should detect cells correctly', () => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          [null, null],
          [null, null],
          ['=A1', '\'=A1'],
          [0, true],
          [null, void 0],
          ['', 1.1],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

      const formulas = getPlugin('formulas');

      expect(formulas.getCellType(0, 0)).toBe('VALUE');
      expect(formulas.getCellType(0, 1)).toBe('VALUE');
      expect(formulas.getCellType(1, 0)).toBe('VALUE');
      expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
      expect(formulas.getCellType(3, 0)).toBe('ARRAY');
      expect(formulas.getCellType(4, 0)).toBe('FORMULA');
      expect(formulas.getCellType(4, 1)).toBe('VALUE');
      expect(formulas.getCellType(5, 0)).toBe('VALUE');
      expect(formulas.getCellType(5, 1)).toBe('VALUE');
      expect(formulas.getCellType(6, 0)).toBe('EMPTY');
      expect(formulas.getCellType(6, 1)).toBe('EMPTY');
      expect(formulas.getCellType(7, 0)).toBe('VALUE');
      expect(formulas.getCellType(7, 1)).toBe('VALUE');

      setDataAtCell(2, 0, '=ARRAYFORMULA(A1:A2*B1:B2)');

      expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
      expect(formulas.getCellType(3, 0)).toBe('ARRAY');
    });
  });
});
