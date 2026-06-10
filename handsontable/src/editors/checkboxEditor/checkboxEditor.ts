import { BaseEditor } from '../baseEditor';
import { eventTargetEl, hasClass } from '../../helpers/dom/element';

export const EDITOR_TYPE = 'checkbox';

/**
 * @private
 * @class CheckboxEditor
 */
export class CheckboxEditor extends BaseEditor {
  /**
   * Returns the unique editor type identifier for the checkbox editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Handles the mouseup event on the cell TD element to trigger a checkbox click via a double-click interaction.
   */
  beginEditing(initialValue?: unknown, event?: Event): void {
    // Just some events connected with the checkbox editor are delegated here. Some `keydown` events like `enter` and
    // `space` key presses are handled inside `checkboxRenderer`. Some events come here from `editorManager`. The below
    // `if` statement was created by the author for the purpose of handling only the `doubleclick` event on the TD
    // element with a checkbox.

    if (event && (event as MouseEvent).type === 'mouseup' && eventTargetEl(event)!.nodeName === 'TD') {
      const checkbox = this.TD!.querySelector('input[type="checkbox"]') as HTMLInputElement;

      if (!hasClass(checkbox, 'htBadValue')) {
        checkbox.click();
      }
    }
  }

  /**
   * No-op override — the checkbox editor does not perform a finish step.
   */
  finishEditing(): void { // intentionally empty
  }
  /**
   * No-op override — the checkbox editor requires no DOM initialization.
   */
  init(): void { // intentionally empty
  }
  /**
   * No-op override — the checkbox editor has no visible editing element to open.
   */
  open(): void { // intentionally empty
  }
  /**
   * No-op override — the checkbox editor has no visible editing element to close.
   */
  close(): void { // intentionally empty
  }
  /**
   * Returns undefined because checkbox state is written directly to the cell; no separate value is held.
   */
  getValue(): unknown {
    return undefined;
  }
  /**
   * No-op override — the checkbox editor writes its value directly via DOM events.
   */
  setValue(): void { // intentionally empty
  }
  /**
   * No-op override — the checkbox editor delegates focus to the native checkbox element.
   */
  focus(): void { // intentionally empty
  }
}
