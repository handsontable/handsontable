import { TextEditor } from '../textEditor';
import { isValidISODate } from '../../helpers/dateTime';
import { warn } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isEmpty } from '../../helpers/mixed';

export const EDITOR_TYPE = 'date';

/**
 * @private
 * @class DateEditor
 */
export class DateEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the date editor.
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
   * Prepares the editor, replacing the display value with the raw ISO source data for the native date input.
   */
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement,
          value: unknown, cellProperties: Record<string, unknown>): void {
    super.prepare(row, col, prop, td, value, cellProperties);
    // The value passed to prepare() is the formatted display value (from valueFormatter).
    // Replace originalValue with the raw source data so the native date input receives an ISO string.
    const physicalRow = this.hot.toPhysicalRow(row);

    this.originalValue = this.hot.getSourceDataAtCell(physicalRow, col);
  }

  /**
   * Creates the editor's textarea element as a native date input.
   */
  createElements(type?: string): void {
    super.createElements('input');

    this.TEXTAREA.setAttribute('type', 'date');
  }

  /**
   * Sets the editor value, falling back to `defaultDate` when the value is empty, and warns if the value is not a valid ISO date string.
   */
  setValue(value?: unknown): void {
    if (isEmpty(value)) {
      value = this.cellProperties.defaultDate;
    }

    if (!isValidISODate(value)) {
      warn(toSingleLine`DateEditor: value must be in ISO date format ("YYYY-MM-DD")\x20
        required by the native date input. Received:`, value);

      super.setValue('');

      return;
    }

    super.setValue(value);
  }

  /**
   * Selects all text in the date input element when the editor receives focus.
   */
  focus(): void {
    this.TEXTAREA.select();
  }

  /**
   * Opens the editor and programmatically invokes the native date picker via showPicker().
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
