import { TextEditor } from '../textEditor';
import { isValidTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';

export const EDITOR_TYPE = 'time';

/**
 * @private
 * @class TimeEditor
 */
export class TimeEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  init(): void {
    super.init();

    this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
      if (!firstRun) {
        this.close();
      }
    });
  }

  createElements(type?: string): void {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'time');
    this.TEXTAREA.setAttribute('dir', 'ltr');
  }

  setValue(value?: unknown): void {
    if (!isValidTime(value)) {
      warn(toSingleLine`TimeEditor: value must be in 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS")\x20
        required by the native time input. Received:`, value);

      return;
    }

    super.setValue(value);
  }

  focus(): void {
    this.TEXTAREA.select();
  }

  open(): void {
    super.open();

    try {
      (this.TEXTAREA as HTMLInputElement).showPicker();
    } catch {
      // Prevents showPicker() user-gesture errors in tests
    }
  }
}
