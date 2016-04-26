import Handsontable from './../browser';
import {registerEditor} from './../editors';
import {BaseEditor} from './_baseEditor';
import {hasClass} from './../helpers/dom/element';

/**
 * @private
 * @editor CheckboxEditor
 * @class CheckboxEditor
 */
class CheckboxEditor extends BaseEditor {
  beginEditing() {
    // editorManager return in second argument double click event as undefined
    if (arguments[1] === void 0) {
      let checkbox = this.TD.querySelector('input[type="checkbox"]');

      if (!hasClass(checkbox, 'htBadValue')) {
        checkbox.click();
      }
    }
  }

  finishEditing() {}
  init() {}
  open() {}
  close() {}
  getValue() {}
  setValue() {}
  focus() {}
}

export {CheckboxEditor};

registerEditor('checkbox', CheckboxEditor);
