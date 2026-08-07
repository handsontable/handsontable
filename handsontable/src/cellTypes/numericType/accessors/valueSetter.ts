import {
  isCommaThousandsGroupedInteger,
  isDotThousandsGroupedInteger,
  isDotThousandsGroupedFloat,
  isLossyNumericConversion,
  isNumeric,
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
  const isCommaGrouped = isCommaThousandsGroupedInteger(newValue, decimalSeparator);
  const isDotGroupedInteger = isDotThousandsGroupedInteger(newValue, decimalSeparator);
  const isDotGroupedFloat = isDotThousandsGroupedFloat(newValue, decimalSeparator);

  if (isNumericLike(newValue) || isCommaGrouped || isDotGroupedInteger || isDotGroupedFloat) {
    const parsedNumber = getParsedNumber(newValue, {
      decimalSeparator,
    });

    if (isNullish(parsedNumber)) {
      return newValue;
    }

    const isGrouped = isCommaGrouped || isDotGroupedInteger || isDotGroupedFloat;

    // Opt-in: keep the original literal when parsing to a JS number would lose information
    // (trailing fractional zeros like `9.0`, or precision beyond Number.MAX_SAFE_INTEGER). This
    // preserves what the user typed in the editor, matching spreadsheet behavior. Gated behind
    // `preserveNumericLiteral` (default `false`) so existing configurations are unchanged. The
    // guard is limited to plain, dot-decimal literals (`isNumeric`): grouping removal
    // (e.g. `7.000` → 7000) is intended, and preserving a comma-bearing literal (`9,0`, `0,100`)
    // would break numeric rendering and validation, which do not accept a comma decimal separator.
    if (
      cellMeta.preserveNumericLiteral === true &&
      !isGrouped &&
      isNumeric(newValue) &&
      isLossyNumericConversion(newValue, parsedNumber)
    ) {
      return newValue.trim();
    }

    return parsedNumber;
  }

  return newValue;
}
