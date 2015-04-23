
import numeral from 'numeral';
import {getEditor, registerEditor} from './../editors.js';
import {TextEditor} from './textEditor.js';

var NumericEditor = TextEditor.prototype.extend();

export {NumericEditor};

Handsontable.editors = Handsontable.editors || {};

/**
 * @private
 * @editor
 * @class NumericEditor
 * @dependencies TextEditor numeral
 */
Handsontable.editors.NumericEditor = NumericEditor;

NumericEditor.prototype.beginEditing = function (initialValue) {

  var BaseEditor = TextEditor.prototype;

  if (typeof(initialValue) === 'undefined' && this.originalValue) {

    var value = '' + this.originalValue;

    if (typeof this.cellProperties.language !== 'undefined') {
      numeral.language(this.cellProperties.language);
    }

    var decimalDelimiter = numeral.languageData().delimiters.decimal;
    value = value.replace('.', decimalDelimiter);

    BaseEditor.beginEditing.apply(this, [value]);
  } else {
    BaseEditor.beginEditing.apply(this, arguments);
  }

};
registerEditor('numeric', NumericEditor);
