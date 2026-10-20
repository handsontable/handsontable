/**
 * Options accepted by `inferColumnTypes()`.
 */
export interface InferColumnTypesOptions {
  /**
   * How many data rows to read. The header row, when there is one, is not counted. `Infinity`
   * reads every row; a value below `1` reads the default. Defaults to `1000`.
   */
  sampleSize?: number;
  /**
   * Which data rows `sampleSize` picks. `'head'` reads the first rows. `'spread'` reads rows spaced
   * evenly across the data, the first and the last row included, so sorted data and a value that
   * appears only late are still sampled. Both are deterministic. Defaults to `'head'`.
   */
  sampling?: 'head' | 'spread';
  /**
   * The locale that settles an ambiguous column: the decimal separator of `1.234`, the day and
   * month order of `12/03/2026`, and the currency a shared symbol such as `$` stands for. Defaults to
   * `'en-US'`, or to the grid's `locale` through the `ImportFile` plugin method. A locale the
   * browser does not support falls back to `'en-US'`.
   */
  locale?: string;
  /**
   * The share of non-blank values, from `0` to `1`, a type has to read for the column to get it.
   * Below it the column falls back to `text`. Defaults to `0.9`.
   */
  minConfidence?: number;
  /**
   * Whether a column of a few repeated strings becomes a `dropdown`, and how many distinct values it
   * may have. Defaults to `true`, with `maxOptions` at `10`.
   */
  dropdown?: boolean | { maxOptions?: number };
  /**
   * Whether the first row of array data is a header row. `true` takes it as a header, `false` as
   * data, and `'auto'` takes it as a header when every cell of it is a non-blank string and at
   * least one column below it reads as a number, a date, a time, or a checkbox that the header cell
   * does not. A table of text only has no such evidence, so `'auto'` reads it as data. A header row
   * is left out of the inference and its cells come back as each column's `title`. Rows of
   * objects have no header row; the keys are the titles. Defaults to `false`.
   */
  headerRow?: boolean | 'auto';
  /**
   * Date formats to read instead of the built-in year-last dates (`12/03/2026`, `12.03.2026`). The
   * tokens are `YYYY` (a four-digit year), `MM` and `DD` (two digits), and `M` and `D` (one or two
   * digits); every other character is matched as it is, for example `DD/MM/YYYY`, `YYYYMMDD`, or
   * `D. M. YYYY`. A format needs exactly one year, one month, and one day token, and a format with
   * any other letter, or with an `M` or `D` token right next to another token (`YYYYMD`), is
   * ignored, with a console warning. A column takes the format that reads the most of its values,
   * and the earlier one in the list on a tie. A value the format does not match is still read as an
   * ISO date, and only in the form `2026-03-12`. Whole numbers are read too (`20260312` with
   * `YYYYMMDD`), padded back to the width of a fixed-width format (`1032026` is `01032026` for
   * `DDMMYYYY`), and not read at all when the year is below 1000, since `101` is a quantity far more
   * often than the year 1. A column that reads both as a date and as a number becomes a date.
   * Defaults to none, which reads the built-in year-last dates in the order the data or the
   * `locale` settles.
   */
  dateFormats?: ReadonlyArray<string>;
  /**
   * Words a `checkbox` column reads as `true` and as `false`, besides `true` and `false`
   * themselves, for example `{ true: ['yes', 'tak'], false: ['no', 'nie'] }`. Words are compared
   * trimmed and in any case (the Turkish dotted and dotless `i` count as one letter, so `HAYIR`
   * matches a listed `hayır`), and a number cell is compared as its text, so listed `1` and `0` read
   * the numbers `1` and `0`. A word listed on both sides reads as neither. Defaults to none.
   */
  booleanValues?: { true?: ReadonlyArray<string>; false?: ReadonlyArray<string> };
  /**
   * Whether to return `stats` for every column. `true` keeps the first 5 distinct values as
   * examples; `{ examples }` sets how many. Defaults to `false`.
   */
  stats?: boolean | { examples?: number };
}

/**
 * The cell types `inferColumnTypes()` can return.
 */
export type InferredCellType = 'numeric' | 'date' | 'time' | 'checkbox' | 'dropdown' | 'text';

/**
 * How the raw values of a column were written, which `convertToInferredTypes()` needs to read them.
 */
export interface InferredInputFormat {
  /**
   * The decimal separator of a `numeric` column.
   */
  decimalSeparator?: '.' | ',';
  /**
   * Set on a `numeric` column whose values are percentages, which are converted to fractions.
   */
  percent?: boolean;
  /**
   * The currency symbol of a `numeric` column's values. A value with another symbol is not
   * converted.
   */
  currencySymbol?: string;
  /**
   * The day and month order of a `date` column's year-last values: the one the sampled values
   * show, or the locale's when they show none. Not set when a format of the `dateFormats` option
   * compiles.
   */
  dateOrder?: 'DMY' | 'MDY';
  /**
   * The format from the `dateFormats` option that a `date` column's values are read with.
   */
  dateFormat?: string;
  /**
   * The words from the `booleanValues` option that a `checkbox` column reads, besides `true` and
   * `false`.
   */
  booleanValues?: { true: string[]; false: string[] };
}

/**
 * The column options of one inferred column. The names are the grid's column options, so the
 * object can be passed to the `columns` option as it is.
 */
export interface InferredColumnSettings {
  /**
   * The property the column reads, set when the data is an array of objects.
   */
  data?: string;
  /**
   * The inferred cell type. A column that no other type reads with enough confidence is `text`.
   */
  type: InferredCellType;
  /**
   * The `Intl.NumberFormat` options of a `numeric` column, following how the values were written:
   * the currency, the percent sign, the fraction digits, and the grouping.
   */
  numericFormat?: Intl.NumberFormatOptions;
  /**
   * The `Intl.DateTimeFormatOptions` of a `date` column.
   */
  dateFormat?: Intl.DateTimeFormatOptions;
  /**
   * The `Intl.DateTimeFormatOptions` of a `time` column.
   */
  timeFormat?: Intl.DateTimeFormatOptions;
  /**
   * The options of a `dropdown` column, in the order they first appear in the sampled rows. A value
   * that appears only outside the sampled rows is not listed, so the dropdown validator rejects it.
   */
  source?: string[];
}

/**
 * What a detector proposes for a column: the settings, plus how the values were written.
 */
export interface DetectedColumn {
  /**
   * The proposed column options.
   */
  settings: Omit<InferredColumnSettings, 'data'>;
  /**
   * How the values were written, when the converter needs to know.
   */
  inputFormat?: InferredInputFormat;
}

/**
 * What the sampled values of one column look like. Computed only when the `stats` option is set.
 * Every field is derived from the sampled rows, so it is deterministic.
 */
export interface InferredColumnStats {
  /**
   * How many sampled values are not blank.
   */
  count: number;
  /**
   * How many sampled values are blank (`null`, `undefined`, or whitespace only).
   */
  emptyCount: number;
  /**
   * How many different non-blank values were sampled, compared as trimmed text.
   */
  distinctCount: number;
  /**
   * The first distinct non-blank values, as trimmed text, in the order they appear.
   */
  examples: string[];
  /**
   * The smallest value of a `numeric` column (a number), a `date` column (`YYYY-MM-DD`), or a
   * `time` column (`HH:mm:ss`), after conversion. Not set for the other types.
   */
  min?: number | string;
  /**
   * The largest value, under the same rules as `min`.
   */
  max?: number | string;
  /**
   * The next best type: the other type that reads the largest share of the values. For a `text`
   * column it is the type that came closest to the confidence floor, and it is not set when no
   * type reads any value. For any other type with no rival it is `'text'`.
   */
  runnerUpType?: InferredCellType;
}

/**
 * One inferred column: the settings to give the grid, kept apart from what describes the inference.
 */
export interface InferredColumn {
  /**
   * The column options, assignable to one entry of the grid's `columns` option as they are.
   */
  settings: InferredColumnSettings;
  /**
   * The share of the column's non-blank sampled values the type reads, from `0` to `1`. A date
   * column whose day and month order came from the locale rather than the data scores `0.95` of
   * that share (the `minConfidence` floor is checked against the share itself). A `text` column
   * scores `1`, or `0` when every sampled value is blank.
   */
  confidence: number;
  /**
   * How the raw values were written. Set on `numeric` and `date` columns, and on `checkbox`
   * columns when the `booleanValues` option is set. Read by `convertToInferredTypes()`.
   */
  inputFormat?: InferredInputFormat;
  /**
   * The column's header: the text of its header row cell, or the property name for rows of objects.
   * Not set when array data has no header row.
   */
  title?: string;
  /**
   * What the sampled values look like. Set only when the `stats` option is on.
   */
  stats?: InferredColumnStats;
}

/**
 * What `inferColumnTypes()` returns.
 */
export interface InferColumnTypesResult {
  /**
   * One entry per column, in column order.
   */
  columns: InferredColumn[];
  /**
   * Whether the first row of the data was read as a header row. It is `true` when `headerRow` was
   * `true`, or was `'auto'` and found one. `convertToInferredTypes()` leaves that row out of its
   * result.
   */
  headerRow: boolean;
}
