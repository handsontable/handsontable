import { parseRangeRef, type RangeRef } from '../../utils/xlsxEngine/cellRef';
import { PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, POINTS_PER_PIXEL } from '../../utils/xlsxEngine/units';
import type {
  CellSnapshot,
  CellValidationSnapshot,
  CellValue,
  SheetSnapshot,
  WorkbookSnapshot,
} from '../../utils/xlsxEngine/model';

/**
 * A cell type derived from a cell's number format and value. A `numeric` cell carries
 * `numericFormat` only when its Excel number format could be inverted into `Intl.NumberFormat`
 * options, and `unsupportedNumFmt` (the raw pattern) only when it could not.
 */
export type InferredType =
  | { type: 'numeric'; numericFormat?: Intl.NumberFormatOptions; unsupportedNumFmt?: string }
  | { type: 'date'; dateFormat: Intl.DateTimeFormatOptions }
  | { type: 'time'; timeFormat: Intl.DateTimeFormatOptions }
  | { type: 'checkbox' }
  | { type: 'text' };

/**
 * Currency symbols the export can write, mapped back to their ISO 4217 codes. Longer symbols are
 * matched first, so `R$` never reads as `$`.
 */
const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  zł: 'PLN',
  '₹': 'INR',
  '₩': 'KRW',
  CHF: 'CHF',
  kr: 'SEK',
  R$: 'BRL',
};

/**
 * `CURRENCY_SYMBOL_TO_CODE`'s symbols, longest first, so a multi-character symbol wins over a
 * single-character one that is its suffix.
 */
const CURRENCY_SYMBOLS = Object.keys(CURRENCY_SYMBOL_TO_CODE).sort((a, b) => b.length - a.length);

/**
 * Matches Excel's locale-tagged currency token, `[$<symbol>-<LCID>]` or `[$<symbol>]`.
 */
const CURRENCY_TOKEN_REGEX = /\[\$([^\]-]*)(?:-[^\]]*)?\]/;

/**
 * The dollar-sign composites `Intl.NumberFormat` writes under `en-US` for currencies whose symbol
 * is a dollar but not THE dollar, mapped to their ISO 4217 codes. `intlNumFormatToExcelNumFmt`
 * emits them bare (`HK$#,##0`), the same way it emits a bare ISO code for a currency with no
 * symbol at all (`CHF#,##0`, `SEK#,##0`).
 */
const DOLLAR_COMPOSITE_TO_CODE: Record<string, string> = {
  A$: 'AUD',
  CA$: 'CAD',
  HK$: 'HKD',
  MX$: 'MXN',
  NT$: 'TWD',
  NZ$: 'NZD',
  US$: 'USD',
};

/**
 * A bare currency marker at either end of a number format: a three-letter ISO code (`CHF`, `SEK`)
 * or a dollar composite (`HK$`, `US$`), separated from the digits by an optional space. The
 * alternation is anchored to the pattern's number part (`#` or `0`) on the inner side so a format
 * code that happens to be uppercase, such as `YYYY-MM-DD`, is never read as a currency.
 */
const BARE_CURRENCY_REGEX = /^([A-Z]{1,3}\$|[A-Z]{3}) ?(?=[#0])|(?<=[#0%]) ?([A-Z]{1,3}\$|[A-Z]{3})$/;

/**
 * Maps a bare currency marker to its ISO code: a three-letter code is its own code, a dollar
 * composite is looked up, anything else is unknown.
 */
function bareMarkerToCode(marker: string): string | null {
  if (marker.endsWith('$')) {
    return DOLLAR_COMPOSITE_TO_CODE[marker] ?? null;
  }

  return marker;
}

/**
 * The format codes a number pattern may be composed of once its currency token and percent sign are
 * captured: digit placeholders, the grouping comma, the decimal point and spacing.
 */
const PLAIN_NUMBER_PATTERN_REGEX = /^[#0,.\s]+$/;

/**
 * The Excel epoch (1899-12-30) expressed in UTC milliseconds, the base every date serial counts from.
 */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

/**
 * Milliseconds in a day, used to convert whole-day offsets to and from the Excel epoch.
 */
const MS_PER_DAY = 86400000;

/**
 * Strips bracketed sections (`[$-409]`, `[Red]`, `[h]`) and quoted literals from a number format so
 * the classifier sees only format codes.
 */
function stripDecorations(numFmt: string): string {
  return numFmt.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, '').replace(/\\./g, '');
}

/**
 * Detects a date-shaped format code: `y`, `d` or a month name (`mmm`) anywhere, or a bare `m`
 * (ambiguous between "month" and "minute") when the format carries no `h` or `s` to disambiguate it
 * as a time — Excel's own rule for a lone `m`/`mm` token.
 */
function hasDateCode(bare: string): boolean {
  return /y|d|mmm/.test(bare) || (/m/.test(bare) && !/h|s/.test(bare));
}

/**
 * Detects a time-shaped format code: `h`, `s` or `AM/PM` anywhere, or a bare `m` read as "minute"
 * because the format also carries an `h` or `s`.
 */
function hasTimeCode(bare: string): boolean {
  return /h|s|am\/pm/.test(bare) || (/m/.test(bare) && /h|s/.test(bare));
}

/**
 * Detects a date-only, time-only or date-time number format.
 */
function classifyTemporal(numFmt: string): 'date' | 'time' | 'datetime' | null {
  const bare = stripDecorations(numFmt).toLowerCase();
  const hasDate = hasDateCode(bare);
  const hasTime = hasTimeCode(bare);
  const elapsedHours = /\[h\]/i.test(numFmt);

  if (hasDate && hasTime) {
    return 'datetime';
  }

  if (hasDate) {
    return 'date';
  }

  if (hasTime || elapsedHours) {
    return 'time';
  }

  return null;
}

/**
 * Splits a decoration-stripped, lower-cased number format into runs of one repeated format letter,
 * the `AM/PM` marker in either of its two spellings, and the single characters between them. An
 * `m` run has to be read next to its neighbours, so a run is the smallest useful token.
 */
const FORMAT_TOKEN_REGEX = /am\/pm|a\/p|y+|m+|d+|h+|s+|./g;

/**
 * The format letter a token is a run of, or an empty string for a separator or the `AM/PM` marker.
 */
function tokenCode(token: string): string {
  return /^[ymdhs]/.test(token) ? token[0] : '';
}

/**
 * Reads the format letter of the nearest run in one direction, skipping separators. Returns an
 * empty string when there is none.
 */
function neighborCode(tokens: string[], index: number, step: number): string {
  for (let i = index + step; i >= 0 && i < tokens.length; i += step) {
    const code = tokenCode(tokens[i]);

    if (code !== '') {
      return code;
    }
  }

  return '';
}

/**
 * Writes the option an `m` run stands for. Excel reads `m` as a minute when an hour run precedes it
 * or a second run follows it, and as a month everywhere else; `mmm` and `mmmm` are month names.
 */
function applyMonthOrMinute(options: Intl.DateTimeFormatOptions, tokens: string[], index: number): void {
  const length = tokens[index].length;

  if (neighborCode(tokens, index, -1) === 'h' || neighborCode(tokens, index, 1) === 's') {
    options.minute = length >= 2 ? '2-digit' : 'numeric';

    return;
  }

  if (length >= 3) {
    options.month = length >= 4 ? 'long' : 'short';

    return;
  }

  options.month = length === 2 ? '2-digit' : 'numeric';
}

/**
 * Writes the option a `d` run stands for. Excel reads one or two `d`s as the day of the month and
 * three or more as the weekday NAME, which is a different `Intl.DateTimeFormatOptions` key — so
 * `ddd`/`dddd` must not be read as a zero-padded day.
 */
function applyDayOrWeekday(options: Intl.DateTimeFormatOptions, tokens: string[], index: number): void {
  const length = tokens[index].length;

  if (length >= 3) {
    options.weekday = length >= 4 ? 'long' : 'short';

    return;
  }

  options.day = length === 2 ? '2-digit' : 'numeric';
}

/**
 * Writes the option one token stands for. A doubled run is a zero-padded component, a single one
 * is not, which is exactly the `'2-digit'` / `'numeric'` split.
 */
function applyFormatToken(options: Intl.DateTimeFormatOptions, tokens: string[], index: number): void {
  const length = tokens[index].length;

  switch (tokenCode(tokens[index])) {
    case 'y':
      options.year = length >= 3 ? 'numeric' : '2-digit';
      break;
    case 'd':
      applyDayOrWeekday(options, tokens, index);
      break;
    case 'h':
      options.hour = length >= 2 ? '2-digit' : 'numeric';
      break;
    case 's':
      options.second = length >= 2 ? '2-digit' : 'numeric';
      break;
    case 'm':
      applyMonthOrMinute(options, tokens, index);
      break;
    default:
      break;
  }
}

/**
 * Turns an Excel date or time number format into the `Intl.DateTimeFormatOptions` Handsontable's
 * `date` and `time` cell types take. Handsontable 18 types `dateFormat` and `timeFormat` as
 * `Intl.DateTimeFormatOptions`; a string is rejected by both renderers with a console warning and
 * the raw value is shown instead, so a pattern-shaped string must never be emitted here.
 *
 * `hour12` is written only when the format carries an hour, so a date-only or minute-and-second
 * format does not pin a clock it says nothing about.
 */
export function excelDateFmtToIntlOptions(numFmt: string): Intl.DateTimeFormatOptions {
  const tokens = stripDecorations(numFmt).toLowerCase().match(FORMAT_TOKEN_REGEX) ?? [];
  const options: Intl.DateTimeFormatOptions = {};

  tokens.forEach((token, index) => applyFormatToken(options, tokens, index));

  if (options.hour !== undefined) {
    options.hour12 = tokens.some(token => token === 'am/pm' || token === 'a/p');
  }

  return options;
}

/**
 * What a number format's currency capture produced: the ISO 4217 code when a known symbol was
 * found, and the pattern with that symbol removed.
 */
interface CurrencyCapture {
  /**
   * The ISO 4217 code the captured symbol maps to, or `null` when the pattern carries no currency.
   */
  currency: string | null;
  /**
   * The number format with the currency token removed.
   */
  rest: string;
}

/**
 * Captures the currency a number format carries: Excel's `[$<symbol>-<LCID>]` / `[$<symbol>]` token
 * first, then a leading or trailing symbol the way `intlNumFormatToExcelNumFmt` writes it, then a
 * bare ISO code or dollar composite (`CHF#,##0`, `HK$#,##0`) the same function writes for a
 * currency with no single-character symbol.
 */
function captureCurrency(numFmt: string): CurrencyCapture {
  const token = numFmt.match(CURRENCY_TOKEN_REGEX);

  if (token) {
    return {
      currency: CURRENCY_SYMBOL_TO_CODE[token[1].trim()] ?? null,
      rest: numFmt.replace(CURRENCY_TOKEN_REGEX, ''),
    };
  }

  const trimmed = numFmt.trim();

  for (const symbol of CURRENCY_SYMBOLS) {
    if (trimmed.startsWith(symbol)) {
      return { currency: CURRENCY_SYMBOL_TO_CODE[symbol], rest: trimmed.slice(symbol.length) };
    }

    if (trimmed.endsWith(symbol)) {
      return { currency: CURRENCY_SYMBOL_TO_CODE[symbol], rest: trimmed.slice(0, -symbol.length) };
    }
  }

  const bare = trimmed.match(BARE_CURRENCY_REGEX);

  if (bare) {
    return { currency: bareMarkerToCode(bare[1] ?? bare[2]), rest: trimmed.replace(BARE_CURRENCY_REGEX, '') };
  }

  return { currency: null, rest: numFmt };
}

/**
 * The most fraction digits `Intl.NumberFormat` accepts. ECMA-402 caps `minimumFractionDigits` and
 * `maximumFractionDigits` at 100, and the constructor throws a `RangeError` above it — inside the
 * grid's numeric renderer, which builds its formatter from whatever the column carries, so it would
 * throw on every draw. Excel's own number formats never reach past 30 fraction digits, so a pattern
 * above this is malformed rather than merely exotic, and is reported as unsupported.
 */
const MAX_INTL_FRACTION_DIGITS = 100;

/**
 * Counts the zeros that follow the decimal point, which is how many fraction digits the format pins.
 */
function countFractionDigits(pattern: string): number {
  const separator = pattern.indexOf('.');

  if (separator === -1) {
    return 0;
  }

  return pattern.slice(separator + 1).split('').filter(char => char === '0').length;
}

/**
 * Inverts `intlNumFormatToExcelNumFmt`: turns an Excel number format back into the
 * `Intl.NumberFormat` options Handsontable's numeric cell type takes. Returns `null` when the
 * pattern carries codes with no `Intl` equivalent (scientific notation, fractions, text literals
 * that change the reading), or pins more than the 100 fraction digits `Intl` accepts, so the caller
 * can report it as dropped.
 */
export function excelNumFmtToIntlOptions(numFmt: string): Intl.NumberFormatOptions | null {
  const { currency, rest } = captureCurrency(numFmt);
  const stripped = stripDecorations(rest).trim();
  const isPercent = stripped.endsWith('%');
  const bare = (isPercent ? stripped.slice(0, -1) : stripped).trim();

  if (!PLAIN_NUMBER_PATTERN_REGEX.test(bare) || !/[#0]/.test(bare)) {
    return null;
  }

  const fractionDigits = countFractionDigits(bare);

  if (fractionDigits > MAX_INTL_FRACTION_DIGITS) {
    return null;
  }

  const options: Intl.NumberFormatOptions = {};

  if (currency) {
    options.style = 'currency';
    options.currency = currency;
  } else if (isPercent) {
    options.style = 'percent';
  }

  options.minimumFractionDigits = fractionDigits;
  options.maximumFractionDigits = fractionDigits;
  options.useGrouping = bare.includes('#,##');

  return options;
}

/**
 * Turns a non-temporal number format into a numeric inferred type: with `numericFormat` when the
 * format inverts, and with the raw pattern under `unsupportedNumFmt` when it does not.
 */
function toNumericType(numFmt: string): InferredType {
  const numericFormat = excelNumFmtToIntlOptions(numFmt);

  return numericFormat ? { type: 'numeric', numericFormat } : { type: 'numeric', unsupportedNumFmt: numFmt };
}

/**
 * Derives a cell type from a cell's number format and value. Returns `null` when the cell is empty
 * and carries no format, so the caller can leave the column untyped.
 */
export function inferCellType(cell: CellSnapshot): InferredType | null {
  const { numFmt } = cell;
  const value = cellDisplayValue(cell);

  if (numFmt === '@') {
    return { type: 'text' };
  }

  if (numFmt) {
    // The currency comes off first: `CHF`, `SEK` and `HK$` carry an `h` or an `s` that would
    // otherwise read as a time code and turn a money column into `12:00:00`s.
    const temporal = classifyTemporal(captureCurrency(numFmt).rest);

    if (temporal === 'time') {
      return { type: 'time', timeFormat: excelDateFmtToIntlOptions(numFmt) };
    }

    // A date-time pattern stays a `date` cell carrying both halves in `dateFormat`, which is what
    // the export writes an `intl-date` cell as.
    if (temporal === 'date' || temporal === 'datetime') {
      return { type: 'date', dateFormat: excelDateFmtToIntlOptions(numFmt) };
    }

    if (numFmt !== 'General') {
      return toNumericType(numFmt);
    }
  }

  if (typeof value === 'boolean') {
    return { type: 'checkbox' };
  }

  if (typeof value === 'number') {
    return { type: 'numeric' };
  }

  if (typeof value === 'string') {
    return { type: 'text' };
  }

  return null;
}

/**
 * Two-digit zero padding.
 */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Converts an Excel date serial to an ISO calendar date, dropping any fractional day.
 */
export function serialToIsoDate(serial: number): string {
  const date = new Date(EXCEL_EPOCH_UTC + (Math.floor(serial) * MS_PER_DAY));

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Converts the fractional part of a serial to `HH:mm:ss`.
 */
export function serialToTimeString(serial: number): string {
  const totalSeconds = Math.round((serial - Math.floor(serial)) * 86400) % 86400;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Converts a serial with a fractional day to `YYYY-MM-DD HH:mm:ss`, the shape a date-time cell
 * exports to.
 */
export function serialToIsoDateTime(serial: number): string {
  // Round the whole serial to a second ONCE, then split: rounding the fraction on its own wrapped
  // `23:59:59.7` to `00:00:00` while the date half kept the original day, a full day off.
  const totalSeconds = Math.round(serial * 86400);
  const days = Math.floor(totalSeconds / 86400);

  return `${serialToIsoDate(days)} ${serialToTimeString((totalSeconds - (days * 86400)) / 86400)}`;
}

/**
 * Converts an Excel column width to CSS pixels, rounded to a whole pixel.
 */
export function excelWidthToPx(width: number): number {
  return Math.round(width * PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT);
}

/**
 * Converts a row height in points to CSS pixels, rounded to a whole pixel.
 */
export function pointsToPx(points: number): number {
  return Math.round(points / POINTS_PER_PIXEL);
}

/**
 * Finds a sheet by name, tolerating the single quotes Excel wraps around names.
 */
function findSheet(workbook: WorkbookSnapshot, quotedName: string): SheetSnapshot | undefined {
  const name = quotedName.replace(/^'(.*)'$/, '$1').replaceAll('\'\'', '\'');

  return workbook.sheets.find(sheet => sheet.name === name);
}

/**
 * The value a cell shows: a formula cell keeps its display text in `formula.result` with `value`
 * left `null`, every other cell in `value`.
 */
export function cellDisplayValue(cell: CellSnapshot): CellValue {
  return cell.formula ? cell.formula.result ?? null : cell.value;
}

/**
 * Converts one cell to the grid value, using the inferred type to turn serials into strings.
 */
export function toGridValue(cell: CellSnapshot, inferred: InferredType | null): unknown {
  const value = cellDisplayValue(cell);

  if (typeof value !== 'number' || !inferred) {
    return value;
  }

  // The presence of an hour in the derived options is what separates a date-time format from a
  // date-only one; the value the grid stores stays the ISO string either way.
  if (inferred.type === 'date') {
    return inferred.dateFormat.hour === undefined ? serialToIsoDate(value) : serialToIsoDateTime(value);
  }

  if (inferred.type === 'time') {
    return serialToTimeString(value);
  }

  return value;
}

/**
 * Reads a cell as the text a header label or a dropdown option carries: `null` for an empty cell,
 * otherwise the grid value as a string. Reading `cell.value` directly is wrong for exactly the
 * cells `toGridValue` exists for - a formula cell's `value` is `null` and a date cell's is a serial.
 */
export function toDisplayText(cell: CellSnapshot): string | null {
  const value = toGridValue(cell, inferCellType(cell));

  return value === null || value === undefined ? null : String(value);
}

/**
 * Reads a resolved range from a sheet, column-first, skipping empty cells. The range is clamped to
 * the sheet's real extent first: a reference comes verbatim from the file and may span the whole
 * sheet (`A:A`, or a hand-written `$A$1:$A$1048576`), and walking the declared rectangle instead of
 * the held one is a main-thread hang the file's author controls.
 */
function readRangeValues(sheet: SheetSnapshot, range: RangeRef): string[] {
  const source: string[] = [];
  const lastRow = Math.min(range.endRow, sheet.rows.length);
  const lastCol = Math.min(range.endCol, sheet.rows.reduce((width, row) => Math.max(width, row.length), 0));

  for (let col = range.startCol; col <= lastCol; col++) {
    for (let row = range.startRow; row <= lastRow; row++) {
      const cell = sheet.rows[row - 1]?.[col - 1];
      const text = cell ? toDisplayText(cell) : null;

      if (text !== null) {
        source.push(text);
      }
    }
  }

  return source;
}

/**
 * Turns a list validation into a dropdown source: an inline `"a,b,c"` list is split, a range
 * reference is read column-first from the sheet it names - or from `sheet`, the one the validation
 * sits on, when it names none. Excel stores a list whose source range is on the same sheet as a
 * bare `$A$1:$A$10`; only a range on another sheet, such as the export's own `_HotValidation`
 * helper, carries a `Sheet!` qualifier. Anything else returns `null`.
 */
export function resolveListSource(
  validation: CellValidationSnapshot, workbook: WorkbookSnapshot, sheet: SheetSnapshot
): string[] | null {
  const [formula] = validation.formulae;

  if (typeof formula !== 'string' || formula === '') {
    return null;
  }

  const inline = formula.match(/^"(.*)"$/);

  if (inline) {
    return inline[1].split(',').map(item => item.trim());
  }

  const separator = formula.lastIndexOf('!');
  const source = separator === -1 ? sheet : findSheet(workbook, formula.slice(0, separator));
  const range = parseRangeRef(formula.slice(separator + 1));

  if (!source || !range) {
    return null;
  }

  return readRangeValues(source, range);
}
