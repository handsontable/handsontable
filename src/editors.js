/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
import {toUpperCaseFirst} from './helpers/string';
import Hooks from './pluginHooks';

var
  registeredEditorNames = {},
  registeredEditorClasses = new WeakMap();

function RegisteredEditor(editorClass) {
  var Clazz,
    instances;

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

  Hooks.getSingleton().add('afterDestroy', function() {
    instances = {};
  });
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

  if (typeof editorName === 'function') {
    if (!(registeredEditorClasses.get(editorName))) {
      registerEditor(null, editorName);
    }
    editor = registeredEditorClasses.get(editorName);

  } else if (typeof editorName === 'string') {
    editor = registeredEditorNames[editorName];

  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter ');
  }

  if (!editor) {
    throw Error(`No editor registered under name "${editorName}"`);
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

  if (typeof editorName === 'string') {
    editor = registeredEditorNames[editorName];

  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter ');
  }

  if (!editor) {
    throw Error(`No editor registered under name "${editorName}"`);
  }

  return editor.getConstructor();
}

/**
 * @param editorName
 * @returns {Boolean}
 */
function hasEditor(editorName) {
  return !!registeredEditorNames[editorName];
}

/**
 * Get list of registered editor names.
 *
 * @return {Array} Returns an array of registered editor names.
 */
function getRegisteredEditorNames() {
  return Object.keys(registeredEditorNames);
}

export {registerEditor, getEditor, hasEditor, getEditorConstructor, getRegisteredEditorNames};
