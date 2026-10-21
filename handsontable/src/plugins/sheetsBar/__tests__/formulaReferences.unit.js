import { formatSheetName, rewriteSheetReferences } from '../formulaReferences';

describe('rewriteSheetReferences', () => {
  const rename = (from, to) => reference => (reference.name === from ? to : null);

  it('rewrites an unquoted sheet name in front of a cell and a range reference', () => {
    expect(rewriteSheetReferences('=Prices!A1+SUM(Prices!B1:B3)', rename('Prices', 'Costs')))
      .toBe('=Costs!A1+SUM(Costs!B1:B3)');
  });

  it('reads a quoted name with a doubled quote as one sheet name', () => {
    const seen = [];

    rewriteSheetReferences('=\'O\'\'Brien\'!A1', (reference) => {
      seen.push(reference);

      return null;
    });

    expect(seen).toEqual([{ name: 'O\'Brien', quoted: true }]);
  });

  it('leaves a name inside a string literal alone', () => {
    expect(rewriteSheetReferences('="Prices!A1"&Prices!A1', rename('Prices', 'Costs'))).toBe('="Prices!A1"&Costs!A1');
  });

  it('leaves a longer name that only ends with the renamed one alone', () => {
    expect(rewriteSheetReferences('=OldPrices!A1', rename('Prices', 'Costs'))).toBe('=OldPrices!A1');
  });

  it('leaves cell references and functions without a sheet name alone', () => {
    expect(rewriteSheetReferences('=SUM(A1:A3)*Prices', rename('Prices', 'Costs'))).toBe('=SUM(A1:A3)*Prices');
  });

  it('returns the same string when nothing is rewritten', () => {
    const formula = '=Other!A1';

    expect(rewriteSheetReferences(formula, rename('Prices', 'Costs'))).toBe(formula);
  });

  it('reads letters outside the Latin script as part of a name', () => {
    expect(rewriteSheetReferences('=Лист2!A1', rename('Лист2', '\'Лист3\''))).toBe('=\'Лист3\'!A1');
  });
});

describe('formatSheetName', () => {
  it('quotes a name and doubles every quote in it', () => {
    expect(formatSheetName('O\'Brien', true)).toBe('\'O\'\'Brien\'');
  });

  it('leaves a name that needs no quotes as it is', () => {
    expect(formatSheetName('Costs', false)).toBe('Costs');
  });
});
