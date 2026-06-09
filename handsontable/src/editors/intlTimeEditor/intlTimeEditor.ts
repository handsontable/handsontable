import { TextEditor } from '../textEditor';
import { isValidTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';

export const EDITOR_TYPE = 'intl-time';

/**
 * @private
 * @class IntlTimeEditor
 */
export class IntlTimeEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the intl-time editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
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
  }

  /**
   * Sets the editor value and warns if the value does not match the 24-hour time format required by the native time input.
   */
  setValue(value: unknown): void {
    if (!isValidTime(value)) {
      warn(toSingleLine`IntlTimeEditor: value must be in 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS")\x20
        required by the native time input. Received:`, value);

      return;
    }

    super.setValue(value);
  }

  /**
   * Selects all text in the time input element when the editor receives focus.
   */
  focus(): void {
    this.TEXTAREA.select();
  }

  /**
   * Opens the editor and programmatically invokes the native time picker via showPicker().
   */
  open(): void {
    super.open();

    try {
      (this.TEXTAREA as HTMLInputElement).showPicker();
    } catch {
      // Prevents showPicker() user-gesture errors in tests
    }
  }
}
