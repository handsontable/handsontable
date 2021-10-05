export const operations = {};

/**
 * Get operation closure with pre-bound arguments.
 *
 * @param {string} id Operator `id`.
 * @returns {Function}
 */
export function getOperationFunc(id) {
  if (!operations[id]) {
    throw Error(`Operation with id "${id}" does not exist.`);
  }
  const func = operations[id].func;

  return function(conditions, value) {
    return func(conditions, value);
  };
}

/**
 * Return name of operation which is displayed inside UI component, basing on it's `id`.
 *
 * @param {string} id `Id` of operation.
 * @returns {string}
 */
export function getOperationName(id) {
  return operations[id].name;
}

/**
 * Operator registerer.
 *
 * @param {string} id Operation `id`.
 * @param {string} name Operation name which is displayed inside UI component.
 * @param {Function} func Operation function.
 */
export function registerOperation(id, name, func) {
  operations[id] = { name, func };
}
