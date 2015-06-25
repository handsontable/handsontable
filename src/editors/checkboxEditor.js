
import {registerEditor} from './../editors.js';
import {BaseEditor} from './_baseEditor.js';


/**
 * @private
 * @editor CheckboxEditor
 * @class CheckboxEditor
 */
class CheckboxEditor extends BaseEditor {
  beginEditing() {
    let checkbox = this.TD.querySelector('input[type="checkbox"]');

    if (checkbox) {
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
