/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */

import {toUpperCaseFirst} from './helpers/string';

export {registerEditor, getEditor, hasEditor, getEditorConstructor};

var
  registeredEditorNames = {},
  registeredEditorClasses = new WeakMap();

// support for older versions of Handsontable
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;

function RegisteredEditor(editorClass) {
  var Clazz, instances;

  instances = {};
  Clazz = editorClass;

  this.getConstructor = function() {
    return editorClass;
  };

  this.getInstance = function(hotInstance) {
    if (!(hotInstance.guid in instances)) {
      instances[hotInstance.guid] = new Clazz(hotInstance);
    }

    return instances[hotInstance.guid];
  };
}

/**
 * Registers editor under given name
 * @param {String} editorName
 * @param {Function} editorClass
 */
function registerEditor(editorName, editorClass) {
  var editor = new RegisteredEditor(editorClass);

  if (typeof editorName === 'string') {
    registeredEditorNames[editorName] = editor;
    Handsontable.editors[toUpperCaseFirst(editorName) + 'Editor'] = editorClass;
  }
  registeredEditorClasses.set(editorClass, editor);
}

/**
 * Returns instance (singleton) of editor class
 *
 * @param {String} editorName
 * @param {Object} hotInstance
 * @returns {Function} editorClass
 */
function getEditor(editorName, hotInstance) {
  var editor;

  if (typeof editorName == 'function') {
    if (!(registeredEditorClasses.get(editorName))) {
      registerEditor(null, editorName);
    }
    editor = registeredEditorClasses.get(editorName);

  } else if (typeof editorName == 'string') {
    editor = registeredEditorNames[editorName];

  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter ');
  }

  if (!editor) {
    throw Error('No editor registered under name "' + editorName + '"');
  }

  return editor.getInstance(hotInstance);
}

/**
 * Get editor constructor class
 *
 * @param {String} editorName
 * @returns {Function}
 */
function getEditorConstructor(editorName) {
  var editor;

  if (typeof editorName == 'string') {
    editor = registeredEditorNames[editorName];

  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter ');
  }

  if (!editor) {
    throw Error('No editor registered under name "' + editorName + '"');
  }

  return editor.getConstructor();
}

/**
 * @param editorName
 * @returns {Boolean}
 */
function hasEditor(editorName) {
  return registeredEditorNames[editorName] ? true : false;
}
