import { TextEditor } from '../textEditor';

export const EDITOR_TYPE = 'numeric';

/**
 * @private
 * @class NumericEditor
 */
export class NumericEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the numeric editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }
}
