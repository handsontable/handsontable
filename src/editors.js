/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
(function (Handsontable) {
  'use strict';

  function RegisteredEditor(editorClass) {
    var Clazz, instances;

    instances = {};
    Clazz = editorClass;

    this.getInstance = function (hotInstance) {
      if (!(hotInstance.guid in instances)) {
        instances[hotInstance.guid] = new Clazz(hotInstance);
      }

      return instances[hotInstance.guid];
    };

  }

  var registeredEditorNames = {};
  var registeredEditorClasses = new WeakMap();

  Handsontable.editors = {

    /**
     * Registers editor under given name
     * @param {String} editorName
     * @param {Function} editorClass
     */
    registerEditor: function (editorName, editorClass) {
      var editor = new RegisteredEditor(editorClass);
      if (typeof editorName === "string") {
        registeredEditorNames[editorName] = editor;
      }
      registeredEditorClasses.set(editorClass, editor);
    },

    /**
     * Returns instance (singleton) of editor class
     * @param {String|Function} editorName/editorClass
     * @returns {Function} editorClass
     */
    getEditor: function (editorName, hotInstance) {
      var editor;
      if (typeof editorName == 'function') {
        if (!(registeredEditorClasses.get(editorName))) {
          this.registerEditor(null, editorName);
        }
        editor = registeredEditorClasses.get(editorName);
      }
      else if (typeof editorName == 'string') {
        editor = registeredEditorNames[editorName];
      }
      else {
        throw Error('Only strings and functions can be passed as "editor" parameter ');
      }

      if (!editor) {
        throw Error('No editor registered under name "' + editorName + '"');
      }

      return editor.getInstance(hotInstance);
    }

  };


})(Handsontable);
