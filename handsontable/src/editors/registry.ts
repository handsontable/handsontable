import type { HotInstance } from '../core/types';
/**
 * Utility to register editors and common namespace for keeping reference to all editor classes.
 */
import { Hooks } from '../core/hooks';
import { staticRegister } from '../utils/staticRegister';
import { BaseEditor, EDITOR_TYPE as BASE_EDITOR } from './baseEditor';
import { throwWithCause } from '../helpers/errors';
import { EDITOR_TYPE as AUTOCOMPLETE_EDITOR } from './autocompleteEditor';
import { EDITOR_TYPE as CHECKBOX_EDITOR } from './checkboxEditor';
import { EDITOR_TYPE as DATE_EDITOR } from './dateEditor';
import { EDITOR_TYPE as DROPDOWN_EDITOR } from './dropdownEditor';
import { EDITOR_TYPE as HANDSONTABLE_EDITOR } from './handsontableEditor';
import { EDITOR_TYPE as INTL_DATE_EDITOR } from './intlDateEditor';
import { EDITOR_TYPE as INTL_TIME_EDITOR } from './intlTimeEditor';
import { EDITOR_TYPE as MULTI_SELECT_EDITOR } from './multiSelectEditor';
import { EDITOR_TYPE as NUMERIC_EDITOR } from './numericEditor';
import { EDITOR_TYPE as PASSWORD_EDITOR } from './passwordEditor';
import { EDITOR_TYPE as SELECT_EDITOR } from './selectEditor';
import { EDITOR_TYPE as TEXT_EDITOR } from './textEditor';
import { EDITOR_TYPE as TIME_EDITOR } from './timeEditor';

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
export function RegisteredEditor(this: Record<string, unknown>, editorClass: typeof BaseEditor | Function) {
  const instances: Record<string, unknown> = {};
  const Clazz = editorClass as typeof BaseEditor;

  this.getConstructor = function(): typeof BaseEditor | Function {
    return editorClass;
  };

  this.getInstance = function(hotInstance: HotInstance): unknown {
    if (!(hotInstance.guid in instances)) {
      instances[hotInstance.guid] = new Clazz(hotInstance);
    }

    return instances[hotInstance.guid];
  };

  Hooks.getSingleton().add('afterDestroy', function(this: Record<string, unknown>) {
    instances[String(this.guid)] = null;
  });
}

/**
 * Returns instance (singleton) of editor class.
 *
 * @param {string} name Name of an editor under which it has been stored.
 * @param {object} hotInstance Instance of Handsontable.
 * @returns {Function} Returns instance of editor.
 */
export function _getEditorInstance(name: string | typeof BaseEditor | Function, hotInstance: HotInstance): unknown {
  let editor: Record<string, Function>;

  if (typeof name === 'function') {
    if (!(registeredEditorClasses.get(name))) {
      _register(null, name);
    }
    editor = registeredEditorClasses.get(name);

  } else if (typeof name === 'string') {
    editor = getItem(name);

  } else {
    throwWithCause('Only strings and functions can be passed as "editor" parameter');
  }

  if (!editor) {
    throwWithCause(`No editor registered under name "${name}"`);
  }

  return editor.getInstance(hotInstance);
}

/**
 * Retrieve editor class.
 *
 * @param {string} name Editor identification.
 * @returns {Function} Returns editor class.
 */
function _getItem(name: string | typeof BaseEditor | Function): typeof BaseEditor | Function {
  if (typeof name === 'function') {
    return name;
  }
  if (!hasItem(name)) {
    throwWithCause(`No registered editor found under "${name}" name`);
  }

  return getItem(name).getConstructor();
}

/**
 * Register editor class under specified name.
 *
 * @param {string} name Editor identification.
 * @param {Function} editorClass Editor class.
 */
function _register(name: string | typeof BaseEditor | Function, editorClass?: typeof BaseEditor | Function): void {
  if (name && typeof name !== 'string') {
    editorClass = name;
    name = (editorClass as unknown as { EDITOR_TYPE: string }).EDITOR_TYPE;
  }

  type WrapperCtor = new (editorClass: typeof BaseEditor | Function) => unknown;
  const editorWrapper = new (RegisteredEditor as unknown as WrapperCtor)(editorClass);

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

/**
 * All built-in editor type names.
 */
export type EditorType = typeof AUTOCOMPLETE_EDITOR | typeof BASE_EDITOR | typeof CHECKBOX_EDITOR |
  typeof DATE_EDITOR | typeof DROPDOWN_EDITOR | typeof HANDSONTABLE_EDITOR | typeof INTL_DATE_EDITOR |
  typeof INTL_TIME_EDITOR | typeof MULTI_SELECT_EDITOR | typeof NUMERIC_EDITOR | typeof PASSWORD_EDITOR |
  typeof SELECT_EDITOR | typeof TEXT_EDITOR | typeof TIME_EDITOR | string;
