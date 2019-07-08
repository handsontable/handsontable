import { addClass } from './../../helpers/dom/element';

/**
 * Comment editor for the Comments plugin.
 *
 * @class CommentEditor
 * @plugin Comments
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

  constructor(rootDocument) {
    this.container = null;
    this.rootDocument = rootDocument;
    this.editor = this.createEditor();
    this.editorStyle = this.editor.style;

    this.hidden = true;

    this.hide();
  }

  /**
   * Set position of the comments editor according to the  provided x and y coordinates.
   *
   * @param {Number} x X position (in pixels).
   * @param {Number} y Y position (in pixels).
   */
  setPosition(x, y) {
    this.editorStyle.left = `${x}px`;
    this.editorStyle.top = `${y}px`;
  }

  /**
   * Set the editor size according to the provided arguments.
   *
   * @param {Number} width Width in pixels.
   * @param {Number} height Height in pixels.
   */
  setSize(width, height) {
    if (width && height) {
      const input = this.getInputElement();

      input.style.width = `${width}px`;
      input.style.height = `${height}px`;
    }
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
   * @param {Boolean} state The new read only state.
   */
  setReadOnlyState(state) {
    const input = this.getInputElement();

    input.readOnly = state;
  }

  /**
   * Show the comments editor.
   */
  show() {
    this.editorStyle.display = 'block';
    this.hidden = false;
  }

  /**
   * Hide the comments editor.
   */
  hide() {
    this.editorStyle.display = 'none';
    this.hidden = true;
  }

  /**
   * Checks if the editor is visible.
   *
   * @returns {Boolean}
   */
  isVisible() {
    return this.editorStyle.display === 'block';
  }

  /**
   * Set the comment value.
   *
   * @param {String} [value] The value to use.
   */
  setValue(value = '') {
    const comment = value || '';

    this.getInputElement().value = comment;
  }

  /**
   * Get the comment value.
   *
   * @returns {String}
   */
  getValue() {
    return this.getInputElement().value;
  }

  /**
   * Checks if the comment input element is focused.
   *
   * @returns {Boolean}
   */
  isFocused() {
    return this.rootDocument.activeElement === this.getInputElement();
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
    const editor = this.rootDocument.createElement('div');
    const textArea = this.rootDocument.createElement('textarea');
    this.container = this.rootDocument.querySelector(`.${CommentEditor.CLASS_EDITOR_CONTAINER}`);

    if (!this.container) {
      this.container = this.rootDocument.createElement('div');
      addClass(this.container, CommentEditor.CLASS_EDITOR_CONTAINER);
      this.rootDocument.body.appendChild(this.container);
    }

    addClass(editor, CommentEditor.CLASS_EDITOR);
    addClass(textArea, CommentEditor.CLASS_INPUT);

    editor.appendChild(textArea);
    this.container.appendChild(editor);

    return editor;
  }

  /**
   * Get the input element.
   *
   * @returns {HTMLElement}
   */
  getInputElement() {
    return this.editor.querySelector(`.${CommentEditor.CLASS_INPUT}`);
  }

  /**
   * Destroy the comments editor.
   */
  destroy() {
    const containerParentElement = this.container ? this.container.parentNode : null;

    this.editor.parentNode.removeChild(this.editor);
    this.editor = null;
    this.editorStyle = null;

    if (containerParentElement) {
      containerParentElement.removeChild(this.container);
    }
  }
}

export default CommentEditor;
