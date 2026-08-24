import { throwWithCause } from '../../helpers/errors';

export const operations: Record<string, { name: string; func: Function }> = {};

/**
 * Get operation closure with pre-bound arguments.
 *
 * @param {string} id Operator `id`.
 * @returns {Function}
 */
export function getOperationFunc(id: string) {
  if (!operations[id]) {
    throwWithCause(`Operation with id "${id}" does not exist.`);
  }

  const func = operations[id].func;

  return function(conditions: unknown[], value: unknown): boolean {
    return (func as (c: unknown[], v: unknown) => boolean)(conditions, value);
  };
}

/**
 * Return name of operation which is displayed inside UI component, basing on it's `id`.
 *
 * @param {string} id `Id` of operation.
 * @returns {string}
 */
export function getOperationName(id: string) {
  return operations[id].name;
}

/**
 * Operator registerer.
 *
 * @param {string} id Operation `id`.
 * @param {string} name Operation name which is displayed inside UI component.
 * @param {Function} func Operation function.
 */
export function registerOperation(id: string, name: string, func: Function) {
  operations[id] = { name, func };
}
