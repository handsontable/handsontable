import {
  ArrayRangeClaims, normalizeFormula, normalizeNamedExpression, toFormulaLiteral,
} from '../types/xlsx/formula-utils';

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

  describe('decimal separator', () => {
    const normalizeComma = (formula, rows = 0, cols = 0) => (
      normalizeFormula(formula, ';', rows, cols, undefined, undefined, ',')
    );

    it('should write a decimal comma of a number literal as a dot', () => {
      // `SUM(A1,1,5)` would sum three arguments in Excel.
      expect(normalizeComma('=SUM(A1;1,5)')).toBe('SUM(A1,1.5)');
      expect(normalizeComma('=A1*0,5', 1, 1)).toBe('B2*0.5');
    });

    it('should convert every number literal form the engine reads', () => {
      expect(normalizeComma('=1,5e3+1,5e-3+,5+5,')).toBe('1.5e3+1.5e-3+.5+5.');
    });

    it('should convert an uppercase exponent too, which the engine does not read, without harm', () => {
      // HyperFormula reads a lowercase `e` only, so such a formula never comes from the engine.
      expect(normalizeComma('=1,5E-3')).toBe('1.5E-3');
    });

    it('should not offset the exponent of a number with a trailing decimal comma', () => {
      expect(normalizeComma('=1,e3+A1', 1, 1)).toBe('1.e3+B2');
    });

    it('should leave a comma inside a string literal or a quoted sheet name', () => {
      expect(normalizeComma('="1,5"&A1')).toBe('"1,5"&A1');
      expect(normalizeComma('=\'Sheet 1,5\'!A1*2,5')).toBe('\'Sheet 1,5\'!A1*2.5');
    });

    it('should leave a comma that does not belong to a number literal', () => {
      expect(normalizeComma('=Sheet1!A1,B1')).toBe('Sheet1!A1,B1');
      expect(normalizeComma('=A$1,5')).toBe('A$1,5');
    });

    it('should leave a dot decimal separator as it is', () => {
      expect(normalizeFormula('=SUM(A1,1.5)', ',', 0, 0, undefined, undefined, '.')).toBe('SUM(A1,1.5)');
    });

    it('should keep the row separator of an array literal under a `;` argument separator', () => {
      // OOXML's array literal separates rows with `;` too: swapping it gave `{1,2,3,4}`, a `#REF!`.
      expect(normalizeFormula('=INDEX({1,2;3,4};2;1)', ';', 0, 0)).toBe('INDEX({1,2;3,4},2,1)');
      expect(normalizeFormula('=INDEX({"a;b";"c"};1;1)', ';', 0, 0)).toBe('INDEX({"a;b";"c"},1,1)');
    });
  });
});

describe('normalizeNamedExpression', () => {
  const normalize = (formula, {
    rows = 0, cols = 0, exRows, exCols, separator = ',', decimalSeparator = '.',
  } = {}) => {
    const sheets = new Map([
      ['data', {
        exportedName: 'Sheet1', rowOffset: rows, colOffset: cols, excludedRows: exRows, excludedCols: exCols,
      }],
      ['rates', { exportedName: 'Rate Table', rowOffset: 0, colOffset: 0 }],
    ]);

    return normalizeNamedExpression(formula, separator, sheets, decimalSeparator);
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

  it('should strip an ARRAYFORMULA call, which Excel does not have', () => {
    expect(normalize('=ARRAYFORMULA(Data!$A$1:$A$3*2)')).toBe('Sheet1!$A$1:$A$3*2');
    expect(normalize('=SUM(ARRAYFORMULA(Data!$A$1:$A$3*2))')).toBe('SUM(Sheet1!$A$1:$A$3*2)');
  });

  it('should keep the row separator of an array literal under a `;` argument separator', () => {
    expect(normalize('=INDEX({1,2;3,4};2;1)', { separator: ';' })).toBe('INDEX({1,2;3,4},2,1)');
  });

  it('should answer null for a definition HyperFormula could not parse', () => {
    // HyperFormula stores `=1+` and `="a""b"` as `=#ERROR!`, which no reader parses.
    expect(normalize('=#ERROR!')).toBeNull();
    expect(normalize('=SUM(#ERROR!)')).toBeNull();
    expect(normalize('="#ERROR!"')).toBe('"#ERROR!"');
  });

  it('should keep a constant as it is', () => {
    expect(normalize('=0.07', { rows: 1 })).toBe('0.07');
    expect(normalize('="Data!A1"', { rows: 1 })).toBe('"Data!A1"');
  });

  it('should convert the argument separator', () => {
    expect(normalize('=SUM(Data!$A$1;Data!$A$2)', { separator: ';' })).toBe('SUM(Sheet1!$A$1,Sheet1!$A$2)');
  });

  it('should write a decimal comma of a number literal as a dot', () => {
    expect(normalize('=Data!$A$1*0,5', { rows: 1, separator: ';', decimalSeparator: ',' })).toBe('Sheet1!$A$2*0.5');
    expect(normalize('=SUM(Data!$A$1;1,5;"2,5")', { separator: ';', decimalSeparator: ',' }))
      .toBe('SUM(Sheet1!$A$1,1.5,"2,5")');
  });

  it('should count the left-out rows below a reference correctly and fast over a large set', () => {
    // With a `range`, the set holds every engine row outside it: 500,000 rows here. Walking the set
    // for every reference corner made a few thousand names cost billions of reads.
    const exRows = new Set();

    for (let row = 0; row < 500000; row++) {
      if (row < 10 || row >= 20) {
        exRows.add(row);
      }
    }

    const started = performance.now();
    const results = new Set();

    for (let index = 0; index < 5000; index++) {
      results.add(normalize('=Data!$A$11:$A$20', { rows: 1, exRows }));
    }

    expect(performance.now() - started).toBeLessThan(1000);
    expect([...results]).toEqual(['Sheet1!$A$2:$A$11']);
    // A set changed after a call is read again.
    exRows.delete(0);

    expect(normalize('=Data!$A$11:$A$20', { rows: 1, exRows })).toBe('Sheet1!$A$3:$A$12');
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
    // The file cannot hold these characters: the XML writer strips them, which silently changed
    // `x\u0001y` to `xy`. The set is the native writer's own (DEL and the two non-characters too).
    expect(toFormulaLiteral('x\u0001y')).toBeNull();
    expect(toFormulaLiteral('\u0000')).toBeNull();
    expect(toFormulaLiteral('a\u000Bb\u000Cc')).toBeNull();
    expect(toFormulaLiteral('end\u001F')).toBeNull();
    expect(toFormulaLiteral('x\u007Fy')).toBeNull();
    expect(toFormulaLiteral('x\uFFFEy')).toBeNull();
    expect(toFormulaLiteral('x\uFFFFy')).toBeNull();
    // A carriage return is written raw, and the reader's end-of-line handling turns it into a line
    // feed. A tab and a line feed are kept.
    expect(toFormulaLiteral('a\rb')).toBeNull();
    expect(toFormulaLiteral('a\tb\nc')).toBe('"a\tb\nc"');
    // A lone surrogate is written as U+FFFD, a different string.
    expect(toFormulaLiteral('a\uD800b')).toBeNull();
    expect(toFormulaLiteral('b\uDC00')).toBeNull();
    expect(toFormulaLiteral('\uD83D\uDE00')).toBe('"\uD83D\uDE00"');
    expect(toFormulaLiteral(Infinity)).toBeNull();
  });
});

describe('ArrayRangeClaims', () => {
  const range = (top, left, bottom, right) => ({ top, left, bottom, right });

  it('should claim ranges in row-major order and refuse one that overlaps an earlier claim', () => {
    // The export asks master by master, row by row and left to right.
    const claims = new ArrayRangeClaims();

    expect(claims.claim(range(1, 1, 3, 2))).toBe(true); // A1:B3
    expect(claims.claim(range(1, 3, 1, 3))).toBe(true); // C1, right of A1:B3
    expect(claims.claim(range(2, 2, 2, 2))).toBe(false); // B2, inside A1:B3
    expect(claims.claim(range(2, 3, 3, 4))).toBe(true); // C2:D3, touches A1:B3 and C1 only at the edges
    expect(claims.claim(range(4, 1, 4, 1))).toBe(true); // A4, below A1:B3
    expect(claims.claim(range(4, 3, 6, 3))).toBe(true); // C4:C6
    expect(claims.claim(range(5, 1, 5, 4))).toBe(false); // A5:D5, a free master reaching into C4:C6
    expect(claims.claim(range(6, 1, 6, 2))).toBe(true); // A6:B6, stops left of C6
    expect(claims.claim(range(7, 3, 7, 3))).toBe(true); // C7, below C4:C6
  });

  it('should refuse a range over a merged cell, and a CSE array on one, but not a one-cell dynamic array', () => {
    // Excel shows a dynamic array spilling into a merge as `#SPILL!`, and takes no CSE array in a
    // merged cell.
    const claims = new ArrayRangeClaims([range(2, 2, 2, 3), range(5, 1, 6, 1)]); // B2:C2, A5:A6

    expect(claims.claim(range(1, 2, 3, 2))).toBe(false); // B1:B3 crosses B2
    expect(claims.claim(range(1, 4, 3, 4))).toBe(true); // D1:D3 passes right of the merge
    expect(claims.claim(range(2, 2, 2, 2))).toBe(true); // B2, a one-cell dynamic array
    expect(claims.claim(range(2, 2, 2, 2), false)).toBe(false); // B2, a one-cell CSE array
    expect(claims.claim(range(3, 1, 4, 1), false)).toBe(true); // A3:A4 stops above A5
    expect(claims.claim(range(4, 2, 6, 2))).toBe(true); // B4:B6 passes right of A5:A6
    expect(claims.claim(range(7, 1, 7, 1), false)).toBe(true); // A7, below the merge
  });

  it('should not let a refused claim block a later range', () => {
    const claims = new ArrayRangeClaims();

    expect(claims.claim(range(1, 1, 2, 1))).toBe(true);
    expect(claims.claim(range(2, 1, 9, 9))).toBe(false);
    expect(claims.claim(range(3, 3, 3, 3))).toBe(true);
  });

  it('should claim a 100,000-row column of one-cell arrays in linear time', () => {
    // An IFS column is a one-cell dynamic array per row. Comparing each claim with every earlier
    // one took about 3 seconds for 100,000 rows.
    const claims = new ArrayRangeClaims();
    const started = performance.now();

    const answers = new Set();

    for (let row = 1; row <= 100000; row++) {
      answers.add(claims.claim(range(row, 3, row, 3)));

      if (row === 1) {
        // A spill over D1:D100000 next to the IFS column.
        answers.add(claims.claim(range(1, 4, 100000, 4)));
      }
    }

    expect(performance.now() - started).toBeLessThan(500);
    expect([...answers]).toEqual([true]);
    // A master inside the spill is still refused.
    expect(claims.claim(range(100000, 4, 100000, 5))).toBe(false);
  });
});
