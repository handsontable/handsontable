export const holder = new WeakMap();

export const rootInstanceSymbol = Symbol('rootInstance');

/**
 * Register an object as a root instance.
 *
 * @param  {Object} object An object to associate with root instance flag.
 */
export function registerAsRootInstance(object) {
  holder.set(object, true);
}

/**
 * Check if the source of the root indication call is valid.
 *
 * @param  {Symbol} rootSymbol A symbol as a source of truth.
 * @return {Boolean}
 */
export function hasValidParameter(rootSymbol) {
  return rootSymbol === rootInstanceSymbol;
}

/**
 * Check if passed an object was flagged as a root instance.
 *
 * @param  {Object} object An object to check.
 * @return {Boolean}
 */
export function isRootInstance(object) {
  return holder.has(object);
}
