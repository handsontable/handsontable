import type { HotInstance } from '../../../core/types';
import { setAttribute, setCaretPosition } from '../../../helpers/dom/element';
import type { TextEditor } from '../../../editors/textEditor/textEditor';
import type { Formulas } from '../formulas';
import {
  printReferenceFromVisualSelection,
  getActiveFormulaReferenceTokenAtCaret,
} from '../utils';

const FORMULA_REFERENCE_PICKING_ATTR = 'data-formula-reference-picking';

/**
 * Manages formula reference picking for a single Handsontable instance.
 */
export class FormulaReferenceInserter {
  /**
   * Formulas plugin instance that owns the editor.
   *
   * @private
   * @type {Formulas}
   */
  readonly #formulasPlugin: Formulas;

  /**
   * Whether formula reference picking is currently enabled.
   *
   * @private
   * @type {boolean}
   */
  #isEnabled = false;

  /**
   * Returns whether formula reference picking is currently enabled.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.#isEnabled;
  }

  /**
   * Caret index of the active editor.
   *
   * @private
   * @type {number}
   */
  #caretIndex = 0;

  /**
   * Whether a selection change is in progress.
   *
   * @private
   * @type {boolean}
   */
  #selectionInProgress = false;

  /**
   * Whether the reference is being inserted.
   *
   * @private
   * @type {boolean}
   */
  #ignoreSelectionChange = false;

  /**
   * @param {Formulas} formulasPlugin Formulas plugin instance that owns the editor.
   */
  constructor(formulasPlugin: Formulas) {
    this.#formulasPlugin = formulasPlugin;
  }

  /**
   * Starts formula reference picking on the instance with the open editor.
   */
  enable(): void {
    if (this.#isEnabled) {
      return;
    }

    this.#isEnabled = true;
    this.#hot.getFocusManager().suspend();

    this.#hot.addHook('beforeSetRangeStart', this.#onBeforeSelectionChange);
    this.#hot.addHook('beforeSetRangeStartOnly', this.#onBeforeSelectionChange);
    this.#hot.addHook('beforeSetRangeEnd', this.#onBeforeSelectionChange);
    this.#hot.addHook('afterSelection', this.#onAfterSelection);
    this.#hot.addHook('afterSelectionEnd', this.#onAfterSelectionEnd);
    this.#textarea.addEventListener('selectionchange', this.#onSelectionChange);

    setAttribute(this.#hot.rootElement, FORMULA_REFERENCE_PICKING_ATTR, true);
  }

  /**
   * Stops formula reference picking and removes temporary hooks.
   */
  disable(): void {
    if (!this.#isEnabled) {
      return;
    }

    this.#isEnabled = false;
    this.#hot.getFocusManager().resume();

    this.#hot.removeHook('beforeSetRangeStart', this.#onBeforeSelectionChange);
    this.#hot.removeHook('beforeSetRangeStartOnly', this.#onBeforeSelectionChange);
    this.#hot.removeHook('beforeSetRangeEnd', this.#onBeforeSelectionChange);
    this.#hot.removeHook('afterSelection', this.#onAfterSelection);
    this.#hot.removeHook('afterSelectionEnd', this.#onAfterSelectionEnd);
    this.#textarea
      .removeEventListener('selectionchange', this.#onSelectionChange);

    this.#caretIndex = 0;

    setAttribute(this.#hot.rootElement, FORMULA_REFERENCE_PICKING_ATTR, false);
  }

  /**
   * Handsontable instance that owns the open editor.
   *
   * @private
   * @type {HotInstance}
   */
  get #hot(): HotInstance {
    return this.#formulasPlugin.hot;
  }

  /**
   * The textarea element of the active editor.
   *
   * @private
   * @type {HTMLTextAreaElement}
   */
  get #textarea(): HTMLTextAreaElement {
    return (this.#hot.getActiveEditor() as TextEditor).TEXTAREA as HTMLTextAreaElement;
  }

  /**
   * Marks formula reference picks so the editor stays open.
   */
  #onBeforeSelectionChange = (): void => {
    this.#hot.selection.markSource('formulaReference');
    this.#selectionInProgress = true;
  };

  /**
   * Inserts or updates the formula reference for the current selection.
   */
  #onAfterSelection = (fromRow: number, fromCol: number, toRow: number, toCol: number): void => {

    if (this.#hot.selection.getSelectionSource() !== 'formulaReference') {
      return;
    }

    this.applyReferenceFromSelection(fromRow, fromCol, toRow, toCol);
  };

  /**
   * Restores the edited cell selection and editor focus after a reference pick.
   */
  #onAfterSelectionEnd = (): void => {
    this.#hot.getFocusManager().focusElement(this.#textarea, { preventScroll: true });
    setCaretPosition(this.#textarea, this.#caretIndex, this.#caretIndex);
    this.#selectionInProgress = false;

    // there a weird selectionchange fire with selectionStart at 0 even when the selection is not changed
    // either programmatically or by the user
    // and what is even more weird that it's not reproducible in playwright
    this.#ignoreSelectionChange = true;
    setTimeout(() => {
      this.#ignoreSelectionChange = false;
    }, 0);
  };

  /**
   * Handles the selection change event.
   */
  #onSelectionChange = (): void => {
    if (this.#selectionInProgress || this.#ignoreSelectionChange) {
      return;
    }
    this.#caretIndex = this.#textarea.selectionStart ?? 0;
  };

  /**
   * Inserts or updates a formula reference from the current grid selection.
   *
   * @param {number} fromRow Visual start row index.
   * @param {number} fromCol Visual start column index.
   * @param {number} toRow Visual end row index.
   * @param {number} toCol Visual end column index.
   */
  applyReferenceFromSelection(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ): void {
    const referenceText = printReferenceFromVisualSelection(
      this.#hot,
      fromRow,
      fromCol,
      toRow,
      toCol,
    );

    if (referenceText === null) {
      return;
    }

    const formula = String(this.#hot.getActiveEditor()!.getValue());
    const caretIndex = this.#caretIndex ?? formula.length;
    const activeToken = getActiveFormulaReferenceTokenAtCaret(formula, caretIndex);
    const replaceStart = activeToken?.start ?? caretIndex;
    const replaceEnd = activeToken?.end ?? caretIndex;

    this.#textarea.focus();
    setCaretPosition(this.#textarea, replaceStart, replaceEnd);

    const inserted = this.#textarea.ownerDocument.execCommand('insertText', false, referenceText);

    if (!inserted) {
      this.#textarea.value = `${formula.slice(0, replaceStart)}${referenceText}${formula.slice(replaceEnd)}`;
    }

    this.#caretIndex = replaceStart + referenceText.length;
    setCaretPosition(this.#textarea, this.#caretIndex, this.#caretIndex);

    this.#textarea.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      inputType: 'insertReplacementText',
      data: referenceText,
    }));
  }
}
