/**
 * Utility to register editors and common namespace for keeping reference to all editor classes.
 */
import { Hooks } from '../core/hooks';
import staticRegister from '../utils/staticRegister';

interface BaseEditor {
  EDITOR_TYPE?: string;
  new (hotInstance: any): any;
}

interface EditorWrapper {
  getConstructor(): BaseEditor;
  getInstance(hotInstance: any): any;
}

interface RegisteredEditorMap {
  [key: string]: EditorWrapper;
}

const registeredEditorClasses = new WeakMap<BaseEditor, EditorWrapper>();

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
export function RegisteredEditor(editorClass: BaseEditor) {
  const instances: { [key: string]: any } = {};
  const Clazz = editorClass;

  this.getConstructor = function(): BaseEditor {
    return editorClass;
  };

  this.getInstance = function(hotInstance: any): any {
    if (!(hotInstance.guid in instances)) {
      instances[hotInstance.guid] = new Clazz(hotInstance);
    }

    return instances[hotInstance.guid];
  };

  Hooks.getSingleton().add('afterDestroy', function(this: { guid: string }) {
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
export function _getEditorInstance(name: string | BaseEditor, hotInstance: any): any {
  let editor: EditorWrapper | undefined;

  if (typeof name === 'function') {
    if (!(registeredEditorClasses.get(name))) {
      _register(null as any, name);
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
function _getItem(name: string | BaseEditor): BaseEditor {
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
function _register(name: string | null | BaseEditor, editorClass: BaseEditor): void {
  if (name && typeof name !== 'string') {
    editorClass = name;
    name = editorClass.EDITOR_TYPE || '';
  }

  const editorWrapper = new (RegisteredEditor as any)(editorClass) as EditorWrapper;

  if (typeof name === 'string' && name !== '') {
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
