import {
  excelDateFmtToIntlOptions,
  excelNumFmtToIntlOptions,
  inferCellType,
  serialToIsoDate,
  serialToTimeString,
  serialToIsoDateTime,
  toGridValue,
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
  parseIsoDateTimeStringToSerial,
  intlDateFmtToExcelNumFmt,
  intlTimeFmtToExcelNumFmt,
  intlDateTimeFmtToExcelNumFmt,
} from '../../exportFile/types/xlsx/date-utils';
import { intlNumFormatToExcelNumFmt } from '../../exportFile/types/xlsx/numeric-utils';
import { createCellSnapshot, createWorkbookSnapshot, createSheetSnapshot } from '../../../utils/xlsxEngine/model';
import { PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, POINTS_PER_PIXEL } from '../../../utils/xlsxEngine/units';
import { valueFormatter as intlDatetimeValueFormatter } from '../../../renderers/intlDatetimeRenderer';
import { isValidISODateTime } from '../../../helpers/dateTime';
import { BAD_VALUE_TEXT } from '../../../helpers/constants';

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
      type: 'intl-datetime',
      dateTimeFormat: {
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

  it('should classify an elapsed-time format as a time, not as a date', () => {
    // `[h]:mm` and `[hh]:mm` are Excel's standard duration formats. Stripping the bracket first left
    // `:mm`, a bare month, so a timesheet column imported as 1899 dates.
    const duration = cell({ value: 0.5625, numFmt: '[h]:mm' });
    const inferred = inferCellType(duration);

    expect(inferred).toEqual({ type: 'time', timeFormat: { hour: 'numeric', minute: '2-digit', hour12: false } });
    expect(toGridValue(duration, inferred)).toBe('13:30:00');
    expect(inferCellType(cell({ value: 0.5, numFmt: '[hh]:mm' })))
      .toEqual({ type: 'time', timeFormat: { hour: '2-digit', minute: '2-digit', hour12: false } });
    expect(inferCellType(cell({ value: 0.01, numFmt: '[m]' })))
      .toEqual({ type: 'time', timeFormat: { minute: 'numeric' } });
    expect(inferCellType(cell({ value: 0.01, numFmt: '[mm]:ss' })))
      .toEqual({ type: 'time', timeFormat: { minute: '2-digit', second: '2-digit' } });
    expect(inferCellType(cell({ value: 30 / 86400, numFmt: '[s]' })))
      .toEqual({ type: 'time', timeFormat: { second: 'numeric' } });
    expect(inferCellType(cell({ value: 30 / 86400, numFmt: '[ss]' })).timeFormat)
      .toEqual(expect.objectContaining({ second: '2-digit' }));
    // Excel accepts the elapsed section in uppercase too. Read case-sensitively, `[HH]:MM` stripped
    // to `:mm`, a bare month, and the duration column typed as dates again.
    expect(inferCellType(cell({ value: 0.5, numFmt: '[HH]:MM' })).type).toBe('time');
    expect(inferCellType(cell({ value: 0.5, numFmt: '[HH]:MM:SS' })).type).toBe('time');
  });

  it('should keep a duration past what its elapsed format can show as a time a number, and report the format', () => {
    // The grid value of a time cell is `HH:mm:ss`, so a 25:30 duration imported as `01:30:00`, and the
    // whole day was lost from the data (a re-export wrote 0.0625). `[mm]:ss` and `[ss]` render the
    // minute of the hour and the second of the minute, so 90 minutes showed `30:00` and `0`.
    [
      [25.5 / 24, '[h]:mm'],
      [2, '[hh]:mm:ss'],
      [1.5, '[h]:mm'],
      [-0.25, '[h]:mm'],
      [90 / 1440, '[mm]:ss'],
      [90 / 1440, '[m]'],
      [90 / 1440, '[ss]'],
      [61 / 86400, '[s]'],
    ].forEach(([value, numFmt]) => {
      const duration = cell({ value, numFmt });
      const inferred = inferCellType(duration);

      expect(inferred).toEqual({ type: 'numeric', unsupportedNumFmt: numFmt });
      expect(toGridValue(duration, inferred)).toBe(value);
    });

    // A duration just under the capacity is still a time.
    expect(inferCellType(cell({ value: 86399 / 86400, numFmt: '[h]:mm:ss' })).type).toBe('time');
    expect(inferCellType(cell({ value: 59 / 1440, numFmt: '[mm]:ss' })).type).toBe('time');
    // A clock format is not elapsed and keeps reading the time of day.
    expect(inferCellType(cell({ value: 1.5, numFmt: 'h:mm' })).type).toBe('time');
  });

  it('should keep a duration of exactly the format\'s capacity a number', () => {
    // A 24:00 total is an ordinary timesheet value. Typed as a time it would import as `00:00:00`.
    expect(inferCellType(cell({ value: 1, numFmt: '[h]:mm' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '[h]:mm' });
    expect(inferCellType(cell({ value: 60 / 1440, numFmt: '[mm]:ss' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '[mm]:ss' });
    expect(inferCellType(cell({ value: 1 / 24, numFmt: '[m]' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '[m]' });
    expect(inferCellType(cell({ value: 60 / 86400, numFmt: '[s]' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '[s]' });
    // Rounded to the second first: 23:59:59.6 is a full day, 23:59:59.4 is not.
    expect(inferCellType(cell({ value: 1 - (0.4 / 86400), numFmt: '[h]:mm' })).type).toBe('numeric');
    expect(inferCellType(cell({ value: 1 - (0.6 / 86400), numFmt: '[h]:mm' })).type).toBe('time');
  });

  it('should classify a bare month format as a date, and a month next to hour/second as time', () => {
    expect(inferCellType(cell({ value: 3, numFmt: 'mm' })).type).toBe('date');
    expect(inferCellType(cell({ value: 3, numFmt: 'm' })).type).toBe('date');
    expect(inferCellType(cell({ value: 0.1, numFmt: 'h:mm' })).type).toBe('time');
  });

  it('should read a backslash-escaped literal as decoration, matching what the ExcelJS path hands over', () => {
    // Both engines now hand the format code over verbatim, so `\%` is a literal percent sign (no
    // scaling by 100) and `\d` a literal letter, never a date code. The native reader used to
    // strip the backslashes, which made `0.0\%` a scaling percent and `0\d` a date.
    expect(inferCellType(cell({ value: 12.5, numFmt: '0.0\\%' }))).toEqual({
      type: 'numeric',
      numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false },
    });
    // `\ ` escapes only the space; the `%` after it still scales, so this one IS a percent.
    expect(inferCellType(cell({ value: 0.125, numFmt: '0.0\\ %' }))).toEqual({
      type: 'numeric',
      numericFormat: {
        style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false,
      },
    });
    expect(inferCellType(cell({ value: 7, numFmt: '0\\d' }))).toEqual({
      type: 'numeric',
      numericFormat: { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: false },
    });
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
    // The zloty sign is keyed as an escape in the source, so the bundles stay ASCII (DEV-111).
    const zloty = `z${String.fromCharCode(0x142)}`;

    expect(inferCellType(cell({ value: 1234.5, numFmt: `[$${zloty}-415]#,##0.00` })).numericFormat.currency)
      .toBe('PLN');
    expect(inferCellType(cell({ value: 1234.5, numFmt: `${zloty}#,##0.00` })).numericFormat.currency).toBe('PLN');
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

  it('should read a quoted currency literal as a currency, the way Excel\'s Currency style writes it', () => {
    // `"$"#,##0.00` is Excel's en-US Currency style. The decoration strip deleted the quoted `$`
    // before the currency was looked for, so the column rendered `1,234.50` with no symbol.
    expect(excelNumFmtToIntlOptions('"$"#,##0.00')).toEqual({
      style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
    });
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00" \u20AC"' })).numericFormat.currency).toBe('EUR');
    expect(inferCellType(cell({ value: 1234.5, numFmt: '"CHF "#,##0' })).numericFormat.currency).toBe('CHF');
    // A quoted literal that is not a symbol is still not a currency.
    expect(excelNumFmtToIntlOptions('"Total "0')).toEqual({
      minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: false,
    });
  });

  it('should read a backslash-escaped currency symbol as a currency, the way LibreOffice saves one', () => {
    // LibreOffice writes `"$"#,##0.00` back as `\$#,##0.00`. The escape strip removed the symbol, so
    // the column rendered `1,234.50` on the built-in engine (ExcelJS unescapes the code first).
    expect(inferCellType(cell({ value: 1234.5, numFmt: '\\$#,##0.00' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'USD' }));
    expect(inferCellType(cell({ value: 1234.5, numFmt: '\\\u00A3#,##0.00' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'GBP' }));
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00\\\u20AC' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'EUR' }));
    // An escaped percent sign is a literal, not a percentage, and stays a plain number.
    expect(inferCellType(cell({ value: 12.5, numFmt: '0.0\\%' })).numericFormat)
      .not.toEqual(expect.objectContaining({ style: 'percent' }));
  });

  it('should read a quoted ISO code or dollar composite as a currency, the way the export writes one', () => {
    // The export quotes every symbol longer than one character, so the import has to read the
    // quoted ISO code back or a quoted `"USD"` column re-imports as a plain number.
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00"USD"' }))).toEqual({
      type: 'numeric',
      numericFormat: {
        style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
      },
    });
    expect(inferCellType(cell({ value: 1234.5, numFmt: '"EUR"#,##0.00' })).numericFormat.currency).toBe('EUR');
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00" RON"' })).numericFormat.currency).toBe('RON');
    expect(inferCellType(cell({ value: 1234.5, numFmt: '"HK$"#,##0' })).numericFormat.currency).toBe('HKD');
    expect(inferCellType(cell({ value: 1234.5, numFmt: '"US$"#,##0.00' })).numericFormat.currency).toBe('USD');
    // A quoted label that is not a code stays a label.
    expect(inferCellType(cell({ value: 12, numFmt: '0" pcs"' })).numericFormat.style).toBeUndefined();
    expect(inferCellType(cell({ value: 12, numFmt: '"Abc"0' })).numericFormat.style).toBeUndefined();
  });

  it('should read a currency symbol escaped one character at a time, the way Excel saves one', () => {
    // Excel saves the unquoted `#,##0.00zł` as `#,##0.00\z\ł`. Only a whole-symbol escape was
    // unescaped, so the column lost its currency on the built-in engine.
    const zloty = `z${String.fromCharCode(0x142)}`;

    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00\\z\\\u0142' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'PLN' }));
    expect(inferCellType(cell({ value: 1234.5, numFmt: '\\C\\H\\F#,##0.00' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'CHF' }));
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00\\k\\r' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'SEK' }));
    expect(inferCellType(cell({ value: 1234.5, numFmt: '#,##0.00\\ \\U\\S\\D' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'USD' }));
    expect(excelNumFmtToIntlOptions(`#,##0.00\\${zloty[0]}\\${zloty[1]}`).currency).toBe('PLN');
    // An escaped run that is not a currency stays a literal.
    expect(inferCellType(cell({ value: 12.5, numFmt: '0.0\\%' })).numericFormat.style).toBeUndefined();
    expect(inferCellType(cell({ value: 7, numFmt: '0\\p\\c' })).numericFormat.style).toBeUndefined();
  });

  it('should read a currency token naming an Object.prototype member as no currency', () => {
    // A plain-object symbol table resolved `[$constructor-409]` to the `Object` function, which then
    // reached `Intl.NumberFormat` as the currency code and made every later render throw.
    ['[$constructor-409]#,##0.00', '[$toString]0.00', '[$__proto__-409]0.00', 'constructor#,##0', '#,##0valueOf']
      .forEach((numFmt) => {
        const inferred = inferCellType(cell({ value: 12.5, numFmt }));

        expect(inferred.numericFormat?.currency).toBeUndefined();
        expect(inferred.numericFormat?.style).not.toBe('currency');
      });

    expect(inferCellType(cell({ value: 12.5, numFmt: '[$€-407]#,##0.00' })).numericFormat)
      .toEqual(expect.objectContaining({ style: 'currency', currency: 'EUR' }));
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

  it('should keep the positive section but report a negative section the grid cannot show', () => {
    // `Intl` writes a negative number with its own minus sign, so `(#,##0)` shows `-1,234`
    // instead of `(1,234)`. The positive section still applies, and the code is reported.
    const integer = { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true };

    expect(inferCellType(cell({ value: -1234, numFmt: '[Red]#,##0;(#,##0)' }))).toEqual({
      type: 'numeric', numericFormat: integer, unsupportedNumFmt: '[Red]#,##0;(#,##0)',
    });
    expect(inferCellType(cell({ value: -1234, numFmt: '#,##0;#,##0' })).unsupportedNumFmt).toBe('#,##0;#,##0');
    expect(inferCellType(cell({ value: -1, numFmt: '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)' })).unsupportedNumFmt)
      .toBe('"$"#,##0.00_);[Red]\\("$"#,##0.00\\)');
    // A negative section that is the positive one with a minus sign is what the grid shows anyway.
    expect(inferCellType(cell({ value: -1234, numFmt: '#,##0;[Red]-#,##0' }))).toEqual({
      type: 'numeric', numericFormat: integer,
    });
    expect(inferCellType(cell({ value: -1234, numFmt: '#,##0;\\-#,##0' }))).toEqual({
      type: 'numeric', numericFormat: integer,
    });
    expect(inferCellType(cell({ value: -1234, numFmt: '[$\u20AC-407]#,##0;[RED]-[$\u20AC-407]#,##0' })))
      .toEqual({ type: 'numeric', numericFormat: { ...integer, style: 'currency', currency: 'EUR' } });
  });

  it('should treat a bare number with no format as numeric with no format, and a bare boolean as checkbox', () => {
    expect(inferCellType(cell({ value: 3 }))).toEqual({ type: 'numeric' });
    expect(inferCellType(cell({ value: 3, numFmt: 'General' }))).toEqual({ type: 'numeric' });
    expect(inferCellType(cell({ value: true }))).toEqual({ type: 'checkbox' });
  });

  it('should read a boolean as a checkbox whatever its number format says', () => {
    // LibreOffice writes `"TRUE";"TRUE";"FALSE"` on every boolean cell. Asked first, that format
    // typed the column `numeric` and put a `numFmt:` entry in `dropped`.
    expect(inferCellType(cell({ value: true, numFmt: '"TRUE";"TRUE";"FALSE"' }))).toEqual({ type: 'checkbox' });
    expect(inferCellType(cell({ value: false, numFmt: '0.00' }))).toEqual({ type: 'checkbox' });
    const boolFormula = { text: 'FALSE()', result: false };

    expect(inferCellType(cell({ value: null, formula: boolFormula, numFmt: '"TRUE";"TRUE";"FALSE"' })))
      .toEqual({ type: 'checkbox' });
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
    ['a quoted ISO code (it-IT / USD)', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }, 'it-IT'],
    ['a quoted symbol (pl-PL / PLN)', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }, 'pl-PL'],
    ['a quoted ISO code (de-CH / CHF)', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }, 'de-CH'],
    ['a quoted dollar composite (en-US / HKD)', { style: 'currency', currency: 'HKD' }, 'en-US'],
  ])('should invert the export\'s own number format for %s', (_, options, locale) => {
    expect(excelNumFmtToIntlOptions(intlNumFormatToExcelNumFmt(options, locale))).toEqual(normalize(options));
  });

  it('should read the positive section of a multi-section format, without its padding and fill', () => {
    // Every format with a `;` section used to reach the plain-number check whole and imported
    // unformatted: Excel's built-in currency (5–8), number (37–40) and accounting (41–44) formats.
    const usd2 = {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
    };

    expect(excelNumFmtToIntlOptions('"$"#,##0.00_);[Red]\\("$"#,##0.00\\)')).toEqual(usd2);
    expect(excelNumFmtToIntlOptions('_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)')).toEqual(usd2);
    expect(excelNumFmtToIntlOptions('#,##0;[Red]-#,##0')).toEqual({
      minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true,
    });
    expect(excelNumFmtToIntlOptions('#,##0.00 ;(#,##0.00)')).toEqual({
      minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
    });
    expect(excelNumFmtToIntlOptions('_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)')).toEqual({
      minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
    });
    // A `;` inside a quoted literal is text, not a section break: cut there, the code would end in
    // an unterminated quote and read as no number format at all.
    expect(excelNumFmtToIntlOptions('0" a;b"')).toEqual({
      minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: false,
    });
  });

  it('should return null for a pattern with no Intl.NumberFormat equivalent', () => {
    expect(excelNumFmtToIntlOptions('0.00E+00')).toBeNull();
    expect(excelNumFmtToIntlOptions('# ?/?')).toBeNull();
  });

  it('should return null for a multi-section code whose sections apply to a range of values', () => {
    // The first section applies only where its condition holds. Applied to every cell, the grid
    // showed `1234567.0` where Excel shows `1.2M`.
    expect(excelNumFmtToIntlOptions('[>=1000000]0.0,,"M";[>=1000]0.0,"K";0')).toBeNull();
    expect(excelNumFmtToIntlOptions('[>=100]#,##0;0.00')).toBeNull();
    expect(excelNumFmtToIntlOptions('[<1]0.00%;0%')).toBeNull();
    expect(excelNumFmtToIntlOptions('[<=9999999]###\\-####;\\(###\\) ###\\-####')).toBeNull();
    expect(excelNumFmtToIntlOptions('#,##0;[Red][<0]-#,##0')).toBeNull();
    expect(excelNumFmtToIntlOptions('0;[=0]"-"')).toBeNull();
    expect(inferCellType(cell({ value: 5500, numFmt: '[>=100]#,##0;0.00' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '[>=100]#,##0;0.00' });
  });

  it('should return null for a trailing comma, which scales the number by a thousand', () => {
    // `#,##0,` is "in thousands": read as a grouping flag, a column Excel shows as `1,235` showed
    // `1,234,568`.
    expect(excelNumFmtToIntlOptions('#,##0,')).toBeNull();
    expect(excelNumFmtToIntlOptions('#,##0.0,,')).toBeNull();
    expect(excelNumFmtToIntlOptions('0.0,,"M"')).toBeNull();
    expect(excelNumFmtToIntlOptions('0.0,"K"')).toBeNull();
    expect(inferCellType(cell({ value: 1234567.891, numFmt: '#,##0,' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '#,##0,' });
    // A grouping comma inside the number is not a scale.
    expect(excelNumFmtToIntlOptions('#,##0')).toEqual(expect.objectContaining({ useGrouping: true }));
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

  it('should read the elapsed-hours format as a 24-hour time, so a duration under a day shows its hours', () => {
    // `Intl.DateTimeFormat` has no elapsed hours, so a longer duration shows its hours modulo 24.
    // Without the hour, `13:30` rendered as `30`.
    expect(excelDateFmtToIntlOptions('[h]:mm:ss'))
      .toEqual({ hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });
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

  it('should import the export\'s own date-time output as an intl-datetime cell that renders and validates', () => {
    // The export writes an `intl-datetime` cell from `dateTimeFormat`; the import has to hand the
    // same type, options and an ISO value back, or the cell renders `#bad-value#` (a `date` cell
    // accepts a date-only ISO string, never a date-time one).
    const options = {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const numFmt = intlDateTimeFmtToExcelNumFmt(options);
    const serial = parseIsoDateTimeStringToSerial('2024-01-15T09:30:45');
    const source = cell({ value: serial, numFmt });
    const inferred = inferCellType(source);
    const value = toGridValue(source, inferred);

    expect(inferred).toEqual({ type: 'intl-datetime', dateTimeFormat: options });
    expect(value).toBe('2024-01-15 09:30:45');
    expect(isValidISODateTime(value)).toBe(true);
    expect(parseIsoDateTimeStringToSerial(value)).toBe(serial);
    expect(intlDatetimeValueFormatter(value, { dateTimeFormat: inferred.dateTimeFormat, locale: 'en-US' }))
      .toBe('01/15/2024, 09:30:45');
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

  it('should pad a year below 1000 to four digits, so the date cell accepts the value', () => {
    const serialOf = (year, month, day) => {
      const date = new Date(0);

      date.setUTCFullYear(year, month - 1, day);

      return (date.getTime() - Date.UTC(1899, 11, 30)) / 86400000;
    };

    expect(serialToIsoDate(serialOf(1, 1, 1))).toBe('0001-01-01');
    expect(serialToIsoDate(serialOf(999, 12, 31))).toBe('0999-12-31');
    expect(serialToIsoDate(serialOf(1000, 1, 1))).toBe('1000-01-01');
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

describe('inferCellType - date-time formats', () => {
  [
    ['yyyy-mm-dd hh:mm:ss', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }],
    ['m/d/yy h:mm', {
      month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: false,
    }],
    ['[$-409]m/d/yy h:mm AM/PM', {
      month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true,
    }],
  ].forEach(([numFmt, dateTimeFormat]) => {
    it(`should map "${numFmt}" to an intl-datetime cell whose value renders and validates`, () => {
      const source = cell({ value: 45292.5, numFmt });
      const inferred = inferCellType(source);
      const value = toGridValue(source, inferred);

      expect(inferred).toEqual({ type: 'intl-datetime', dateTimeFormat });
      expect(value).toBe('2024-01-01 12:00:00');
      expect(isValidISODateTime(value)).toBe(true);
      expect(intlDatetimeValueFormatter(value, { dateTimeFormat, locale: 'en-US' })).not.toBe(BAD_VALUE_TEXT);
    });
  });

  it('should keep a date-only format a date cell with a date-only value', () => {
    const source = cell({ value: 45292.5, numFmt: 'yyyy-mm-dd' });
    const inferred = inferCellType(source);

    expect(inferred).toEqual({ type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } });
    expect(toGridValue(source, inferred)).toBe('2024-01-01');
  });
});

describe('inferCellType - hostile number formats', () => {
  // A number format is file data. A 2 KB workbook can carry a 100 000-character format, and a
  // bracket regex that rescans to the end of the string from every `[` is quadratic in it.
  const LONG = 100000;

  it('should classify a 100 000-character "[[[..." format quickly, as an unsupported number format', () => {
    const numFmt = `${'['.repeat(LONG)}0`;
    const start = performance.now();
    const inferred = inferCellType(cell({ value: 1, numFmt }));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(inferred).toEqual({ type: 'numeric', unsupportedNumFmt: numFmt });
  });

  it('should classify a 100 000-character "[$[$..." format quickly, as an unsupported number format', () => {
    const numFmt = `${'[$'.repeat(LONG / 2)}0`;
    const start = performance.now();
    const inferred = inferCellType(cell({ value: 1, numFmt }));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(inferred).toEqual({ type: 'numeric', unsupportedNumFmt: numFmt });
  });

  it('should parse a 100 000-character bracket run in linear time even past the length cap', () => {
    // The cap keeps `inferCellType` away from such a format, but the parsers are exported and must
    // not depend on it: each bracket regex excludes `[` from its body, so no match rescans the tail.
    const brackets = `${'['.repeat(LONG)}0`;
    const currencies = `${'[$'.repeat(LONG / 2)}0`;
    const start = performance.now();

    expect(excelNumFmtToIntlOptions(brackets)).toBeNull();
    expect(excelNumFmtToIntlOptions(currencies)).toBeNull();
    expect(excelDateFmtToIntlOptions(brackets)).toEqual({});

    expect(performance.now() - start).toBeLessThan(200);
  });

  it('should treat a format longer than Excel\'s 255-character limit as unsupported, whatever it reads as', () => {
    const date = `yyyy-mm-dd${' '.repeat(246)}`;

    expect(date.length).toBe(256);
    expect(inferCellType(cell({ value: 1, numFmt: date }))).toEqual({ type: 'numeric', unsupportedNumFmt: date });
    expect(inferCellType(cell({ value: 1, numFmt: date.slice(0, 255) })).type).toBe('date');
  });

  it('should still read a currency token and strip bracketed sections under the 255-character limit', () => {
    expect(excelNumFmtToIntlOptions('[$\u20ac-407]#,##0.00')).toEqual({
      style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true,
    });
    expect(excelNumFmtToIntlOptions('[Red][<100]0.0')).toEqual({
      minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false,
    });
    // A nested `[` no longer extends a bracket section: the inner `[x]` is what gets stripped.
    expect(excelNumFmtToIntlOptions('[[x]0')).toBeNull();
  });
});

describe('inferCellType (review round 5)', () => {
  it('should never read a code with a condition section as a date, whatever its letters say', () => {
    // LibreOffice writes `[>=1000000]0.0,,\M;[>=1000]0.0,\K;0`. ExcelJS drops the backslashes, so
    // the code arrives with a bare `M`, which read as a month and imported 1234567 as `5280-02-15`.
    const stripped = '[>=1000000]0.0,,M;[>=1000]0.0,K;0';
    const snapshot = cell({ value: 1234567, numFmt: stripped });
    const inferred = inferCellType(snapshot);

    expect(inferred).toEqual({ type: 'numeric', unsupportedNumFmt: stripped });
    expect(toGridValue(snapshot, inferred)).toBe(1234567);
    // The escaped form the native reader passes through stays a number too.
    expect(inferCellType(cell({ value: 1234567, numFmt: '[>=1000000]0.0,,\\M;[>=1000]0.0,\\K;0' })))
      .toEqual({ type: 'numeric', unsupportedNumFmt: '[>=1000000]0.0,,\\M;[>=1000]0.0,\\K;0' });
    // A plain date is still a date.
    expect(inferCellType(cell({ value: 45292, numFmt: 'yyyy-mm-dd' })).type).toBe('date');
  });

  it('should keep the leading zeros a zero-padded format pins (US ZIP codes, employee IDs)', () => {
    expect(inferCellType(cell({ value: 2134, numFmt: '00000' }))).toEqual({
      type: 'numeric',
      numericFormat: {
        minimumIntegerDigits: 5, minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: false,
      },
    });
    expect(excelNumFmtToIntlOptions('000000').minimumIntegerDigits).toBe(6);
    expect(excelNumFmtToIntlOptions('0000').minimumIntegerDigits).toBe(4);
    expect(excelNumFmtToIntlOptions('000.00')).toEqual({
      minimumIntegerDigits: 3, minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false,
    });
    expect(excelNumFmtToIntlOptions('00,000')).toEqual({
      minimumIntegerDigits: 5, minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true,
    });
    expect(excelNumFmtToIntlOptions('#00').minimumIntegerDigits).toBe(2);
    // One zero is the default and is not written.
    expect(excelNumFmtToIntlOptions('#,##0.00').minimumIntegerDigits).toBeUndefined();
    expect(excelNumFmtToIntlOptions('0').minimumIntegerDigits).toBeUndefined();
    // `Intl.NumberFormat` throws above 21 integer digits, so a longer pad is reported instead.
    expect(excelNumFmtToIntlOptions('0'.repeat(22))).toBeNull();
    expect(excelNumFmtToIntlOptions('0'.repeat(21)).minimumIntegerDigits).toBe(21);
  });

  it('should show a zero-padded number with its zeros and write the pad back on export', () => {
    const { numericFormat } = inferCellType(cell({ value: 2134, numFmt: '00000' }));

    expect(new Intl.NumberFormat('en-US', numericFormat).format(2134)).toBe('02134');
    expect(intlNumFormatToExcelNumFmt(numericFormat, 'en-US')).toBe('00000');

    const decimal = inferCellType(cell({ value: 7, numFmt: '000.00' })).numericFormat;

    expect(new Intl.NumberFormat('en-US', decimal).format(7)).toBe('007.00');
    expect(intlNumFormatToExcelNumFmt(decimal, 'en-US')).toBe('000.00');
  });

  it('should return null for a comma right before the decimal point, which scales the number', () => {
    expect(excelNumFmtToIntlOptions('#,##0,.0')).toBeNull();
  });

  describe('currency round trip per locale', () => {
    const cases = [
      ['nb-NO', 'NOK'],
      ['sv-SE', 'SEK'],
      ['da-DK', 'DKK'],
      ['is-IS', 'ISK'],
      ['cs-CZ', 'CZK'],
      ['hu-HU', 'HUF'],
      ['ru-RU', 'RUB'],
      ['tr-TR', 'TRY'],
      ['ja-JP', 'JPY'],
      ['en-US', 'JPY'],
      ['zh-CN', 'CNY'],
      ['de-DE', 'EUR'],
      ['it-IT', 'USD'],
      ['pl-PL', 'PLN'],
      ['en-GB', 'GBP'],
    ];

    cases.forEach(([locale, currency]) => {
      it(`should bring ${locale} ${currency} back as ${currency}`, () => {
        const numFmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency, minimumFractionDigits: 2 }, locale);
        const inferred = inferCellType(cell({ value: 1234.5, numFmt }));

        expect(inferred.type).toBe('numeric');
        expect(inferred.numericFormat).toEqual(expect.objectContaining({ style: 'currency', currency }));
        expect(inferred.unsupportedNumFmt).toBeUndefined();
      });
    });

    it('should read the krone and yen signs by the LCID of their locale token', () => {
      const yen = '\u00A5';

      expect(excelNumFmtToIntlOptions('#,##0.00[$kr-414]').currency).toBe('NOK');
      expect(excelNumFmtToIntlOptions('#,##0.00[$kr-41D]').currency).toBe('SEK');
      expect(excelNumFmtToIntlOptions('#,##0.00[$kr.-406]').currency).toBe('DKK');
      expect(excelNumFmtToIntlOptions('#,##0[$kr.-40F]').currency).toBe('ISK');
      expect(excelNumFmtToIntlOptions(`[$${yen}-411]#,##0`).currency).toBe('JPY');
      expect(excelNumFmtToIntlOptions(`[$${yen}-804]#,##0.00`).currency).toBe('CNY');
      // An LCID the table does not hold falls back to the symbol table.
      expect(excelNumFmtToIntlOptions('#,##0.00[$kr-409]').currency).toBe('SEK');
      expect(excelNumFmtToIntlOptions(`[$${yen}-409]#,##0`).currency).toBe('JPY');
      // The LCID never reassigns another symbol: `[$$-414]` is still the dollar.
      expect(excelNumFmtToIntlOptions('[$$-414]#,##0').currency).toBe('USD');
      expect(excelNumFmtToIntlOptions('[$\u20AC-407]#,##0').currency).toBe('EUR');
    });

    it('should read the koruna, forint, ruble, lira and fullwidth yen symbols', () => {
      expect(excelNumFmtToIntlOptions('#,##0.00"K\u010D"').currency).toBe('CZK');
      expect(excelNumFmtToIntlOptions('#,##0.00 K\u010D').currency).toBe('CZK');
      expect(excelNumFmtToIntlOptions('#,##0.00"Ft"').currency).toBe('HUF');
      expect(excelNumFmtToIntlOptions('#,##0.00\u20BD').currency).toBe('RUB');
      expect(excelNumFmtToIntlOptions('\u20BA#,##0.00').currency).toBe('TRY');
      expect(excelNumFmtToIntlOptions('\uFFE5#,##0').currency).toBe('JPY');
      expect(excelNumFmtToIntlOptions('#,##0.00"z\u0142"').currency).toBe('PLN');
      expect(excelNumFmtToIntlOptions('\u00A3#,##0.00').currency).toBe('GBP');
    });
  });
});

describe('inferCellType - Excel BOOLEAN format on a number', () => {
  // Excel stores a cell formatted as BOOLEAN as the number 1 or 0 under `"TRUE";"TRUE";"FALSE"`, and
  // shows TRUE for any non-zero value. Read as a number, the column imported as 1 and 0 with the format
  // reported as dropped (found on a workbook Excel for Mac 16.113 saved, `excel-saved.xlsx`).
  it('should infer a checkbox for a number under the BOOLEAN format', () => {
    expect(inferCellType(cell({ value: 1, numFmt: '"TRUE";"TRUE";"FALSE"' }))).toEqual({ type: 'checkbox' });
    expect(inferCellType(cell({ value: 0, numFmt: '"TRUE";"TRUE";"FALSE"' }))).toEqual({ type: 'checkbox' });
    expect(inferCellType(cell({ value: 1, numFmt: '"true";"true";"false"' }))).toEqual({ type: 'checkbox' });
  });

  it('should import the number as the boolean Excel shows', () => {
    const format = '"TRUE";"TRUE";"FALSE"';
    const gridValue = (value) => {
      const snapshot = cell({ value, numFmt: format });

      return toGridValue(snapshot, inferCellType(snapshot));
    };

    expect(gridValue(1)).toBe(true);
    expect(gridValue(0)).toBe(false);
    expect(gridValue(-3)).toBe(true);
  });

  it('should leave other quoted three-section formats alone', () => {
    expect(inferCellType(cell({ value: 1, numFmt: '"Yes";"Yes";"No"' })).type).not.toBe('checkbox');
    expect(inferCellType(cell({ value: 1, numFmt: '"TRUE";"FALSE";"TRUE"' })).type).not.toBe('checkbox');
  });
});
