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
});
