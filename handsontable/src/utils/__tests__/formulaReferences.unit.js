import {
  formatSheetName, isUnquotedSheetName, quoteUnreadableSheetNames, rewriteSheetReferences,
} from '../formulaReferences';

describe('quoteUnreadableSheetNames', () => {
  const readableUnquoted = name => !/^\d/.test(name);

  it('quotes an unquoted name the engine cannot read and leaves the rest as written', () => {
    expect(quoteUnreadableSheetNames('=2026!A1+Costs!B2+\'Q1 Data\'!C3', readableUnquoted))
      .toBe('=\'2026\'!A1+Costs!B2+\'Q1 Data\'!C3');
  });

  it('leaves error literals alone, including the ones with a digit before the `!`', () => {
    const canReadUnquoted = jest.fn(() => false);
    const formula = '=IFERROR(1/0,#DIV/0!)&IF(A1,#N/A,#NAME?)&#REF!&#VALUE!&#NULL!&#NUM!';

    expect(quoteUnreadableSheetNames(formula, canReadUnquoted)).toBe(formula);
    expect(canReadUnquoted).not.toHaveBeenCalled();
  });

  it('reads a decomposed accented name as one name', () => {
    const decomposed = 'Café';

    expect(quoteUnreadableSheetNames(`=${decomposed}!A1`, () => false)).toBe(`='${decomposed}'!A1`);
  });

  it('reads a name with a letter outside the Basic Multilingual Plane as one name', () => {
    expect(quoteUnreadableSheetNames('=\u{20000}x!A1', () => false)).toBe('=\'\u{20000}x\'!A1');
  });

  it('returns a formula with no sheet reference without asking about any name', () => {
    const canReadUnquoted = jest.fn(() => true);

    expect(quoteUnreadableSheetNames('=SUM(A1:A3)', canReadUnquoted)).toBe('=SUM(A1:A3)');
    expect(canReadUnquoted).not.toHaveBeenCalled();
  });
});

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

  it('leaves an error literal alone when a sheet carries the same word', () => {
    const formula = '=IFERROR(A1,#VALUE!)+#REF!+Value!A1+REF!B2';

    expect(rewriteSheetReferences(formula, reference => (/^(value|ref)$/i.test(reference.name) ? 'Costs' : null)))
      .toBe('=IFERROR(A1,#VALUE!)+#REF!+Costs!A1+Costs!B2');
  });

  it('skips a string literal with an escaped quote and a `!` in it', () => {
    expect(rewriteSheetReferences('="a""b!"&Prices!A1', rename('Prices', 'Costs'))).toBe('="a""b!"&Costs!A1');
  });

  it('returns a formula with an unclosed quote as it is', () => {
    expect(rewriteSheetReferences('=\'O\'\'Brien!A1', rename('O\'Brien', 'Costs'))).toBe('=\'O\'\'Brien!A1');
  });

  it('reads a quoted name that holds a `!` as one name', () => {
    expect(rewriteSheetReferences('=\'A!B\'!A1', rename('A!B', 'Costs'))).toBe('=Costs!A1');
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

describe('isUnquotedSheetName', () => {
  it('accepts a name a formula reads as one name, in any script', () => {
    expect(['Prices', 'Data_2', '2026', 'Лист2', 'Café'].map(isUnquotedSheetName))
      .toEqual([true, true, true, true, true]);
  });

  it('rejects a name with an operator, a space, a quote or nothing in it', () => {
    expect(['Sales-EU', 'a+b', 'a&b', 'Q1 Data', 'O\'Brien', ''].map(isUnquotedSheetName))
      .toEqual([false, false, false, false, false, false]);
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
