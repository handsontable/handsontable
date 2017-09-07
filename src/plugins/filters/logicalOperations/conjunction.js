import {registerOperation} from '../logicalOperationRegisterer';

export const OPERATION_ID = 'conjunction';
export const SHORT_NAME_FOR_COMPONENT = 'And';
// p AND q AND w AND x AND... === TRUE?

export function operationResult(conditions, value) {
  return conditions.every((condition) => condition.func(value));
}

registerOperation(OPERATION_ID, SHORT_NAME_FOR_COMPONENT, operationResult);
