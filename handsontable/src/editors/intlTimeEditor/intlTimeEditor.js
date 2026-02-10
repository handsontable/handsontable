import { TextEditor } from '../textEditor';
import { isValidTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';

export const EDITOR_TYPE = 'intlTime';

/**
 * @private
 * @class IntlTimeEditor
 */
export class IntlTimeEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  init() {
    super.init();

    this.hot.addHook('afterSetTheme', (themeName, firstRun) => {
      if (!firstRun) {
        this.close();
      }
    });
  }

  /**
   * Create data picker instance.
   */
  createElements() {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'time');
  }

  /**
   * Set the value of the editor.
   *
   * @param {*} value The value to set.
   */
  setValue(value) {
    if (!isValidTime(value)) {
      warn(toSingleLine`IntlTimeEditor: value must be in 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS")\x20
        required by the native time input. Received:`, value);

      return;
    }

    super.setValue(value);
  }

  /**
   * Sets focus state on the select element.
   */
  focus() {
    // For IME editor textarea element must be focused using ".select" method.
    // Using ".focus" browser automatically scroll into the focused element which
    // is undesired effect.
    this.TEXTAREA.select();
  }

  /**
   * Open editor.
   */
  open() {
    super.open();

    // Prevents "Failed to execute 'showPicker' on 'HTMLInputElement': HTMLInputElement::showPicker() requires a user gesture." errors
    // when running tests or calling the method directly out of the event-loop cycle.
    try {
      this.TEXTAREA.showPicker();
    } catch {} // eslint-disable-line no-empty
  }
}
