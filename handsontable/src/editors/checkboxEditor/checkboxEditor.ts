import { BaseEditor } from '../baseEditor';
import { eventTargetEl, hasClass } from '../../helpers/dom/element';

export const EDITOR_TYPE = 'checkbox';

/**
 * @private
 * @class CheckboxEditor
 */
export class CheckboxEditor extends BaseEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  beginEditing(initialValue?: unknown, event?: Event): void {
    // Just some events connected with the checkbox editor are delegated here. Some `keydown` events like `enter` and
    // `space` key presses are handled inside `checkboxRenderer`. Some events come here from `editorManager`. The below
    // `if` statement was created by the author for the purpose of handling only the `doubleclick` event on the TD
    // element with a checkbox.

    if (event && (event as MouseEvent).type === 'mouseup' && eventTargetEl(event)!.nodeName === 'TD') {
      const checkbox = this.TD.querySelector('input[type="checkbox"]') as HTMLInputElement;

      if (!hasClass(checkbox, 'htBadValue')) {
        checkbox.click();
      }
    }
  }

  finishEditing(): void { // intentionally empty
  }
  init(): void { // intentionally empty
  }
  open(): void { // intentionally empty
  }
  close(): void { // intentionally empty
  }
  getValue(): unknown { return undefined; }
  setValue(): void { // intentionally empty
  }
  focus(): void { // intentionally empty
  }
}
