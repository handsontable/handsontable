/**
 * Utility to register renderers and common namespace for keeping reference to all renderers classes
 */
import {toUpperCaseFirst} from './helpers/string';

var registeredRenderers = {};

/**
 * Registers renderer under given name
 * @param {String} rendererName
 * @param {Function} rendererFunction
 */
function registerRenderer(rendererName, rendererFunction) {
  registeredRenderers[rendererName] = rendererFunction;
}

/**
 * @param {String|Function} rendererName
 * @returns {Function} rendererFunction
 */
function getRenderer(rendererName) {
  if (typeof rendererName == 'function') {
    return rendererName;
  }

  if (typeof rendererName != 'string') {
    throw Error('Only strings and functions can be passed as "renderer" parameter');
  }

  if (!(rendererName in registeredRenderers)) {
    throw Error(`No editor registered under name "${rendererName}"`);
  }

  return registeredRenderers[rendererName];
}

/**
 * @param rendererName
 * @returns {Boolean}
 */
function hasRenderer(rendererName) {
  return rendererName in registeredRenderers;
}

/**
 * Get list of registered renderer names.
 *
 * @return {Array} Returns an array of registered renderer names.
 */
function getRegisteredRendererNames() {
  return Object.keys(registeredRenderers);
}

export {registerRenderer, getRenderer, hasRenderer, getRegisteredRendererNames};
