import HyperFormula from 'hyperformula';

describe('Formulas public API', () => {
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

  describe('isFormulaCellType()', () => {
    it('should return `true` when under the cell is formula', async() => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          ['', ''],
          ['', ''],
          ['=A1', '\'=A1'],
          [0, true],
          [null, undefined],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

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
    it('should detect cells correctly', async() => {
      handsontable({
        data: [
          ['1', '2'],
          ['3', '4'],
          [null, null],
          [null, null],
          ['=A1', '\'=A1'],
          [0, true],
          [null, undefined],
          ['', 1.1],
        ],
        formulas: {
          engine: HyperFormula
        }
      });

      await setDataAtCell(2, 0, '=TRANSPOSE(A1:B2)');

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

      await setDataAtCell(2, 0, '=ARRAYFORMULA(A1:A2*B1:B2)');

      expect(formulas.getCellType(2, 0)).toBe('ARRAYFORMULA');
      expect(formulas.getCellType(3, 0)).toBe('ARRAY');
    });
  });

  describe('getCellDependents()', () => {
    it('should return the cells that depend on the given cell', async() => {
      handsontable({
        data: [['1', '=A1', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // B1 (=A1) and C1 (=A1+B1) both reference A1.
      expect(formulas.getCellDependents({ sheet: 0, row: 0, col: 0 })).toEqual(
        jasmine.arrayWithExactContents([
          { sheet: 0, row: 0, col: 1 },
          { sheet: 0, row: 0, col: 2 },
        ])
      );
    });

    it('should accept a cell range and return the cells that depend on it', async() => {
      handsontable({
        data: [['1'], ['2'], ['=SUM(A1:A2)']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // A3 (=SUM(A1:A2)) depends on the range A1:A2.
      expect(formulas.getCellDependents({
        start: { sheet: 0, row: 0, col: 0 },
        end: { sheet: 0, row: 1, col: 0 },
      })).toEqual(jasmine.arrayContaining([
        { sheet: 0, row: 2, col: 0 },
      ]));
    });
  });

  describe('getCellPrecedents()', () => {
    it('should return the cells that the given cell depends on', async() => {
      handsontable({
        data: [['1', '=A1', '=A1+B1']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // C1 (=A1+B1) reads A1 and B1.
      expect(formulas.getCellPrecedents({ sheet: 0, row: 0, col: 2 })).toEqual(
        jasmine.arrayWithExactContents([
          { sheet: 0, row: 0, col: 0 },
          { sheet: 0, row: 0, col: 1 },
        ])
      );
    });

    it('should accept a cell range and return the cells it depends on', async() => {
      handsontable({
        data: [['1'], ['2'], ['=SUM(A1:A2)']],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // The range A1:A2 is read by =SUM(A1:A2) in A3, so its precedents are A1 and A2.
      expect(formulas.getCellPrecedents({
        start: { sheet: 0, row: 0, col: 0 },
        end: { sheet: 0, row: 1, col: 0 },
      })).toEqual(jasmine.arrayWithExactContents([
        { sheet: 0, row: 0, col: 0 },
        { sheet: 0, row: 1, col: 0 },
      ]));
    });
  });

  describe('coordinate space', () => {
    it('should use HyperFormula index space (not visual) for the argument and the returned coordinates', async() => {
      handsontable({
        // HyperFormula/physical rows: 0:'1', 1:'2', 2:'3', 3:'=A1+A2'.
        data: [['1'], ['2'], ['3'], ['=A1+A2']],
        // Trim the first physical row, so visual indexes no longer match HyperFormula indexes:
        // visual 0 -> HF 1, visual 1 -> HF 2, visual 2 -> HF 3 (the formula cell).
        trimRows: [0],
        formulas: {
          engine: HyperFormula
        }
      });

      const formulas = getPlugin('formulas');

      // Sanity check that the two index spaces really diverge here: the formula sits at HF row 3
      // but visual row 2.
      expect(formulas.isFormulaCellType(2, 0)).toBe(true);

      // Precedents of the formula cell, addressed by its HF index (row 3), come back in HF index space:
      // A1 (HF row 0, a trimmed row that has no visual index) and A2 (HF row 1). A visual-translating
      // implementation would neither accept row 3 as the formula cell nor return the trimmed row 0.
      expect(formulas.getCellPrecedents({ sheet: 0, row: 3, col: 0 })).toEqual(
        jasmine.arrayWithExactContents([
          { sheet: 0, row: 0, col: 0 },
          { sheet: 0, row: 1, col: 0 },
        ])
      );
    });
  });
});
