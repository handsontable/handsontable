import {
  excelDateFmtToIntlOptions,
  excelNumFmtToIntlOptions,
  inferCellType,
  serialToIsoDate,
  serialToTimeString,
  serialToIsoDateTime,
  excelWidthToPx,
  pointsToPx,
  resolveListSource,
} from '../inference';
import {
  getDateNumFmt,
  getTimeNumFmt,
  getDateTimeNumFmt,
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  intlDateFmtToExcelNumFmt,
  intlTimeFmtToExcelNumFmt,
  intlDateTimeFmtToExcelNumFmt,
} from '../../exportFile/types/xlsx/date-utils';
import { intlNumFormatToExcelNumFmt } from '../../exportFile/types/xlsx/numeric-utils';
import { createCellSnapshot, createWorkbookSnapshot, createSheetSnapshot } from '../../../utils/xlsxEngine/model';
import { PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, POINTS_PER_PIXEL } from '../../../utils/xlsxEngine/units';

function cell(overrides) {
  return { ...createCellSnapshot(), ...overrides };
}

describe('inferCellType', () => {
  it('should map the export\'s own date, time and date-time formats back to their types', () => {
    expect(inferCellType(cell({ value: 45292, numFmt: getDateNumFmt() })))
      .toEqual({ type: 'date', dateFormat: { month: '2-digit', day: '2-digit', year: '2-digit' } });
    expect(inferCellType(cell({ value: 0.5, numFmt: getTimeNumFmt() })))
      .toEqual({ type: 'time', timeFormat: { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false } });
    expect(inferCellType(cell({ value: 45292.5, numFmt: getDateTimeNumFmt() }))).toEqual({
      type: 'date',
      dateFormat: {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      },
    });
  });

  it('should recognize other date and time patterns Excel writes', () => {
    expect(inferCellType(cell({ value: 1, numFmt: 'yyyy-mm-dd' })).type).toBe('date');
    expect(inferCellType(cell({ value: 1, numFmt: 'd/m/yyyy' })).type).toBe('date');
    expect(inferCellType(cell({ value: 1, numFmt: '[$-409]mmm d, yyyy' })).type).toBe('date');
    expect(inferCellType(cell({ value: 0.1, numFmt: 'h:mm AM/PM' })).type).toBe('time');
    expect(inferCellType(cell({ value: 0.1, numFmt: '[h]:mm:ss' })).type).toBe('time');
  });

  it('should classify a bare month format as a date, and a month next to hour/second as time', () => {
    expect(inferCellType(cell({ value: 3, numFmt: 'mm' })).type).toBe('date');
    expect(inferCellType(cell({ value: 3, numFmt: 'm' })).type).toBe('date');
    expect(inferCellType(cell({ value: 0.1, numFmt: 'h:mm' })).type).toBe('time');
  });

  it('should keep numeric-looking formats with letters as numeric', () => {
    expect(inferCellType(cell({ value: 42, numFmt: '0.00E+00' })).type).toBe('numeric');
    expect(inferCellType(cell({ value: 42, numFmt: '"Total: "0.00' })).type).toBe('numeric');
    expect(inferCellType(cell({ value: 42, numFmt: '0.00" m"' })).type).toBe('numeric');
    expect(inferCellType(cell({ value: 42, numFmt: '# ?/?' })).type).toBe('numeric');
    expect(inferCellType(cell({ value: 42, numFmt: '[Red]0.00' })).type).toBe('numeric');
  });

  it('should read a bare currency code as a currency, not as a time code', () => {
    // `CHF#,##0.00` carries an `h`, `SEK#,##0` an `s` and `HK$#,##0` both - the letters of a
    // currency code, not format codes. Classifying before the currency was captured turned each
    // into a `time` column and `1234.5` into `12:00:00`.
    expect(inferCellType(cell({ value: 1234.5, numFmt: 'CHF#,##0.00' }))).toEqual({
      type: 'numeric',
      numericFormat: {
        style: 'currency', currency: 'CHF', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
      },
    });
    expect(inferCellType(cell({ value: 1234.5, numFmt: 'SEK#,##0' }))).toEqual({
      type: 'numeric',
      numericFormat: {
        style: 'currency', currency: 'SEK', minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true,
      },
    });
    expect(inferCellType(cell({ value: 1234.5, numFmt: 'HK$#,##0' })).numericFormat.currency).toBe('HKD');
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00 PLN' })).numericFormat.currency).toBe('PLN');
    // An uppercase format code is not a currency.
    expect(inferCellType(cell({ value: 45000, numFmt: 'YYYY-MM-DD' })).type).toBe('date');
    // The export's own output for these currencies has to come back numeric.
    ['CHF', 'SEK', 'HKD', 'USD'].forEach((currency) => {
      const numFmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency }, 'en-US');

      expect(inferCellType(cell({ value: 1234.5, numFmt })).type).toBe('numeric');
    });
    // A real time code next to a currency-looking prefix stays a time.
    expect(inferCellType(cell({ value: 0.5, numFmt: 'h:mm' })).type).toBe('time');
    expect(inferCellType(cell({ value: 0.5, numFmt: '[$-409]h:mm:ss AM/PM' })).type).toBe('time');
  });

  it('should map numeric formats, including the export\'s own, to Intl.NumberFormat options', () => {
    const currency = intlNumFormatToExcelNumFmt(
      { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }, 'en-US'
    );

    expect(inferCellType(cell({ value: 42, numFmt: '#,##0.00' }))).toEqual({
      type: 'numeric',
      numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true },
    });
    expect(inferCellType(cell({ value: 0.5, numFmt: '0.0%' }))).toEqual({
      type: 'numeric',
      numericFormat: {
        style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false,
      },
    });
    expect(inferCellType(cell({ value: 142000, numFmt: currency }))).toEqual({
      type: 'numeric',
      numericFormat: {
        style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
      },
    });
  });

  it('should report a number format it cannot invert instead of guessing options', () => {
    expect(inferCellType(cell({ value: 42, numFmt: '0.00E+00' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '0.00E+00' });
    expect(inferCellType(cell({ value: 42, numFmt: '# ?/?' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '# ?/?' });
  });

  it('should treat a bare number with no format as numeric with no format, and a bare boolean as checkbox', () => {
    expect(inferCellType(cell({ value: 3 }))).toEqual({ type: 'numeric' });
    expect(inferCellType(cell({ value: 3, numFmt: 'General' }))).toEqual({ type: 'numeric' });
    expect(inferCellType(cell({ value: true }))).toEqual({ type: 'checkbox' });
  });

  it('should return text for strings and null for empty cells', () => {
    expect(inferCellType(cell({ value: 'hello' }))).toEqual({ type: 'text' });
    expect(inferCellType(cell({ value: 'hello', numFmt: '@' }))).toEqual({ type: 'text' });
    expect(inferCellType(cell({ value: null }))).toBeNull();
  });

  it('should not classify a formula cell by its cached result type', () => {
    expect(inferCellType(cell({ value: null, formula: { text: 'SUM(A1:A2)', result: 5 }, numFmt: '#,##0' }))).toEqual({
      type: 'numeric',
      numericFormat: { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true },
    });
    expect(inferCellType(cell({ value: null, formula: { text: 'A1&B1' } }))).toBeNull();
  });

  it('should read a formula cell\'s own number format, so an exported numeric formula column comes back numeric', () => {
    // The export writes a formula cell with the number format its column meta describes. Without
    // that format the cell would infer as `text` here and the target grid would render `840.1`
    // where the source rendered `840.10`.
    expect(inferCellType(cell({ value: null, formula: { text: 'B1*0.2', result: 840.1 }, numFmt: '0.00' })))
      .toEqual({
        type: 'numeric',
        numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false },
      });
  });
});

describe('excelNumFmtToIntlOptions', () => {
  // `intlNumFormatToExcelNumFmt` writes one digit count into the pattern (it reads
  // `maximumFractionDigits ?? minimumFractionDigits`) and defaults `useGrouping` to `true`, so a
  // format string cannot carry a minimum that differs from its maximum, nor an absent
  // `useGrouping`. The inverse can therefore only return that normalized shape, and the round-trip
  // expectation is the input options put through the same normalization.
  function normalize(options) {
    const digits = options.maximumFractionDigits ?? options.minimumFractionDigits ?? 0;

    return {
      ...options,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: options.useGrouping ?? true,
    };
  }

  it.each([
    ['plain fraction digits', { minimumFractionDigits: 2 }, undefined],
    ['a percent', { style: 'percent', minimumFractionDigits: 1 }, undefined],
    ['a prefixed currency', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }, 'en-US'],
    ['a suffixed currency', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }, 'de-DE'],
    ['grouping turned off', { useGrouping: false }, undefined],
  ])('should invert the export\'s own number format for %s', (_, options, locale) => {
    expect(excelNumFmtToIntlOptions(intlNumFormatToExcelNumFmt(options, locale))).toEqual(normalize(options));
  });

  it('should return null for a pattern with no Intl.NumberFormat equivalent', () => {
    expect(excelNumFmtToIntlOptions('0.00E+00')).toBeNull();
    expect(excelNumFmtToIntlOptions('# ?/?')).toBeNull();
  });

  it('should return null for a pattern pinning more fraction digits than Intl accepts', () => {
    // ECMA-402 caps `minimumFractionDigits`/`maximumFractionDigits` at 100 and the constructor
    // throws a `RangeError` above it. The numeric renderer builds its formatter from whatever the
    // column carries, so emitting one would break the grid on every draw, not at import time.
    expect(excelNumFmtToIntlOptions(`0.${'0'.repeat(101)}`)).toBeNull();
    // Excel itself allows 30, which is well inside the limit and must still invert.
    expect(excelNumFmtToIntlOptions(`0.${'0'.repeat(25)}`)).toEqual(expect.objectContaining({
      minimumFractionDigits: 25, maximumFractionDigits: 25,
    }));
    // Exactly at the limit is still inverted.
    expect(excelNumFmtToIntlOptions(`0.${'0'.repeat(100)}`)).toEqual(expect.objectContaining({
      minimumFractionDigits: 100, maximumFractionDigits: 100,
    }));
  });

  it('should report an over-long fraction pattern as an unsupported number format', () => {
    const pattern = `0.${'0'.repeat(101)}`;

    expect(inferCellType({ ...createCellSnapshot(), value: 1, numFmt: pattern })).toEqual({
      type: 'numeric', unsupportedNumFmt: pattern,
    });
    // And the digit counts it does emit are ones `Intl.NumberFormat` accepts.
    const supported = excelNumFmtToIntlOptions(`0.${'0'.repeat(100)}`);

    expect(() => new Intl.NumberFormat('en', supported)).not.toThrow();
  });
});

describe('excelDateFmtToIntlOptions', () => {
  it('should invert the export\'s own date format', () => {
    expect(excelDateFmtToIntlOptions('mm-dd-yy'))
      .toEqual({ month: '2-digit', day: '2-digit', year: '2-digit' });
  });

  it('should read a four-letter year as numeric and doubled month and day as zero-padded', () => {
    expect(excelDateFmtToIntlOptions('yyyy-mm-dd'))
      .toEqual({ year: 'numeric', month: '2-digit', day: '2-digit' });
  });

  it('should read a month name and strip the locale token', () => {
    expect(excelDateFmtToIntlOptions('[$-409]mmm d, yyyy'))
      .toEqual({ month: 'short', day: 'numeric', year: 'numeric' });
    expect(excelDateFmtToIntlOptions('mmmm d, yyyy'))
      .toEqual({ month: 'long', day: 'numeric', year: 'numeric' });
  });

  it('should read an m run next to an hour or a second as a minute, and pin a 24-hour clock', () => {
    expect(excelDateFmtToIntlOptions('h:mm:ss'))
      .toEqual({ hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });
  });

  it('should turn an AM/PM marker into hour12', () => {
    expect(excelDateFmtToIntlOptions('h:mm AM/PM'))
      .toEqual({ hour: 'numeric', minute: '2-digit', hour12: true });
  });

  it('should read both halves of a date-time format, month first and minute second', () => {
    expect(excelDateFmtToIntlOptions('mm-dd-yy h:mm:ss')).toEqual({
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  });

  it('should read the elapsed-hours format as a minute-and-second time with no hour', () => {
    expect(excelDateFmtToIntlOptions('[h]:mm:ss')).toEqual({ minute: '2-digit', second: '2-digit' });
  });

  it('should read three or more `d`s as a weekday name, not as a zero-padded day', () => {
    expect(excelDateFmtToIntlOptions('ddd, mm-dd-yyyy'))
      .toEqual({ weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' });
    expect(excelDateFmtToIntlOptions('dddd')).toEqual({ weekday: 'long' });
  });
});

describe('date format round trip (export derivation inverted by the import)', () => {
  // A test-only cross-plugin import: the two directions have to agree token for token, and the
  // property is only meaningful when both halves are exercised together. Source must never import
  // across this boundary (see ../AGENTS.md).
  const cases = [
    ['a zero-padded date with a four-digit year', intlDateFmtToExcelNumFmt, 'mm-dd-yyyy',
      { month: '2-digit', day: '2-digit', year: 'numeric' }],
    ['the export\'s own legacy fallback shape', intlDateFmtToExcelNumFmt, 'mm-dd-yy',
      { month: '2-digit', day: '2-digit', year: '2-digit' }],
    ['an unpadded date', intlDateFmtToExcelNumFmt, 'm-d-yy',
      { month: 'numeric', day: 'numeric', year: '2-digit' }],
    ['a short month name', intlDateFmtToExcelNumFmt, 'mmm d yyyy',
      { month: 'short', day: 'numeric', year: 'numeric' }],
    ['a long month name with no day', intlDateFmtToExcelNumFmt, 'mmmm yyyy',
      { month: 'long', year: 'numeric' }],
    ['a month and year with the day missing', intlDateFmtToExcelNumFmt, 'mm-yyyy',
      { month: '2-digit', year: 'numeric' }],
    ['a weekday name in front of the date', intlDateFmtToExcelNumFmt, 'ddd, mm-dd-yyyy',
      { weekday: 'short', month: '2-digit', day: '2-digit', year: 'numeric' }],
    ['a lone weekday name', intlDateFmtToExcelNumFmt, 'dddd',
      { weekday: 'long' }],
    ['a 24-hour time', intlTimeFmtToExcelNumFmt, 'hh:mm:ss',
      { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }],
    ['a 12-hour time', intlTimeFmtToExcelNumFmt, 'h:mm AM/PM',
      { hour: 'numeric', minute: '2-digit', hour12: true }],
    ['a time with an unpadded second', intlTimeFmtToExcelNumFmt, 'h:mm:s',
      { hour: 'numeric', minute: '2-digit', second: 'numeric', hour12: false }],
    ['a minute-and-second time with no hour', intlTimeFmtToExcelNumFmt, 'mm:ss',
      { minute: '2-digit', second: '2-digit' }],
    ['a date-time carrying both halves', intlDateTimeFmtToExcelNumFmt, 'mm-dd-yyyy hh:mm:ss',
      {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }],
  ];

  cases.forEach(([label, derive, numFmt, options]) => {
    it(`should recover the same Intl options for ${label}`, () => {
      expect(derive(options)).toBe(numFmt);
      expect(excelDateFmtToIntlOptions(numFmt)).toEqual(options);
    });
  });

  it('should pin a 24-hour clock on an hour-carrying format that named none', () => {
    // The one asymmetry: Excel has no "clock unspecified" marker, so an absent `hour12` comes back
    // as `false`. That is what the source grid rendered, because the export resolves an
    // unspecified `hour12` from the cell's locale exactly as `Intl` does — under a 24-hour locale
    // it writes no AM/PM marker, and under a 12-hour one it writes one and the clock survives.
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' }, 'de-DE')).toBe('hh:mm');
    expect(excelDateFmtToIntlOptions('hh:mm'))
      .toEqual({ hour: '2-digit', minute: '2-digit', hour12: false });

    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' }, 'en-US')).toBe('hh:mm AM/PM');
    expect(excelDateFmtToIntlOptions('hh:mm AM/PM'))
      .toEqual({ hour: '2-digit', minute: '2-digit', hour12: true });
  });
});

describe('serial conversions', () => {
  it('should round a date-time serial once, so a second short of midnight does not lose a day', () => {
    // 2024-01-01 23:59:59.7 is serial 45292 + 86399.7 / 86400. Rounding the fraction on its own gave
    // 86400 s → `00:00:00` on a date half that still said 2024-01-01: a full day off.
    expect(serialToIsoDateTime(45292 + (86399.7 / 86400))).toBe('2024-01-02 00:00:00');
    expect(serialToIsoDateTime(45292 + (86399.4 / 86400))).toBe('2024-01-01 23:59:59');
  });

  it('should invert the export\'s ISO date parser', () => {
    expect(serialToIsoDate(parseIsoStringToSerial('2024-01-01'))).toBe('2024-01-01');
    expect(serialToIsoDate(parseIsoStringToSerial('1999-12-31'))).toBe('1999-12-31');
    expect(serialToIsoDate(45292.999)).toBe('2024-01-01');
  });

  it('should invert the export\'s time parser', () => {
    expect(serialToTimeString(parseTimeStringToSerial('12:30:00'))).toBe('12:30:00');
    expect(serialToTimeString(parseTimeStringToSerial('09:05'))).toBe('09:05:00');
    expect(serialToTimeString(parseTimeStringToSerial('11:59:59 PM'))).toBe('23:59:59');
    expect(serialToTimeString(1.5)).toBe('12:00:00');
  });

  it('should combine both halves for date-times', () => {
    expect(serialToIsoDateTime(45292.5)).toBe('2024-01-01 12:00:00');
  });
});

describe('unit conversions', () => {
  it('should invert the export\'s width and height conversions', () => {
    expect(excelWidthToPx(10)).toBe(70);
    expect(excelWidthToPx(Math.max(150 / PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, 1))).toBe(150);
    expect(pointsToPx(30 * POINTS_PER_PIXEL)).toBe(30);
    expect(pointsToPx(15)).toBe(20);
  });
});

describe('resolveListSource', () => {
  function workbookWithHelper() {
    const workbook = createWorkbookSnapshot();
    const data = createSheetSnapshot('Data');
    const helper = createSheetSnapshot('_HotValidation');

    helper.state = 'veryHidden';
    helper.rows = [
      [cell({ value: 'Open' })],
      [cell({ value: 'Closed' })],
      [cell({ value: 'Blocked' })],
    ];
    workbook.sheets.push(data, helper);

    return workbook;
  }

  it('should split an inline quoted list', () => {
    const workbook = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Data');

    expect(resolveListSource({ type: 'list', allowBlank: true, formulae: ['"a,b,c"'] }, workbook, sheet))
      .toEqual(['a', 'b', 'c']);
    expect(resolveListSource({ type: 'list', allowBlank: true, formulae: ['"Open, Closed"'] }, workbook, sheet))
      .toEqual(['Open', 'Closed']);
  });

  it('should read a sheet range reference from the referenced sheet', () => {
    const workbook = workbookWithHelper();
    const source = resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['\'_HotValidation\'!$A$1:$A$3'] }, workbook, workbook.sheets[0]
    );

    expect(source).toEqual(['Open', 'Closed', 'Blocked']);
  });

  it('should read an unqualified range from the sheet the validation sits on', () => {
    // Excel stores a Data Validation → List → range-on-this-sheet as a bare `$A$1:$A$10`; only the
    // export's own `_HotValidation` helper sheet ever qualifies the range with a name.
    const workbook = workbookWithHelper();
    const [data, helper] = workbook.sheets;

    data.rows = [[cell({ value: 'Yes' })], [cell({ value: 'No' })], [cell({ value: null })]];

    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['$A$1:$A$3'] }, workbook, data
    )).toEqual(['Yes', 'No']);
    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['A1:A2'] }, workbook, helper
    )).toEqual(['Open', 'Closed']);
  });

  it('should read a list option from a formula cell\'s cached result and format a date serial', () => {
    const workbook = workbookWithHelper();
    const [data] = workbook.sheets;

    data.rows = [
      [cell({ value: null, formula: { text: 'A9', result: 'Computed' } })],
      [cell({ value: 44927, numFmt: 'yyyy-mm-dd' })],
      [cell({ value: null, formula: { text: 'A10' } })],
    ];

    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['$A$1:$A$3'] }, workbook, data
    )).toEqual(['Computed', '2023-01-01']);
  });

  it('should clamp a list range to the sheet it reads, so a sheet-sized range costs the sheet', () => {
    const workbook = workbookWithHelper();
    const [data] = workbook.sheets;

    data.rows = [[cell({ value: 'Yes' })], [cell({ value: 'No' })]];

    // Both forms describe a million rows; only the two that exist are visited.
    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['$A$1:$A$1048576'] }, workbook, data
    )).toEqual(['Yes', 'No']);
    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['A:A'] }, workbook, data
    )).toEqual(['Yes', 'No']);
    // Past the sheet limits the reference is not one at all.
    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['$A$1:$A$99999999999'] }, workbook, data
    )).toBeNull();
  });

  it('should return null for a reference it cannot resolve', () => {
    const workbook = workbookWithHelper();
    const [data] = workbook.sheets;

    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['\'Missing\'!$A$1:$A$3'] }, workbook, data
    )).toBeNull();
    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: ['INDIRECT("x")'] }, workbook, data
    )).toBeNull();
    expect(resolveListSource(
      { type: 'list', allowBlank: true, formulae: [] }, workbook, data
    )).toBeNull();
  });
});
