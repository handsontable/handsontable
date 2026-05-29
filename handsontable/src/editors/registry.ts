import type { HotInstance } from '../core/types';
/**
 * Utility to register editors and common namespace for keeping reference to all editor classes.
 */
import { Hooks } from '../core/hooks';
import { staticRegister } from '../utils/staticRegister';
import type { EDITOR_TYPE as BASE_EDITOR } from './baseEditor';
import { BaseEditor } from './baseEditor';
import { throwWithCause } from '../helpers/errors';
import type { EDITOR_TYPE as AUTOCOMPLETE_EDITOR } from './autocompleteEditor';
import type { EDITOR_TYPE as CHECKBOX_EDITOR } from './checkboxEditor';
import type { EDITOR_TYPE as DATE_EDITOR } from './dateEditor';
import type { EDITOR_TYPE as DROPDOWN_EDITOR } from './dropdownEditor';
import type { EDITOR_TYPE as HANDSONTABLE_EDITOR } from './handsontableEditor';
import type { EDITOR_TYPE as INTL_DATE_EDITOR } from './intlDateEditor';
import type { EDITOR_TYPE as INTL_TIME_EDITOR } from './intlTimeEditor';
import type { EDITOR_TYPE as MULTI_SELECT_EDITOR } from './multiSelectEditor';
import type { EDITOR_TYPE as NUMERIC_EDITOR } from './numericEditor';
import type { EDITOR_TYPE as PASSWORD_EDITOR } from './passwordEditor';
import type { EDITOR_TYPE as SELECT_EDITOR } from './selectEditor';
import type { EDITOR_TYPE as TEXT_EDITOR } from './textEditor';
import type { EDITOR_TYPE as TIME_EDITOR } from './timeEditor';

/**
 * Constructor signature of any editor class. Editors extend `BaseEditor` but historically
 * the public API also accepts plain constructors, so we use a structural type here.
 */
type EditorConstructor = new (hotInstance: HotInstance) => unknown;

/**
 * Editor constructor with the optional static `EDITOR_TYPE` identifier used during registration.
 */
type EditorConstructorWithType = EditorConstructor & { EDITOR_TYPE?: string };

/**
 * Public accepted shape for an editor class. Historically the registry accepts any `Function`
 * (this is the documented type used by `CellTypeObject.editor`), so the public signatures
 * stay compatible while the internal logic narrows to `EditorConstructorWithType`.
 */
type EditorClass = EditorConstructorWithType | Function;

const {
  register,
  getItem,
  hasItem,
  getNames,
  getValues,
} = staticRegister('editors');

/**
 * Wraps an editor class and lazily creates a single editor instance per Handsontable instance.
 */
export class RegisteredEditor {
  #editorClass: EditorConstructorWithType;
  #instances: Record<string, unknown> = {};

  constructor(editorClass: EditorConstructorWithType) {
    this.#editorClass = editorClass;

    const instances = this.#instances;

    Hooks.getSingleton().add('afterDestroy', function(this: HotInstance) {
      instances[this.guid] = null;
    });
  }

  /**
   * Returns the underlying editor constructor.
   *
   * @returns {Function} The editor class.
   */
  getConstructor(): EditorConstructorWithType {
    return this.#editorClass;
  }

  /**
   * Returns a memoized editor instance for the given Handsontable instance.
   *
   * @param {HotInstance} hotInstance The Handsontable instance.
   * @returns {object} The editor instance.
   */
  getInstance(hotInstance: HotInstance): unknown {
    if (!(hotInstance.guid in this.#instances)) {
      this.#instances[hotInstance.guid] = new this.#editorClass(hotInstance);
    }

    return this.#instances[hotInstance.guid];
  }

}

const registeredEditorClasses = new WeakMap<EditorConstructorWithType, RegisteredEditor>();

/**
 * Type guard for the function form of the `name` argument accepted by registry helpers.
 *
 * @param {unknown} value Value to test.
 * @returns {boolean} `true` when the value is an editor constructor.
 */
function isEditorConstructor(value: unknown): value is EditorConstructorWithType {
  return typeof value === 'function';
}

/**
 * Narrows the public `EditorClass` type to the structural constructor type used internally.
 *
 * @param {Function} editorClass The editor class accepted from the public API.
 * @returns {EditorConstructorWithType} The same value, typed as a constructor.
 */
function toEditorConstructor(editorClass: EditorClass): EditorConstructorWithType {
  if (!isEditorConstructor(editorClass)) {
    throwWithCause('Editor class must be a constructor function.');
  }

  return editorClass;
}

/**
 * Returns instance (singleton) of editor class.
 *
 * @param {string} name Name of an editor under which it has been stored.
 * @param {object} hotInstance Instance of Handsontable.
 * @returns {Function} Returns instance of editor.
 */
export function _getEditorInstance(name: string | EditorClass, hotInstance: HotInstance): unknown {
  let editor: RegisteredEditor | undefined;

  if (isEditorConstructor(name)) {
    if (!registeredEditorClasses.get(name)) {
      _register(null, name);
    }
    editor = registeredEditorClasses.get(name);

  } else if (typeof name === 'string') {
    editor = getItem(name) as RegisteredEditor | undefined;

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
function _getItem(name: string | EditorClass): EditorConstructorWithType {
  if (typeof name !== 'string') {
    return toEditorConstructor(name);
  }
  if (!hasItem(name)) {
    throwWithCause(`No registered editor found under "${name}" name`);
  }

  const wrapper = getItem(name) as RegisteredEditor;

  return wrapper.getConstructor();
}

/**
 * Register editor class under specified name.
 *
 * @param {string} name Editor identification.
 * @param {Function} editorClass Editor class.
 */
function _register(
  name: string | EditorClass | null,
  editorClass?: EditorClass,
): void {
  let editorName: string | null = typeof name === 'string' ? name : null;
  let resolvedClass: EditorClass | undefined = editorClass;

  if (name && isEditorConstructor(name)) {
    resolvedClass = name;
    editorName = name.EDITOR_TYPE ?? null;
  }

  if (!resolvedClass) {
    throwWithCause('Editor class is required to register an editor.');
  }

  const editorCtor = toEditorConstructor(resolvedClass);
  const editorWrapper = new RegisteredEditor(editorCtor);

  if (editorName !== null) {
    register(editorName, editorWrapper);
  }
  registeredEditorClasses.set(editorCtor, editorWrapper);
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
