
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
    let checkbox = this.TD.querySelector('input[type="checkbox"]');

    if (!hasClass(checkbox, 'htBadValue')) {
      checkbox.click();
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
