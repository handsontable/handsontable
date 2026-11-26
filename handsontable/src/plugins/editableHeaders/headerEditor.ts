import { A11Y_LABEL } from '../../helpers/a11y';
import { getDeepActiveElement, setAttribute } from '../../helpers/dom/element';

const INPUT_CLASS = 'htEditableHeaderInput';

/**
 * The box the input is laid over, in pixels, relative to the element the input is mounted in.
 */
export interface HeaderEditorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * What the editor needs from its host. It holds no reference to the grid.
 */
export interface HeaderEditorOptions {
  /**
   * The document the input is created in.
   */
  rootDocument: Document;
  /**
   * The element the input is mounted in. It must be positioned, so `rect` is read against it.
   */
  container: HTMLElement;
  /**
   * Called when the input loses the focus while open. The host decides whether that commits.
   */
  onBlur: () => void;
}

/**
 * The input laid over a header while the user renames it. It owns the DOM only: the keys, the
 * commit and the focus return are the plugin's.
 */
export class HeaderEditor {
  /**
   * What the host gave the editor.
   */
  #options: HeaderEditorOptions;
  /**
   * The input, created on the first open.
   */
  #input: HTMLInputElement | null = null;
  /**
   * Whether the input is shown.
   */
  #opened = false;
  /**
   * Whether an IME composition is in progress in the input.
   */
  #composing = false;

  /**
   * @param {HeaderEditorOptions} options What the editor needs from its host.
   */
  constructor(options: HeaderEditorOptions) {
    this.#options = options;
  }

  /**
   * Whether the input is shown.
   *
   * @returns {boolean}
   */
  isOpened(): boolean {
    return this.#opened;
  }

  /**
   * Whether an IME composition is in progress. A key pressed then belongs to the IME.
   *
   * @returns {boolean}
   */
  isComposing(): boolean {
    return this.#composing;
  }

  /**
   * Returns the input element, or `null` before the first open.
   *
   * @returns {HTMLInputElement|null}
   */
  getInputElement(): HTMLInputElement | null {
    return this.#input;
  }

  /**
   * Returns the text in the input.
   *
   * @returns {string}
   */
  getValue(): string {
    return this.#input?.value ?? '';
  }

  /**
   * Shows the input over `rect` with `value` selected, and focuses it.
   *
   * @param {HeaderEditorRect} rect The header's box.
   * @param {string} value The text to start from.
   * @param {object} a11y The accessible name and the text direction.
   * @param {string} a11y.label The accessible name of the input.
   * @param {string} a11y.dir The text direction, `'ltr'` or `'rtl'`.
   */
  open(rect: HeaderEditorRect, value: string, { label, dir }: { label: string; dir: 'ltr' | 'rtl' }) {
    const input = this.#ensureInput();

    input.value = value;
    input.dir = dir;
    setAttribute(input, [A11Y_LABEL(label)]);
    this.reposition(rect);
    input.style.display = '';
    this.#opened = true;
    input.focus({ preventScroll: true });
    input.select();
  }

  /**
   * Moves the open input over `rect`.
   *
   * @param {HeaderEditorRect} rect The header's box.
   */
  reposition(rect: HeaderEditorRect) {
    const input = this.#input;

    if (input === null) {
      return;
    }

    input.style.top = `${rect.top}px`;
    input.style.left = `${rect.left}px`;
    input.style.width = `${rect.width}px`;
    input.style.height = `${rect.height}px`;
  }

  /**
   * Hides the input. The focus is the caller's to move.
   */
  close() {
    this.#opened = false;
    this.#composing = false;

    if (this.#input) {
      this.#input.style.display = 'none';
    }
  }

  /**
   * Removes the input from the DOM.
   */
  destroy() {
    this.close();
    this.#input?.remove();
    this.#input = null;
  }

  /**
   * Creates the input on the first open.
   *
   * @returns {HTMLInputElement}
   */
  #ensureInput(): HTMLInputElement {
    if (this.#input !== null) {
      return this.#input;
    }

    const { rootDocument, container } = this.#options;
    const input = rootDocument.createElement('input');

    input.type = 'text';
    input.className = INPUT_CLASS;
    input.autocomplete = 'off';
    input.spellcheck = false;
    // Marks the input as the grid's own, so the grid keeps listening while it holds the focus.
    input.setAttribute('data-hot-input', '');
    input.style.display = 'none';
    input.addEventListener('compositionstart', this.#onCompositionStart);
    input.addEventListener('compositionend', this.#onCompositionEnd);
    input.addEventListener('blur', this.#onBlur);
    container.appendChild(input);
    this.#input = input;

    return input;
  }

  /**
   * Marks the start of an IME composition.
   */
  #onCompositionStart = () => {
    this.#composing = true;
  };

  /**
   * Marks the end of an IME composition.
   */
  #onCompositionEnd = () => {
    this.#composing = false;
  };

  /**
   * Reports a blur of the open input to the host. A blur while the input is still the active element means the
   * window lost the focus (another window, the browser's developer tools): the user is not done typing.
   */
  #onBlur = () => {
    if (this.#opened && getDeepActiveElement(this.#options.rootDocument) !== this.#input) {
      this.#options.onBlur();
    }
  };
}
