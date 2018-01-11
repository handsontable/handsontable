import TextEditor from './textEditor';

/**
 * @private
 * @editor NumericEditor
 * @class NumericEditor
 * @dependencies TextEditor numbro
 */
class NumericEditor extends TextEditor {
  beginEditing() {
    super.beginEditing(this.originalValue);
  }
}

export default NumericEditor;
