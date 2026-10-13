import type { CellProperties } from '../../settings';
import { EDITOR_STATE } from '../baseEditor';
import { TextEditor } from '../textEditor';
import { isValidISODate } from '../../helpers/dateTime';
import { warn, warnOnce } from '../../helpers/console';
import { toSingleLine } from '../../helpers/templateLiteralTag';
import { isEmpty } from '../../helpers/mixed';

export const EDITOR_TYPE = 'date';

/**
 * @private
 * @class DateEditor
 */
export class DateEditor extends TextEditor {
  /**
   * Whether the native input fired an `input` event since the editor was prepared.
   */
  #inputEventFired = false;

  /**
   * Whether the native input was given a date since the editor was prepared.
   */
  #dateSeeded = false;

  /**
   * Returns the unique editor type identifier for the date editor.
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
   * Prepares the editor, replacing the display value with the raw ISO source data for the native date input.
   */
  prepare(row: number, col: number, prop: string | number, td: HTMLTableCellElement,
          value: unknown, cellProperties: CellProperties): void {
    super.prepare(row, col, prop, td, value, cellProperties);

    if ((cellProperties as Record<string, unknown>).datePickerConfig !== undefined) {
      warnOnce(this.hot.rootElement, 'datePickerConfig',
        'The "datePickerConfig" option is not supported. The native date input is used instead of Pikaday.');
    }

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
    this.eventManager.addEventListener(this.TEXTAREA, 'input', () => {
      this.#inputEventFired = true;
    });
  }

  /**
   * Begins editing, forgetting what the previous editing session did to the input.
   *
   * The state is reset here, not in `prepare()`: Escape closes the editor without moving the selection, so
   * the next keystroke on the same cell opens a new session without preparing the editor again.
   *
   * @param {*} newInitialValue The initial editor value.
   * @param {Event} event The keyboard event object.
   */
  beginEditing(newInitialValue?: unknown, event?: Event): void {
    // Called again while the editor is open (F2), the base method returns early and the session goes on.
    if (this.state === EDITOR_STATE.VIRGIN) {
      this.#inputEventFired = false;
      this.#dateSeeded = false;
    }

    super.beginEditing(newInitialValue, event);
  }

  /**
   * Finishes editing, keeping the cell's date when the native input holds an incomplete date.
   *
   * A native date input reports an empty value for an incomplete date, the same as for a cleared one.
   * Committing that empty value would erase the cell, so an incomplete entry restores the cell's date.
   * Every way out of the editor takes this path, so leaving it by a click, Tab, or Ctrl+Enter restores the
   * date too, and a Ctrl+Enter fill then writes nothing.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in every selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: Function): void {
    const keepCellDate = this.state === EDITOR_STATE.EDITING && this.#isIncomplete(ctrlDown);

    super.finishEditing(restoreOriginalValue || keepCellDate, ctrlDown, callback);
  }

  /**
   * Checks whether the input is empty because its date is incomplete, not because the user cleared it.
   *
   * Chromium and WebKit flag a partly filled date with `validity.badInput`. Firefox does not. There, an
   * input that was never given the cell's date (the editor was opened by typing, which the date input
   * cannot take) and that never fired an `input` event holds nothing the user entered. That holds after
   * a switch to full edit mode (F2) too, which does not seed the input.
   *
   * A column with `allowEmpty: false` and `allowInvalid: false` refuses the empty value on its own, so the
   * validator answers there.
   *
   * @param {boolean} [ctrlDown] True when Ctrl/Meta+Enter finishes the editing, which fills the whole selection.
   * @returns {boolean}
   */
  #isIncomplete(ctrlDown?: boolean): boolean {
    const input = this.TEXTAREA as HTMLInputElement;

    if (input.value !== '') {
      return false;
    }

    // `allowEmpty: false` with `allowInvalid: false` keeps the editor open on the empty value. Without
    // `allowInvalid: false` the empty value would still be saved, and only marked invalid.
    if (this.cellProperties.allowEmpty === false && this.cellProperties.allowInvalid === false) {
      return false;
    }

    // An empty edited cell has no date to keep, and an untouched input there is just empty. Only a fill
    // is at stake: Ctrl+Enter writes the empty value over the other selected cells, which hold dates, and
    // that is wrong only when the input is flagged as incomplete.
    if (isEmpty(this.originalValue)) {
      return ctrlDown === true && input.validity.badInput;
    }

    return input.validity.badInput || (!this.#dateSeeded && !this.#inputEventFired);
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
    this.#dateSeeded = true;
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
