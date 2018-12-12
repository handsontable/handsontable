/**
 * Utility to register editors and common namespace for keeping reference to all editor classes
 */
import staticRegister from './../utils/staticRegister';
import Hooks from './../pluginHooks';

import BaseEditor from './_baseEditor';
import AutocompleteEditor from './autocompleteEditor';
import CheckboxEditor from './checkboxEditor';
import DateEditor from './dateEditor';
import DropdownEditor from './dropdownEditor';
import HandsontableEditor from './handsontableEditor';
import NumericEditor from './numericEditor';
import PasswordEditor from './passwordEditor';
import SelectEditor from './selectEditor';
import TextEditor from './textEditor';

const registeredEditorClasses = new WeakMap();

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('editors');

_register('base', BaseEditor);
_register('autocomplete', AutocompleteEditor);
_register('checkbox', CheckboxEditor);
_register('date', DateEditor);
_register('dropdown', DropdownEditor);
_register('handsontable', HandsontableEditor);
_register('numeric', NumericEditor);
_register('password', PasswordEditor);
_register('select', SelectEditor);
_register('text', TextEditor);

export function RegisteredEditor(editorClass) {
  const instances = {};
  const Clazz = editorClass;

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
    instances[this.guid] = null;
  });
}

/**
 * Returns instance (singleton) of editor class.
 *
 * @param {String} name Name of an editor under which it has been stored.
 * @param {Object} hotInstance Instance of Handsontable.
 * @returns {Function} Returns instance of editor.
 */
export function _getEditorInstance(name, hotInstance) {
  let editor;

  if (typeof name === 'function') {
    if (!(registeredEditorClasses.get(name))) {
      _register(null, name);
    }
    editor = registeredEditorClasses.get(name);

  } else if (typeof name === 'string') {
    editor = getItem(name);

  } else {
    throw Error('Only strings and functions can be passed as "editor" parameter');
  }

  if (!editor) {
    throw Error(`No editor registered under name "${name}"`);
  }

  return editor.getInstance(hotInstance);
}

/**
 * Retrieve editor class.
 *
 * @param {String} name Editor identification.
 * @returns {Function} Returns editor class.
 */
function _getItem(name) {
  if (!hasItem(name)) {
    throw Error(`No registered editor found under "${name}" name`);
  }

  return getItem(name).getConstructor();
}

/**
 * Register editor class under specified name.
 *
 * @param {String} name Editor identification.
 * @param {Function} editorClass Editor class.
 */
function _register(name, editorClass) {
  const editorWrapper = new RegisteredEditor(editorClass);

  if (typeof name === 'string') {
    register(name, editorWrapper);
  }
  registeredEditorClasses.set(editorClass, editorWrapper);
}

export {
  _register as registerEditor,
  _getItem as getEditor,
  _getEditorInstance as getEditorInstance,
  hasItem as hasEditor,
  getNames as getRegisteredEditorNames,
  getValues as getRegisteredEditors,
};
