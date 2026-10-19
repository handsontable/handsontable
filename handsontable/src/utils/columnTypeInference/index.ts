import { isObject } from '../../helpers/object';
import { DETECTORS, type DetectionContext } from './detectors';
import { getLocaleDateOrder, getLocaleDecimalSeparator, resolveLocale } from './locale';
import { isBlank, readBoolean, readDate, readNumber, readTime } from './values';
import type { InferColumnTypesOptions, InferredColumn } from './types';

export type { InferColumnTypesOptions, InferredCellType, InferredColumn, InferredInputFormat } from './types';

/**
 * How many rows are read when `sampleSize` is not given.
 */
const DEFAULT_SAMPLE_SIZE = 1000;

/**
 * The confidence floor when `minConfidence` is not given.
 */
const DEFAULT_MIN_CONFIDENCE = 0.9;

/**
 * The most distinct values a dropdown column may have when `dropdown.maxOptions` is not given.
 */
const DEFAULT_MAX_DROPDOWN_OPTIONS = 10;

/**
 * The rows `inferColumnTypes()` and `convertToInferredTypes()` take: arrays of values, or objects
 * keyed by column property.
 */
export type InferenceData = unknown[][] | Record<string, unknown>[];

/**
 * Reads a positive integer option, or returns the fallback for anything else.
 */
function toPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

/**
 * Reads the confidence floor, clamped to `0`–`1`, or returns the default for a non-number.
 */
function toConfidence(value: unknown): number {
  return typeof value === 'number' && !Number.isNaN(value)
    ? Math.min(Math.max(value, 0), 1)
    : DEFAULT_MIN_CONFIDENCE;
}

/**
 * Reads the most distinct values a dropdown column may have; `0` turns dropdowns off.
 */
function toMaxDropdownOptions(dropdown: InferColumnTypesOptions['dropdown']): number {
  if (dropdown === false) {
    return 0;
  }

  const maxOptions = typeof dropdown === 'object' ? dropdown.maxOptions : undefined;

  return toPositiveInteger(maxOptions, DEFAULT_MAX_DROPDOWN_OPTIONS);
}

/**
 * Lists the columns of the data: one index per position for arrays, sized by the widest sampled
 * row, or the keys of the first object row.
 */
function listColumnKeys(rows: unknown[]): Array<number | string> {
  const firstRow = rows.find(row => row !== null && row !== undefined);

  if (Array.isArray(firstRow)) {
    const width = rows.reduce<number>((max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max), 0);

    return Array.from({ length: width }, (_, index) => index);
  }

  return isObject(firstRow) ? Object.keys(firstRow as object) : [];
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
 * Picks a column's type: the first detector whose confidence reaches the floor, or `text`.
 */
function inferColumn(values: unknown[], context: DetectionContext, minConfidence: number): InferredColumn {
  const nonBlank = values.filter(value => !isBlank(value));

  if (nonBlank.length === 0) {
    return { type: 'text', confidence: 0 };
  }

  for (const detect of DETECTORS) {
    const detection = detect(nonBlank, context);
    const confidence = detection ? (detection.matched / nonBlank.length) * detection.certainty : 0;

    if (detection && detection.matched > 0 && confidence >= minConfidence) {
      return { ...detection.column, confidence };
    }
  }

  return { type: 'text', confidence: 1 };
}

/**
 * Infers a cell type and format for every column of raw, untyped data: rows parsed from a CSV
 * file, pasted text split into cells, or values from an API. The function is pure and
 * deterministic. It reads the first `sampleSize` rows, never the host's locale, and returns the same
 * result for the same input.
 *
 * Each returned entry uses the names of the grid's column options (`type`, `numericFormat`,
 * `dateFormat`, `timeFormat`, `source`, and `data` for object rows), plus `confidence` and
 * `inputFormat`. Pass the data through `convertToInferredTypes()` before loading it, so the values
 * match what each cell type stores.
 */
export function inferColumnTypes(data: InferenceData, options: InferColumnTypesOptions = {}): InferredColumn[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const locale = resolveLocale(options.locale);
  const rows = data.slice(0, toPositiveInteger(options.sampleSize, DEFAULT_SAMPLE_SIZE)) as unknown[];
  const minConfidence = toConfidence(options.minConfidence);
  const context: DetectionContext = {
    localeDecimalSeparator: getLocaleDecimalSeparator(locale),
    localeDateOrder: getLocaleDateOrder(locale),
    maxDropdownOptions: toMaxDropdownOptions(options.dropdown),
  };

  return listColumnKeys(rows).map((key) => {
    const column = inferColumn(rows.map(row => readCell(row, key)), context, minConfidence);

    return typeof key === 'string' ? { data: key, ...column } : column;
  });
}

/**
 * Converts one value to the shape its inferred cell type stores, or returns it unchanged when the
 * column cannot read it (a blank, a `Total` row, an `n/a`).
 */
function convertValue(value: unknown, column: InferredColumn): unknown {
  if (isBlank(value)) {
    return value;
  }

  let converted: unknown = null;
  const { inputFormat = {}, numericFormat = {} } = column;

  switch (column.type) {
    case 'numeric':
      converted = readNumber(value, {
        decimalSeparator: inputFormat.decimalSeparator ?? '.',
        currency: numericFormat.currency ?? null,
        percent: inputFormat.percent === true,
      });
      break;
    case 'date':
      converted = readDate(value, inputFormat.dateOrder ?? 'DMY')?.iso ?? null;
      break;
    case 'time':
      converted = readTime(value)?.value ?? null;
      break;
    case 'checkbox':
      converted = readBoolean(value);
      break;
    default:
      break;
  }

  return converted === null ? value : converted;
}

/**
 * Converts one row: an array by column position, an object by each column's `data` property.
 * Anything else is returned as it is.
 */
function convertRow(row: unknown, columns: InferredColumn[]): unknown {
  if (Array.isArray(row)) {
    return (row as unknown[]).map((value, index) => (columns[index] ? convertValue(value, columns[index]) : value));
  }

  if (!isObject(row)) {
    return row;
  }

  const copy: Record<string, unknown> = { ...(row as Record<string, unknown>) };

  columns.forEach((column) => {
    if (column.data !== undefined && Object.prototype.hasOwnProperty.call(copy, column.data)) {
      copy[column.data] = convertValue(copy[column.data], column);
    }
  });

  return copy;
}

/**
 * Returns a copy of the data with every value converted to what the column's inferred cell type
 * stores: a number for `numeric`, `YYYY-MM-DD` for `date`, `HH:mm:ss` for `time`, and a boolean for
 * `checkbox`. Every row is converted, not only the sampled ones. A value the column cannot read is
 * kept as it is, so the cell type's validator marks it. The input is never changed.
 */
export function convertToInferredTypes<T extends InferenceData>(data: T, columns: InferredColumn[]): T {
  if (!Array.isArray(data)) {
    return data;
  }

  return (data as unknown[]).map(row => convertRow(row, columns)) as T;
}
