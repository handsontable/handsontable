export const operations = {};

/**
 * Get operation closure with pre-bound arguments.
 *
 * @param {String} id Operator `id`.
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
 * @param {String} id `Id` of operation.
 */
export function getOperationName(id) {
  return operations[id].name;
}

/**
 * Operator registerer.
 *
 * @param {String} id Operation `id`.
 * @param {String} name Operation name which is displayed inside UI component.
 * @param {Function} func Operation function.
 */
export function registerOperation(id, name, func) {
  operations[id] = {name, func};
}
