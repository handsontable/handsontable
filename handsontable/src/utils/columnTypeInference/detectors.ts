import { resolveCurrencyCode } from './locale';
import {
  MAX_FRACTION_DIGITS,
  countFractionDigits,
  countNumberFractionDigits,
  hasLeadingZero,
  isGroupedBody,
  isNumberBody,
  readDate,
  readSplitNumber,
  readTime,
  splitNumberParts,
  splitYearLastDate,
  type BooleanValues,
  type CompiledDateFormat,
  type DateReading,
  type NumberMode,
  type NumberParts,
} from './values';
import type { DetectedColumn } from './types';

/**
 * The column-wide inputs every detector shares.
 */
export interface DetectionContext {
  /**
   * The decimal separator of the locale, used when the column does not settle it.
   */
  localeDecimalSeparator: '.' | ',';
  /**
   * The day and month order of the locale, used when the column does not settle it.
   */
  localeDateOrder: 'DMY' | 'MDY';
  /**
   * The region of the locale, which picks the currency a shared symbol (`$`, `kr`) stands for.
   */
  region: string;
  /**
   * The most distinct values a dropdown column may have, or `0` when dropdowns are off.
   */
  maxDropdownOptions: number;
  /**
   * The formats from the `dateFormats` option. When there are any, they replace the built-in
   * year-last reading.
   */
  dateFormats: CompiledDateFormat[];
  /**
   * The words from the `booleanValues` option, or `null` when it is not set.
   */
  booleanValues: BooleanValues | null;
  /**
   * Reads a value as a boolean, the `booleanValues` words included.
   */
  readBoolean: (value: unknown) => boolean | null;
}

/**
 * What a detector found: the column settings it proposes, how many values it read, and a factor
 * the confidence is scaled by when the reading leaned on the locale.
 */
export interface Detection {
  /**
   * The proposed column settings and the way the values were written.
   */
  column: DetectedColumn;
  /**
   * How many of the non-blank values the proposed settings read.
   */
  matched: number;
  /**
   * A factor below `1` when the reading is ambiguous.
   */
  certainty: number;
  /**
   * Set on a type that is only a fallback for strings. It reads every string, so it always has the
   * largest share; it wins only when no other detector reaches the confidence floor.
   */
  fallback?: boolean;
}

/**
 * A detector reads a column's non-blank sampled values and proposes one cell type, or returns
 * `null` when the type does not apply at all.
 */
type Detector = (values: unknown[], context: DetectionContext) => Detection | null;

/**
 * The score a date column gets when its day and month order came from the locale, not the data.
 */
const LOCALE_ORDER_CERTAINTY = 0.95;

/**
 * Counts the values a reader accepts.
 */
function countMatches(values: unknown[], read: (value: unknown) => unknown): number {
  return values.reduce<number>((count, value) => count + (read(value) === null ? 0 : 1), 0);
}

/**
 * Detects `true`/`false` columns, and columns of the `booleanValues` words. Runs before the numeric
 * detector, but `1` and `0` are not read here unless they are listed words, so a column of them
 * stays numeric. The words travel in `inputFormat`, because the converter has no options to read
 * them from.
 */
function detectCheckbox(values: unknown[], context: DetectionContext): Detection | null {
  const column: DetectedColumn = { settings: { type: 'checkbox' } };

  if (context.booleanValues) {
    column.inputFormat = { booleanValues: context.booleanValues };
  }

  return { column, matched: countMatches(values, context.readBoolean), certainty: 1 };
}

/**
 * A value of a numeric candidate column, split once so every pass reads the same parts.
 */
interface SplitValue {
  /**
   * The value itself.
   */
  value: unknown;
  /**
   * Its split string form, or `null` for a non-string or a string that is not number-shaped.
   */
  parts: NumberParts | null;
}

/**
 * Settles a numeric column's decimal separator by vote: a value only one separator can read votes
 * for it, and a tie (`1.234`, `123`) leaves it to the locale.
 */
function voteDecimalSeparator(values: SplitValue[], context: DetectionContext): '.' | ',' {
  let dot = 0;
  let comma = 0;

  values.forEach(({ parts }) => {
    if (parts) {
      const readsDot = isNumberBody(parts.body, '.');
      const readsComma = isNumberBody(parts.body, ',');

      dot += readsDot && !readsComma ? 1 : 0;
      comma += readsComma && !readsDot ? 1 : 0;
    }
  });

  if (dot === comma) {
    return context.localeDecimalSeparator;
  }

  return dot > comma ? '.' : ',';
}

/**
 * Settles how a numeric column reads its values. The decimal separator is a vote. The currency
 * symbol and the percent reading are the combination that reads the most values: a currency column
 * also reads its bare numbers, so `$5, 5, 5, $5` is a USD column whichever order it comes in. A tie
 * goes to the symbol that appears first in the column, and to a plain reading over a percent one.
 */
function resolveNumberMode(values: SplitValue[], context: DetectionContext): NumberMode {
  const decimalSeparator = voteDecimalSeparator(values, context);
  const symbols = Array.from(new Set(values.map(({ parts }) => parts?.currencySymbol ?? null)))
    .filter(symbol => symbol !== null);
  let best: NumberMode = { decimalSeparator, currencySymbol: null, percent: false };
  let bestCount = -1;

  [...symbols, null].forEach((currencySymbol) => {
    [false, true].forEach((percent) => {
      const mode: NumberMode = { decimalSeparator, currencySymbol, percent };
      const count = values.filter(({ value, parts }) => readSplitNumber(value, parts, mode) !== null).length;

      if (count > bestCount) {
        best = mode;
        bestCount = count;
      }
    });
  });

  return best;
}

/**
 * Builds the `Intl.NumberFormat` options that print a numeric column the way it was written, from
 * the values the column reads. The fraction digits are capped at `MAX_FRACTION_DIGITS`, since
 * `Intl.NumberFormat` throws above 100.
 */
function toNumericFormat(read: SplitValue[], mode: NumberMode, context: DetectionContext): Intl.NumberFormatOptions {
  // Text values pin the digits: `1.50` and `2.00` are written with two. A real number does not, so
  // one computed float (`1 / 3`) widens the maximum and leaves the others unpadded.
  let writtenDigits = 0;
  let numberDigits = 0;
  let useGrouping = false;

  read.forEach(({ value, parts }) => {
    if (parts === null) {
      numberDigits = Math.max(numberDigits, countNumberFractionDigits(value as number));

      return;
    }

    // An exponent moves the point: `1.23E+15` has no fraction, `1.5E-7` has eight digits.
    const digits = countFractionDigits(parts.body, mode.decimalSeparator) - parts.exponent;

    writtenDigits = Math.max(writtenDigits, digits);
    useGrouping = useGrouping || isGroupedBody(parts.body, mode.decimalSeparator);
  });

  const style: Intl.NumberFormatOptions = {};

  if (mode.currencySymbol !== null) {
    style.style = 'currency';
    style.currency = resolveCurrencyCode(mode.currencySymbol, context.region);

  } else if (mode.percent) {
    style.style = 'percent';
  }

  const minimumFractionDigits = Math.min(Math.max(writtenDigits, 0), MAX_FRACTION_DIGITS);
  const maximumFractionDigits = Math.min(Math.max(writtenDigits, numberDigits, 0), MAX_FRACTION_DIGITS);

  return { ...style, minimumFractionDigits, maximumFractionDigits, useGrouping };
}

/**
 * Detects numeric columns, including currency amounts and percentages. Each value is split once,
 * and the format is built only from the values the column reads.
 */
function detectNumeric(values: unknown[], context: DetectionContext): Detection | null {
  const split = values.map(value => ({
    value,
    parts: typeof value === 'string' ? splitNumberParts(value) : null,
  }));

  // One zero-led integer rules the column out: `02134` would render as `2134`, so a ZIP column with a
  // few such codes among plain ones must not become numeric.
  if (split.some(({ parts }) => parts !== null && hasLeadingZero(parts.body))) {
    return null;
  }

  const mode = resolveNumberMode(split, context);
  const read = split.filter(({ value, parts }) => readSplitNumber(value, parts, mode) !== null);
  const inputFormat = {
    decimalSeparator: mode.decimalSeparator,
    ...(mode.percent ? { percent: true } : {}),
    ...(mode.currencySymbol !== null ? { currencySymbol: mode.currencySymbol } : {}),
  };

  return {
    column: { settings: { type: 'numeric', numericFormat: toNumericFormat(read, mode, context) }, inputFormat },
    matched: read.length,
    certainty: 1,
  };
}

/**
 * Settles a date column's day and month order by vote: a first part above 12 can only be a day,
 * a second part above 12 can only be a day too, and a dot separator reads as day first. Returns
 * `null` when no value decides it.
 */
function voteDateOrder(yearLastParts: Array<[number, number, string]>): 'DMY' | 'MDY' | null {
  let dayFirst = 0;
  let monthFirst = 0;

  yearLastParts.forEach(([first, second, separator]) => {
    const dayShows = first > 12 && second <= 12;
    const monthShows = second > 12 && first <= 12;

    // A dot is how day-first locales write a date (`12.03.2026`), unless a part says otherwise.
    dayFirst += dayShows || (separator === '.' && !monthShows) ? 1 : 0;
    monthFirst += monthShows ? 1 : 0;
  });

  if (dayFirst === monthFirst) {
    return null;
  }

  return dayFirst > monthFirst ? 'DMY' : 'MDY';
}

/**
 * Builds a date column's settings from the values it reads: the zero padding follows them.
 */
function toDateSettings(readings: DateReading[]): DetectedColumn['settings'] {
  return {
    type: 'date',
    dateFormat: {
      year: 'numeric',
      month: readings.every(reading => reading.paddedMonth) ? '2-digit' : 'numeric',
      day: readings.every(reading => reading.paddedDay) ? '2-digit' : 'numeric',
    },
  };
}

/**
 * Detects date columns with the `dateFormats` formats: the column takes the format that reads the
 * most values, the earlier one on a tie, and ISO dates are read alongside. The format is recorded
 * even when no sampled value needs it, so rows past the sample convert with it.
 */
function detectListedDate(values: unknown[], formats: CompiledDateFormat[]): Detection {
  const readAll = (candidate: CompiledDateFormat) => values
    .map(value => readDate(value, 'MDY', candidate))
    .filter(reading => reading !== null);
  let [format] = formats;
  let readings = readAll(format);

  formats.slice(1).forEach((candidate) => {
    const candidateReadings = readAll(candidate);

    if (candidateReadings.length > readings.length) {
      format = candidate;
      readings = candidateReadings;
    }
  });

  return {
    column: { settings: toDateSettings(readings), inputFormat: { dateFormat: format.pattern } },
    matched: readings.length,
    certainty: 1,
  };
}

/**
 * Detects date columns: ISO dates and their `/` and `.` variants, and year-last dates in either
 * day and month order, or the `dateFormats` formats instead of the year-last dates.
 */
function detectDate(values: unknown[], context: DetectionContext): Detection | null {
  if (context.dateFormats.length > 0) {
    return detectListedDate(values, context.dateFormats);
  }

  const yearLastParts = values.map(splitYearLastDate).filter(parts => parts !== null);
  const voted = voteDateOrder(yearLastParts);
  const dateOrder = voted ?? context.localeDateOrder;
  const readings = values.map(value => readDate(value, dateOrder)).filter(reading => reading !== null);
  const hasYearLast = yearLastParts.length > 0;

  return {
    column: {
      settings: toDateSettings(readings),
      // Recorded even when no sampled value is year-last, so rows past the sample convert in the
      // same order the locale settles.
      inputFormat: { dateOrder },
    },
    matched: readings.length,
    certainty: hasYearLast && voted === null ? LOCALE_ORDER_CERTAINTY : 1,
  };
}

/**
 * Detects time columns, in 24-hour or 12-hour form.
 */
function detectTime(values: unknown[]): Detection | null {
  const readings = values.map(readTime).filter(reading => reading !== null);
  const hour12 = readings.some(reading => reading.hour12);
  const timeFormat: Intl.DateTimeFormatOptions = {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    ...(readings.some(reading => reading.hasSeconds) ? { second: '2-digit' } : {}),
    hour12,
  };

  return { column: { settings: { type: 'time', timeFormat } }, matched: readings.length, certainty: 1 };
}

/**
 * The fewest distinct values a dropdown has: a single repeated value is no choice.
 */
const MIN_DROPDOWN_OPTIONS = 2;

/**
 * The fewest values a dropdown is inferred from. A handful of rows repeat by chance, and a column
 * that becomes a strict dropdown rejects every value it has not seen.
 */
const MIN_DROPDOWN_VALUES = 6;

/**
 * Detects columns of a few repeated strings. A column qualifies when it has at least
 * `MIN_DROPDOWN_VALUES` values, between `MIN_DROPDOWN_OPTIONS` and `maxDropdownOptions` distinct
 * ones, and every value repeats at least once on average, which keeps a column of names or free text
 * from becoming a dropdown. A short list of names that repeat can still qualify: turn dropdowns off
 * with `dropdown: false` when that is wrong for the data.
 */
function detectDropdown(values: unknown[], context: DetectionContext): Detection | null {
  // Trimmed, like every other reader: padded CSV values are one option, not several.
  const strings = values.filter(value => typeof value === 'string').map(value => value.trim());
  const source = Array.from(new Set(strings));
  const tooFew = source.length < MIN_DROPDOWN_OPTIONS || strings.length < MIN_DROPDOWN_VALUES;

  if (tooFew || source.length > context.maxDropdownOptions || strings.length < source.length * 2) {
    return null;
  }

  return {
    column: { settings: { type: 'dropdown', source } },
    matched: strings.length,
    certainty: 1,
    fallback: true,
  };
}

/**
 * The detectors in the order they are tried. The one that reads the largest share of the values wins
 * once it reaches the floor, and on equal shares the earlier one does, so the order is the
 * tie-break rule.
 */
export const DETECTORS: Detector[] = [
  detectCheckbox,
  detectNumeric,
  detectDate,
  detectTime,
  detectDropdown,
];

/**
 * The detectors when the `dateFormats` option lists a format: dates before numbers, so a column of
 * digits that a listed format reads (`YYYYMMDD`) becomes a date on a tie.
 */
const DATE_FIRST_DETECTORS: Detector[] = [
  detectCheckbox,
  detectDate,
  detectNumeric,
  detectTime,
  detectDropdown,
];

/**
 * Returns the detectors in the order they are tried for the given options.
 */
export function getDetectors(context: DetectionContext): Detector[] {
  return context.dateFormats.length > 0 ? DATE_FIRST_DETECTORS : DETECTORS;
}
