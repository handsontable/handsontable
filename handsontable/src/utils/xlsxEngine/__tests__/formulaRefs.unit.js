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

  it('should leave a qualified reference untouched, quoted or bare, and shift only the unqualified ones', () => {
    // A header band added to or removed from THIS sheet moves nothing on another sheet, so a reference
    // that names one keeps its cell part. Only the references into this sheet follow the shift.
    expect(shiftFormulaReferences('\'Sheet 1\'!B2', 1, 1)).toBe('\'Sheet 1\'!B2');
    expect(shiftFormulaReferences('Data!A2', -1, 0)).toBe('Data!A2');
    expect(shiftFormulaReferences('SUM(Rates!A1:A3)+A2', -1, 0)).toBe('SUM(Rates!A1:A3)+A1');
    expect(shiftFormulaReferences('\'My Rates\'!$A$1:$B$2*C2', -1, -1)).toBe('\'My Rates\'!$A$1:$B$2*B1');
  });

  it('should recognize a quoted sheet name with an escaped apostrophe and a bare non-ASCII one', () => {
    // Excel doubles an apostrophe inside a quoted name and leaves a name made of letters from any
    // script unquoted, so `O'Brien` and `Лист1` are both real shapes a workbook stores.
    expect(shiftFormulaReferences('\'O\'\'Brien\'!A1+A2', -1, 0)).toBe('\'O\'\'Brien\'!A1+A1');
    expect(shiftFormulaReferences('Лист1!A1+A2', -1, 0)).toBe('Лист1!A1+A1');
    expect(shiftFormulaReferences('SUM(\'Лист 1\'!$A$1:B2)', -1, -1)).toBe('SUM(\'Лист 1\'!$A$1:B2)');
    expect(shiftFormulaReferences('Arkusz_1.a!A1', -1, 0)).toBe('Arkusz_1.a!A1');
  });

  it('should shift a lowercase reference like an uppercase one, writing it back uppercase', () => {
    // HyperFormula accepts `=sum(a1:b2)`, and the export hands the raw source string over. A
    // case-sensitive match shifted `B2` but not `a1`, so the two ends of one range came apart.
    expect(shiftFormulaReferences('sum(a1:B2)', 1, 1)).toBe('sum(B2:C3)');
    expect(shiftFormulaReferences('data!a1+a2', -1, 0)).toBe('data!a1+A1');
  });

  it('should not start a reference inside a defined name or a structured reference', () => {
    // `TOTAL1` used to match `AL1`, `TABLE1[Col]` matched `BLE1`, and `ABCD1` matched `BCD1`.
    expect(shiftFormulaReferences('TOTAL1+A1', 1, 1)).toBe('TOTAL1+B2');
    expect(shiftFormulaReferences('SUM(TABLE1[Col])', 1, 1)).toBe('SUM(TABLE1[Col])');
    expect(shiftFormulaReferences('ABCD1*2', 1, 1)).toBe('ABCD1*2');
    expect(shiftFormulaReferences('my_range1+A1', 1, 1)).toBe('my_range1+B2');
    // A `$` before the column is the reference's own absolute marker, not a name character.
    expect(shiftFormulaReferences('$A$1+$B2', 1, 1)).toBe('$B$2+$C3');
  });

  it('should shift a whole-column or whole-row reference on its own axis only', () => {
    // `=SUM(A:A)` used to pass through untouched, so with a row-header column prepended the sum
    // silently named the header column.
    expect(shiftFormulaReferences('SUM(A:A)', 1, 1)).toBe('SUM(B:B)');
    expect(shiftFormulaReferences('SUM($A:$C)+A1', 1, 1)).toBe('SUM($B:$D)+B2');
    expect(shiftFormulaReferences('SUM(A:A)', 5, 0)).toBe('SUM(A:A)');
    expect(shiftFormulaReferences('SUM(1:1)', 1, 3)).toBe('SUM(2:2)');
    expect(shiftFormulaReferences('SUM(A:A)', 0, -1)).toBeNull();
    expect(shiftFormulaReferences('SUM(1:2)', -1, 0)).toBeNull();
    expect(shiftFormulaReferences('SUM(Data!A:A)+SUM(\'S 1\'!2:2)', 1, 1)).toBe('SUM(Data!A:A)+SUM(\'S 1\'!2:2)');
  });

  it('should not reject a qualified reference that would leave the sheet if it were shifted', () => {
    // `Data!A1` under a `firstRow` header window used to shift to row 0 and drop the whole formula.
    expect(shiftFormulaReferences('Data!A1', -1, -1)).toBe('Data!A1');
    expect(shiftFormulaReferences('Data!A1+B2', -1, -1)).toBe('Data!A1+A1');
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

  it('should reject a reference the shift pushes past the last row or column of a sheet', () => {
    expect(shiftFormulaReferences('XFD1048576', 1, 0)).toBeNull();
    expect(shiftFormulaReferences('XFD1048576', 0, 1)).toBeNull();
    expect(shiftFormulaReferences('XFC1048575', 1, 1)).toBe('XFD1048576');
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

  it('should not hand a qualified reference to the mapper', () => {
    const seen = [];

    const result = mapFormulaReferences('Data!A1+\'Sheet 1\'!B2:C3+D4', (reference) => {
      seen.push(reference);

      return { row: reference.row + 1, col: reference.col };
    });

    expect(seen).toEqual([{ row: 4, col: 4, rowAbsolute: false, colAbsolute: false }]);
    expect(result).toBe('Data!A1+\'Sheet 1\'!B2:C3+D5');
  });

  it('should hand an open reference to the mapper with null on its open axis', () => {
    const seen = [];

    mapFormulaReferences('A:B+3:3', (reference) => {
      seen.push(reference);

      return { row: reference.row, col: reference.col };
    });

    expect(seen).toEqual([
      { row: null, col: 1, rowAbsolute: false, colAbsolute: false },
      { row: null, col: 2, rowAbsolute: false, colAbsolute: false },
      { row: 3, col: null, rowAbsolute: false, colAbsolute: false },
      { row: 3, col: null, rowAbsolute: false, colAbsolute: false },
    ]);
  });

  it('should return null as soon as the mapper rejects a reference', () => {
    expect(mapFormulaReferences('A1+B2', reference => (reference.col === 2 ? null : reference))).toBeNull();
  });
});
