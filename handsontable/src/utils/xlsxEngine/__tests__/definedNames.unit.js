import { namesUsedIn, selectWritableDefinedNames } from '../definedNames';

const names = list => list.map(name => ({ name, formula: '1', sheetName: null }));

describe('selectWritableDefinedNames', () => {
  it('should keep a name spelled with non-ASCII letters, as HyperFormula and Excel accept it', () => {
    const { entries, skipped } = selectWritableDefinedNames(
      names(['Größe', 'Umsätze', '_ärger', 'Café.Preis', '売上', 'Größe2']),
      ['Data'],
    );

    expect(entries.map(({ name }) => name)).toEqual(['Größe', 'Umsätze', '_ärger', 'Café.Preis', '売上', 'Größe2']);
    expect(skipped).toBe(false);
  });

  it('should still refuse a name that starts with a digit, spells a cell reference or holds a space', () => {
    const { entries, skipped } = selectWritableDefinedNames(
      names(['1abc', '1ä', 'ZZZ1', 'A1', 'has space', 'Größe Wert', 'R1C1', 'Fine']),
      ['Data'],
    );

    expect(entries.map(({ name }) => name)).toEqual(['Fine']);
    expect(skipped).toBe(true);
  });

  it('should refuse `TRUE`, `FALSE` and any `_xlnm.` name, which readers rename or skip', () => {
    // LibreOffice renames `TRUE` to `_TRUE` and a workbook-scoped `_xlnm.Print_Area` to
    // `Excel_BuiltIn_Print_Area` on load, and both readers skip `_xlnm.` names on import.
    const { entries, skipped } = selectWritableDefinedNames(
      names(['TRUE', 'false', '_xlnm.Print_Area', '_XLNM._FilterDatabase', 'TrueRate', '_xlnmRate']),
      ['Data'],
    );

    expect(entries.map(({ name }) => name)).toEqual(['TrueRate', '_xlnmRate']);
    expect(skipped).toBe(true);
  });

  it('should compare non-ASCII names of the same scope case-insensitively', () => {
    const { entries, skipped } = selectWritableDefinedNames(names(['Größe', 'GRÖßE', 'Maß']), ['Data']);

    expect(entries.map(({ name }) => name)).toEqual(['Größe', 'Maß']);
    expect(skipped).toBe(true);
  });

  it('should leave out a name a reader flagged as unsupported, whatever its definition', () => {
    // A reader keeps such a name only so the formulas over it import their cached values; its text
    // is not the file's definition and must never be written as one.
    const { entries, skipped } = selectWritableDefinedNames([
      { name: 'Rate', formula: 'Data!$A$1', sheetName: null, unsupported: true },
      { name: 'Fine', formula: '1', sheetName: null },
    ], ['Data']);

    expect(entries.map(({ name }) => name)).toEqual(['Fine']);
    expect(skipped).toBe(true);
  });
});

describe('namesUsedIn', () => {
  it('should list the bare words, lower-cased, skipping quoted runs, calls and sheet qualifiers', () => {
    expect([...namesUsedIn('SUM(Rate)+"Sales"+\'Tax Rate\'!A1+Tax!B2+Größe*_x.y')])
      .toEqual(['rate', 'a1', 'b2', 'größe', '_x.y']);
  });

  it('should skip the words inside brackets, nested ones included', () => {
    // A structured reference's column (`Sales[Rate]`) and an external workbook index name no
    // defined name; a LET parameter is still listed (see the JSDoc).
    expect([...namesUsedIn('SUM(Sales[[#This Row],[Rate]])+[1]Book!A1+LET(x,1,x)')])
      .toEqual(['sales', 'a1', 'x', '1']);
  });

  it('should not list the column of an absolute or mixed reference as a word', () => {
    // `$` is not a name character, so `$A$1` used to yield `a`, and a one-letter name (`A`, the reserved
    // `R` and `C`) then claimed every formula with such a reference.
    expect([...namesUsedIn('$A$1+A$2+$R$3*$C1+Rate')]).toEqual(['rate']);
  });

  it('should not list the columns of a whole-column span as words', () => {
    expect([...namesUsedIn('SUM(A:A)+SUM($B:$C)+SUM(d:XFD)+SUM(AB:$AC)')]).toEqual([]);
    // Mixed spans: the right-hand column follows an absolute left-hand one.
    expect([...namesUsedIn('SUM($A:B)+SUM($AB:CD)+SUM(E:$F)')]).toEqual([]);
  });

  it('should still list names on either side of a colon that are not column letters', () => {
    expect([...namesUsedIn('SUM(Start:Finish)+SUM(A:Total)+SUM(Total:A)+A')])
      .toEqual(['start', 'finish', 'a', 'total']);
  });
});
