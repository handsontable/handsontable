import * as C from '../../../i18n/constants';
import { registerOperation } from '../logicalOperationRegisterer';

export const OPERATION_ID = 'conjunction';
export const SHORT_NAME_FOR_COMPONENT = C.FILTERS_LABELS_CONJUNCTION;
// p AND q AND w AND x AND... === TRUE?

/**
 * @param {Array} conditions An array with values to check.
 * @param {*} value The comparable value.
 * @returns {boolean}
 */
export function operationResult(conditions, value) {
  return conditions.every(condition => condition.func(value));
}

registerOperation(OPERATION_ID, SHORT_NAME_FOR_COMPONENT, operationResult);
