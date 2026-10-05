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

  /**
   * Turns off the `maxLength` cap of the text editor. This editor has its own input rules.
   *
   * @returns {boolean}
   */
  protected override get capsLength(): boolean {
    return false;
  }
}
