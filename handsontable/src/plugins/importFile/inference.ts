import { parseRangeRef, type RangeRef } from '../../utils/xlsxEngine/cellRef';
import { EXCEL_EPOCH_UTC, MS_PER_DAY } from '../../utils/xlsxEngine/dates';
import { PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, POINTS_PER_PIXEL } from '../../utils/xlsxEngine/units';
import {
  MAX_NUMBER_FORMAT_LENGTH,
  captureCurrency,
  classifyTemporalFormat,
  positiveFormatSection,
  stripFormatDecorations,
} from '../../utils/xlsxEngine/numFmtCode';
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
  | { type: 'intl-datetime'; dateTimeFormat: Intl.DateTimeFormatOptions }
  | { type: 'time'; timeFormat: Intl.DateTimeFormatOptions }
  | { type: 'checkbox' }
  | { type: 'text' };

/**
 * The format codes a number pattern may be composed of once its currency token and percent sign are
 * captured: digit placeholders, the grouping comma, the decimal point and spacing.
 */
const PLAIN_NUMBER_PATTERN_REGEX = /^[#0,.\s]+$/;

/**
 * Splits a decoration-stripped, lower-cased number format into elapsed-time sections (`[h]`,
 * `[mm]`, `[ss]`), runs of one repeated format letter, the `AM/PM` marker in either of its two
 * spellings, and the single characters between them. An `m` run has to be read next to its
 * neighbours, so a run is the smallest useful token.
 */
const FORMAT_TOKEN_REGEX = /\[(?:h+|m+|s+)\]|am\/pm|a\/p|y+|m+|d+|h+|s+|./g;

/**
 * The format letter a token is a run of (an elapsed-time section counts as its letter), or an empty
 * string for a separator or the `AM/PM` marker.
 */
function tokenCode(token: string): string {
  const match = /^\[?([ymdhs])/.exec(token);

  return match ? match[1] : '';
}

/**
 * Writes the option an elapsed-time section stands for. `[m]` and `[s]` are always a minute and a
 * second, whatever surrounds them. `[h]` writes an `hour`: leaving the hour out showed `13:30` as
 * `30` and every whole hour as `0`. `Intl.DateTimeFormat` has no elapsed components, so these
 * options fit only a duration under the leading section's capacity (a day for `[h]`, an hour for
 * `[m]`, a minute for `[s]`); `inferCellType` keeps a longer one a number (`exceedsElapsedFormat`).
 */
function applyElapsedToken(options: Intl.DateTimeFormatOptions, token: string): void {
  const length = token.length - 2;

  if (token[1] === 'h') {
    options.hour = length >= 2 ? '2-digit' : 'numeric';
  } else if (token[1] === 'm') {
    options.minute = length >= 2 ? '2-digit' : 'numeric';
  } else if (token[1] === 's') {
    options.second = length >= 2 ? '2-digit' : 'numeric';
  }
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

  if (tokens[index].startsWith('[')) {
    applyElapsedToken(options, tokens[index]);

    return;
  }

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
  const tokens = stripFormatDecorations(numFmt, { keepElapsed: true }).toLowerCase().match(FORMAT_TOKEN_REGEX) ?? [];
  const options: Intl.DateTimeFormatOptions = {};

  tokens.forEach((token, index) => applyFormatToken(options, tokens, index));

  if (options.hour !== undefined) {
    options.hour12 = tokens.some(token => token === 'am/pm' || token === 'a/p');
  }

  return options;
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
  // `Intl` renders a negative number with its own minus sign, so the positive section is the whole
  // format as far as it can be expressed.
  const { currency, rest } = captureCurrency(positiveFormatSection(numFmt).trim());
  const stripped = stripFormatDecorations(rest).trim();
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
 * Derives a cell type from a non-empty number format alone. Returns `null` for `General`, which
 * says nothing about the type, so the caller falls back to the cell's value.
 */
function inferFromNumberFormat(numFmt: string): InferredType | null {
  if (numFmt === '@') {
    return { type: 'text' };
  }

  // Excel caps a format code at 255 characters, so a longer one is malformed: it is reported as an
  // unsupported format instead of being parsed, which also bounds every regex below.
  if (numFmt.length > MAX_NUMBER_FORMAT_LENGTH) {
    return { type: 'numeric', unsupportedNumFmt: numFmt };
  }

  // The same classification the native reader's `date1904` shift asks (`isTemporalFormatCode`), so
  // a serial the reader shifted is always one this types as a date or a time. It takes the currency
  // off first and reads an elapsed-time section (`[h]:mm`) as a time.
  const temporal = classifyTemporalFormat(numFmt);

  if (temporal === 'time') {
    return { type: 'time', timeFormat: excelDateFmtToIntlOptions(numFmt) };
  }

  // A date-time pattern is an `intl-datetime` cell, the type the export writes one from: a `date`
  // cell accepts a date-only ISO value, so a date-time value rendered `#bad-value#` there.
  if (temporal === 'datetime') {
    return { type: 'intl-datetime', dateTimeFormat: excelDateFmtToIntlOptions(numFmt) };
  }

  if (temporal === 'date') {
    return { type: 'date', dateFormat: excelDateFmtToIntlOptions(numFmt) };
  }

  return numFmt === 'General' ? null : toNumericType(numFmt);
}

/**
 * The first elapsed-time section of a format (`[h]`, `[mm]`, `[ss]`), read on the format's own
 * letters. Bounded by `MAX_NUMBER_FORMAT_LENGTH`, which every caller checks first.
 */
const LEADING_ELAPSED_SECTION_REGEX = /\[(h+|m+|s+)\]/i;

/**
 * The serial (in days) at which an elapsed section stops fitting the clock component it renders
 * through: `Intl.DateTimeFormat` has no elapsed hours, minutes or seconds, so `[h]` shows the hour
 * of the day, `[m]` the minute of the hour and `[s]` the second of the minute.
 */
const ELAPSED_SECTION_CAPACITY: Record<string, number> = {
  h: 1,
  m: 1 / 24,
  s: 1 / 1440,
};

/**
 * Whether a value under an elapsed-time format is a duration the grid cannot show as a time: one
 * past the capacity of the format's leading section (`[h]:mm` at 25:30, `[mm]:ss` at 90 minutes),
 * or a negative one. Such a cell would lose its whole days or hours from the data, not only from
 * the display, because the grid value is a `HH:mm:ss` string - so it stays a number instead.
 * Rounded to a second, the precision `serialToTimeString` keeps.
 */
export function exceedsElapsedFormat(numFmt: string | null, value: CellValue): boolean {
  if (typeof value !== 'number' || !numFmt || numFmt.length > MAX_NUMBER_FORMAT_LENGTH) {
    return false;
  }

  const section = LEADING_ELAPSED_SECTION_REGEX.exec(stripFormatDecorations(numFmt, { keepElapsed: true }));

  if (!section) {
    return false;
  }

  const seconds = Math.round(value * 86400);
  const capacity = Math.round(ELAPSED_SECTION_CAPACITY[section[1][0].toLowerCase()] * 86400);

  return seconds < 0 || seconds >= capacity;
}

/**
 * Derives a cell type from a cell's number format and value. Returns `null` when the cell is empty
 * and carries no format, so the caller can leave the column untyped.
 */
export function inferCellType(cell: CellSnapshot): InferredType | null {
  const { numFmt } = cell;

  // A boolean is a checkbox whatever its format says. LibreOffice writes its BOOLEAN format
  // `"TRUE";"TRUE";"FALSE"` on every `t="b"` cell; read first, that format made the column
  // `numeric` and reported a number format the import never needed.
  if (typeof cellDisplayValue(cell) === 'boolean') {
    return { type: 'checkbox' };
  }

  const fromFormat = numFmt ? inferFromNumberFormat(numFmt) : null;

  if (fromFormat?.type === 'time' && exceedsElapsedFormat(numFmt, cellDisplayValue(cell))) {
    return { type: 'numeric', unsupportedNumFmt: numFmt as string };
  }

  if (fromFormat) {
    return fromFormat;
  }

  const value = cellDisplayValue(cell);

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

  if (inferred.type === 'date') {
    return serialToIsoDate(value);
  }

  // `YYYY-MM-DD HH:mm:ss`, which the `intl-datetime` renderer, validator and editor all accept.
  if (inferred.type === 'intl-datetime') {
    return serialToIsoDateTime(value);
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
