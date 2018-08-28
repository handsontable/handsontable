import * as C from 'handsontable/i18n/constants';
import { registerOperation } from '../logicalOperationRegisterer';

export const OPERATION_ID = 'disjunctionWithExtraCondition';
export const SHORT_NAME_FOR_COMPONENT = C.FILTERS_LABELS_DISJUNCTION;
// ((p OR q OR w OR x OR...) AND z) === TRUE?

export function operationResult(conditions, value) {
  if (conditions.length < 3) {
    throw Error('Operation doesn\'t work on less then three conditions.');
  }

  return conditions.slice(0, conditions.length - 1).some(condition => condition.func(value))
    && conditions[conditions.length - 1].func(value);
}

registerOperation(OPERATION_ID, SHORT_NAME_FOR_COMPONENT, operationResult);
