import { mapFormulaReferences, shiftFormulaReferences } from '../formulaRefs';
import { normalizeFormula } from '../../../plugins/exportFile/types/xlsx/formula-utils';

describe('shiftFormulaReferences', () => {
  it('should shift a relative reference forward and back again', () => {
    expect(shiftFormulaReferences('A1', 1, 1)).toBe('B2');
    expect(shiftFormulaReferences('B2', -1, -1)).toBe('A1');
  });

  it('should shift an absolute reference too, keeping both $ markers', () => {
    // `$` pins a reference against copy and fill, not against the sheet moving: adding or removing
    // a header band translates the whole coordinate space, so every reference follows it.
    expect(shiftFormulaReferences('$A$1', 1, 1)).toBe('$B$2');
  });

  it('should shift both components of a mixed reference, keeping the $ where it was', () => {
    expect(shiftFormulaReferences('A$1', 1, 1)).toBe('B$2');
    expect(shiftFormulaReferences('$A1', 1, 1)).toBe('$B2');
  });

  it('should shift both ends of a range', () => {
    expect(shiftFormulaReferences('A1:C3', 1, 1)).toBe('B2:D4');
  });

  it('should keep the sheet part of a qualified reference and shift only the cell part', () => {
    expect(shiftFormulaReferences('\'Sheet 1\'!B2', 1, 1)).toBe('\'Sheet 1\'!C3');
  });

  it('should not touch a reference-shaped string literal', () => {
    expect(shiftFormulaReferences('"A1"', 1, 1)).toBe('"A1"');
    expect(shiftFormulaReferences('CONCAT("A1",A1)', 1, 1)).toBe('CONCAT("A1",B2)');
  });

  it('should shift the arguments of a function call without touching its name', () => {
    expect(shiftFormulaReferences('SUM(A1:A3)', 1, 1)).toBe('SUM(B2:B4)');
    expect(shiftFormulaReferences('LOG10(A1)', 1, 1)).toBe('LOG10(B2)');
  });

  it('should return null when a shifted reference falls above row 1 or left of column A', () => {
    expect(shiftFormulaReferences('A1', -1, 0)).toBeNull();
    expect(shiftFormulaReferences('A1', 0, -1)).toBeNull();
    expect(shiftFormulaReferences('SUM(A1:B5)', -1, 0)).toBeNull();
  });

  it('should reject an absolute reference that would leave the sheet, like a relative one', () => {
    expect(shiftFormulaReferences('$A$1', -1, -1)).toBeNull();
    expect(shiftFormulaReferences('A1', -1, 0)).toBeNull();
  });

  it('should invert the export\'s own shift, $ markers included', () => {
    // `normalizeFormula` strips the leading `=` and shifts by the header row and row-header column
    // the export prepends; the import shifts back by the same amount.
    const exported = normalizeFormula('=$A$1+B2', ',', 1, 1);

    expect(exported).toBe('$B$2+C3');
    expect(shiftFormulaReferences(exported, -1, -1)).toBe('$A$1+B2');
  });

  it('should return the formula untouched for a zero shift', () => {
    expect(shiftFormulaReferences('A1*0.2', 0, 0)).toBe('A1*0.2');
  });
});

describe('mapFormulaReferences', () => {
  it('should report each reference in 1-based coordinates with its absolute flags', () => {
    const seen = [];

    mapFormulaReferences('SUM($A1:B$2)', (reference) => {
      seen.push(reference);

      return { row: reference.row, col: reference.col };
    });

    expect(seen).toEqual([
      { row: 1, col: 1, rowAbsolute: false, colAbsolute: true },
      { row: 2, col: 2, rowAbsolute: true, colAbsolute: false },
    ]);
  });

  it('should return null as soon as the mapper rejects a reference', () => {
    expect(mapFormulaReferences('A1+B2', reference => (reference.col === 2 ? null : reference))).toBeNull();
  });
});
