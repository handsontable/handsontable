import Handsontable from '../../../index';
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
  const [column] = inferColumnTypes(columnsToRows(values), options).columns;

  // The settings and the description of the inference are asserted together here; the nesting itself
  // is pinned in "the result shape".
  return { ...column.settings, ...column, settings: undefined };
}

/**
 * Infers and converts a single column, returning the converted values.
 * @param values
 * @param options
 */
function convertOne(values, options) {
  const rows = columnsToRows(values);
  const result = inferColumnTypes(rows, options);

  return convertToInferredTypes(rows, result).map(row => row[0]);
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

    it('reads a long run of fraction zeros in linear time', () => {
      const values = [`1.${'0'.repeat(300000)}1`, '2'];

      expect(inferOne(values).type).toBe('text');
      expect(inferOne([`1.5${'0'.repeat(300000)}`, '2']).type).toBe('numeric');
    });

    it('counts the fraction digits of numbers printed in exponent form', () => {
      expect(inferOne([1.5e-7, 2.5e-7, 3e-7]).numericFormat.maximumFractionDigits).toBe(8);
    });

    it('reads the bare numbers of a currency column as that currency, whatever the order', () => {
      ['$5', '5', '5', '$5'].forEach((_, offset, values) => {
        const rotated = [...values.slice(offset), ...values.slice(0, offset)];

        expect(inferOne(rotated).numericFormat.currency).toBe('USD');
        expect(convertOne(rotated)).toEqual(rotated.map(value => Number(value.replace('$', ''))));
      });
      expect(inferOne(['$1,000', '250', '300']).type).toBe('numeric');
      expect(convertOne(['$1,000', '250', '300'])).toEqual([1000, 250, 300]);
    });

    it('settles a column with two currencies on the one that reads more values', () => {
      const dollars = Array.from({ length: 9 }, (_, index) => `$${index + 1}`);
      const euros = Array.from({ length: 9 }, (_, index) => `\u20ac${index + 1}`);

      expect(inferOne([...dollars, '\u20ac6']).numericFormat.currency).toBe('USD');
      expect(inferOne(['\u20ac6', ...dollars]).numericFormat.currency).toBe('USD');
      expect(inferOne([...euros, '$6']).numericFormat.currency).toBe('EUR');
      expect(inferOne(['$5', '\u20ac6']).type).toBe('text');
    });

    it('matches the longest currency symbol first', () => {
      expect(inferOne(['R$ 12,50', 'R$ 7'], { locale: 'pt-BR' }).numericFormat.currency).toBe('BRL');
    });

    it('reads the typographic apostrophe as grouping', () => {
      expect(convertOne(['1\u2019234.50', '12.5'], { locale: 'de-CH' })).toEqual([1234.5, 12.5]);
    });

    it('rules a column out of numeric when any value is a zero-led code', () => {
      const zips = [...Array.from({ length: 95 }, (_, index) => String(10000 + index)), '02134', '02135', '02136'];

      expect(inferOne(zips).type).toBe('text');
      expect(convertOne(zips)[0]).toBe('10000');
      expect(inferOne(['0.5', '0', '10']).type).toBe('numeric');
    });

    it('pads the fraction digits of text values only, so a computed float does not pad the column', () => {
      const column = inferOne([1, 2.5, 1 / 3, 10]);

      expect(column.numericFormat.minimumFractionDigits).toBe(0);
      expect(column.numericFormat.maximumFractionDigits).toBe(15);
      expect(inferOne(['1.50', '2.00', 0.125]).numericFormat).toEqual(expect.objectContaining({
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      }));
    });

    it('reads accounting negatives, exponents, and ISO currency codes', () => {
      expect(convertOne(['(1,234.00)', '5.5'])).toEqual([-1234, 5.5]);
      expect(convertOne(['($5)', '$7'])).toEqual([-5, 7]);
      expect(convertOne(['1.23E+15', '4e2', '1.5E-7'])).toEqual([1.23e15, 400, 1.5e-7]);
      expect(inferOne(['1.23E+15', '4e2']).numericFormat.maximumFractionDigits).toBe(0);
      expect(inferOne(['1.5E-3', '2E-3']).numericFormat.maximumFractionDigits).toBe(4);
      expect(inferOne(['12.00 USD', 'USD 7.50']).numericFormat).toEqual(expect.objectContaining({
        style: 'currency',
        currency: 'USD',
      }));
      expect(convertOne(['12.00 USD', 'USD 7.50'])).toEqual([12, 7.5]);
      expect(inferOne(['12.00 PLN', '7 PLN'], { locale: 'en-US' }).numericFormat.currency).toBe('PLN');
    });

    it('reads signed space-grouped quantities, and still keeps a phone number as text', () => {
      expect(convertOne(['+1 234,5', '-1 234,5', '2,5'], { locale: 'fr-FR' })).toEqual([1234.5, -1234.5, 2.5]);
      expect(inferOne(['+48 601 234 567', '+48 502 111 222']).type).toBe('text');
    });

    it('keeps a space-grouped integer of nine digits or more as text', () => {
      expect(inferOne(['601 234 567', '502 111 222', '600 000 001']).type).toBe('text');
      expect(convertOne(['1 234 567', '12 345'], { locale: 'pl-PL' })).toEqual([1234567, 12345]);
      expect(convertOne(['601 234 567,5', '1,5'], { locale: 'pl-PL' })).toEqual([601234567.5, 1.5]);
    });

    it('reads large amounts grouped by the spaces Intl writes, and keeps a typed phone number as text', () => {
      const nnbsp = '\u202f';
      const nbsp = '\u00a0';

      expect(convertOne([`1${nnbsp}234${nnbsp}567${nnbsp}890`, '5'], { locale: 'fr-FR' })).toEqual([1234567890, 5]);
      expect(convertOne([`1${nbsp}234${nbsp}567${nbsp}890`, '5'], { locale: 'pl-PL' })).toEqual([1234567890, 5]);
      expect(convertOne(['1 234 567 890 \u20ac', '5 \u20ac'], { locale: 'fr-FR' })).toEqual([1234567890, 5]);
      expect(inferOne(['1 234 567 890 \u20ac', '5 \u20ac'], { locale: 'fr-FR' }).numericFormat.currency).toBe('EUR');
      expect(convertOne(['12 345 678%', '5%'])).toEqual([123456.78, 0.05]);
      expect(inferOne(['601 234 567', '502 111 222']).type).toBe('text');
      expect(convertOne(['12 345 678', '5'], { locale: 'pl-PL' })).toEqual([12345678, 5]);
    });

    it('reads an ISO currency code only from a short list, with a space before the digits', () => {
      ['TOP 10', 'ALL 5', 'MAD 3', 'TRY 7', 'PEN 9'].forEach((word) => {
        expect(inferOne([word, word, word]).type).not.toBe('numeric');
      });
      expect(inferOne(['PLN1', 'PLN2', 'PLN3']).type).not.toBe('numeric');
      expect(inferOne(['USD12', 'USD5']).type).not.toBe('numeric');
      expect(convertOne(['CAD 1', 'CAD 2.50'])).toEqual([1, 2.5]);
      expect(inferOne(['CAD 1', 'CAD 2.50']).numericFormat.currency).toBe('CAD');
      expect(convertOne(['12.00 SEK', 'SEK 7.50'])).toEqual([12, 7.5]);
    });

    it('does not turn a value that underflows into zero', () => {
      const values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '1.5E-400'];

      expect(inferOne(values).type).toBe('numeric');
      expect(convertOne(values)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, '1.5E-400']);
      expect(convertOne(['0E-400', '0.0', '1', '2', '3', '4', '5', '6', '7', '8'])[0]).toBe(0);
      expect(convertOne(['1E999', '1', '2', '3', '4', '5', '6', '7', '8', '9'])[0]).toBe('1E999');
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
        const result = inferColumnTypes(rows, { sampleSize: 2, locale });

        expect(result.columns[0].inputFormat).toEqual({ dateOrder: locale === 'en-US' ? 'MDY' : 'DMY' });
        expect(convertToInferredTypes(rows, result)[2][0]).toBe(locale === 'en-US' ? '2026-03-04' : '2026-04-03');
      });
    });

    it('reads the day-month order of a year-first locale without its year', () => {
      expect(convertOne(['12/03/2026', '01/02/2026'], { locale: 'sv-SE' })).toEqual(['2026-03-12', '2026-02-01']);
      expect(convertOne(['12/03/2026', '01/02/2026'], { locale: 'ja-JP' })).toEqual(['2026-12-03', '2026-01-02']);
    });

    it('reads a dot as a day-first date whatever the locale', () => {
      expect(convertOne(['12.03.2026', '01.04.2026'], { locale: 'en-US' })).toEqual(['2026-03-12', '2026-04-01']);
      expect(inferOne(['12.03.2026', '01.04.2026'], { locale: 'en-US' }).confidence).toBe(1);
      expect(convertOne(['03.25.2026', '01.04.2026'], { locale: 'en-US' })).toEqual(['2026-03-25', '2026-01-04']);
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

    it('counts padded values as one option, and converts them trimmed', () => {
      const values = ['Open', 'Open ', 'Closed', 'Closed', 'Open', 'Open', 'Closed'];
      const column = inferOne(values, { stats: true });

      expect(column.type).toBe('dropdown');
      expect(column.source).toEqual(['Open', 'Closed']);
      expect(column.stats.distinctCount).toBe(column.source.length);
      expect(convertOne(values)).toEqual(['Open', 'Open', 'Closed', 'Closed', 'Open', 'Open', 'Closed']);
      expect(inferOne([...values, ' Open']).source).toEqual(['Open', 'Closed']);
    });

    it('needs two options and six values', () => {
      expect(inferOne(['yes', 'yes', 'yes', 'yes', 'yes', 'yes']).type).toBe('text');
      expect(inferOne(['yes', 'no', 'yes', 'no']).type).toBe('text');
      expect(inferOne(['yes', 'no', 'yes', 'no', 'yes', 'no']).type).toBe('dropdown');
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

    it('keeps a typed column typed when one stray value would let a dropdown read every string', () => {
      // Few distinct values, so a dropdown would qualify and read every string (a share of 1).
      const repeat = (items, times, stray) => [
        ...Array.from({ length: times }, () => items).flat(),
        stray,
      ];
      const cases = [
        ['numeric', repeat(['1', '2', '3'], 3, 'n/a'), 1],
        ['date', repeat(['01.01.2026', '02.01.2026', '03.01.2026'], 3, '?'), '2026-01-01'],
        ['checkbox', repeat(['true', 'false'], 5, 'n/a'), true],
        ['numeric', repeat(['5%', '10%'], 5, '-'), 0.05],
      ];

      cases.forEach(([type, values, firstConverted]) => {
        const column = inferOne(values);

        expect(column.type).toBe(type);
        expect(column.source).toBeUndefined();
        expect(convertOne(values)[0]).toBe(firstConverted);
      });
    });

    it('tries a dropdown only when no typed detector reaches the floor, and names it the runner-up', () => {
      const values = ['1', '2', '3', '1', '2', '3', '1', '2', '3', 'n/a'];

      expect(inferOne(values, { stats: true }).type).toBe('numeric');
      expect(inferOne(values, { stats: true }).stats.runnerUpType).toBe('dropdown');
      expect(inferOne(['1', '2', '1', '2', '1', '2', 'x', 'y', 'x', 'y']).type).toBe('dropdown');
    });

    it('gives the type that reads the most values, and the earlier detector a tie', () => {
      const values = ['true', 'true', 'true', 'true', '1', '2', '3', '4', '5', '6'];

      expect(inferOne(values, { minConfidence: 0.4 }).type).toBe('numeric');
      expect(convertOne(values, { minConfidence: 0.4 }).slice(4)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(inferOne(['1', '2', '1', '2', '1', '2'], { minConfidence: 0.4 }).type).toBe('numeric');
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
        ['Eve', '3,5', '16.03.2026', 'true', 'Closed'],
        ['Frank', '40', '17.03.2026', 'false', 'Open'],
      ];
      const result = inferColumnTypes(rows, { locale: 'de-DE' });

      expect(result.columns.map(column => column.settings.type))
        .toEqual(['text', 'numeric', 'date', 'checkbox', 'dropdown']);
      expect(convertToInferredTypes(rows, result)).toEqual([
        ['Alice', 1234.56, '2026-03-12', true, 'Open'],
        ['Bob', 12.5, '2026-03-13', false, 'Closed'],
        ['Carol', 7, '2026-03-14', true, 'Open'],
        ['Dave', 99, '2026-03-15', false, 'Open'],
        ['Eve', 3.5, '2026-03-16', true, 'Closed'],
        ['Frank', 40, '2026-03-17', false, 'Open'],
      ]);
    });

    it('infers objects by key and names the property', () => {
      const rows = [
        { name: 'Alice', amount: '10.5', joined: '2026-01-02' },
        { name: 'Bob', amount: '7', joined: '2026-02-03' },
      ];
      const result = inferColumnTypes(rows);

      expect(result.columns.map(({ settings }) => [settings.data, settings.type]))
        .toEqual([['name', 'text'], ['amount', 'numeric'], ['joined', 'date']]);
      expect(convertToInferredTypes(rows, result)).toEqual([
        { name: 'Alice', amount: 10.5, joined: '2026-01-02' },
        { name: 'Bob', amount: 7, joined: '2026-02-03' },
      ]);
    });

    it('infers every key the sampled object rows carry, in the order the keys first appear', () => {
      const rows = [{ id: '1' }, { id: '2', joined: '2026-01-01' }, { id: '3', joined: '2026-01-02' }];
      const result = inferColumnTypes(rows);

      expect(result.columns.map(({ settings }) => [settings.data, settings.type]))
        .toEqual([['id', 'numeric'], ['joined', 'date']]);
      expect(convertToInferredTypes(rows, result)).toEqual([
        { id: 1 },
        { id: 2, joined: '2026-01-01' },
        { id: 3, joined: '2026-01-02' },
      ]);
    });

    it('converts ragged and empty rows', () => {
      const rows = [['1', '2026-01-02'], ['2'], null, ['3', '2026-01-04', 'extra']];
      const result = inferColumnTypes(rows);

      expect(convertToInferredTypes(rows, result)).toEqual([[1, '2026-01-02'], [2], null, [3, '2026-01-04', 'extra']]);
    });

    it('reads every row for sampleSize Infinity, and 1000 rows by default', () => {
      const values = [...Array(1000).fill('1'), ...Array.from({ length: 200 }, (_, index) => `Note ${index}`)];

      expect(inferOne(values).type).toBe('numeric');
      expect(inferOne(values, { sampleSize: Infinity }).type).toBe('text');
    });

    it('reads null options leniently', () => {
      expect(() => inferColumnTypes([['1']], null)).not.toThrow();
      expect(inferOne(['a', 'b', 'a', 'b', 'a', 'b'], { dropdown: null }).type).toBe('dropdown');
      expect(inferOne(['a', 'b', 'a', 'b', 'a', 'b'], { dropdown: { maxOptions: 0 } }).type).toBe('text');
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
      const result = inferColumnTypes(
        [['Price', 'Joined', 'Tag'], ['1,5', '2026-01-02', 'a'], ['2', '2026-01-03', 'a']],
        { locale: 'de-DE', headerRow: true, stats: true }
      );

      expect(JSON.parse(JSON.stringify(result))).toEqual(result);
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
      expect(inferColumnTypes([])).toEqual({ columns: [], headerRow: false });
    });
  });

  describe('the result shape', () => {
    it('keeps the grid column options apart from what describes the inference', () => {
      const result = inferColumnTypes([['1,5', '2026-01-02'], ['2', '2026-01-03']], { locale: 'de-DE' });

      expect(Object.keys(result)).toEqual(['columns', 'headerRow']);
      expect(result.columns).toEqual([
        {
          settings: {
            type: 'numeric',
            numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false },
          },
          confidence: 1,
          inputFormat: { decimalSeparator: ',' },
        },
        {
          settings: { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
          confidence: 1,
          inputFormat: { dateOrder: 'DMY' },
        },
      ]);
    });

    it('leaves confidence, inputFormat, title and stats out of the settings', () => {
      const [column] = inferColumnTypes([['Price'], ['1.5'], ['2']], { headerRow: true, stats: true }).columns;

      expect(Object.keys(column.settings).sort()).toEqual(['numericFormat', 'type']);
      expect(column.title).toBe('Price');
      expect(column.stats).toBeDefined();
      expect(column.confidence).toBe(1);
    });

    it('sets title and stats only when asked for', () => {
      const [column] = inferColumnTypes([['1'], ['2']]).columns;

      expect(Object.keys(column).sort()).toEqual(['confidence', 'inputFormat', 'settings']);
    });

    it('puts the object key into settings.data and title', () => {
      const [column] = inferColumnTypes([{ price: '1' }, { price: '2' }]).columns;

      expect(column.settings.data).toBe('price');
      expect(column.title).toBe('price');
    });
  });

  describe('headerRow', () => {
    const table = [
      ['Name', 'Amount', 'Joined'],
      ['Alice', '1.5', '2026-01-02'],
      ['Bob', '7', '2026-02-03'],
      ['Carol', '12', '2026-03-04'],
    ];

    it('takes the first row as data by default', () => {
      const result = inferColumnTypes(table);

      expect(result.headerRow).toBe(false);
      expect(result.columns.map(column => column.title)).toEqual([undefined, undefined, undefined]);
      expect(result.columns.map(column => column.settings.type)).toEqual(['text', 'text', 'text']);
    });

    it('leaves the header row out of the inference and returns its cells as titles', () => {
      const result = inferColumnTypes(table, { headerRow: true, minConfidence: 1 });

      expect(result.headerRow).toBe(true);
      expect(result.columns.map(column => column.title)).toEqual(['Name', 'Amount', 'Joined']);
      expect(result.columns.map(column => column.settings.type)).toEqual(['text', 'numeric', 'date']);
      expect(result.columns.map(column => column.confidence)).toEqual([1, 1, 1]);
    });

    it('leaves the header row out of the converted data', () => {
      const result = inferColumnTypes(table, { headerRow: true });

      expect(convertToInferredTypes(table, result)).toEqual([
        ['Alice', 1.5, '2026-01-02'],
        ['Bob', 7, '2026-02-03'],
        ['Carol', 12, '2026-03-04'],
      ]);
    });

    it('keeps every row when no header row was found', () => {
      const result = inferColumnTypes(table, { headerRow: false });

      expect(convertToInferredTypes(table, result)).toHaveLength(4);
    });

    it('counts sampleSize in data rows, not in the header row', () => {
      const result = inferColumnTypes(
        [['Amount'], ['1'], ['2'], ['x']],
        { headerRow: true, sampleSize: 2, minConfidence: 1, stats: true }
      );

      expect(result.columns[0].settings.type).toBe('numeric');
      expect(result.columns[0].stats.count).toBe(2);
    });

    it('trims a title, and gives a blank header cell an empty title', () => {
      const result = inferColumnTypes([['  Price ', ''], ['1', '2'], ['3', '4']], { headerRow: true });

      expect(result.columns.map(column => column.title)).toEqual(['Price', '']);
    });

    it('titles a column the data rows reach past the header', () => {
      const result = inferColumnTypes([['A'], ['1', '2']], { headerRow: true });

      expect(result.columns.map(column => column.title)).toEqual(['A', '']);
    });

    it('reads a lone header row as a header over empty text columns', () => {
      const result = inferColumnTypes([['A', 'B']], { headerRow: true });

      expect(result.columns.map(column => [column.title, column.settings.type, column.confidence]))
        .toEqual([['A', 'text', 0], ['B', 'text', 0]]);
      expect(convertToInferredTypes([['A', 'B']], result)).toEqual([]);
    });

    it('has no header row to take in empty data or object rows', () => {
      expect(inferColumnTypes([], { headerRow: true })).toEqual({ columns: [], headerRow: false });

      const rows = [{ price: '1' }, { price: '2' }];
      const result = inferColumnTypes(rows, { headerRow: true });

      expect(result.headerRow).toBe(false);
      expect(result.columns[0].title).toBe('price');
      expect(convertToInferredTypes(rows, result)).toEqual([{ price: 1 }, { price: 2 }]);
    });

    describe('the auto value', () => {
      const detect = (rows, options) => inferColumnTypes(rows, { headerRow: 'auto', ...options });

      it('finds a header over typed columns', () => {
        const result = detect(table);

        expect(result.headerRow).toBe(true);
        expect(result.columns.map(column => column.title)).toEqual(['Name', 'Amount', 'Joined']);
      });

      it('finds a header over a checkbox, a time, and a currency column', () => {
        expect(detect([['Active'], ['TRUE'], ['false']]).headerRow).toBe(true);
        expect(detect([['Start'], ['9:05'], ['14:30']]).headerRow).toBe(true);
        expect(detect([['Price'], ['$5'], ['$7.50']]).headerRow).toBe(true);
      });

      it('reads a table of text only as data, since nothing tells a header from a row', () => {
        const result = detect([['Name', 'City'], ['Alice', 'Paris'], ['Bob', 'Rome']]);

        expect(result.headerRow).toBe(false);
        expect(result.columns.map(column => column.title)).toEqual([undefined, undefined]);
      });

      it('reads a first row the typed column reads as data', () => {
        expect(detect([['1', '2'], ['3', '4'], ['5', '6']]).headerRow).toBe(false);
        expect(detect([['true'], ['false'], ['TRUE']]).headerRow).toBe(false);
        expect(detect([['2026-01-01'], ['2026-01-02']]).headerRow).toBe(false);
      });

      it('reads a first row with a number, a blank cell, or too few cells as data', () => {
        expect(detect([['Name', 5], ['Alice', 6], ['Bob', 7]]).headerRow).toBe(false);
        expect(detect([['Name', ''], ['Alice', '6'], ['Bob', '7']]).headerRow).toBe(false);
        expect(detect([['Name'], ['Alice', '6'], ['Bob', '7']]).headerRow).toBe(false);
      });

      it('finds a header over a table that has a dropdown column', () => {
        const rows = [['Name', 'Status'], ['A', 'Open'], ['B', 'Closed'], ['C', 'Open'], ['D', 'Closed'],
          ['E', 'Open'], ['F', 'Open']];

        expect(detect(rows).headerRow).toBe(false);

        const withNumbers = [['Qty', 'Status'], ['1', 'Open'], ['2', 'Closed'], ['3', 'Open'], ['4', 'Closed'],
          ['5', 'Open'], ['6', 'Open']];
        const result = detect(withNumbers);

        expect(result.headerRow).toBe(true);
        expect(result.columns.map(column => [column.title, column.settings.type]))
          .toEqual([['Qty', 'numeric'], ['Status', 'dropdown']]);
        expect(convertToInferredTypes(withNumbers, result)).toHaveLength(6);
      });

      it('reads a first row as data when a dropdown is the only non-text column', () => {
        const rows = [['Name', 'Status'], ['A', 'Open'], ['B', 'Closed'], ['C', 'Open'], ['D', 'Closed'],
          ['E', 'Open'], ['F', 'Open']];

        expect(detect(rows).headerRow).toBe(false);
      });

      it('reads a first row that holds a missing-value word as a record, and keeps it', () => {
        const rows = [['Alice', 'n/a'], ['Bob', '5'], ['Carol', '7'], ['Dave', '9'], ['Eve', '11']];

        ['n/a', 'N/A', '-', '--', 'null', 'NA', '#N/A', '?', ' none '].forEach((word) => {
          const withGap = [['Alice', word], ...rows.slice(1)];
          const result = detect(withGap);

          expect(result.headerRow).toBe(false);
          expect(convertToInferredTypes(withGap, result)).toHaveLength(5);
        });

        expect(convertToInferredTypes(rows, detect(rows))[0]).toEqual(['Alice', 'n/a']);
      });

      it('reads a first row as data when any typed column reads its cell', () => {
        const rows = [['Score', '2026-01-01'], ['5', '2026-02-01'], ['7', '2026-02-02'], ['9', '2026-02-03']];

        expect(detect(rows).headerRow).toBe(false);
        expect(detect([['Alice', '-', '2026-01-01'], ['Bob', '5', '2026-02-01'], ['Eve', '7', '2026-02-02']]).headerRow)
          .toBe(false);
        expect(detect([['Score', 'Joined'], ['5', '2026-02-01'], ['7', '2026-02-02']]).headerRow).toBe(true);
      });

      it('settles on one header column that differs from its data', () => {
        expect(detect([['Name', 'City', 'Rank'], ['Alice', 'Paris', '1'], ['Bob', 'Rome', '2']]).headerRow).toBe(true);
      });

      it('infers the data rows the same way whether or not it finds a header', () => {
        const withHeader = detect(table);

        expect(withHeader.columns).toEqual(inferColumnTypes(table, { headerRow: true }).columns);
        expect(detect([['Alice', '1'], ['Bob', '2']]).columns)
          .toEqual(inferColumnTypes([['Alice', '1'], ['Bob', '2']]).columns);
      });

      it('converts the way it inferred', () => {
        const result = detect(table);

        expect(convertToInferredTypes(table, result)).toHaveLength(3);

        const dataOnly = [['Alice', '1'], ['Bob', '2']];

        expect(convertToInferredTypes(dataOnly, detect(dataOnly))).toEqual([['Alice', 1], ['Bob', 2]]);
      });
    });
  });

  describe('stats', () => {
    const stats = (values, options) => inferOne(values, { stats: true, ...options }).stats;

    it('is not returned unless asked for', () => {
      expect(inferOne(['1', '2']).stats).toBeUndefined();
      expect(inferOne(['1', '2'], { stats: false }).stats).toBeUndefined();
      expect(inferOne(['1', '2'], { stats: null }).stats).toBeUndefined();
    });

    it('counts values, blanks, and distinct values, and lists examples', () => {
      expect(stats(['10', '2', '2', null, 'abc', '7', '  ', ''], { minConfidence: 0.7 })).toEqual({
        count: 5,
        emptyCount: 3,
        distinctCount: 4,
        examples: ['10', '2', 'abc', '7'],
        min: 2,
        max: 10,
        runnerUpType: 'text',
      });
    });

    it('compares distinct values as trimmed text', () => {
      expect(stats(['a', ' a', 'a ']).distinctCount).toBe(1);
      expect(stats([1, '1', ' 1 ']).distinctCount).toBe(1);
    });

    it('keeps the first examples, in order, up to the limit', () => {
      const values = ['d', 'c', 'b', 'a', 'e', 'f', 'g', 'a'];

      expect(stats(values).examples).toEqual(['d', 'c', 'b', 'a', 'e']);
      expect(stats(values, { stats: { examples: 2 } }).examples).toEqual(['d', 'c']);
      expect(stats(values, { stats: { examples: 0 } })).toEqual(expect.objectContaining({ examples: [], count: 8 }));
      expect(stats(values, { stats: { examples: -1 } }).examples).toHaveLength(5);
    });

    it('lists a Date by its ISO string, not by the host time zone', () => {
      expect(stats([new Date(Date.UTC(2026, 0, 2, 3, 4, 5))]).examples).toEqual(['2026-01-02T03:04:05.000Z']);
    });

    it('takes min and max over the converted values of a numeric column', () => {
      expect(stats(['$1,234.50', '$12.00', '-$3.25'])).toEqual(expect.objectContaining({ min: -3.25, max: 1234.5 }));
      expect(stats(['12.5%', '50%'])).toEqual(expect.objectContaining({ min: 0.125, max: 0.5 }));
    });

    it('takes min and max of date and time columns as ISO text', () => {
      expect(stats(['2026-03-12', '2025-12-01', '2026-01-05']))
        .toEqual(expect.objectContaining({ min: '2025-12-01', max: '2026-03-12' }));
      expect(stats(['9:05 PM', '12:00 am', '14:30']))
        .toEqual(expect.objectContaining({ min: '00:00:00', max: '21:05:00' }));
    });

    it('takes min and max over a very large sample', () => {
      const values = Array.from({ length: 100000 }, (_, index) => String((index * 7919) % 100003));
      const result = stats(values, { sampleSize: Infinity });

      expect(result).toEqual(expect.objectContaining({ count: 100000, min: 0, max: 100002 }));
    });

    it('sets no min and max for the other types', () => {
      ['text', 'checkbox', 'dropdown'].forEach((type) => {
        const values = {
          text: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'],
          checkbox: ['TRUE', 'false'],
          dropdown: ['Open', 'Closed', 'Open', 'Closed', 'Open', 'Closed'],
        }[type];
        const result = stats(values);

        expect(inferOne(values).type).toBe(type);
        expect('min' in result).toBe(false);
        expect('max' in result).toBe(false);
      });
    });

    it('names the type that came closest as the runner-up of a text column', () => {
      expect(inferOne(['1', '2', '3', 'x'], { stats: true })).toEqual(expect.objectContaining({
        type: 'text',
        stats: expect.objectContaining({ runnerUpType: 'numeric' }),
      }));
    });

    it('names a rival type that reads the same values, in detector order for a tie', () => {
      expect(stats(['1', '2', '1', '2', '1', '2']).runnerUpType).toBe('dropdown');
      expect(stats(['TRUE', 'false', 'TRUE', 'false', 'TRUE', 'false']).runnerUpType).toBe('dropdown');
    });

    it('names text as the runner-up of a type with no rival', () => {
      expect(stats(['2026-01-01', '2026-01-02']).runnerUpType).toBe('text');
    });

    it('sets no runner-up when nothing reads any value', () => {
      expect(stats(['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'])).toEqual({
        count: 6,
        emptyCount: 0,
        distinctCount: 6,
        examples: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
      });
      expect(stats([null, '', ' '])).toEqual({ count: 0, emptyCount: 3, distinctCount: 0, examples: [] });
    });

    it('describes only the sampled rows', () => {
      expect(stats(['1', '2', 'x', 'y'], { sampleSize: 2 })).toEqual(expect.objectContaining({
        count: 2,
        distinctCount: 2,
        min: 1,
        max: 2,
      }));
    });

    it('does not change the settings or the confidence', () => {
      const rows = [['1,5', '12.03.2026', 'a'], ['2', '13.03.2026', 'a'], ['x', '14.03.2026', 'b']];
      const withStats = inferColumnTypes(rows, { locale: 'de-DE', minConfidence: 0.5, stats: true });
      const without = inferColumnTypes(rows, { locale: 'de-DE', minConfidence: 0.5 });

      expect(withStats.columns.map(({ stats: omitted, ...column }) => column)).toEqual(without.columns);
    });
  });

  describe('sampling', () => {
    /**
     * Builds rows whose only cell is the row index as text, so the sampled rows can be read back
     * from `stats.examples`.
     * @param {number} count
     */
    function indexRows(count) {
      return Array.from({ length: count }, (_, index) => [String(index)]);
    }

    /**
     * Returns the row indexes a sampling reads, in the order it reads them.
     * @param {Array} rows
     * @param {object} options
     */
    function sampledIndexes(rows, options) {
      const [column] = inferColumnTypes(rows, { ...options, stats: { examples: Infinity } }).columns;

      return column.stats.examples.map(Number);
    }

    it('reads the first rows by default and with sampling: head', () => {
      const rows = indexRows(10);

      expect(sampledIndexes(rows, { sampleSize: 4 })).toEqual([0, 1, 2, 3]);
      expect(sampledIndexes(rows, { sampleSize: 4, sampling: 'head' })).toEqual([0, 1, 2, 3]);
      expect(inferColumnTypes(rows, { sampleSize: 4, sampling: 'head' }))
        .toEqual(inferColumnTypes(rows, { sampleSize: 4 }));
    });

    it('reads evenly spaced rows with sampling: spread, the first and the last included', () => {
      expect(sampledIndexes(indexRows(10), { sampleSize: 4, sampling: 'spread' })).toEqual([0, 3, 6, 9]);
      expect(sampledIndexes(indexRows(100), { sampleSize: 3, sampling: 'spread' })).toEqual([0, 49, 99]);
      expect(sampledIndexes(indexRows(7), { sampleSize: 2, sampling: 'spread' })).toEqual([0, 6]);
    });

    it('reads every row when sampleSize covers the data, and the first row for a sampleSize of 1', () => {
      expect(sampledIndexes(indexRows(5), { sampleSize: 5, sampling: 'spread' })).toEqual([0, 1, 2, 3, 4]);
      expect(sampledIndexes(indexRows(5), { sampleSize: 50, sampling: 'spread' })).toEqual([0, 1, 2, 3, 4]);
      expect(sampledIndexes(indexRows(5), { sampleSize: Infinity, sampling: 'spread' })).toEqual([0, 1, 2, 3, 4]);
      expect(sampledIndexes(indexRows(5), { sampleSize: 1, sampling: 'spread' })).toEqual([0]);
    });

    it('reads an unknown sampling value as head', () => {
      expect(sampledIndexes(indexRows(10), { sampleSize: 3, sampling: 'random' })).toEqual([0, 1, 2]);
    });

    it('finds a dropdown option that appears only late in sorted data', () => {
      const values = [
        ...Array(500).fill('Closed'),
        ...Array(500).fill('Open'),
        ...Array(500).fill('Pending'),
      ];
      const head = inferOne(values, { sampleSize: 100 });
      const spread = inferOne(values, { sampleSize: 100, sampling: 'spread' });

      expect(head.type).toBe('text');
      expect(spread.type).toBe('dropdown');
      expect(spread.source).toEqual(['Closed', 'Open', 'Pending']);
      expect(convertOne(values, { sampleSize: 100, sampling: 'spread' })
        .filter(value => !isAcceptedByCellType(spread, value))).toEqual([]);
    });

    it('does not count a header row, also when headerRow: auto decides it', () => {
      const rows = [['Amount'], ...indexRows(9).map(([value]) => [`${value}.5`])];

      ['auto', true].forEach((headerRow) => {
        const result = inferColumnTypes(rows, { headerRow, sampleSize: 3, sampling: 'spread', stats: true });

        expect(result.headerRow).toBe(true);
        expect(result.columns[0].stats.examples).toEqual(['0.5', '4.5', '8.5']);
      });
    });

    it('spreads over every row when headerRow: auto finds no header', () => {
      const rows = indexRows(9);
      const result = inferColumnTypes(rows, { headerRow: 'auto', sampleSize: 3, sampling: 'spread', stats: true });

      expect(result.headerRow).toBe(false);
      expect(result.columns[0].stats.examples).toEqual(['0', '4', '8']);
    });

    it('takes the keys of object rows from the spread sample', () => {
      const rows = [
        ...Array.from({ length: 8 }, (_, index) => ({ id: String(index) })),
        { id: '8', note: 'late' },
      ];

      expect(inferColumnTypes(rows, { sampleSize: 3 }).columns.map(({ settings }) => settings.data))
        .toEqual(['id']);
      expect(inferColumnTypes(rows, { sampleSize: 3, sampling: 'spread' }).columns.map(({ settings }) => settings.data))
        .toEqual(['id', 'note']);
    });
  });

  describe('dateFormats', () => {
    it('reads a listed format instead of the locale order', () => {
      const options = { locale: 'en-US', dateFormats: ['DD/MM/YYYY'] };
      const column = inferOne(['12/03/2026', '01/02/2026'], options);

      expect(column.type).toBe('date');
      expect(column.confidence).toBe(1);
      expect(column.inputFormat).toEqual({ dateFormat: 'DD/MM/YYYY' });
      expect(convertOne(['12/03/2026', '01/02/2026'], options)).toEqual(['2026-03-12', '2026-02-01']);
    });

    it('takes the listed format that reads the most values, and the first one on a tie', () => {
      const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY'];

      expect(inferOne(['03/25/2026', '01/02/2026'], { dateFormats }).inputFormat)
        .toEqual({ dateFormat: 'MM/DD/YYYY' });
      expect(convertOne(['03/25/2026', '01/02/2026'], { dateFormats })).toEqual(['2026-03-25', '2026-01-02']);
      expect(inferOne(['12/03/2026', '01/02/2026'], { dateFormats }).inputFormat)
        .toEqual({ dateFormat: 'DD/MM/YYYY' });
    });

    it('still reads ISO dates next to a listed format', () => {
      expect(convertOne(['2026-03-12', '13.03.2026'], { dateFormats: ['DD.MM.YYYY'] }))
        .toEqual(['2026-03-12', '2026-03-13']);
    });

    it('replaces the built-in year-last reading', () => {
      expect(inferOne(['12/03/2026', '13/03/2026'], { dateFormats: ['YYYY.MM.DD'] }).type).toBe('text');
    });

    it('reads one- and two-digit parts by the token, with any literal between them', () => {
      expect(convertOne(['1-4-2026', '12-3-2026'], { dateFormats: ['D-M-YYYY'] }))
        .toEqual(['2026-04-01', '2026-03-12']);
      expect(inferOne(['1-4-2026', '12-3-2026'], { dateFormats: ['DD-MM-YYYY'] }).type).toBe('text');
      expect(convertOne(['2026年3月12日', '2026年12月1日'], { dateFormats: ['YYYY年M月D日'] }))
        .toEqual(['2026-03-12', '2026-12-01']);
      expect(convertOne([' 12. 03. 2026 ', '1. 04. 2026'], { dateFormats: ['D. MM. YYYY'] }))
        .toEqual(['2026-03-12', '2026-04-01']);
    });

    it('mirrors the zero padding of the values in the date format', () => {
      expect(inferOne(['12|03|2026', '01|04|2026'], { dateFormats: ['DD|MM|YYYY'] }).dateFormat)
        .toEqual({ year: 'numeric', month: '2-digit', day: '2-digit' });
      expect(inferOne(['1|4|2026', '12|3|2026'], { dateFormats: ['D|M|YYYY'] }).dateFormat)
        .toEqual({ year: 'numeric', month: 'numeric', day: 'numeric' });
    });

    it('reads a format without separators as a date, not a number', () => {
      const column = inferOne(['20260312', '20261201'], { dateFormats: ['YYYYMMDD'] });

      expect(column.type).toBe('date');
      expect(convertOne(['20260312', '20261201'], { dateFormats: ['YYYYMMDD'] })).toEqual(['2026-03-12', '2026-12-01']);
      expect(inferOne(['20260312', '20261201']).type).toBe('numeric');
    });

    it('rejects a date the calendar does not have', () => {
      expect(inferOne(['30/02/2026', '31/04/2026'], { dateFormats: ['DD/MM/YYYY'] }).type).toBe('text');
    });

    it('ignores a format without exactly one year, month and day, or with an unknown token', () => {
      const values = ['12/03/2026', '01/02/2026'];
      const builtIn = inferColumnTypes(columnsToRows(values), { locale: 'en-US' });

      ['DD/MM', 'DD/MM/YYYY/YYYY', 'DD/MMM/YYYY', 'DD/MM/YY', 'dd/mm/yyyy', ''].forEach((format) => {
        expect(inferColumnTypes(columnsToRows(values), { locale: 'en-US', dateFormats: [format] }))
          .toEqual(builtIn);
      });
      expect(inferColumnTypes(columnsToRows(values), { locale: 'en-US', dateFormats: [] })).toEqual(builtIn);
      expect(inferColumnTypes(columnsToRows(values), { locale: 'en-US', dateFormats: null })).toEqual(builtIn);
      expect(inferOne(values, { locale: 'en-US', dateFormats: ['DD/MMM/YYYY', 'DD/MM/YYYY'] }).inputFormat)
        .toEqual({ dateFormat: 'DD/MM/YYYY' });
    });

    it('converts a row past the sample with the listed format', () => {
      const rows = [['2026-01-02'], ['2026-01-03'], ['13|04|2026']];
      const result = inferColumnTypes(rows, { sampleSize: 2, dateFormats: ['DD|MM|YYYY'] });

      expect(result.columns[0].inputFormat).toEqual({ dateFormat: 'DD|MM|YYYY' });
      expect(convertToInferredTypes(rows, result)[2][0]).toBe('2026-04-13');
      expect(convertToInferredTypes(rows, JSON.parse(JSON.stringify(result)))[2][0]).toBe('2026-04-13');
    });

    it('lets a header row be found over a listed format', () => {
      const rows = [['Joined'], ['12|03|2026'], ['13|03|2026']];
      const result = inferColumnTypes(rows, { headerRow: 'auto', dateFormats: ['DD|MM|YYYY'] });

      expect(result.headerRow).toBe(true);
      expect(convertToInferredTypes(rows, result)).toEqual([['2026-03-12'], ['2026-03-13']]);
    });
  });

  it('reads the guide example for date formats and boolean words', () => {
    const rows = [
      ['Employee', 'Hired', 'Remote'],
      ['Ana García', '14/03/2022', 'yes'],
      ['James Okafor', '02/11/2023', 'no'],
      ['Li Wei', '20/06/2021', 'Yes'],
    ];
    const result = inferColumnTypes(rows, {
      locale: 'en-US',
      headerRow: true,
      dateFormats: ['DD/MM/YYYY'],
      booleanValues: { true: ['yes'], false: ['no'] },
    });

    expect(result.columns.map(({ settings }) => settings.type)).toEqual(['text', 'date', 'checkbox']);
    expect(convertToInferredTypes(rows, result)).toEqual([
      ['Ana García', '2022-03-14', true],
      ['James Okafor', '2023-11-02', false],
      ['Li Wei', '2021-06-20', true],
    ]);
  });

  describe('booleanValues', () => {
    const booleanValues = { true: ['yes', 'Tak'], false: ['no', 'nie'] };

    it('reads the listed words in any case and padding, and true and false still', () => {
      const values = ['YES', ' no ', 'tak', 'Nie', 'TRUE', 'false', true];

      expect(inferOne(values, { booleanValues }).type).toBe('checkbox');
      expect(convertOne(values, { booleanValues })).toEqual([true, false, true, false, true, false, true]);
    });

    it('carries the words in inputFormat, and nothing without the option', () => {
      expect(inferOne(['yes', 'no'], { booleanValues }).inputFormat).toEqual({ booleanValues });
      expect(inferOne(['true', 'false']).inputFormat).toBeUndefined();
      expect(inferOne(['yes', 'no']).type).toBe('text');
    });

    it('converts a row past the sample with any listed word', () => {
      const rows = [['yes'], ['no'], ['nie']];
      const result = inferColumnTypes(rows, { sampleSize: 2, booleanValues });

      expect(convertToInferredTypes(rows, result)).toEqual([[true], [false], [false]]);
      expect(convertToInferredTypes(rows, JSON.parse(JSON.stringify(result)))).toEqual([[true], [false], [false]]);
    });

    it('reads a word listed on both sides as neither, and skips blank words', () => {
      const options = { booleanValues: { true: ['yes', 'maybe', ''], false: ['no', 'MAYBE', '  '] } };

      expect(convertOne(['yes', 'no', 'maybe', 'yes', 'no', 'yes', 'no', 'yes', 'no', 'yes'], options))
        .toEqual([true, false, 'maybe', true, false, true, false, true, false, true]);
    });

    it('lets listed words win over numbers on a tie', () => {
      const options = { booleanValues: { true: ['1'], false: ['0'] } };

      expect(inferOne(['1', '0', '1'], options).type).toBe('checkbox');
      expect(convertOne(['1', '0', '1'], options)).toEqual([true, false, true]);
      expect(inferOne(['1', '0', '1']).type).toBe('numeric');
    });

    it('reads only arrays of strings', () => {
      expect(inferOne(['yes', 'no'], { booleanValues: { true: 'yes', false: ['no'] } }).type).toBe('text');
      expect(inferOne(['true', 'no'], { booleanValues: { false: ['no', 7] } }).type).toBe('checkbox');
      expect(inferOne(['true', 'false'], { booleanValues: null }).inputFormat).toBeUndefined();
    });

    it('lets a header row be found over listed words', () => {
      const rows = [['Active'], ['yes'], ['no']];
      const result = inferColumnTypes(rows, { headerRow: 'auto', booleanValues });

      expect(result.headerRow).toBe(true);
      expect(convertToInferredTypes(rows, result)).toEqual([[true], [false]]);
    });
  });

  describe('the guide example', () => {
    const header = ['Name', 'Balance', 'Joined', 'Active', 'Status'];
    const body = [
      ['Alice', '1.234,56', '12.03.2026', 'TRUE', 'Open'],
      ['Bob', '12,5', '13.03.2026', 'false', 'Closed'],
      ['Carol', '7', '14.03.2026', 'true', 'Open'],
      ['Dave', '99', '15.03.2026', 'false', 'Open'],
      ['Eve', '3,5', '16.03.2026', 'true', 'Closed'],
      ['Frank', '40', '17.03.2026', 'false', 'Open'],
    ];
    const types = ['text', 'numeric', 'date', 'checkbox', 'dropdown'];

    it('infers the types, the titles, and the converted first row the guide prints', () => {
      const rows = [header, ...body];
      const result = inferColumnTypes(rows, { locale: 'de-DE', headerRow: 'auto' });

      expect(result.headerRow).toBe(true);
      expect(result.columns.map(column => [column.title, column.settings.type]))
        .toEqual(header.map((title, index) => [title, types[index]]));
      expect(convertToInferredTypes(rows, result)).toHaveLength(6);
      expect(convertToInferredTypes(rows, result)[0]).toEqual(['Alice', 1234.56, '2026-03-12', true, 'Open']);
    });

    it('keeps its types and its header when the rows repeat', () => {
      const rows = [header, ...body, ...body, ...body];
      const result = inferColumnTypes(rows, { locale: 'de-DE', headerRow: 'auto' });

      expect(result.headerRow).toBe(true);
      // The names repeat three times each, so the first column is now a dropdown too.
      expect(result.columns.map(column => column.settings.type))
        .toEqual(['dropdown', ...types.slice(1)]);
      expect(convertToInferredTypes(rows, result)).toHaveLength(18);
    });

    it('prints the statistics the guide shows', () => {
      const [, balance] = inferColumnTypes([header, ...body], { headerRow: true, stats: true }).columns;

      expect(balance.stats).toEqual({
        count: 6,
        emptyCount: 0,
        distinctCount: 6,
        examples: ['1.234,56', '12,5', '7', '99', '3,5'],
        min: 3.5,
        max: 1234.56,
        runnerUpType: 'text',
      });
    });
  });

  describe('in a grid', () => {
    it('renders a column whose property name has a dot', () => {
      const rows = [{ 'unit.price': '10' }, { 'unit.price': '12.5' }];
      const result = inferColumnTypes(rows);
      const container = document.createElement('div');

      document.body.appendChild(container);

      const hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: convertToInferredTypes(rows, result),
        columns: result.columns.map(column => column.settings),
      });

      expect(result.columns[0].settings.data).toBe('unit.price');
      expect(hot.getDataAtCell(0, 0)).toBe(10);
      expect(hot.getDataAtCell(1, 0)).toBe(12.5);
      expect(hot.getCell(0, 0).textContent).toBe('10.0');

      hot.destroy();
      container.remove();
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
      { values: ['Open', 'Closed', 'Open', 'Open', 'Closed', 'Open', null] },
      { values: ['1 234,56 zł', '12,5 zł', '7 zł'], locale: 'pl-PL' },
      {
        values: ['yes', 'no', 'Tak', 'nie', null],
        options: { booleanValues: { true: ['yes', 'tak'], false: ['no', 'nie'] } },
      },
      { values: ['12/03/2026', '01/02/2026', ''], locale: 'en-US', options: { dateFormats: ['DD/MM/YYYY'] } },
      { values: ['20260312', '20261201'], options: { dateFormats: ['YYYYMMDD'] } },
      {
        values: [...Array(10).fill('Closed'), ...Array(10).fill('Open')],
        options: { sampleSize: 6, sampling: 'spread' },
      },
    ];

    corpus.forEach(({ values, locale, options }) => {
      it(`are accepted by the inferred cell type: ${JSON.stringify(values)} (${locale ?? 'default'}, ${JSON.stringify(options ?? {})})`, () => {
        const column = inferOne(values, { locale, ...options });
        const converted = convertOne(values, { locale, ...options });
        const rejected = converted.filter(value => !isAcceptedByCellType(column, value));

        expect(column.type).not.toBe('text');
        expect(rejected).toEqual([]);
      });
    });
  });
});
