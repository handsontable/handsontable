import { TextEditor } from '../textEditor';
import { createInputElementResizer } from '../../utils/autoResize';
import { empty } from '../../helpers/dom/element';
import { A11Y_TABINDEX } from '../../helpers/a11y';

export const EDITOR_TYPE = 'password';

/**
 * @private
 * @class PasswordEditor
 */
export class PasswordEditor extends TextEditor {
  /**
   * The password input element replacing the `<textarea>` from `TextEditor`.
   *
   * @type {HTMLInputElement}
   */
  declare TEXTAREA: HTMLInputElement;

  /**
   * Autoresize instance for resizing the editor to the size of the entered text. Its overwrites the default
   * resizer of the TextEditor.
   *
   * @private
   * @type {Function}
   */
  autoResize = createInputElementResizer(this.hot.rootDocument, {
    textContent: (element: HTMLInputElement) => '•'.repeat(element.value.length)
  });

  /**
   * The real (unmasked) value tracked when `hashRevealDelay` is active.
   *
   * @type {string}
   */
  #realValue = '';

  /**
   * Timer ID for hiding the last revealed character.
   *
   * @type {number|null}
   */
  #revealTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Bound input event handler used when `hashRevealDelay` is active.
   *
   * @type {Function|null}
   */
  #onInput: ((event: Event) => void) | null = null;

  /**
   * Whether the editor is currently in reveal-delay mode. Captured in `open()` and cleared in
   * `close()` so that `getValue()` still returns the real value after `prepare()` updates
   * `cellProperties` for the next cell (which happens before `finishEditing` fires via focusout).
   *
   * @type {boolean}
   */
  #inRevealMode = false;

  /**
   * @returns {string}
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * Creates the editor's DOM elements. Replaces the `<textarea>` from `TextEditor` with an
   * `<input type="password">` element so that the browser masks its content natively.
   */
  createElements(): void {
    super.createElements();

    this.TEXTAREA = this.hot.rootDocument.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', ''); // Makes the element recognizable by Hot as its own component's element.
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';

    empty(this.TEXTAREA_PARENT);
    const tabIndexAttr = A11Y_TABINDEX(-1);

    this.TEXTAREA.setAttribute(tabIndexAttr[0], String(tabIndexAttr[1]));
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }

  /**
   * Opens the editor. When `hashRevealDelay` is set, switches the input to `type="text"` and
   * installs a manual masking handler so each typed character is briefly visible before being
   * replaced by `hashSymbol`.
   */
  open() {
    super.open();

    const hashRevealDelay = this.cellProperties.hashRevealDelay as number;
    // || fallback catches empty string ('') in addition to undefined/null.
    const hashSymbol = String(this.cellProperties.hashSymbol || '*');

    if (hashRevealDelay > 0) {
      this.#inRevealMode = true;
      // Use only the first character of hashSymbol for input masking. Multi-character values
      // are intended for the cell renderer (which uses HTML), not the plain-text input field.
      const maskChar = hashSymbol[0];

      this.TEXTAREA.setAttribute('type', 'text');
      this.TEXTAREA.setAttribute('autocomplete', 'off');
      this.TEXTAREA.setAttribute('spellcheck', 'false');
      this.TEXTAREA.setAttribute('autocapitalize', 'off');
      this.TEXTAREA.setAttribute('autocorrect', 'off');

      // #realValue may already be set by setValue() called from beginEditing(); mask the display.
      this.TEXTAREA.value = maskChar.repeat(this.#realValue.length);

      this.#onInput = (event: Event) => this.#handleRevealInput(event as InputEvent, maskChar, hashRevealDelay);
      this.TEXTAREA.addEventListener('input', this.#onInput);
    }
  }

  /**
   * Closes the editor. Removes the input event listener, cancels any pending reveal timer,
   * resets reveal-mode state, and restores the input to `type="password"`.
   */
  close() {
    if (this.#onInput) {
      this.TEXTAREA.removeEventListener('input', this.#onInput);
      this.#onInput = null;
    }

    if (this.#revealTimer !== null) {
      clearTimeout(this.#revealTimer);
      this.#revealTimer = null;
    }

    this.#inRevealMode = false;
    this.#realValue = '';
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.removeAttribute('autocomplete');
    this.TEXTAREA.removeAttribute('spellcheck');
    this.TEXTAREA.removeAttribute('autocapitalize');
    this.TEXTAREA.removeAttribute('autocorrect');
    super.close();
  }

  /**
   * Returns the current editor value. In reveal-delay mode returns the real (unmasked) value
   * stored in `#realValue` rather than reading the input's display value, which may contain
   * hash symbols.
   *
   * @returns {string}
   */
  getValue() {
    if (this.#inRevealMode) {
      return this.#realValue;
    }

    return super.getValue();
  }

  /**
   * Sets the editor value. In reveal-delay mode stores the plain value in `#realValue` and
   * updates the input display with masked characters. When called from `beginEditing()` before
   * `open()` has set `#inRevealMode`, pre-populates `#realValue` so `open()` can mask it
   * immediately on display.
   *
   * @param {string} [value] The value to set.
   */
  setValue(value?: string) {
    if (this.#inRevealMode) {
      this.#realValue = value ?? '';
      const maskChar = String(this.cellProperties.hashSymbol || '*')[0];

      this.TEXTAREA.value = maskChar.repeat(this.#realValue.length);
    } else if ((this.cellProperties?.hashRevealDelay as number) > 0) {
      // setValue() called from beginEditing() before open() sets #inRevealMode.
      this.#realValue = value ?? '';
    } else {
      super.setValue(value);
    }
  }

  /**
   * Handles input events when `hashRevealDelay` is active. Updates `#realValue` and the
   * display using cursor-position-based reconciliation for all insert operations with data
   * (typed characters, paste, drag-drop, IME composition, replacement text — correctly handles
   * append, mid-string insert, and select-and-replace), position-based tracking for deletions,
   * and a length-based fallback for unknown input types.
   *
   * @param {InputEvent} event The DOM input event.
   * @param {string} maskChar The single-character mask used in the input field.
   * @param {number} delay Milliseconds before newly typed characters are masked.
   */
  #handleRevealInput(event: InputEvent, maskChar: string, delay: number) {
    const { inputType, data } = event;
    const isInsertWithData = data && (
      inputType === 'insertText' ||
      inputType === 'insertFromPaste' ||
      inputType === 'insertFromDrop' ||
      inputType === 'insertReplacementText' ||
      inputType === 'insertCompositionText'
    );

    if (isInsertWithData) {
      // Cursor position after browser insertion tells us exactly where chars were inserted
      // and how many masked chars follow — works for append, mid-string, select-replace,
      // paste, drag-drop, IME composition, and replacement text.
      const cursorAfter = this.TEXTAREA.selectionStart ?? 0;
      const insertionStart = cursorAfter - data.length;
      const maskedSuffix = this.TEXTAREA.value.length - cursorAfter;

      this.#realValue =
        this.#realValue.slice(0, insertionStart) +
        data +
        this.#realValue.slice(this.#realValue.length - maskedSuffix);

      this.TEXTAREA.value = maskChar.repeat(insertionStart) + data + maskChar.repeat(maskedSuffix);
      this.TEXTAREA.setSelectionRange(cursorAfter, cursorAfter);

      if (this.#revealTimer !== null) {
        clearTimeout(this.#revealTimer);
      }

      this.#revealTimer = this.hot._registerTimeout(() => {
        const cursor = this.TEXTAREA.selectionStart;

        this.TEXTAREA.value = maskChar.repeat(this.#realValue.length);
        this.TEXTAREA.setSelectionRange(cursor, cursor);
        this.#revealTimer = null;
      }, delay);

    } else if (inputType?.startsWith('delete')) {
      // Cursor after deletion + deleted-count (derived from display length change) lets us
      // splice the correct characters from any position.
      const prevRealLength = this.#realValue.length;
      const cursorAfter = this.TEXTAREA.selectionStart ?? 0;
      const deletedCount = prevRealLength - this.TEXTAREA.value.length;

      this.#realValue =
        this.#realValue.slice(0, cursorAfter) +
        this.#realValue.slice(cursorAfter + deletedCount);

      this.TEXTAREA.value = maskChar.repeat(this.#realValue.length);
      this.TEXTAREA.setSelectionRange(cursorAfter, cursorAfter);

      if (this.#revealTimer !== null) {
        clearTimeout(this.#revealTimer);
        this.#revealTimer = null;
      }

    } else {
      // Fallback for paste, composition, undo/redo, and tests that dispatch without inputType.
      // Length comparison works for simple append-at-end cases.
      const prevLength = this.#realValue.length;
      const displayValue = this.TEXTAREA.value;

      if (displayValue.length > prevLength) {
        const newChars = displayValue.slice(prevLength);

        this.#realValue += newChars;
        this.TEXTAREA.value = maskChar.repeat(prevLength) + newChars;

        if (this.#revealTimer !== null) {
          clearTimeout(this.#revealTimer);
        }

        this.#revealTimer = this.hot._registerTimeout(() => {
          this.TEXTAREA.value = maskChar.repeat(this.#realValue.length);
          this.#revealTimer = null;
        }, delay);

      } else {
        this.#realValue = this.#realValue.slice(0, displayValue.length);
        this.TEXTAREA.value = maskChar.repeat(this.#realValue.length);

        if (this.#revealTimer !== null) {
          clearTimeout(this.#revealTimer);
          this.#revealTimer = null;
        }
      }
    }
  }
}
