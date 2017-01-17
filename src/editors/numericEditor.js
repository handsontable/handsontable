import numbro from 'numbro';
import {registerEditor} from './../editors';
import {TextEditor} from './textEditor';

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
      if (typeof this.cellProperties.language !== 'undefined') {
        numbro.culture(this.cellProperties.language);
      }
      let decimalDelimiter = numbro.cultureData().delimiters.decimal;
      initialValue = ('' + this.originalValue).replace('.', decimalDelimiter);
    }
    super.beginEditing(initialValue);
  }
}

export {NumericEditor};

registerEditor('numeric', NumericEditor);
