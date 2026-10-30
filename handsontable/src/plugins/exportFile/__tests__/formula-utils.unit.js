import { normalizeFormula, normalizeNamedExpression, toFormulaLiteral } from '../types/xlsx/formula-utils';

describe('normalizeFormula', () => {
  describe('relative references', () => {
    it('should shift a simple relative reference by the given offsets', () => {
      expect(normalizeFormula('=A1', ',', 1, 1)).toBe('B2');
    });

    it('should shift multiple relative references in one formula', () => {
      expect(normalizeFormula('=A1+B2', ',', 1, 0)).toBe('A2+B3');
    });
  });

  describe('absolute references ($)', () => {
    it('should shift an absolute column reference ($A1) and preserve the $ on the column', () => {
      // $A means column is locked; the export offset still applies so the reference
      // points to the correct Excel cell after header rows/columns are prepended.
      expect(normalizeFormula('=$A1', ',', 1, 1)).toBe('$B2');
    });

    it('should shift an absolute row reference (A$1) and preserve the $ on the row', () => {
      expect(normalizeFormula('=A$1', ',', 1, 1)).toBe('B$2');
    });

    it('should shift a fully absolute reference ($A$1) and preserve both $ signs', () => {
      expect(normalizeFormula('=$A$1', ',', 1, 1)).toBe('$B$2');
    });

    it('should handle absolute references in a multi-term formula', () => {
      expect(normalizeFormula('=SUM($A$1:$B$2)', ',', 1, 1)).toBe('SUM($B$2:$C$3)');
    });
  });

  describe('open references', () => {
    it('should shift a whole-column reference by the column offset only', () => {
      expect(normalizeFormula('=SUM(A:A)', ',', 1, 1)).toBe('SUM(B:B)');
      expect(normalizeFormula('=SUM(2:2)', ',', 1, 1)).toBe('SUM(3:3)');
    });
  });

  describe('string literals', () => {
    it('should not offset cell-reference-like patterns inside double-quoted string literals', () => {
      // The "See A1" string constant must stay unchanged; only the A1 reference in the condition is shifted.
      expect(normalizeFormula('=IF(A1>3,"See A1","OK")', ',', 1, 1)).toBe('IF(B2>3,"See A1","OK")');
    });

    it('should preserve double-quoted strings with embedded "" escapes unchanged', () => {
      expect(normalizeFormula('=IF(A1>0,"A1=""yes""","no")', ',', 1, 0)).toBe('IF(A2>0,"A1=""yes""","no")');
    });

    it('should not offset a qualified reference, its sheet name or its cell part', () => {
      // The header band is prepended to the exported sheet only; a reference that names another
      // sheet (quoted or bare) points at cells the export never moved.
      expect(normalizeFormula('=\'Sheet A1\'!B2', ',', 1, 1)).toBe('\'Sheet A1\'!B2');
      expect(normalizeFormula('=Rates!A1+A1', ',', 1, 1)).toBe('Rates!A1+B2');
      expect(normalizeFormula('=SUM(Rates!$A$1:$A$3)', ',', 1, 1)).toBe('SUM(Rates!$A$1:$A$3)');
    });
  });

  describe('scientific notation', () => {
    it('should not offset the exponent letter in a scientific notation literal (e.g. 1.5E3)', () => {
      // 'E3' inside '1.5E3' looks like a cell reference but is part of a number literal.
      expect(normalizeFormula('=1.5E3+A1', ',', 1, 1)).toBe('1.5E3+B2');
    });

    it('should not offset a single-digit exponent in scientific notation (e.g. 1E3)', () => {
      expect(normalizeFormula('=1E3+A1', ',', 1, 1)).toBe('1E3+B2');
    });

    it('should still offset a real cell reference that looks like an exponent (e.g. +E3 after an operator)', () => {
      // E3 here is a genuine cell reference, not preceded by a digit.
      expect(normalizeFormula('=E3+A1', ',', 1, 1)).toBe('F4+B2');
    });
  });

  describe('separator replacement', () => {
    it('should replace a non-comma separator outside string literals', () => {
      expect(normalizeFormula('=SUM(A1;B1)', ';', 0, 0)).toBe('SUM(A1,B1)');
    });

    it('should not replace a separator inside string literals', () => {
      expect(normalizeFormula('=CONCATENATE("a;b";C1)', ';', 0, 0)).toBe('CONCATENATE("a;b",C1)');
    });
  });
});

describe('normalizeNamedExpression', () => {
  const normalize = (formula, { rows = 0, cols = 0, exRows, exCols, separator = ',' } = {}) => {
    const sheets = new Map([
      ['data', {
        exportedName: 'Sheet1', rowOffset: rows, colOffset: cols, excludedRows: exRows, excludedCols: exCols,
      }],
      ['rates', { exportedName: 'Rate Table', rowOffset: 0, colOffset: 0 }],
    ]);

    return normalizeNamedExpression(formula, separator, sheets);
  };

  it('should strip the `=`, shift a reference to an exported sheet and qualify it with its exported name', () => {
    expect(normalize('=Data!$A$1:$A$3', { rows: 1 })).toBe('Sheet1!$A$2:$A$4');
    expect(normalize('=data!A$1', { rows: 1, cols: 1 })).toBe('Sheet1!B$2');
  });

  it('should move each reference by the sheet it names', () => {
    expect(normalize('=Rates!$A$1+Data!$B$1', { rows: 1 })).toBe('\'Rate Table\'!$A$1+Sheet1!$B$2');
  });

  it('should answer null for a reference to a sheet the export does not write, or to no sheet', () => {
    expect(normalize('=Other!$A$1+Data!$A$1')).toBeNull();
    expect(normalize('=2026!$A$1')).toBeNull();
    expect(normalize('=$A$1')).toBeNull();
  });

  it('should keep a constant as it is', () => {
    expect(normalize('=0.07', { rows: 1 })).toBe('0.07');
    expect(normalize('="Data!A1"', { rows: 1 })).toBe('"Data!A1"');
  });

  it('should convert the argument separator', () => {
    expect(normalize('=SUM(Data!$A$1;Data!$A$2)', { separator: ';' })).toBe('SUM(Sheet1!$A$1,Sheet1!$A$2)');
  });

  it('should shift an open span on its own axis only', () => {
    expect(normalize('=Data!$A:$A', { rows: 1, cols: 1 })).toBe('Sheet1!$B:$B');
    expect(normalize('=Data!$2:$3', { rows: 1, cols: 1 })).toBe('Sheet1!$3:$4');
  });

  it('should shrink a range around a left-out row and shift the references below it', () => {
    expect(normalize('=Data!$A$1:$A$3', { exRows: new Set([1]) })).toBe('Sheet1!$A$1:$A$2');
    expect(normalize('=Data!$A$4', { exRows: new Set([1]) })).toBe('Sheet1!$A$3');
  });

  it('should answer null for a reference that starts or ends on a left-out row or column', () => {
    expect(normalize('=Data!$A$2', { exRows: new Set([1]) })).toBeNull();
    expect(normalize('=Data!$A$1:$A$2', { exRows: new Set([1]) })).toBeNull();
    expect(normalize('=Data!$A$2:$A$3', { exRows: new Set([1]) })).toBeNull();
    expect(normalize('=Data!$B$1', { exCols: new Set([1]) })).toBeNull();
    expect(normalize('=Data!$B:$B', { exCols: new Set([1]) })).toBeNull();
  });

  it('should not reject a reference to another sheet at a left-out index of this one', () => {
    expect(normalize('=Rates!$A$2', { exRows: new Set([1]) })).toBe('\'Rate Table\'!$A$2');
  });
});

describe('toFormulaLiteral', () => {
  it('should spell numbers, strings, booleans and coded errors', () => {
    expect(toFormulaLiteral(0.5)).toBe('0.5');
    expect(toFormulaLiteral('say "hi"')).toBe('"say ""hi"""');
    expect(toFormulaLiteral(true)).toBe('TRUE()');
    expect(toFormulaLiteral(false)).toBe('FALSE()');
    expect(toFormulaLiteral({ type: 'NA', value: '#N/A' })).toBe('#N/A');
  });

  it('should answer null for what a literal cannot spell', () => {
    expect(toFormulaLiteral('x'.repeat(256))).toBeNull();
    expect(toFormulaLiteral('x'.repeat(255))).toBe(`"${'x'.repeat(255)}"`);
    expect(toFormulaLiteral(null)).toBeNull();
    expect(toFormulaLiteral({ type: 'CYCLE', value: '#CYCLE!' })).toBeNull();
    expect(toFormulaLiteral(Infinity)).toBeNull();
  });
});
