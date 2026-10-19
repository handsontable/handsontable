import {
  countFractionDigits,
  countNumberFractionDigits,
  isNumberBody,
  readBoolean,
  readDate,
  readNumber,
  readTime,
  splitNumberParts,
  splitYearLastDate,
  type NumberMode,
} from './values';
import type { InferredColumn } from './types';

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
   * The most distinct values a dropdown column may have, or `0` when dropdowns are off.
   */
  maxDropdownOptions: number;
}

/**
 * What a detector found: the column settings it proposes, how many values it read, and a factor
 * the confidence is scaled by when the reading leaned on the locale.
 */
export interface Detection {
  /**
   * The proposed column settings, without the confidence.
   */
  column: Omit<InferredColumn, 'confidence'>;
  /**
   * How many of the non-blank values the proposed settings read.
   */
  matched: number;
  /**
   * A factor below `1` when the reading is ambiguous.
   */
  certainty: number;
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
 * Detects `true`/`false` columns. Runs before the numeric detector, but `1` and `0` are not read
 * here, so a column of them stays numeric.
 */
function detectCheckbox(values: unknown[]): Detection | null {
  return { column: { type: 'checkbox' }, matched: countMatches(values, readBoolean), certainty: 1 };
}

/**
 * Settles a numeric column's decimal separator by vote: a value only one separator can read votes
 * for it, and a tie (`1.234`, `123`) leaves it to the locale.
 */
function voteDecimalSeparator(values: unknown[], context: DetectionContext): '.' | ',' {
  let dot = 0;
  let comma = 0;

  values.forEach((value) => {
    const parts = typeof value === 'string' ? splitNumberParts(value) : null;

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
 * Settles how a numeric column reads its values. The first string value with a currency sets the
 * currency, and the first number-shaped string decides whether the column holds percentages.
 */
function resolveNumberMode(values: unknown[], context: DetectionContext): NumberMode {
  const parts = values
    .map(value => (typeof value === 'string' ? splitNumberParts(value) : null))
    .filter(part => part !== null);

  return {
    decimalSeparator: voteDecimalSeparator(values, context),
    currency: parts.find(part => part.currency !== null)?.currency ?? null,
    percent: parts[0]?.percent ?? false,
  };
}

/**
 * Builds the `Intl.NumberFormat` options that print a numeric column the way it was written.
 */
function toNumericFormat(values: unknown[], mode: NumberMode): Intl.NumberFormatOptions {
  let fractionDigits = 0;
  let useGrouping = false;
  const groupSeparator = mode.decimalSeparator === '.' ? ',' : '.';

  values.forEach((value) => {
    if (readNumber(value, mode) === null) {
      return;
    }

    if (typeof value === 'number') {
      fractionDigits = Math.max(fractionDigits, countNumberFractionDigits(value));

      return;
    }

    const { body } = splitNumberParts(value as string) as { body: string };

    fractionDigits = Math.max(fractionDigits, countFractionDigits(body, mode.decimalSeparator));
    useGrouping = useGrouping || body.includes(groupSeparator);
  });

  const style: Intl.NumberFormatOptions = {};

  if (mode.currency !== null) {
    style.style = 'currency';
    style.currency = mode.currency;

  } else if (mode.percent) {
    style.style = 'percent';
  }

  return { ...style, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits, useGrouping };
}

/**
 * Detects numeric columns, including currency amounts and percentages.
 */
function detectNumeric(values: unknown[], context: DetectionContext): Detection | null {
  const mode = resolveNumberMode(values, context);
  const inputFormat = mode.percent
    ? { decimalSeparator: mode.decimalSeparator, percent: true }
    : { decimalSeparator: mode.decimalSeparator };

  return {
    column: { type: 'numeric', numericFormat: toNumericFormat(values, mode), inputFormat },
    matched: countMatches(values, value => readNumber(value, mode)),
    certainty: 1,
  };
}

/**
 * Settles a date column's day and month order by vote: a first part above 12 can only be a day,
 * and a second part above 12 can only be a day too. Returns `null` when no value decides it.
 */
function voteDateOrder(values: unknown[]): 'DMY' | 'MDY' | null {
  let dayFirst = 0;
  let monthFirst = 0;

  values.forEach((value) => {
    const parts = splitYearLastDate(value);

    if (parts) {
      dayFirst += parts[0] > 12 && parts[1] <= 12 ? 1 : 0;
      monthFirst += parts[1] > 12 && parts[0] <= 12 ? 1 : 0;
    }
  });

  if (dayFirst === monthFirst) {
    return null;
  }

  return dayFirst > monthFirst ? 'DMY' : 'MDY';
}

/**
 * Detects date columns: ISO dates and their `/` and `.` variants, and year-last dates in either
 * day and month order.
 */
function detectDate(values: unknown[], context: DetectionContext): Detection | null {
  const voted = voteDateOrder(values);
  const dateOrder = voted ?? context.localeDateOrder;
  const readings = values.map(value => readDate(value, dateOrder)).filter(reading => reading !== null);
  const hasYearLast = values.some(value => splitYearLastDate(value) !== null);

  return {
    column: {
      type: 'date',
      dateFormat: {
        year: 'numeric',
        month: readings.every(reading => reading.paddedMonth) ? '2-digit' : 'numeric',
        day: readings.every(reading => reading.paddedDay) ? '2-digit' : 'numeric',
      },
      ...(hasYearLast ? { inputFormat: { dateOrder } } : {}),
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

  return { column: { type: 'time', timeFormat }, matched: readings.length, certainty: 1 };
}

/**
 * Detects columns of a few repeated strings. A column qualifies when it has at most
 * `maxDropdownOptions` distinct values and every value repeats at least once on average, which
 * keeps a column of names or free text from becoming a dropdown.
 */
function detectDropdown(values: unknown[], context: DetectionContext): Detection | null {
  const strings = values.filter(value => typeof value === 'string');
  const source = Array.from(new Set(strings));

  if (source.length > context.maxDropdownOptions || strings.length < source.length * 2) {
    return null;
  }

  return { column: { type: 'dropdown', source }, matched: strings.length, certainty: 1 };
}

/**
 * The detectors in the order they are tried. The first one whose confidence reaches the floor
 * wins, so the order is the tie-break rule.
 */
export const DETECTORS: Detector[] = [
  detectCheckbox,
  detectNumeric,
  detectDate,
  detectTime,
  detectDropdown,
];
