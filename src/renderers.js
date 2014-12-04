/**
 * Utility to register renderers and common namespace for keeping reference to all renderers classes
 */
(function (Handsontable) {
  'use strict';

  var registeredRenderers = {};

  Handsontable.renderers = {

    /**
     * Registers renderer under given name
     * @param {String} rendererName
     * @param {Function} rendererFunction
     */
    registerRenderer: function (rendererName, rendererFunction) {
      registeredRenderers[rendererName] = rendererFunction;
    },

    /**
     * @param {String|Function} rendererName/rendererFunction
     * @returns {Function} rendererFunction
     */
    getRenderer: function (rendererName) {
      if (typeof rendererName == 'function'){
        return rendererName;
      }

      if (typeof rendererName != 'string'){
        throw Error('Only strings and functions can be passed as "renderer" parameter ');
      }

      if (!(rendererName in registeredRenderers)) {
        throw Error('No editor registered under name "' + rendererName + '"');
      }

      return registeredRenderers[rendererName];
    }

  };


})(Handsontable);
