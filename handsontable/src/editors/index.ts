import { TextEditor, EDITOR_TYPE as TEXT_EDITOR } from './textEditor';
import {
  registerEditor,
} from './registry';
import { BaseEditorConstructor } from './types';

/**
 * Registers all available editors.
 */
export function registerAllEditors(): void {
  registerEditor(TextEditor as unknown as BaseEditorConstructor);
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
