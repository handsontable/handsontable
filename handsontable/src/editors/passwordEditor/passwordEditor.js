import { TextEditor } from '../textEditor';
import { createInputElementResizer } from '../../utils/autoResize';
import { empty } from '../../helpers/dom/element';
import { A11Y_TABINDEX } from '../../helpers/a11y';

export const EDITOR_TYPE = 'password';

/**
 * @class PasswordEditor
 */
export class PasswordEditor extends TextEditor {
  /**
   * Autoresize instance for resizing the editor to the size of the entered text. Its overwrites the default
   * resizer of the TextEditor.
   *
   * @type {Function}
   */
  autoResize = createInputElementResizer(this.hot.rootDocument, {
    textContent: element => '•'.repeat(element.value.length)
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
  #revealTimer = null;

  /**
   * Bound input event handler used when `hashRevealDelay` is active.
   *
   * @type {Function|null}
   */
  #onInput = null;

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
  createElements() {
    super.createElements();

    this.TEXTAREA = this.hot.rootDocument.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', ''); // Makes the element recognizable by Hot as its own component's element.
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    empty(this.TEXTAREA_PARENT);
    this.TEXTAREA.setAttribute(...A11Y_TABINDEX(-1));
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }

  /**
   * Opens the editor. When `hashRevealDelay` is set, switches the input to `type="text"` and
   * installs a manual masking handler so each typed character is briefly visible before being
   * replaced by `hashSymbol`.
   */
  open() {
    super.open();

    const { hashRevealDelay, hashSymbol = '*' } = this.cellProperties;

    if (hashRevealDelay > 0) {
      this.#inRevealMode = true;
      this.TEXTAREA.setAttribute('type', 'text');

      // #realValue may already be set by setValue() called from beginEditing(); mask the display.
      this.TEXTAREA.value = hashSymbol.repeat(this.#realValue.length);

      this.#onInput = () => this.#handleRevealInput(hashSymbol, hashRevealDelay);
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
   * @param {string} value The value to set.
   */
  setValue(value) {
    if (this.#inRevealMode) {
      this.#realValue = value ?? '';
      const hashSymbol = this.cellProperties.hashSymbol ?? '*';

      this.TEXTAREA.value = hashSymbol.repeat(this.#realValue.length);
    } else if (this.cellProperties?.hashRevealDelay > 0) {
      // setValue() called from beginEditing() before open() sets #inRevealMode.
      this.#realValue = value ?? '';
    } else {
      super.setValue(value);
    }
  }

  /**
   * Handles input events when `hashRevealDelay` is active. Reconciles the display value
   * (which may contain hash symbols plus a newly typed plain character) with the stored
   * real value, then schedules masking of the new character.
   *
   * @param {string} hashSymbol The symbol used for masking.
   * @param {number} delay Milliseconds before the last typed character is masked.
   */
  #handleRevealInput(hashSymbol, delay) {
    const displayValue = this.TEXTAREA.value;
    const prevLength = this.#realValue.length;

    if (displayValue.length > prevLength) {
      // Characters were added - find unmasked suffix (plain chars not equal to hashSymbol).
      const newChars = displayValue.slice(prevLength);

      this.#realValue += newChars;
    } else if (displayValue.length < prevLength) {
      // Characters were deleted.
      this.#realValue = this.#realValue.slice(0, displayValue.length);
    }
    // If lengths are equal, the display already matches (e.g. pasted masked content) - no change.

    const maskedPrefix = hashSymbol.repeat(this.#realValue.length - (displayValue.length - prevLength > 0 ? displayValue.length - prevLength : 0));
    const visibleSuffix = displayValue.length > prevLength ? displayValue.slice(prevLength) : '';

    this.TEXTAREA.value = maskedPrefix + visibleSuffix;

    if (this.#revealTimer !== null) {
      clearTimeout(this.#revealTimer);
    }

    if (visibleSuffix.length > 0) {
      this.#revealTimer = this.hot._registerTimeout(() => {
        this.TEXTAREA.value = hashSymbol.repeat(this.#realValue.length);
        this.#revealTimer = null;
      }, delay);
    }
  }
}
