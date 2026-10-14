import { TextEditor } from '../textEditor';
import { isValidTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { hideNativePicker, showNativePicker } from '../utils/showNativePicker';

export const EDITOR_TYPE = 'time';

/**
 * @private
 * @class TimeEditor
 */
export class TimeEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the time editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Turns off the `maxLength` cap of the text editor. This editor has its own input rules.
   *
   * @returns {boolean}
   */
  protected override get capsLength(): boolean {
    return false;
  }

  /**
   * Initializes the editor and registers an afterSetTheme hook to close on theme changes.
   */
  init(): void {
    super.init();

    this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
      if (!firstRun) {
        this.close();
      }
    });
  }

  /**
   * Creates the editor's textarea element as a native time input.
   */
  createElements(type?: string): void {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'time');
    this.TEXTAREA.setAttribute('dir', 'ltr');
  }

  /**
   * Sets the editor value and warns if the value does not match the 24-hour time format required by the native time input.
   */
  setValue(value?: unknown): void {
    if (!isValidTime(value)) {
      warn(toSingleLine`TimeEditor: value must be in 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS")\x20
        required by the native time input. Received:`, value);

      super.setValue('');

      return;
    }

    super.setValue(value);
  }

  /**
   * Focuses the native input and selects its text. Firefox does not move the focus on `select()`
   * for this input type.
   */
  focus(): void {
    this.TEXTAREA.focus({ preventScroll: true });
    this.TEXTAREA.select();
  }

  /**
   * Closes the editor and the native picker it showed.
   *
   * The blur comes after the base `close()`, which hands the keyboard back to the grid while the input
   * still has the focus.
   */
  close(): void {
    super.close();

    hideNativePicker(this.hot, this.TEXTAREA as HTMLInputElement);
  }

  /**
   * Opens the editor and shows the native picker, unless a key opened the editor.
   * A keyboard open leaves the picker closed so Tab and Escape keep reaching the grid.
   *
   * @param {Event} [event] The event that opened the editor.
   */
  open(event?: Event): void {
    super.open(event);

    showNativePicker(this.TEXTAREA as HTMLInputElement, event);
  }
}
