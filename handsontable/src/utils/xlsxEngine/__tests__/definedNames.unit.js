import { selectWritableDefinedNames } from '../definedNames';

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
});
