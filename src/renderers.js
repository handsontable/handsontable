/**
 * Utility to register renderers and common namespace for keeping reference to all renderers classes
 */

import * as helper from './helpers.js';

export {registerRenderer, getRenderer, hasRenderer};

var registeredRenderers = {};

// support for older versions of Handsontable
Handsontable.renderers = Handsontable.renderers || {};
Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;

/**
 * Registers renderer under given name
 * @param {String} rendererName
 * @param {Function} rendererFunction
 */
function registerRenderer(rendererName, rendererFunction) {
  var registerName;

  registeredRenderers[rendererName] = rendererFunction;

  registerName = helper.toUpperCaseFirst(rendererName) + 'Renderer';
  // support for older versions of Handsontable
  Handsontable.renderers[registerName] = rendererFunction;
  Handsontable[registerName] = rendererFunction;
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
    throw Error('No editor registered under name "' + rendererName + '"');
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
