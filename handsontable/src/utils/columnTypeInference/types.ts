/**
 * Options accepted by `inferColumnTypes()`.
 */
export interface InferColumnTypesOptions {
  /**
   * How many rows, from the top, to read. `Infinity` reads every row; a value below `1` reads the
   * default. Defaults to `1000`.
   */
  sampleSize?: number;
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
   * show, or the locale's when they show none.
   */
  dateOrder?: 'DMY' | 'MDY';
}

/**
 * One column's inferred settings. The cell type and format keys use the names of the grid's column
 * options, so an entry can be passed to the `columns` option as it is.
 */
export interface InferredColumn {
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
   * that appears only past `sampleSize` is not listed, so the dropdown validator rejects it.
   */
  source?: string[];
  /**
   * The share of the column's non-blank sampled values the type reads, from `0` to `1`. A date
   * column whose day and month order came from the locale rather than the data scores `0.95` of
   * that share (the `minConfidence` floor is checked against the share itself). A `text` column
   * scores `1`, or `0` when every sampled value is blank.
   */
  confidence: number;
  /**
   * How the raw values were written. Set on `numeric` and `date` columns.
   */
  inputFormat?: InferredInputFormat;
}
