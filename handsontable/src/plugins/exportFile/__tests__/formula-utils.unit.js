import { normalizeFormula } from '../types/xlsx/formula-utils';

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

  describe('string literals', () => {
    it('should not offset cell-reference-like patterns inside double-quoted string literals', () => {
      // The "See A1" string constant must stay unchanged; only the A1 reference in the condition is shifted.
      expect(normalizeFormula('=IF(A1>3,"See A1","OK")', ',', 1, 1)).toBe('IF(B2>3,"See A1","OK")');
    });

    it('should preserve double-quoted strings with embedded "" escapes unchanged', () => {
      expect(normalizeFormula('=IF(A1>0,"A1=""yes""","no")', ',', 1, 0)).toBe('IF(A2>0,"A1=""yes""","no")');
    });

    it('should not offset cell-reference-like patterns inside single-quoted sheet name references', () => {
      // Single-quoted tokens are sheet names (e.g. 'Sheet A1'!B2); the name must stay unchanged.
      expect(normalizeFormula('=\'Sheet A1\'!B2', ',', 1, 1)).toBe('\'Sheet A1\'!C3');
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
