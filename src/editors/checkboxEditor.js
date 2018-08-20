import BaseEditor from './_baseEditor';
import { hasClass } from './../helpers/dom/element';

/**
 * @private
 * @editor CheckboxEditor
 * @class CheckboxEditor
 */
class CheckboxEditor extends BaseEditor {
  beginEditing(initialValue, event) {
    // Just some events connected with checkbox editor are delegated here. Some `keydown` events like `enter` and `space` key press
    // are handled inside `checkboxRenderer`. Some events come here from `editorManager`. Below `if` statement was created by author
    // for purpose of handling only `doubleclick` event which may be done on a cell with checkbox.

    if (event && event.type === 'mouseup') {
      const checkbox = this.TD.querySelector('input[type="checkbox"]');

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

export default CheckboxEditor;
