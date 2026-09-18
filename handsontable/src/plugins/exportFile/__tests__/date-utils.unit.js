import {
  toExcelDateSerial,
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  getDateNumFmt,
  getTimeNumFmt,
  getDateTimeNumFmt,
  intlDateFmtToExcelNumFmt,
  intlTimeFmtToExcelNumFmt,
  intlDateTimeFmtToExcelNumFmt,
} from '../types/xlsx/date-utils';

describe('toExcelDateSerial', () => {
  it('should convert the Excel epoch origin (1900-01-01) to serial 2', () => {
    // Excel erroneously treats 1900 as a leap year, so 1900-01-01 = serial 2
    // (serial 1 = 1900-01-00 phantom day). The function uses the standard
    // offset from 1899-12-30, which produces the correct result for all real dates.
    expect(toExcelDateSerial(new Date(1900, 0, 1))).toBe(2);
  });

  it('should convert 1900-01-00 anchor (1899-12-31) to serial 1', () => {
    expect(toExcelDateSerial(new Date(1899, 11, 31))).toBe(1);
  });

  it('should convert a known modern date (2024-01-01) to its serial', () => {
    // Verified against Excel / Google Sheets
    expect(toExcelDateSerial(new Date(2024, 0, 1))).toBe(45292);
  });
});

describe('parseIsoStringToSerial', () => {
  it('should parse a valid ISO date string to the correct serial number', () => {
    expect(parseIsoStringToSerial('2024-01-01')).toBe(45292);
  });

  it('should return null for a non-ISO string', () => {
    expect(parseIsoStringToSerial('01/01/2024')).toBeNull();
    expect(parseIsoStringToSerial('January 1 2024')).toBeNull();
  });

  it('should return null for a falsy value', () => {
    expect(parseIsoStringToSerial(null)).toBeNull();
    expect(parseIsoStringToSerial(undefined)).toBeNull();
    expect(parseIsoStringToSerial('')).toBeNull();
  });
});

describe('parseTimeStringToSerial', () => {
  it('should parse a 24-hour HH:mm string to a fractional day', () => {
    expect(parseTimeStringToSerial('12:00')).toBeCloseTo(0.5, 10);
    expect(parseTimeStringToSerial('00:00')).toBe(0);
    expect(parseTimeStringToSerial('06:00')).toBeCloseTo(0.25, 10);
  });

  it('should parse a 24-hour HH:mm:ss string to a fractional day', () => {
    expect(parseTimeStringToSerial('12:00:00')).toBeCloseTo(0.5, 10);
    expect(parseTimeStringToSerial('23:59:59')).toBeCloseTo(((23 * 3600) + (59 * 60) + 59) / 86400, 10);
  });

  it('should parse a 12-hour AM/PM string to a fractional day', () => {
    expect(parseTimeStringToSerial('12:00 PM')).toBeCloseTo(0.5, 10);
    expect(parseTimeStringToSerial('12:00 AM')).toBe(0);
    expect(parseTimeStringToSerial('6:00 AM')).toBeCloseTo(0.25, 10);
    expect(parseTimeStringToSerial('6:00 PM')).toBeCloseTo(0.75, 10);
  });

  it('should parse a 12-hour AM/PM string with seconds', () => {
    expect(parseTimeStringToSerial('1:30:00 PM')).toBeCloseTo(((13 * 3600) + (30 * 60)) / 86400, 10);
  });

  it('should return null for an out-of-range time', () => {
    expect(parseTimeStringToSerial('25:00')).toBeNull();
    expect(parseTimeStringToSerial('12:60')).toBeNull();
  });

  it('should return null for a non-time string', () => {
    expect(parseTimeStringToSerial('not-a-time')).toBeNull();
  });

  it('should return null for a falsy value', () => {
    expect(parseTimeStringToSerial(null)).toBeNull();
    expect(parseTimeStringToSerial(undefined)).toBeNull();
    expect(parseTimeStringToSerial('')).toBeNull();
  });
});

describe('getDateNumFmt', () => {
  it('should return the Excel date format string', () => {
    expect(getDateNumFmt()).toBe('mm-dd-yy');
  });
});

describe('getTimeNumFmt', () => {
  it('should return the Excel time format string', () => {
    expect(getTimeNumFmt()).toBe('h:mm:ss');
  });
});

describe('intlDateFmtToExcelNumFmt', () => {
  it('should derive the Excel pattern from the cell\'s Intl date options, in Excel\'s m-d-y order', () => {
    expect(intlDateFmtToExcelNumFmt({ year: 'numeric', month: '2-digit', day: '2-digit' })).toBe('mm-dd-yyyy');
    expect(intlDateFmtToExcelNumFmt({ year: '2-digit', month: 'numeric', day: 'numeric' })).toBe('m-d-yy');
  });

  it('should write a month name and separate the parts with a space', () => {
    expect(intlDateFmtToExcelNumFmt({ year: 'numeric', month: 'short', day: 'numeric' })).toBe('mmm d yyyy');
    expect(intlDateFmtToExcelNumFmt({ year: 'numeric', month: 'long' })).toBe('mmmm yyyy');
  });

  it('should omit the components the options do not name', () => {
    expect(intlDateFmtToExcelNumFmt({ year: 'numeric', month: '2-digit' })).toBe('mm-yyyy');
    expect(intlDateFmtToExcelNumFmt({ day: '2-digit' })).toBe('dd');
  });

  it('should prefix a weekday name and keep it out of the m-d-y body', () => {
    expect(intlDateFmtToExcelNumFmt({ weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }))
      .toBe('ddd, mm-dd-yyyy');
    expect(intlDateFmtToExcelNumFmt({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      .toBe('dddd, mmmm d yyyy');
  });

  it('should write a lone weekday name, which Excel expresses and the import reads back', () => {
    expect(intlDateFmtToExcelNumFmt({ weekday: 'long' })).toBe('dddd');
    expect(intlDateFmtToExcelNumFmt({ weekday: 'short' })).toBe('ddd');
  });

  it('should order the components and pick the separators the cell\'s locale renders', () => {
    // The grid renders a `de-DE` cell as `15.01.2024`; the file has to show the same, not `01-15-2024`.
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };

    expect(intlDateFmtToExcelNumFmt(options, 'de-DE')).toBe('dd.mm.yyyy');
    expect(intlDateFmtToExcelNumFmt(options, 'en-GB')).toBe('dd/mm/yyyy');
    expect(intlDateFmtToExcelNumFmt(options, 'en-US')).toBe('mm/dd/yyyy');
    expect(intlDateFmtToExcelNumFmt({ year: 'numeric', month: 'long', day: 'numeric' }, 'en-US')).toBe('mmmm d, yyyy');
    // No locale keeps the US order and the `-` separator the export has always written.
    expect(intlDateFmtToExcelNumFmt(options)).toBe('mm-dd-yyyy');
    // A malformed locale falls back the same way.
    expect(intlDateFmtToExcelNumFmt(options, 'not a locale')).toBe('mm-dd-yyyy');
  });

  it('should fall back to the fixed format for options that name no date component', () => {
    expect(intlDateFmtToExcelNumFmt(undefined)).toBe(getDateNumFmt());
    // A legacy pattern string — Handsontable 18 types `dateFormat` as Intl options, but a grid
    // configured the old way must keep exporting exactly what it always did.
    expect(intlDateFmtToExcelNumFmt('YYYY-MM-DD')).toBe(getDateNumFmt());
    expect(intlDateFmtToExcelNumFmt({})).toBe(getDateNumFmt());
    expect(intlDateFmtToExcelNumFmt({ hour: 'numeric', minute: '2-digit' })).toBe(getDateNumFmt());
    // `narrow` has no Excel token, so the month drops out and nothing is left to write.
    expect(intlDateFmtToExcelNumFmt({ month: 'narrow' })).toBe(getDateNumFmt());
  });
});

describe('intlTimeFmtToExcelNumFmt', () => {
  // The clock of an hour-carrying format with no `hour12` comes from the locale, so every shape
  // assertion below names one (`de-DE` is a 24-hour locale) rather than leaning on the runtime's
  // default, which differs between machines.
  it('should derive the Excel pattern from the cell\'s Intl time options', () => {
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit', second: '2-digit' }, 'de-DE'))
      .toBe('hh:mm:ss');
    expect(intlTimeFmtToExcelNumFmt({ hour: 'numeric', minute: '2-digit', second: 'numeric' }, 'de-DE'))
      .toBe('h:mm:s');
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' }, 'de-DE')).toBe('hh:mm');
  });

  it('should append the AM/PM marker for a 12-hour clock only', () => {
    expect(intlTimeFmtToExcelNumFmt({ hour: 'numeric', minute: '2-digit', hour12: true })).toBe('h:mm AM/PM');
    expect(intlTimeFmtToExcelNumFmt({ hour: 'numeric', minute: '2-digit', hour12: false })).toBe('h:mm');
  });

  it('should resolve an unspecified hour12 from the locale, the way the time renderer does', () => {
    // A grid with `timeFormat: { hour: '2-digit', minute: '2-digit' }` and the default `en-US`
    // locale renders `09:30 AM`, because `Intl` defaults the clock from the locale. Writing
    // `hh:mm` made the import read `hour12: false` and the target grid render `09:30`.
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' }, 'en-US')).toBe('hh:mm AM/PM');
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' }, 'de-DE')).toBe('hh:mm');
  });

  it('should let an explicit hour12 win over the locale', () => {
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit', hour12: false }, 'en-US')).toBe('hh:mm');
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit', hour12: true }, 'de-DE'))
      .toBe('hh:mm AM/PM');
  });

  it('should leave a format carrying no hour untouched by the locale', () => {
    expect(intlTimeFmtToExcelNumFmt({ minute: '2-digit', second: '2-digit' }, 'en-US')).toBe('mm:ss');
    expect(intlTimeFmtToExcelNumFmt({ minute: '2-digit', second: '2-digit' }, 'de-DE')).toBe('mm:ss');
  });

  it('should treat a locale Intl rejects as a 24-hour clock instead of throwing', () => {
    expect(intlTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' }, 'not a locale')).toBe('hh:mm');
  });

  it('should fall back rather than write an mm run Excel would read as a month', () => {
    // An `m` run is a minute only next to an `h` or an `s`; alone it is a month.
    expect(intlTimeFmtToExcelNumFmt({ minute: '2-digit' })).toBe(getTimeNumFmt());
    expect(intlTimeFmtToExcelNumFmt({ minute: '2-digit', second: '2-digit' })).toBe('mm:ss');
  });

  it('should fall back to the fixed format for options that name no time component', () => {
    expect(intlTimeFmtToExcelNumFmt(undefined)).toBe(getTimeNumFmt());
    expect(intlTimeFmtToExcelNumFmt('HH:mm:ss')).toBe(getTimeNumFmt());
    expect(intlTimeFmtToExcelNumFmt({})).toBe(getTimeNumFmt());
    expect(intlTimeFmtToExcelNumFmt({ year: 'numeric', month: '2-digit' })).toBe(getTimeNumFmt());
  });
});

describe('intlDateTimeFmtToExcelNumFmt', () => {
  it('should join both halves of the cell\'s single dateTimeFormat object', () => {
    expect(intlDateTimeFmtToExcelNumFmt({
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }, 'de-DE')).toBe('dd.mm.yyyy hh:mm:ss');
  });

  it('should resolve an unspecified hour12 from the locale in the time half', () => {
    const options = {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    };

    expect(intlDateTimeFmtToExcelNumFmt(options, 'en-US')).toBe('mm/dd/yyyy hh:mm AM/PM');
    expect(intlDateTimeFmtToExcelNumFmt(options, 'de-DE')).toBe('dd.mm.yyyy hh:mm');
  });

  it('should fall back unless BOTH halves are expressible', () => {
    expect(intlDateTimeFmtToExcelNumFmt(undefined)).toBe(getDateTimeNumFmt());
    expect(intlDateTimeFmtToExcelNumFmt({ year: 'numeric', month: '2-digit', day: '2-digit' }))
      .toBe(getDateTimeNumFmt());
    expect(intlDateTimeFmtToExcelNumFmt({ hour: '2-digit', minute: '2-digit' })).toBe(getDateTimeNumFmt());
  });
});
