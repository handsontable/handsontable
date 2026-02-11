import { TextEditor } from '../textEditor';
import { isValidISODate } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isEmpty } from '../../helpers/mixed';

export const EDITOR_TYPE = 'intl-date';

/**
 * @private
 * @class IntlDateEditor
 */
export class IntlDateEditor extends TextEditor {
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

    this.TEXTAREA.setAttribute('type', 'date');
  }

  /**
   * Set the value of the editor.
   *
   * @param {*} value The value to set.
   */
  setValue(value) {
    if (isEmpty(value)) {
      value = this.cellProperties.defaultDate;
    }

    if (!isValidISODate(value)) {
      warn(toSingleLine`IntlDateEditor: value must be in ISO date format ("YYYY-MM-DD")\x20
        required by the native date input. Received:`, value);

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
