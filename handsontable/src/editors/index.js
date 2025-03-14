import { TextEditor, EDITOR_TYPE as TEXT_EDITOR } from './textEditor';
import {
  registerEditor,
} from './registry';

/**
 * Registers all available editors.
 */
export function registerAllEditors() {
  registerEditor(TextEditor);
}

export {
  TextEditor, TEXT_EDITOR,
};

export {
  RegisteredEditor,
  _getEditorInstance,
  getEditor,
  getEditorInstance,
  registerEditor,
} from './registry';
