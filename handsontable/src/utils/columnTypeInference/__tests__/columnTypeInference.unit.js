import { inferColumnTypes, convertToInferredTypes } from '../index';
import { sourceDataValidator as dateSourceDataValidator } from '../../../validators/dateValidator/dateValidator';
import { sourceDataValidator as timeSourceDataValidator } from '../../../validators/timeValidator/timeValidator';
import { numericValidator } from '../../../validators/numericValidator/numericValidator';
import { dropdownValidator } from '../../../validators/dropdownValidator/dropdownValidator';
import { resolveLocale } from '../locale';

/**
 * Builds array-of-arrays data from one value list per column.
 * @param {...any} columns
 */
function columnsToRows(...columns) {
  const height = Math.max(...columns.map(column => column.length));

  return Array.from({ length: height }, (_, row) => columns.map(column => column[row]));
}

/**
 * Infers a single column.
 * @param values
 * @param options
 */
function inferOne(values, options) {
  return inferColumnTypes(columnsToRows(values), options)[0];
}

/**
 * Infers and converts a single column, returning the converted values.
 * @param values
 * @param options
 */
function convertOne(values, options) {
  const rows = columnsToRows(values);
  const columns = inferColumnTypes(rows, options);

  return convertToInferredTypes(rows, columns).map(row => row[0]);
}

/**
 * Asks the inferred type's own validator whether it accepts a converted value - the check the grid
 * itself runs on load and on edit.
 * @param column
 * @param value
 */
function isAcceptedByCellType(column, value) {
  switch (column.type) {
    case 'dropdown': {
      let result;

      dropdownValidator.call({ allowEmpty: true, source: column.source }, value, (valid) => {
        result = valid;
      });

      return result;
    }
    case 'numeric': {
      let result;

      numericValidator.call({ allowEmpty: true }, value, (valid) => {
        result = valid;
      });

      return result;
    }
    case 'date':
      return dateSourceDataValidator(value, { allowEmpty: true });
    case 'time':
      return timeSourceDataValidator(value, { allowEmpty: true });
    case 'checkbox':
      return value === true || value === false || value === null || value === undefined || value === '';
    default:
      return true;
  }
}

describe('inferColumnTypes', () => {
  describe('numeric', () => {
    it('reads a comma decimal column under a dot-grouping locale', () => {
      const column = inferOne(['1.234,56', '12,5', '7'], { locale: 'de-DE' });

      expect(column.type).toBe('numeric');
      expect(column.numericFormat).toEqual({
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      });
      expect(convertOne(['1.234,56', '12,5', '7'], { locale: 'de-DE' })).toEqual([1234.56, 12.5, 7]);
    });

    it('reads a comma-grouped dot decimal column', () => {
      expect(convertOne(['1,234.56', '0.5'], { locale: 'en-US' })).toEqual([1234.56, 0.5]);
    });

    it('lets the column evidence win over the locale', () => {
      // `0,5` only reads as a comma decimal, so `1.234` in the same column is 1234.
      expect(convertOne(['1.234', '0,5'], { locale: 'en-US' })).toEqual([1234, 0.5]);
      expect(convertOne(['1,234', '0.5'], { locale: 'de-DE' })).toEqual([1234, 0.5]);
    });

    it('resolves an ambiguous column with the locale', () => {
      expect(convertOne(['1.234', '5.678'], { locale: 'en-US' })).toEqual([1.234, 5.678]);
      expect(convertOne(['1.234', '5.678'], { locale: 'de-DE' })).toEqual([1234, 5678]);
    });

    it('reads currency symbols on either side and takes the code from the symbol', () => {
      const dollars = inferOne(['$1,234.50', '$12.00', '-$3.25']);
      const zloty = inferOne(['12 zł', '1234,5 zł', '7 zł'], { locale: 'pl-PL' });

      expect(dollars.type).toBe('numeric');
      expect(dollars.numericFormat).toEqual({
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      });
      expect(convertOne(['$1,234.50', '$12.00', '-$3.25'])).toEqual([1234.5, 12, -3.25]);
      expect(zloty.type).toBe('numeric');
      expect(zloty.numericFormat.currency).toBe('PLN');
    });

    it('reads percentages as fractions with a percent style', () => {
      const column = inferOne(['12.5%', '50%', '7.25%']);

      expect(column.numericFormat).toEqual({
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
      });
      expect(convertOne(['12.5%', '50%', '7.25%'])).toEqual([0.125, 0.5, 0.0725]);
    });

    it('keeps leading-zero codes as text', () => {
      expect(inferOne(['00123', '04567', '00012']).type).toBe('text');
    });

    it('reads a zero integer part as a decimal, never as a thousands group', () => {
      expect(convertOne(['0.123', '0.456'], { locale: 'de-DE' })).toEqual([0.123, 0.456]);
      expect(convertOne(['0,123', '0,456'], { locale: 'en-US' })).toEqual([0.123, 0.456]);
    });

    it('keeps values with more than 15 significant digits as text', () => {
      expect(inferOne(['12345678901234567', '98765432109876543']).type).toBe('text');
      expect(convertOne(['123456789012345', '1.5'])).toEqual([123456789012345, 1.5]);
    });

    it('reads space, no-break space, and apostrophe grouping', () => {
      const zloty = inferOne(['1 234,56 zł', '12,5 zł', '7 zł'], { locale: 'pl-PL' });

      expect(zloty.numericFormat).toEqual({
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      });
      expect(convertOne(['1 234,56 zł', '12,5 zł', '7 zł'], { locale: 'pl-PL' })).toEqual([1234.56, 12.5, 7]);
      expect(convertOne(['1\u00a0234,56', '1\u202f000'], { locale: 'fr-FR' })).toEqual([1234.56, 1000]);
      expect(convertOne(['1\'234.50', '12.5'], { locale: 'de-CH' })).toEqual([1234.5, 12.5]);
    });

    it('rejects a grouping character that changes within a value', () => {
      expect(inferOne(['1,234 567', '2,345 678']).type).toBe('text');
    });

    it('settles percentages and currency by majority, not by the first value', () => {
      const percents = ['0', '1%', '2%', '3%', '4%', '5%', '6%', '7%', '8%', '9%'];
      const dollars = ['\u20ac6', '$5', '$7', '$8', '$9', '$10', '$11', '$12', '$13', '$14'];

      expect(inferOne(percents).numericFormat.style).toBe('percent');
      expect(convertOne(percents)[0]).toBe('0');
      expect(inferOne(dollars).numericFormat.currency).toBe('USD');
      expect(convertOne(dollars)[0]).toBe('\u20ac6');
    });

    it('takes the code of a shared currency symbol from the locale region', () => {
      expect(inferOne(['$12', '$5.50'], { locale: 'en-CA' }).numericFormat.currency).toBe('CAD');
      expect(inferOne(['$12', '$5.50'], { locale: 'en-US' }).numericFormat.currency).toBe('USD');
      expect(inferOne(['12 kr', '7 kr'], { locale: 'nb-NO' }).numericFormat.currency).toBe('NOK');
      expect(inferOne(['12 kr', '7 kr'], { locale: 'sv-SE' }).numericFormat.currency).toBe('SEK');
      expect(inferOne(['$1.234,50', '$5'], { locale: 'es-AR' }).numericFormat.currency).toBe('ARS');
    });

    it('reads a sign before or after the currency symbol, but never two signs', () => {
      expect(convertOne(['$-3.25', '-$4', '+$5'])).toEqual([-3.25, -4, 5]);
      expect(inferOne(['+-5', '+-6']).type).toBe('text');
    });

    it('ignores binary noise and caps the fraction digits', () => {
      expect(inferOne([0.30000000000000004, 1]).numericFormat.maximumFractionDigits).toBe(1);
      expect(inferOne([`0.${'0'.repeat(118)}12`]).numericFormat.maximumFractionDigits).toBe(20);
    });

    it('keeps international phone numbers as text', () => {
      expect(inferOne(['+48 601 234 567', '+48 502 111 222', '+48 600 000 001']).type).toBe('text');
      expect(convertOne(['+1,234', '+5'])).toEqual([1234, 5]);
    });

    it('reads the U+2212 minus sign', () => {
      expect(convertOne(['\u22121,5', '2,5'], { locale: 'sv-SE' })).toEqual([-1.5, 2.5]);
    });

    it('does not count trailing fraction zeros toward the 15-digit limit', () => {
      expect(convertOne(['12345678901234.50', '1.00'])).toEqual([12345678901234.5, 1]);
    });

    it('counts the fraction digits of numbers printed in exponent form', () => {
      expect(inferOne([1.5e-7, 2.5e-7, 3e-7]).numericFormat.maximumFractionDigits).toBe(8);
    });

    it('lets values without a symbol outvote a currency', () => {
      const values = ['$5', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const column = inferOne(values);

      expect(column.numericFormat.style).toBeUndefined();
      expect(convertOne(values)[0]).toBe('$5');
    });

    it('matches the longest currency symbol first', () => {
      expect(inferOne(['R$ 12,50', 'R$ 7'], { locale: 'pt-BR' }).numericFormat.currency).toBe('BRL');
    });

    it('reads the typographic apostrophe as grouping', () => {
      expect(convertOne(['1\u2019234.50', '12.5'], { locale: 'de-CH' })).toEqual([1234.5, 12.5]);
    });

    it('reads 1 and 0 as numbers, not checkboxes', () => {
      expect(inferOne(['1', '0', '1', '0']).type).toBe('numeric');
    });

    it('accepts real numbers', () => {
      expect(inferOne([1, 2.5, -3]).type).toBe('numeric');
      expect(convertOne([1, 2.5, -3])).toEqual([1, 2.5, -3]);
    });

    it('rejects numbers followed by text', () => {
      expect(inferOne(['12 apples', '3 pears', '4 plums']).type).toBe('text');
    });
  });

  describe('date', () => {
    it('reads ISO dates', () => {
      const column = inferOne(['2026-03-12', '2026-12-01']);

      expect(column.type).toBe('date');
      expect(column.confidence).toBe(1);
      expect(convertOne(['2026-03-12', '2026-12-01'])).toEqual(['2026-03-12', '2026-12-01']);
    });

    it('takes the day-month order from the locale when the column cannot decide', () => {
      expect(convertOne(['12/03/2026', '01/02/2026'], { locale: 'en-GB' })).toEqual(['2026-03-12', '2026-02-01']);
      expect(convertOne(['12/03/2026', '01/02/2026'], { locale: 'en-US' })).toEqual(['2026-12-03', '2026-01-02']);
      expect(inferOne(['12/03/2026', '01/02/2026'], { locale: 'en-GB' }).confidence).toBe(0.95);
    });

    it('takes the day-month order from the column evidence', () => {
      expect(convertOne(['12/03/2026', '25/03/2026'], { locale: 'en-US' })).toEqual(['2026-03-12', '2026-03-25']);
      expect(convertOne(['12/03/2026', '03/25/2026'], { locale: 'en-GB' })).toEqual(['2026-12-03', '2026-03-25']);
      expect(inferOne(['12/03/2026', '25/03/2026'], { locale: 'en-US' }).confidence).toBe(1);
    });

    it('checks the confidence floor against the share read, before the locale-order discount', () => {
      const values = ['01/02/2026', '01/03/2026', '01/04/2026', '01/05/2026', '01/06/2026',
        '01/07/2026', '01/08/2026', '01/09/2026', '01/10/2026', 'n/a'];
      const column = inferOne(values);

      expect(column.type).toBe('date');
      expect(column.confidence).toBeCloseTo(0.855, 10);
      expect(inferOne(['01/02/2026', '03/04/2026'], { minConfidence: 1 })).toEqual(expect.objectContaining({
        type: 'date',
        confidence: 0.95,
      }));
    });

    it('converts year-last dates past the sample in the locale order', () => {
      const rows = [['2026-01-02'], ['2026-01-03'], ['03/04/2026']];

      ['en-US', 'en-GB'].forEach((locale) => {
        const columns = inferColumnTypes(rows, { sampleSize: 2, locale });

        expect(columns[0].inputFormat).toEqual({ dateOrder: locale === 'en-US' ? 'MDY' : 'DMY' });
        expect(convertToInferredTypes(rows, columns)[2][0]).toBe(locale === 'en-US' ? '2026-03-04' : '2026-04-03');
      });
    });

    it('reads the day-month order of a year-first locale without its year', () => {
      expect(convertOne(['12/03/2026', '01/02/2026'], { locale: 'sv-SE' })).toEqual(['2026-03-12', '2026-02-01']);
      expect(convertOne(['12/03/2026', '01/02/2026'], { locale: 'ja-JP' })).toEqual(['2026-12-03', '2026-01-02']);
    });

    it('reads dotted and dashed day-month-year dates', () => {
      expect(convertOne(['12.03.2026', '1.4.2026'], { locale: 'de-DE' })).toEqual(['2026-03-12', '2026-04-01']);
    });

    it('mirrors the zero padding of the input in the date format', () => {
      expect(inferOne(['12.03.2026', '01.04.2026'], { locale: 'de-DE' }).dateFormat)
        .toEqual({ year: 'numeric', month: '2-digit', day: '2-digit' });
      expect(inferOne(['1/4/2026', '12/3/2026'], { locale: 'en-US' }).dateFormat)
        .toEqual({ year: 'numeric', month: 'numeric', day: 'numeric' });
    });

    it('rejects a date the calendar does not have', () => {
      expect(inferOne(['31/02/2026', '30/02/2026', '29/02/2026']).type).toBe('text');
      expect(inferOne(['2026-02-30']).type).toBe('text');
    });

    it('leaves date-time values as text', () => {
      expect(inferOne(['2026-03-12 14:30', '2026-03-13 09:00']).type).toBe('text');
    });
  });

  describe('time', () => {
    it('reads 24-hour times', () => {
      const column = inferOne(['14:30:00', '09:05:10']);

      expect(column.type).toBe('time');
      expect(column.timeFormat).toEqual({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      expect(convertOne(['14:30:00', '9:05'])).toEqual(['14:30:00', '09:05:00']);
    });

    it('reads 12-hour times', () => {
      const column = inferOne(['9:05 PM', '12:00 am', '11:59 AM']);

      expect(column.type).toBe('time');
      expect(column.timeFormat).toEqual({ hour: 'numeric', minute: '2-digit', hour12: true });
      expect(convertOne(['9:05 PM', '12:00 am', '11:59 AM', '12:30 PM']))
        .toEqual(['21:05:00', '00:00:00', '11:59:00', '12:30:00']);
    });

    it('rejects out-of-range times', () => {
      expect(inferOne(['24:00', '13:00 PM', '10:61']).type).toBe('text');
    });
  });

  describe('checkbox', () => {
    it('reads true and false in any case, and booleans', () => {
      expect(inferOne(['TRUE', 'false', true, 'True']).type).toBe('checkbox');
      expect(convertOne(['TRUE', 'false', true, 'True'])).toEqual([true, false, true, true]);
    });
  });

  describe('dropdown', () => {
    it('reads a low-cardinality column, with options in order of first appearance', () => {
      const values = ['Open', 'Closed', 'Open', 'Pending', 'Closed', 'Open'];
      const column = inferOne(values);

      expect(column.type).toBe('dropdown');
      expect(column.source).toEqual(['Open', 'Closed', 'Pending']);
      expect(convertOne(values)).toEqual(values);
    });

    it('never reads free text as a dropdown', () => {
      expect(inferOne(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank']).type).toBe('text');
    });

    it('allows up to 10 options by default, and more with maxOptions', () => {
      const options = Array.from({ length: 11 }, (_, index) => `Option ${index}`);
      const values = [...options, ...options];

      expect(inferOne(values.filter(value => value !== 'Option 10')).type).toBe('dropdown');
      expect(inferOne(values).type).toBe('text');
      expect(inferOne(values, { dropdown: { maxOptions: 12 } }).source).toEqual(options);
    });

    it('respects the maxOptions limit and the dropdown switch', () => {
      const values = ['a', 'b', 'c', 'a', 'b', 'c'];

      expect(inferOne(values, { dropdown: { maxOptions: 2 } }).type).toBe('text');
      expect(inferOne(values, { dropdown: false }).type).toBe('text');
    });
  });

  describe('blanks, dirty values and confidence', () => {
    it('ignores blank values', () => {
      expect(inferOne(['12', null, '', '   ', undefined, '3']).type).toBe('numeric');
      expect(convertOne(['12', null, '', '3'])).toEqual([12, null, '', 3]);
    });

    it('returns text with confidence 0 for an all-blank column', () => {
      expect(inferOne([null, '', '  '])).toEqual({ type: 'text', confidence: 0 });
    });

    it('tolerates a stray value at the default confidence floor and leaves it unconverted', () => {
      const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'n/a'];
      const column = inferOne(values);

      expect(column.type).toBe('numeric');
      expect(column.confidence).toBe(0.9);
      expect(convertOne(values)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 'n/a']);
    });

    it('falls back to text below the confidence floor', () => {
      expect(inferOne(['1', '2', 'three', 'four'])).toEqual({ type: 'text', confidence: 1 });
      expect(inferOne(['1', '2', '3', 'four'], { minConfidence: 0.7 }).type).toBe('numeric');
      expect(inferOne(['1', '2', '3', 'four'], { minConfidence: NaN }).type).toBe('text');
      expect(inferOne(['1', '2', '3', 'four'], { minConfidence: -1 }).type).toBe('numeric');
      expect(inferOne(['1', '2', '3', '4'], { minConfidence: 5 }).type).toBe('numeric');
    });

    it('leaves a trailing total row unconverted', () => {
      const values = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100', 'Total'];

      expect(convertOne(values).at(-1)).toBe('Total');
    });
  });

  describe('data shapes and options', () => {
    it('infers every column of mixed data', () => {
      const rows = [
        ['Alice', '1.234,56', '12.03.2026', 'TRUE', 'Open'],
        ['Bob', '12,5', '13.03.2026', 'false', 'Closed'],
        ['Carol', '7', '14.03.2026', 'true', 'Open'],
        ['Dave', '99', '15.03.2026', 'false', 'Open'],
      ];
      const columns = inferColumnTypes(rows, { locale: 'de-DE' });

      expect(columns.map(column => column.type)).toEqual(['text', 'numeric', 'date', 'checkbox', 'dropdown']);
      expect(convertToInferredTypes(rows, columns)).toEqual([
        ['Alice', 1234.56, '2026-03-12', true, 'Open'],
        ['Bob', 12.5, '2026-03-13', false, 'Closed'],
        ['Carol', 7, '2026-03-14', true, 'Open'],
        ['Dave', 99, '2026-03-15', false, 'Open'],
      ]);
    });

    it('infers objects by key and names the property', () => {
      const rows = [
        { name: 'Alice', amount: '10.5', joined: '2026-01-02' },
        { name: 'Bob', amount: '7', joined: '2026-02-03' },
      ];
      const columns = inferColumnTypes(rows);

      expect(columns.map(column => [column.data, column.type]))
        .toEqual([['name', 'text'], ['amount', 'numeric'], ['joined', 'date']]);
      expect(convertToInferredTypes(rows, columns)).toEqual([
        { name: 'Alice', amount: 10.5, joined: '2026-01-02' },
        { name: 'Bob', amount: 7, joined: '2026-02-03' },
      ]);
    });

    it('infers every key the sampled object rows carry, in the order the keys first appear', () => {
      const rows = [{ id: '1' }, { id: '2', joined: '2026-01-01' }, { id: '3', joined: '2026-01-02' }];
      const columns = inferColumnTypes(rows);

      expect(columns.map(column => [column.data, column.type])).toEqual([['id', 'numeric'], ['joined', 'date']]);
      expect(convertToInferredTypes(rows, columns)).toEqual([
        { id: 1 },
        { id: 2, joined: '2026-01-01' },
        { id: 3, joined: '2026-01-02' },
      ]);
    });

    it('converts ragged and empty rows', () => {
      const rows = [['1', '2026-01-02'], ['2'], null, ['3', '2026-01-04', 'extra']];
      const columns = inferColumnTypes(rows);

      expect(convertToInferredTypes(rows, columns)).toEqual([[1, '2026-01-02'], [2], null, [3, '2026-01-04', 'extra']]);
    });

    it('reads every row for sampleSize Infinity, and 1000 rows by default', () => {
      const values = [...Array(1000).fill('1'), ...Array.from({ length: 200 }, (_, index) => `Note ${index}`)];

      expect(inferOne(values).type).toBe('numeric');
      expect(inferOne(values, { sampleSize: Infinity }).type).toBe('text');
    });

    it('reads null options leniently', () => {
      expect(() => inferColumnTypes([['1']], null)).not.toThrow();
      expect(inferOne(['a', 'b', 'a', 'b'], { dropdown: null }).type).toBe('dropdown');
      expect(inferOne(['a', 'b', 'a', 'b'], { dropdown: { maxOptions: 0 } }).type).toBe('text');
    });

    it('samples only the first sampleSize rows', () => {
      const values = ['1', '2', 'x', 'y', 'z'];

      expect(inferOne(values, { sampleSize: 2 }).type).toBe('numeric');
      expect(inferOne(values).type).toBe('text');
    });

    it('does not mutate the input', () => {
      const rows = [['1,5', 'TRUE'], ['2', 'false']];
      const copy = JSON.parse(JSON.stringify(rows));

      convertToInferredTypes(rows, inferColumnTypes(rows, { locale: 'de-DE' }));

      expect(rows).toEqual(copy);
    });

    it('returns plain, JSON-serializable column settings', () => {
      const columns = inferColumnTypes([['1,5', '2026-01-02', 'a'], ['2', '2026-01-03', 'a']], { locale: 'de-DE' });

      expect(JSON.parse(JSON.stringify(columns))).toEqual(columns);
    });

    it('defaults to the en-US locale, not the host one, and falls back to it for an invalid locale', () => {
      expect(convertOne(['1.234', '5.678'])).toEqual([1.234, 5.678]);
      expect(convertOne(['1.234', '5.678'], { locale: 'not a locale!' })).toEqual([1.234, 5.678]);
    });

    it('falls back to en-US for an unknown but well-formed locale tag instead of the host locale', () => {
      expect(resolveLocale('zz')).toBe('en-US');
      expect(resolveLocale('not a locale!')).toBe('en-US');
      expect(resolveLocale('de-DE')).toBe('de-DE');
    });

    it('returns an empty list for empty data', () => {
      expect(inferColumnTypes([])).toEqual([]);
    });
  });

  describe('converted values', () => {
    const corpus = [
      { values: ['1.234,56', '12,5', '7', null], locale: 'de-DE' },
      { values: ['$1,234.50', '$12.00', '-$3.25'] },
      { values: ['12.5%', '50%', '7.25%'] },
      { values: ['12/03/2026', '01/02/2026', ''], locale: 'en-GB' },
      { values: ['12/03/2026', '01/02/2026'], locale: 'en-US' },
      { values: ['2026-03-12', '2026-12-01'] },
      { values: ['9:05 PM', '12:00 am', '14:30'] },
      { values: ['TRUE', 'false', true, null] },
      { values: [1, '2', 3.5] },
      { values: ['Open', 'Closed', 'Open', 'Open', null] },
      { values: ['1 234,56 zł', '12,5 zł', '7 zł'], locale: 'pl-PL' },
    ];

    corpus.forEach(({ values, locale }) => {
      it(`are accepted by the inferred cell type: ${JSON.stringify(values)} (${locale ?? 'default'})`, () => {
        const column = inferOne(values, { locale });
        const converted = convertOne(values, { locale });
        const rejected = converted.filter(value => !isAcceptedByCellType(column, value));

        expect(column.type).not.toBe('text');
        expect(rejected).toEqual([]);
      });
    });
  });
});
