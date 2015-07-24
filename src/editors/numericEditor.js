
import numeral from 'numeral';
import {getEditor, registerEditor} from './../editors.js';
import {TextEditor} from './textEditor.js';


/**
 * @private
 * @editor NumericEditor
 * @class NumericEditor
 * @dependencies TextEditor numeral
 */
class NumericEditor extends TextEditor {
  /**
   * @param {*} initialValue
   */
  beginEditing(initialValue) {
    if (typeof(initialValue) === 'undefined' && this.originalValue) {
      if (typeof this.cellProperties.language !== 'undefined') {
        numeral.language(this.cellProperties.language);
      }
      let decimalDelimiter = numeral.languageData().delimiters.decimal;
      initialValue = ('' + this.originalValue).replace('.', decimalDelimiter);
    }
    super.beginEditing(initialValue);
  }
}

export {NumericEditor};

registerEditor('numeric', NumericEditor);
