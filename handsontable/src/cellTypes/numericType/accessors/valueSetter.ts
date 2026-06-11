import {
  isCommaThousandsGroupedInteger,
  isDotThousandsGroupedInteger,
  isDotThousandsGroupedFloat,
  isNumericLike,
  getParsedNumber,
} from '../../../helpers/number';
import { isNullish } from '../../../dataMap/metaManager/utils';
import type { CellProperties } from '../../../settings';

/**
 * Gets the decimal separator preferred by the cell.
 *
 * @param {object} [cellMeta] The cell meta object.
 * @returns {'.'|','|undefined}
 */
function getCellDecimalSeparator(cellMeta: CellProperties) {
  const numericFormat = cellMeta?.numericFormat as { culture?: string; pattern?: string } | undefined;
  const locale = numericFormat?.culture ?? (cellMeta?.locale as string | undefined);

  if (typeof locale === 'string' && locale.length > 0) {
    try {
      const decimalPart = new Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find(({ type }) => type === 'decimal');

      if (decimalPart?.value === '.' || decimalPart?.value === ',') {
        return decimalPart.value;
      }
    } catch {
      // Invalid locale values are ignored and fall back to the pattern-based detection.
    }
  }

  const pattern = numericFormat?.pattern;

  if (typeof pattern === 'string') {
    const dotIndex = pattern.lastIndexOf('.');
    const commaIndex = pattern.lastIndexOf(',');

    if (dotIndex > -1 && commaIndex > -1) {
      return dotIndex > commaIndex ? '.' : ',';
    }

    if (commaIndex > -1 && dotIndex === -1) {
      return '.';
    }

    if (dotIndex > -1 && commaIndex === -1) {
      return '.';
    }
  }
}

/**
 * Defines what value is set to a numeric-typed cell.
 *
 * @param {*} newValue The value to be set.
 * @param {number} _row The row index.
 * @param {number} _column The column index.
 * @param {object} cellMeta The cell meta object.
 * @returns {*} The new value to be set.
 */
export function valueSetter(newValue: unknown, _row: number, _column: number, cellMeta: CellProperties): unknown {
  if (typeof newValue !== 'string') {
    return newValue;
  }

  const decimalSeparator = getCellDecimalSeparator(cellMeta);

  if (
    isNumericLike(newValue) ||
    isCommaThousandsGroupedInteger(newValue, decimalSeparator) ||
    isDotThousandsGroupedInteger(newValue, decimalSeparator) ||
    isDotThousandsGroupedFloat(newValue, decimalSeparator)
  ) {
    const parsedNumber = getParsedNumber(newValue, {
      decimalSeparator,
    });

    return isNullish(parsedNumber) ? newValue : parsedNumber;
  }

  return newValue;
}
