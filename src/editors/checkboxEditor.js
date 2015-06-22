
import {registerEditor} from './../editors.js';
import {BaseEditor} from './_baseEditor.js';
import * as dom from './../dom.js';

//Blank editor, because all the work is done by renderer
var CheckboxEditor = BaseEditor.prototype.extend();

export {CheckboxEditor};

/**
 * @private
 * @editor CheckboxEditor
 * @class CheckboxEditor
 */
Handsontable.editors = Handsontable.editors || {};
Handsontable.editors.CheckboxEditor = CheckboxEditor;

CheckboxEditor.prototype.beginEditing = function () {
  var checkbox = this.TD.querySelector('input[type="checkbox"]');

  if (!dom.hasClass(checkbox, 'htBadValue')) {
    checkbox.click();
  }
};

CheckboxEditor.prototype.finishEditing = function () {};

CheckboxEditor.prototype.init = function () {};
CheckboxEditor.prototype.open = function () {};
CheckboxEditor.prototype.close = function () {};
CheckboxEditor.prototype.getValue = function () {};
CheckboxEditor.prototype.setValue = function () {};
CheckboxEditor.prototype.focus = function () {};

registerEditor('checkbox', CheckboxEditor);
