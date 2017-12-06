import numbro from 'numbro';
import TextEditor from './textEditor';

/**
 * @private
 * @editor NumericEditor
 * @class NumericEditor
 * @dependencies TextEditor numbro
 */
class NumericEditor extends TextEditor {
  /**
   * @param {*} initialValue
   */
  beginEditing(initialValue) {
    if (typeof initialValue === 'undefined' && this.originalValue) {
      const decimalDelimiter = numbro.cultureData().delimiters.decimal;
      const numericFormat = this.cellProperties.numericFormat;
      const cellCulture = numericFormat && numericFormat.culture;

      if (typeof cellCulture !== 'undefined') {
        numbro.culture(cellCulture);
      }

      initialValue = (`${this.originalValue}`).replace('.', decimalDelimiter);
    }

    super.beginEditing(initialValue);
  }
}

export default NumericEditor;
