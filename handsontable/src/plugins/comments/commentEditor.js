import { addClass, outerWidth, outerHeight } from '../../helpers/dom/element';
import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import { EditorResizeObserver } from './editorResizeObserver';

/**
 * Comment editor for the Comments plugin.
 *
 * @private
 * @class CommentEditor
 */
class CommentEditor {
  static get CLASS_EDITOR_CONTAINER() {
    return 'htCommentsContainer';
  }

  static get CLASS_EDITOR() {
    return 'htComments';
  }

  static get CLASS_INPUT() {
    return 'htCommentTextArea';
  }

  static get CLASS_CELL() {
    return 'htCommentCell';
  }

  /**
   * @type {Document}
   */
  #rootDocument;
  /**
   * @type {boolean}
   */
  #isRtl = false;
  /**
   * @type {HTMLElement}
   */
  #container = null;
  /**
   * @type {HTMLElement}
   */
  #editor;
  /**
   * @type {CSSStyleDeclaration}
   */
  #editorStyle;
  /**
   * @type {boolean}
   */
  #hidden = true;
  /**
   * @type {EditorResizeObserver}
   */
  #resizeObserver = new EditorResizeObserver();

  constructor(rootDocument, isRtl) {
    this.#rootDocument = rootDocument;
    this.#isRtl = isRtl;
    this.#editor = this.createEditor();
    this.#editorStyle = this.#editor.style;
    this.#resizeObserver.setObservedElement(this.getInputElement());
    this.#resizeObserver.addLocalHook('resize', (...args) => this.runLocalHooks('resize', ...args));

    this.hide();
  }

  /**
   * Set position of the comments editor according to the  provided x and y coordinates.
   *
   * @param {number} x X position (in pixels).
   * @param {number} y Y position (in pixels).
   */
  setPosition(x, y) {
    this.#editorStyle.left = `${x}px`;
    this.#editorStyle.top = `${y}px`;
  }

  /**
   * Set the editor size according to the provided arguments.
   *
   * @param {number} width Width in pixels.
   * @param {number} height Height in pixels.
   */
  setSize(width, height) {
    if (width && height) {
      const input = this.getInputElement();

      input.style.width = `${width}px`;
      input.style.height = `${height}px`;
    }
  }

  /**
   * Returns the size of the comments editor.
   *
   * @returns {{ width: number, height: number }}
   */
  getSize() {
    return {
      width: outerWidth(this.getInputElement()),
      height: outerHeight(this.getInputElement()),
    };
  }

  /**
   * Starts observing the editor size.
   */
  observeSize() {
    this.#resizeObserver.observe();
  }

  /**
   * Reset the editor size to its initial state.
   */
  resetSize() {
    const input = this.getInputElement();

    input.style.width = '';
    input.style.height = '';
  }

  /**
   * Set the read-only state for the comments editor.
   *
   * @param {boolean} state The new read only state.
   */
  setReadOnlyState(state) {
    const input = this.getInputElement();

    input.readOnly = state;
  }

  /**
   * Show the comments editor.
   */
  show() {
    this.#editorStyle.display = 'block';
    this.#hidden = false;
  }

  /**
   * Hide the comments editor.
   */
  hide() {
    this.#resizeObserver.unobserve();

    if (!this.#hidden) {
      this.#editorStyle.display = 'none';
    }

    this.#hidden = true;
  }

  /**
   * Checks if the editor is visible.
   *
   * @returns {boolean}
   */
  isVisible() {
    return this.#editorStyle.display === 'block';
  }

  /**
   * Set the comment value.
   *
   * @param {string} [value] The value to use.
   */
  setValue(value = '') {
    const comment = value || '';

    this.getInputElement().value = comment;
  }

  /**
   * Get the comment value.
   *
   * @returns {string}
   */
  getValue() {
    return this.getInputElement().value;
  }

  /**
   * Checks if the comment input element is focused.
   *
   * @returns {boolean}
   */
  isFocused() {
    return this.#rootDocument.activeElement === this.getInputElement();
  }

  /**
   * Focus the comments input element.
   */
  focus() {
    this.getInputElement().focus();
  }

  /**
   * Create the `textarea` to be used as a comments editor.
   *
   * @returns {HTMLElement}
   */
  createEditor() {
    const editor = this.#rootDocument.createElement('div');
    const textarea = this.#rootDocument.createElement('textarea');

    editor.style.display = 'none';

    this.#container = this.#rootDocument.createElement('div');
    this.#container.setAttribute('dir', this.#isRtl ? 'rtl' : 'ltr');

    addClass(this.#container, CommentEditor.CLASS_EDITOR_CONTAINER);

    this.#rootDocument.body.appendChild(this.#container);

    addClass(editor, CommentEditor.CLASS_EDITOR);
    addClass(textarea, CommentEditor.CLASS_INPUT);
    textarea.setAttribute('data-hot-input', true);

    editor.appendChild(textarea);
    this.#container.appendChild(editor);

    return editor;
  }

  /**
   * Get the input element.
   *
   * @returns {HTMLElement}
   */
  getInputElement() {
    return this.#editor.querySelector(`.${CommentEditor.CLASS_INPUT}`);
  }

  /**
   * Get the editor element.
   *
   * @returns {HTMLElement} The editor element.
   */
  getEditorElement() {
    return this.#editor;
  }

  /**
   * Destroy the comments editor.
   */
  destroy() {
    const containerParentElement = this.#container ? this.#container.parentNode : null;

    this.#editor.parentNode.removeChild(this.#editor);
    this.#editor = null;
    this.#editorStyle = null;
    this.#resizeObserver.destroy();

    if (containerParentElement) {
      containerParentElement.removeChild(this.#container);
    }
  }
}

mixin(CommentEditor, localHooks);

export default CommentEditor;
