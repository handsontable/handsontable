import { toISO8601Format } from '../../helpers/date';
import { TextEditor } from '../textEditor';

export const EDITOR_TYPE = 'date';

/**
 * @private
 * @class DateEditor
 */
export class DateEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * @type {boolean}
   */
  parentDestroyed = false;

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
    this.TEXTAREA.showPicker();
  }

  /**
   * Sets new value into editable element.
   *
   * @param {*} newValue The editor value.
   */
  setValue(newValue) {
    super.setValue(toISO8601Format(newValue));
  }
}
