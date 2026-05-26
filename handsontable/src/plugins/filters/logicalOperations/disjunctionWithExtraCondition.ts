import * as C from '../../../i18n/constants';
import { throwWithCause } from '../../../helpers/errors';
import { registerOperation } from '../logicalOperationRegisterer';

export const OPERATION_ID = 'disjunctionWithExtraCondition';
export const SHORT_NAME_FOR_COMPONENT = C.FILTERS_LABELS_DISJUNCTION;
// ((p OR q OR w OR x OR...) AND z) === TRUE?

/**
 * @param {Array} conditions An array with values to check.
 * @param {*} value The comparable value.
 * @returns {boolean}
 */
export function operationResult(conditions: { func: Function }[], value: unknown) {
  if (conditions.length < 3) {
    throwWithCause('Operation doesn\'t work on less then three conditions.');
  }

  return conditions.slice(0, conditions.length - 1).some((condition: { func: Function }) => condition.func(value))
    && conditions[conditions.length - 1].func(value);
}

registerOperation(OPERATION_ID, SHORT_NAME_FOR_COMPONENT, operationResult);
