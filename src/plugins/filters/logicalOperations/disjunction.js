import {registerOperation} from '../logicalOperationRegisterer';

export const OPERATION_ID = 'disjunction';
export const SHORT_NAME_FOR_COMPONENT = 'Or';
// (p OR q OR w OR x OR...) === TRUE?

export function operationResult(conditions, value) {
  return conditions.some((condition) => condition.func(value));
}

registerOperation(OPERATION_ID, SHORT_NAME_FOR_COMPONENT, operationResult);
