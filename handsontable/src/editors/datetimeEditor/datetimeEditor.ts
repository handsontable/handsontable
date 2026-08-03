import type { CellProperties } from '../../settings';
import { TextEditor } from '../textEditor';
import { isValidISODateTime } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isEmpty } from '../../helpers/mixed';

export const EDITOR_TYPE = 'datetime';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const NO_SECONDS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * @private
 * @class DatetimeEditor
 */
export class DatetimeEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the datetime editor.
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
   * Prepares the editor, replacing the display value with the raw ISO source data for the native input.
   */
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement,
          value: unknown, cellProperties: CellProperties): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    // The value passed to prepare() is the formatted display value. Replace originalValue with the
    // raw source data so the native datetime-local input receives an ISO string.
    const physicalRow = this.hot.toPhysicalRow(row);

    this.originalValue = this.hot.getSourceDataAtCell(physicalRow, col);
  }

  /**
   * Creates the editor's element as a native datetime-local input that shows seconds.
   */
  createElements(type?: string): void {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'datetime-local');
    this.TEXTAREA.setAttribute('step', '1');
    this.TEXTAREA.setAttribute('dir', 'ltr');
  }

  /**
   * Sets the editor value, normalizing to the `YYYY-MM-DDTHH:mm:ss` form the native input expects,
   * and warns if the value is not a valid ISO date-time string.
   */
  setValue(value?: unknown): void {
    if (isEmpty(value)) {
      super.setValue('');

      return;
    }

    if (!isValidISODateTime(value)) {
      warn(toSingleLine`DatetimeEditor: value must be in ISO date-time format ("YYYY-MM-DDTHH:mm:ss")\x20
        required by the native datetime-local input. Received:`, value);

      super.setValue('');

      return;
    }

    // The native datetime-local input (even with step="1") cannot represent milliseconds, so drop the
    // fractional-second part here rather than letting the browser silently truncate an unparsed value.
    let normalized = String(value).replace(' ', 'T').replace(/\.\d+$/, '');

    if (DATE_ONLY_RE.test(normalized)) {
      normalized += 'T00:00:00';
    } else if (NO_SECONDS_RE.test(normalized)) {
      normalized += ':00';
    }

    super.setValue(normalized);
  }

  /**
   * Returns the editor value, canonicalizing to `YYYY-MM-DDTHH:mm:ss` (native input may omit seconds).
   */
  getValue(): string {
    const value = super.getValue();

    if (value && NO_SECONDS_RE.test(value as string)) {
      return `${value}:00`;
    }

    return value as string;
  }

  /**
   * Selects all text in the input element when the editor receives focus.
   */
  focus(): void {
    this.TEXTAREA.select();
  }

  /**
   * Opens the editor and programmatically invokes the native picker via showPicker().
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
