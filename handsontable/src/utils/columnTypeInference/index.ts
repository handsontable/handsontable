import { isObject } from '../../helpers/object';
import { DETECTORS, type DetectionContext } from './detectors';
import { getLocaleDateOrder, getLocaleDecimalSeparator, getLocaleRegion, resolveLocale } from './locale';
import { isBlank, readBoolean, readDate, readDateTime, readNumber, readTime } from './values';
import type {
  DetectedColumn,
  InferColumnTypesOptions,
  InferColumnTypesResult,
  InferredCellType,
  InferredColumn,
  InferredColumnStats,
} from './types';

export type {
  InferColumnTypesOptions,
  InferColumnTypesResult,
  InferredCellType,
  InferredColumn,
  InferredColumnSettings,
  InferredColumnStats,
  InferredInputFormat,
} from './types';

/**
 * How many rows are read when `sampleSize` is not given.
 */
const DEFAULT_SAMPLE_SIZE = 1000;

/**
 * The confidence floor when `minConfidence` is not given.
 */
const DEFAULT_MIN_CONFIDENCE = 0.9;

/**
 * The types whose values have an order worth reporting as `min` and `max`.
 */
const RANGE_TYPES = new Set<InferredCellType>(['numeric', 'date', 'intl-datetime', 'time']);

/**
 * How many example values `stats` keeps when `stats: true` does not say.
 */
const DEFAULT_STATS_EXAMPLES = 5;

/**
 * The most distinct values a dropdown column may have when `dropdown.maxOptions` is not given.
 */
const DEFAULT_MAX_DROPDOWN_OPTIONS = 10;

/**
 * The rows `inferColumnTypes()` and `convertToInferredTypes()` take: arrays of values, or objects
 * keyed by column property. Read-only arrays, and rows typed with an interface, are accepted.
 */
export type InferenceData = ReadonlyArray<ReadonlyArray<unknown>> | ReadonlyArray<object>;

/**
 * What `convertToInferredTypes()` returns for the data it takes: the same row shape, with cells typed
 * `unknown`, since a converted cell is a number, a boolean, or a string whatever the input held.
 */
export type ConvertedData<T extends InferenceData> =
  T extends ReadonlyArray<ReadonlyArray<unknown>> ? unknown[][] : Record<string, unknown>[];

/**
 * Reads a positive integer option, `Infinity` included, or returns the fallback for anything else.
 */
function toPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && value >= 1 ? Math.floor(value) : fallback;
}

/**
 * Reads the confidence floor, clamped to `0` through `1`, or returns the default for a non-number.
 */
function toConfidence(value: unknown): number {
  return typeof value === 'number' && !Number.isNaN(value)
    ? Math.min(Math.max(value, 0), 1)
    : DEFAULT_MIN_CONFIDENCE;
}

/**
 * Reads the most distinct values a dropdown column may have. `dropdown: false` and
 * `maxOptions: 0` turn dropdowns off.
 */
function toMaxDropdownOptions(dropdown: InferColumnTypesOptions['dropdown']): number {
  const maxOptions = typeof dropdown === 'object' && dropdown !== null ? dropdown.maxOptions : undefined;

  if (dropdown === false || maxOptions === 0) {
    return 0;
  }

  return toPositiveInteger(maxOptions, DEFAULT_MAX_DROPDOWN_OPTIONS);
}

/**
 * Lists the columns of the data: one index per position for arrays, sized by the widest sampled
 * row, or for objects every key the sampled rows carry, in the order the keys first appear. A row
 * from an API often omits a property that is empty, so the first row alone can miss a column.
 */
function listColumnKeys(rows: unknown[]): Array<number | string> {
  const firstRow = rows.find(row => row !== null && row !== undefined);

  if (Array.isArray(firstRow)) {
    const width = rows.reduce<number>((max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max), 0);

    return Array.from({ length: width }, (_, index) => index);
  }

  const keys = new Set<string>();

  rows.forEach((row) => {
    if (isObject(row)) {
      Object.keys(row as object).forEach(key => keys.add(key));
    }
  });

  return Array.from(keys);
}

/**
 * Reads one cell of a row by column index or property.
 */
function readCell(row: unknown, key: number | string): unknown {
  if (Array.isArray(row) && typeof key === 'number') {
    return row[key];
  }

  return isObject(row) && typeof key === 'string' ? (row as Record<string, unknown>)[key] : undefined;
}

/**
 * What one column's inference found before it is shaped into an `InferredColumn`.
 */
interface ColumnVerdict {
  /**
   * The winning column options and how its values were written.
   */
  column: DetectedColumn;
  /**
   * The winner's confidence.
   */
  confidence: number;
  /**
   * The next best type, collected only when stats were asked for.
   */
  runnerUpType?: InferredCellType;
}

/**
 * A detector's proposal that reached the confidence floor.
 */
interface Winner {
  /**
   * The proposed column options and how its values were written.
   */
  column: DetectedColumn;
  /**
   * The share of values it read, scaled by the detector's certainty.
   */
  confidence: number;
  /**
   * The share of values it read, which decides between detectors.
   */
  share: number;
}

/**
 * Runs the detectors in order. Among the typed detectors the one that reads the largest share wins
 * once that share reaches the floor, and an earlier one keeps a tie. A fallback detector (`dropdown`)
 * reads every string, so it is tried on its own: it wins only when no typed detector reaches the floor.
 * With `collectRivals`, or when the winner reads less than every value, the rest still run: a later
 * one may read more.
 */
function runDetectors(
  nonBlank: unknown[],
  context: DetectionContext,
  minConfidence: number,
  collectRivals: boolean
): { winner: Winner | null; rivals: Array<{ type: InferredCellType; share: number }> } {
  let winner: Winner | null = null;
  const rivals: Array<{ type: InferredCellType; share: number }> = [];

  for (const detect of DETECTORS) {
    const detection = detect(nonBlank, context);
    const share = detection ? detection.matched / nonBlank.length : 0;

    if (detection === null || detection.matched === 0) {
      continue;
    }

    const outranks = winner === null || (share > winner.share && !detection.fallback);

    if (share >= minConfidence && outranks) {
      if (winner !== null) {
        rivals.push({ type: winner.column.settings.type, share: winner.share });
      }

      winner = { column: detection.column, confidence: share * detection.certainty, share };

      // Nothing after a detector that reads every value can read more.
      if (share === 1 && !collectRivals) {
        break;
      }

    } else {
      rivals.push({ type: detection.column.settings.type, share });
    }
  }

  return { winner, rivals };
}

/**
 * Picks a column's type: the typed detector with the largest share of read values that reaches the
 * floor (an earlier one wins a tie), then `dropdown`, then `text`. The floor is checked against the
 * share alone; the detector's certainty only scales the reported confidence, so a fully read date
 * column whose order came from the locale still wins. With `wantRunnerUp` every detector runs, and the
 * best other type is reported.
 */
function inferColumn(
  nonBlank: unknown[],
  context: DetectionContext,
  minConfidence: number,
  wantRunnerUp: boolean
): ColumnVerdict {
  if (nonBlank.length === 0) {
    return { column: { settings: { type: 'text' } }, confidence: 0 };
  }

  const { winner, rivals } = runDetectors(nonBlank, context, minConfidence, wantRunnerUp);
  // `toSorted` is stable, so equal shares keep the order of `DETECTORS`.
  const [rival] = rivals.toSorted((a, b) => b.share - a.share);
  const runnerUpType = rival?.type ?? (winner ? 'text' : undefined);

  return winner
    ? { column: winner.column, confidence: winner.confidence, runnerUpType }
    : { column: { settings: { type: 'text' } }, confidence: 1, runnerUpType };
}

/**
 * Reads one value into the shape a column's cell type stores, or returns `null` when it cannot.
 */
type ValueReader = (value: unknown) => unknown;

/**
 * Builds the reader for one column once, so converting a large dataset does not rebuild the
 * column's reading mode for every cell.
 */
function createReader(column: InferredColumn): ValueReader | null {
  const { inputFormat = {} } = column;

  switch (column.settings.type) {
    case 'numeric': {
      const mode = {
        decimalSeparator: inputFormat.decimalSeparator ?? '.',
        currencySymbol: inputFormat.currencySymbol ?? null,
        percent: inputFormat.percent === true,
      };

      return value => readNumber(value, mode);
    }
    case 'date': {
      const order = inputFormat.dateOrder ?? 'MDY';

      return value => readDate(value, order)?.iso ?? null;
    }
    case 'intl-datetime': {
      const order = inputFormat.dateOrder ?? 'MDY';

      return value => readDateTime(value, order)?.iso ?? null;
    }
    case 'time':
      return value => readTime(value)?.value ?? null;
    case 'checkbox':
      return readBoolean;
    case 'dropdown':
      // The detector compares trimmed values, so the converter writes the trimmed one: `source` lists
      // `Open` once, and the strict dropdown validator would reject `Open `.
      return value => (typeof value === 'string' ? value.trim() : null);
    default:
      return null;
  }
}

/**
 * Turns a value into text for counting and listing, trimmed. A `Date` becomes its ISO string, since
 * its own text follows the host's time zone.
 */
function toText(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  }

  return String(value).trim();
}

/**
 * Describes the sampled values of one column. `min` and `max` are taken over the values the
 * inferred type reads, after conversion, so they compare as numbers or as ISO text. `Date` objects are
 * left out of them.
 */
function describeColumn(
  values: unknown[],
  column: InferredColumn,
  runnerUpType: InferredCellType | undefined,
  exampleLimit: number
): InferredColumnStats {
  const nonBlank = values.filter(value => !isBlank(value));
  const distinct = Array.from(new Set(nonBlank.map(toText)));
  const reader = RANGE_TYPES.has(column.settings.type) ? createReader(column) : null;
  // A `Date` converts to its local wall clock, which follows the host's time zone, and the stats must not.
  const converted = reader
    ? nonBlank.filter(value => !(value instanceof Date)).map(reader)
      .filter((value): value is number | string => value !== null)
    : [];
  const stats: InferredColumnStats = {
    count: nonBlank.length,
    emptyCount: values.length - nonBlank.length,
    distinctCount: distinct.length,
    examples: distinct.slice(0, exampleLimit),
  };

  if (converted.length > 0) {
    // Numbers and ISO strings both order correctly under `<`; a column holds only one of the two.
    // A loop, since spreading into `Math.min` overflows the stack on a large sample.
    let [least] = converted;
    let most = least;

    for (const value of converted) {
      if (value < least) {
        least = value;
      }

      if (value > most) {
        most = value;
      }
    }

    stats.min = least;
    stats.max = most;
  }

  if (runnerUpType !== undefined) {
    stats.runnerUpType = runnerUpType;
  }

  return stats;
}

/**
 * Reads the `stats` option into the number of examples to keep, or `null` when stats are off.
 */
function toExampleLimit(stats: InferColumnTypesOptions['stats']): number | null {
  if (stats === undefined || stats === null || stats === false) {
    return null;
  }

  const requested = typeof stats === 'object' && stats !== null ? stats.examples : undefined;

  return typeof requested === 'number' && requested >= 0 ? Math.floor(requested) : DEFAULT_STATS_EXAMPLES;
}

/**
 * Reads the header text of a header row cell.
 */
function toTitle(cell: unknown): string {
  return isBlank(cell) ? '' : toText(cell);
}

/**
 * Infers every column of `rows`, which hold no header row.
 */
function inferColumns(
  rows: unknown[],
  header: unknown[] | null,
  context: DetectionContext,
  minConfidence: number,
  exampleLimit: number | null
): InferredColumn[] {
  return listColumnKeys(header ? [header, ...rows] : rows).map((key) => {
    const values = rows.map(row => readCell(row, key));
    const verdict = inferColumn(values.filter(value => !isBlank(value)), context, minConfidence, exampleLimit !== null);
    const column: InferredColumn = {
      settings: typeof key === 'string' ? { data: key, ...verdict.column.settings } : verdict.column.settings,
      confidence: verdict.confidence,
    };

    if (verdict.column.inputFormat) {
      column.inputFormat = verdict.column.inputFormat;
    }

    if (typeof key === 'string') {
      column.title = key;

    } else if (header) {
      column.title = toTitle(header[key]);
    }

    if (exampleLimit !== null) {
      column.stats = describeColumn(values, column, verdict.runnerUpType, exampleLimit);
    }

    return column;
  });
}

/**
 * Words a CSV or an API writes for a missing value. A first row that holds one is a record with a
 * gap, not a header.
 */
const MISSING_VALUE_WORDS = new Set(['-', '--', '?', 'n/a', 'na', '#n/a', 'null', 'none', 'nan', 'unknown', 'tbd']);

/**
 * The types that can tell a header cell from a data cell: they read some strings and not others.
 */
const HEADER_EVIDENCE_TYPES = new Set<InferredCellType>(['numeric', 'date', 'intl-datetime', 'time', 'checkbox']);

/**
 * Whether the first row reads as a header: array data, every cell a non-blank string across the
 * full width and none of them a missing-value word, and at least one typed column below it, with
 * every typed column rejecting its cell. A column of text has no type for a header to differ from, so
 * a table of text reads as data. One typed column that reads its cell (`2026-01-01`) is enough to
 * say the row holds data.
 */
function looksLikeHeader(first: unknown, columns: InferredColumn[]): boolean {
  if (!Array.isArray(first) || first.length < columns.length || columns.length === 0) {
    return false;
  }

  const row = first as unknown[];
  const cellsAreNames = row.every(cell => (
    typeof cell === 'string' && !isBlank(cell) && !MISSING_VALUE_WORDS.has(cell.trim().toLowerCase())
  ));

  if (!cellsAreNames) {
    return false;
  }

  const typed = columns.flatMap((column, index) => {
    // A dropdown reads any string, header text included, so it is no evidence either way.
    const reader = HEADER_EVIDENCE_TYPES.has(column.settings.type) ? createReader(column) : null;

    return reader ? [{ reader, cell: row[index] }] : [];
  });

  return typed.length > 0 && typed.every(({ reader, cell }) => reader(cell) === null);
}

/**
 * Infers a cell type and format for every column of raw, untyped data: rows parsed from a CSV
 * file, pasted text split into cells, or values from an API. The function is pure and
 * deterministic. It reads the first `sampleSize` rows, never the host's locale, and returns the same
 * result for the same input.
 *
 * Each column comes back as `{ settings, confidence, inputFormat, title, stats }`. `settings` uses
 * the names of the grid's column options (`type`, `numericFormat`, `dateFormat`, `dateTimeFormat`,
 * `timeFormat`, `source`, and `data` for object rows), so it can be passed to `columns` as it is; the rest
 * describes the inference. Pass the data through `convertToInferredTypes()` before loading it, so
 * the values match what each cell type stores.
 */
export function inferColumnTypes(
  data: InferenceData,
  options: InferColumnTypesOptions | null = {}
): InferColumnTypesResult {
  if (!Array.isArray(data)) {
    return { columns: [], headerRow: false };
  }

  const { locale: localeOption, sampleSize, minConfidence: minConfidenceOption, dropdown, headerRow, stats } =
    options ?? {};
  const locale = resolveLocale(localeOption);
  const limit = toPositiveInteger(sampleSize, DEFAULT_SAMPLE_SIZE);
  const minConfidence = toConfidence(minConfidenceOption);
  const exampleLimit = toExampleLimit(stats);
  const context: DetectionContext = {
    localeDecimalSeparator: getLocaleDecimalSeparator(locale),
    localeDateOrder: getLocaleDateOrder(locale),
    region: getLocaleRegion(locale),
    maxDropdownOptions: toMaxDropdownOptions(dropdown),
  };
  const rows = data as unknown[];
  const first = rows[0];

  if (Array.isArray(first) && (headerRow === true || headerRow === 'auto')) {
    const header = first as unknown[];
    const columns = inferColumns(rows.slice(1, 1 + limit), header, context, minConfidence, exampleLimit);

    if (headerRow === true || looksLikeHeader(header, columns)) {
      return { columns, headerRow: true };
    }
  }

  return { columns: inferColumns(rows.slice(0, limit), null, context, minConfidence, exampleLimit), headerRow: false };
}

/**
 * Converts one value with its column's reader, or returns it unchanged when the column has no
 * reader or cannot read it (a blank, a `Total` row, an `n/a`).
 */
function convertValue(value: unknown, reader: ValueReader | null | undefined): unknown {
  if (!reader || isBlank(value)) {
    return value;
  }

  const converted = reader(value);

  return converted === null ? value : converted;
}

/**
 * Converts one row: an array by column position, an object by each column's `data` property.
 * Anything else is returned as it is.
 */
function convertRow(row: unknown, columns: InferredColumn[], readers: Array<ValueReader | null>): unknown {
  if (Array.isArray(row)) {
    return (row as unknown[]).map((value, index) => convertValue(value, readers[index]));
  }

  if (!isObject(row)) {
    return row;
  }

  const copy: Record<string, unknown> = { ...(row as Record<string, unknown>) };

  columns.forEach((column, index) => {
    const { data } = column.settings;

    if (data !== undefined && Object.hasOwn(copy, data)) {
      copy[data] = convertValue(copy[data], readers[index]);
    }
  });

  return copy;
}

/**
 * Returns a copy of the data with every value converted to what the column's inferred cell type
 * stores: a number for `numeric`, `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm:ss` for
 * `intl-datetime`, `HH:mm:ss` for `time`, and a boolean for `checkbox`. A `Date` converts to its
 * local date and time, which is how the grid reads an `intl-datetime` value. Every row is converted,
 * not only the sampled ones. A value the column cannot read is kept as it is, so the cell type's
 * validator marks it. The input is never changed. The cells of the result are no longer the input's
 * type, which is why it is typed `unknown`.
 *
 * When the result says the first row is a header (`headerRow`), that row is left out: its cells are
 * the columns' `title`s.
 */
export function convertToInferredTypes<T extends InferenceData>(
  data: T,
  result: InferColumnTypesResult
): ConvertedData<T> {
  if (!Array.isArray(data)) {
    return data as unknown as ConvertedData<T>;
  }

  const { columns, headerRow } = result;
  const readers = columns.map(createReader);
  const rows = headerRow && Array.isArray(data[0]) ? (data as unknown[]).slice(1) : (data as unknown[]);

  return rows.map(row => convertRow(row, columns, readers)) as ConvertedData<T>;
}
