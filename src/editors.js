/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
(function (Handsontable) {
  'use strict';

  function RegisteredEditor(editorClass) {
    var clazz, instances;

    instances = {};
    clazz = editorClass;

    this.getInstance = function (hotInstance) {
      if (!(hotInstance.guid in instances)) {
        instances[hotInstance.guid] = new clazz(hotInstance);
      }

      return instances[hotInstance.guid];
    }

  };

  var registeredEditors = {};

  Handsontable.editors = {

    /**
     * Registers editor under given name
     * @param {String} editorName
     * @param {Function} editorClass
     */
    registerEditor: function (editorName, editorClass) {
      registeredEditors[editorName] = new RegisteredEditor(editorClass);
    },

    /**
     * Returns instance (singleton) of editor class
     * @param {String|Function} editorName/editorClass
     * @returns {Function} editorClass
     */
    getEditor: function (editorName, hotInstance) {
      switch (typeof editorName) {
        case 'function':
          return new editorName(hotInstance);
        case 'string':
          if (!(editorName in registeredEditors)) {
            throw Error('No editor registered under name "' + editorName + '"');
          }

          return registeredEditors[editorName].getInstance(hotInstance);
      }

      throw Error('Only strings and functions can be passed as "editor" parameter ');
    }

  };


})(Handsontable);
