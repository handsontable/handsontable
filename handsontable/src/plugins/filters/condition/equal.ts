import * as C from '../../../i18n/constants';
import { stringify } from '../../../helpers/mixed';
import { isNumeric } from '../../../helpers/number';
import { localeLowerCase } from '../../../helpers/string';
import { registerCondition } from '../conditionRegisterer';

export const CONDITION_NAME = 'eq';

type DataRow = {
  value: unknown;
  meta: {
    type?: string;
    locale?: string;
    dateFormat?: Intl.DateTimeFormatOptions;
    instance?: unknown;
    preserveNumericLiteral?: boolean;
    [key: string]: unknown
  };
};

/**
 * Numeric-typed cells with [`preserveNumericLiteral`](@/api/options.md#preservenumericliteral)
 * enabled compare by numeric value (like `gt`/`lt`/`between`), so a preserved literal string
 * such as `9.0` still matches a filter input of `9`. The numeric branch is gated by the option
 * so that columns which never opt in keep the historical string comparison (`1e2` does not
 * match `100`). All other cells compare by locale-lowercased string equality.
 *
 * @param {object} dataRow The object which holds and describes the single cell value.
 * @param {Array} inputValues An array of values to compare with.
 * @param {Array} inputValues."0" Value to check if it same as row's data.
 * @returns {boolean}
 */
export function condition(dataRow: DataRow, [value]: unknown[]) {
  if (
    dataRow.meta.preserveNumericLiteral === true &&
    dataRow.meta.type === 'numeric' &&
    isNumeric(dataRow.value) &&
    isNumeric(value)
  ) {
    return Number(dataRow.value) === Number(value);
  }

  return localeLowerCase(stringify(dataRow.value), dataRow.meta.locale) === stringify(value);
}

registerCondition(CONDITION_NAME, condition, {
  name: C.FILTERS_CONDITIONS_EQUAL,
  inputsCount: 1,
  showOperators: true
});
