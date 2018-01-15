import TextEditor from './textEditor';

/**
 * @private
 * @editor NumericEditor
 * @class NumericEditor
 * @dependencies TextEditor numbro
 */
class NumericEditor extends TextEditor {
  beginEditing(initialValue, event) {
    // There is a problem with `initialValue` property which gets other value when we press `enter`, other when we perform the double click.
    // It was discovered within #4706. Property `event` should be probably removed, but now it's handled by `open` function of `BaseEditor`
    // (called inside inherited `beginEditing` function).
    super.beginEditing(this.originalValue, event);
  }
}

export default NumericEditor;
