'use strict';

exports.__esModule = true;
exports.registerAsRootInstance = registerAsRootInstance;
exports.hasValidParameter = hasValidParameter;
exports.isRootInstance = isRootInstance;
var holder = exports.holder = new WeakMap();

var rootInstanceSymbol = exports.rootInstanceSymbol = Symbol('rootInstance');

/**
 * Register an object as a root instance.
 *
 * @param  {Object} object An object to associate with root instance flag.
 */
function registerAsRootInstance(object) {
  holder.set(object, true);
}

/**
 * Check if the source of the root indication call is valid.
 *
 * @param  {Symbol} rootSymbol A symbol as a source of truth.
 * @return {Boolean}
 */
function hasValidParameter(rootSymbol) {
  return rootSymbol === rootInstanceSymbol;
}

/**
 * Check if passed an object was flagged as a root instance.
 *
 * @param  {Object} object An object to check.
 * @return {Boolean}
 */
function isRootInstance(object) {
  return holder.has(object);
}