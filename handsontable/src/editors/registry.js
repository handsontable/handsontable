/**
 * Utility to register editors and common namespace for keeping reference to all editor classes.
 */
import { Hooks } from '../core/hooks';
import staticRegister from '../utils/staticRegister';

const registeredEditorClasses = new WeakMap();

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('editors');

/**
 * @param {BaseEditor} editorClass The editor constructor.
 */
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
 * @param {string} name Name of an editor under which it has been stored.
 * @param {object} hotInstance Instance of Handsontable.
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
 * @param {string} name Editor identification.
 * @returns {Function} Returns editor class.
 */
function _getItem(name) {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throw Error(`No registered editor found under "${name}" name`);
  }

  return getItem(name).getConstructor();
}

/**
 * Register editor class under specified name.
 *
 * @param {string} name Editor identification.
 * @param {Function} editorClass Editor class.
 */
function _register(name, editorClass) {
  if (name && typeof name !== 'string') {
    editorClass = name;
    name = editorClass.EDITOR_TYPE;
  }

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
