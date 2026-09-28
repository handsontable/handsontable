const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86400000;

/**
 * Converts a JavaScript `Date` to an Excel date serial number.
 *
 * @private
 * @param {Date} date The date to convert.
 * @returns {number}
 */
export function toExcelDateSerial(date: Date): number {
  const localDateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((localDateUtc - EXCEL_EPOCH_UTC) / MS_PER_DAY);
}

/**
 * Parses an ISO 8601 date string (`'YYYY-MM-DD'`) to an Excel date serial number.
 *
 * @private
 * @param {*} value Cell value — expected to be an ISO 8601 string.
 * @returns {number|null}
 */
export function parseIsoStringToSerial(value: unknown): number | null {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return toExcelDateSerial(date);
}

/**
 * Parses a time string to an Excel time serial number (fractional day: 0.0–1.0).
 *
 * Supports 24-hour formats (`'HH:mm'`, `'HH:mm:ss'`) and 12-hour formats
 * (`'h:mm AM/PM'`, `'h:mm:ss AM/PM'`).
 *
 * @private
 * @param {*} value Cell value — expected to be a time string.
 * @returns {number|null}
 */
export function parseTimeStringToSerial(value: unknown): number | null {
  if (!value) {
    return null;
  }

  const str = String(value).trim();
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    const seconds = match24[3] ? parseInt(match24[3], 10) : 0;

    if (hours > 23 || minutes > 59 || seconds > 59) {
      return null;
    }

    return ((hours * 3600) + (minutes * 60) + seconds) / 86400;
  }

  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);

  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const seconds = match12[3] ? parseInt(match12[3], 10) : 0;
    const period = match12[4].toUpperCase();

    if (hours > 12 || minutes > 59 || seconds > 59) {
      return null;
    }

    if (period === 'AM' && hours === 12) {
      hours = 0;
    } else if (period === 'PM' && hours !== 12) {
      hours += 12;
    }

    return ((hours * 3600) + (minutes * 60) + seconds) / 86400;
  }

  return null;
}

/**
 * Returns the Excel `numFmt` string for a date cell (OOXML built-in format ID 14).
 *
 * @private
 * @returns {string}
 */
export function getDateNumFmt(): string {
  return 'mm-dd-yy';
}

/**
 * Returns the Excel `numFmt` string for a time cell.
 *
 * @private
 * @returns {string}
 */
export function getTimeNumFmt(): string {
  return 'h:mm:ss';
}

/**
 * Parses an ISO 8601 date-time string to an Excel date serial number with a fractional-day time part.
 *
 * @private
 * @param {*} value Cell value — expected to be an ISO 8601 date-time string.
 * @returns {number|null}
 */
export function parseIsoDateTimeStringToSerial(value: unknown): number | null {
  if (!value) {
    return null;
  }

  // Mirrors ISO_DATETIME_REGEX in helpers/dateTime.ts, but captures the year for local parsing.
  const match = String(value).match(
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(?:[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?)?$/
  );

  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;
  const seconds = match[6] ? parseInt(match[6], 10) : 0;
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const timeSerial = ((hours * 3600) + (minutes * 60) + seconds) / 86400;

  return toExcelDateSerial(date) + timeSerial;
}

/**
 * Returns the Excel `numFmt` string for a date-time cell.
 *
 * @private
 * @returns {string}
 */
export function getDateTimeNumFmt(): string {
  return 'mm-dd-yy h:mm:ss';
}

/**
 * Excel month tokens keyed by the `Intl.DateTimeFormatOptions#month` value they stand for. `narrow`
 * has no Excel equivalent and is deliberately absent, so it drops out of the pattern.
 *
 * @private
 */
const MONTH_TOKENS: Record<string, string | undefined> = {
  numeric: 'm',
  '2-digit': 'mm',
  short: 'mmm',
  long: 'mmmm',
};

/**
 * Excel day-of-month tokens keyed by the `Intl.DateTimeFormatOptions#day` value they stand for.
 *
 * @private
 */
const DAY_TOKENS: Record<string, string | undefined> = {
  numeric: 'd',
  '2-digit': 'dd',
};

/**
 * Excel year tokens keyed by the `Intl.DateTimeFormatOptions#year` value they stand for.
 *
 * @private
 */
const YEAR_TOKENS: Record<string, string | undefined> = {
  numeric: 'yyyy',
  '2-digit': 'yy',
};

/**
 * Excel weekday-name tokens keyed by the `Intl.DateTimeFormatOptions#weekday` value they stand for.
 *
 * @private
 */
const WEEKDAY_TOKENS: Record<string, string | undefined> = {
  short: 'ddd',
  long: 'dddd',
};

/**
 * Excel hour tokens keyed by the `Intl.DateTimeFormatOptions#hour` value they stand for.
 *
 * @private
 */
const HOUR_TOKENS: Record<string, string | undefined> = {
  numeric: 'h',
  '2-digit': 'hh',
};

/**
 * Excel second tokens keyed by the `Intl.DateTimeFormatOptions#second` value they stand for.
 *
 * @private
 */
const SECOND_TOKENS: Record<string, string | undefined> = {
  numeric: 's',
  '2-digit': 'ss',
};

/**
 * Builds the date half of an Excel number format from `Intl.DateTimeFormatOptions`, in Excel's US
 * `m-d-y` order, so that the import's `excelDateFmtToIntlOptions` reads the same options back.
 * Omitted components are omitted from the pattern. A month NAME switches the separator to a space
 * (`mmmm yyyy`), because `mmmm-yyyy` is not a shape Excel writes.
 *
 * A weekday name is expressible on its own (`dddd`), which the import reads back as `weekday`, so
 * options naming only a weekday build a pattern rather than falling back and dropping it.
 *
 * Returns `null` when the options are missing, are a legacy pattern string, or name no date
 * component at all — the caller then falls back to the fixed format the export has always written.
 *
 * @private
 * @param {object|undefined} options The cell's Intl date options.
 * @returns {string|null}
 */
function buildDatePattern(options: Intl.DateTimeFormatOptions | undefined, locale?: string): string | null {
  if (!options || typeof options !== 'object') {
    return null;
  }

  const month = MONTH_TOKENS[options.month ?? ''];
  const day = DAY_TOKENS[options.day ?? ''];
  const year = YEAR_TOKENS[options.year ?? ''];
  const weekday = WEEKDAY_TOKENS[options.weekday ?? ''];
  const parts = [month, day, year].filter(part => part !== undefined);

  if (parts.length === 0) {
    return weekday ?? null;
  }

  const localized = locale === undefined
    ? null
    : buildLocalizedDatePattern(options, locale, { month, day, year, weekday });

  if (localized !== null) {
    return localized;
  }

  const body = parts.join(month === 'mmm' || month === 'mmmm' ? ' ' : '-');

  return weekday === undefined ? body : `${weekday}, ${body}`;
}

/**
 * The literal characters a localized date pattern may carry between its components. Anything else
 * (a locale's era word, a right-to-left mark) makes the pattern fall back to the US order.
 */
const DATE_LITERAL_REGEX = /^[-./, ]+$/;

/**
 * Orders the date components and picks their separators the way the cell's locale renders them,
 * through `Intl.DateTimeFormat#formatToParts` — the same call the grid's date renderer makes. A
 * `de-DE` cell showing `15.01.2024` therefore exports `dd.mm.yyyy`, not `mm-dd-yyyy`, and Excel
 * shows what the grid showed. Returns `null` when the locale is malformed or a part cannot be
 * expressed, and the caller keeps the US order.
 */
function buildLocalizedDatePattern(
  options: Intl.DateTimeFormatOptions, locale: string,
  tokens: { month?: string; day?: string; year?: string; weekday?: string }
): string | null {
  let parts: Intl.DateTimeFormatPart[];

  try {
    parts = new Intl.DateTimeFormat(locale, {
      year: options.year, month: options.month, day: options.day, weekday: options.weekday,
    }).formatToParts(new Date(Date.UTC(2024, 0, 15)));
  } catch {
    return null;
  }

  const pattern: string[] = [];

  for (const part of parts) {
    if (part.type === 'literal') {
      if (!DATE_LITERAL_REGEX.test(part.value)) {
        return null;
      }

      pattern.push(part.value);
    } else if (part.type === 'month' || part.type === 'day' || part.type === 'year' || part.type === 'weekday') {
      const token = tokens[part.type];

      if (token === undefined) {
        return null;
      }

      pattern.push(token);
    } else {
      return null;
    }
  }

  return pattern.join('').trim();
}

/**
 * Answers whether an hour-carrying format renders on a 12-hour clock. An explicit `hour12` decides
 * it; an unspecified one is resolved from the locale the way `Intl` does, because that is what the
 * grid rendered — the time renderer builds its formatter as `new Intl.DateTimeFormat(locale,
 * timeFormat)` with the same `locale` cell property, so `{ hour: '2-digit', minute: '2-digit' }`
 * under `en-US` shows `09:30 AM`. Assuming 24-hour there wrote `hh:mm`, which the import reads back
 * as `hour12: false`, and the target grid then rendered `09:30`.
 *
 * A malformed locale tag makes `Intl.DateTimeFormat` throw, which is treated as a 24-hour clock —
 * the shape the export has always written.
 *
 * @private
 * @param {object} options The cell's Intl time options, known to carry an hour.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @returns {boolean}
 */
function resolveHour12(options: Intl.DateTimeFormatOptions, locale: string | undefined): boolean {
  if (options.hour12 !== undefined) {
    return options.hour12 === true;
  }

  try {
    return new Intl.DateTimeFormat(locale, options).resolvedOptions().hour12 === true;
  } catch {
    return false;
  }
}

/**
 * Builds the time half of an Excel number format from `Intl.DateTimeFormatOptions`, in Excel's
 * `h:mm:ss` order. A minute is always written as `mm`: Excel reads an `m` run as a minute only when
 * an hour precedes it or a second follows it, and as a month everywhere else, so a minute with
 * neither neighbour cannot be expressed and returns `null` instead of an `mm` the import would read
 * back as a month.
 *
 * Returns `null` when the options are missing, are a legacy pattern string, or name no time
 * component at all.
 *
 * @private
 * @param {object|undefined} options The cell's Intl time options.
 * @param {string|undefined} locale BCP 47 locale tag from the `locale` cell property.
 * @returns {string|null}
 */
function buildTimePattern(
  options: Intl.DateTimeFormatOptions | undefined, locale: string | undefined
): string | null {
  if (!options || typeof options !== 'object') {
    return null;
  }

  const hour = HOUR_TOKENS[options.hour ?? ''];
  const minute = options.minute === undefined ? undefined : 'mm';
  const second = SECOND_TOKENS[options.second ?? ''];
  const parts = [hour, minute, second].filter(part => part !== undefined);

  if (parts.length === 0 || (minute !== undefined && hour === undefined && second === undefined)) {
    return null;
  }

  const body = parts.join(':');

  return hour !== undefined && resolveHour12(options, locale) ? `${body} AM/PM` : body;
}

/**
 * Derives the Excel `numFmt` string for a date cell from its `dateFormat` Intl options, so an export
 * followed by an import recovers the options the source grid rendered with. Falls back to
 * {@link getDateNumFmt} for a cell that carries no usable options.
 *
 * @private
 * @param {object|undefined} options The cell's `dateFormat` option.
 * @param {string|undefined} [locale] The cell's `locale` option, which orders the components and picks
 *   their separators the way the grid renders them.
 * @returns {string}
 */
export function intlDateFmtToExcelNumFmt(
  options: Intl.DateTimeFormatOptions | undefined, locale?: string | undefined
): string {
  return buildDatePattern(options, locale) ?? getDateNumFmt();
}

/**
 * Derives the Excel `numFmt` string for a time cell from its `timeFormat` Intl options. Falls back
 * to {@link getTimeNumFmt} for a cell that carries no usable options.
 *
 * @private
 * @param {object|undefined} options The cell's `timeFormat` option.
 * @param {string|undefined} locale The cell's `locale` option, which decides the clock when the
 *   options name no `hour12`.
 * @returns {string}
 */
export function intlTimeFmtToExcelNumFmt(
  options: Intl.DateTimeFormatOptions | undefined, locale?: string | undefined
): string {
  return buildTimePattern(options, locale) ?? getTimeNumFmt();
}

/**
 * Derives the Excel `numFmt` string for a date-time cell from its `dateTimeFormat` Intl options,
 * which carry both halves in one object. Falls back to {@link getDateTimeNumFmt} unless BOTH halves
 * are expressible, so a half-derived pattern never reaches the file.
 *
 * @private
 * @param {object|undefined} options The cell's `dateTimeFormat` option.
 * @param {string|undefined} locale The cell's `locale` option, which decides the clock when the
 *   options name no `hour12`.
 * @returns {string}
 */
export function intlDateTimeFmtToExcelNumFmt(
  options: Intl.DateTimeFormatOptions | undefined, locale?: string | undefined
): string {
  const datePattern = buildDatePattern(options, locale);
  const timePattern = buildTimePattern(options, locale);

  if (datePattern === null || timePattern === null) {
    return getDateTimeNumFmt();
  }

  return `${datePattern} ${timePattern}`;
}
