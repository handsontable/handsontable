import * as dom from './../../dom.js';

/**
 * Comment editor for Comments plugin.
 *
 * @class CommentEditor
 * @plugin
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

  constructor() {
    this.editor = this.createEditor();
    this.editorStyle = this.editor.style;
    this.editorStyle.position = 'absolute';
    // above cell editor
    this.editorStyle.zIndex = 100;
    this.hide();
  }

  /**
   * Set position of comments editor according to x, y coords
   *
   * @param {Number} x
   * @param {Number} y
   */
  setPosition(x, y) {
    this.editorStyle.left = x + 'px';
    this.editorStyle.top = y + 'px';
  }

  /**
   * Show comments editor
   */
  show() {
    this.editorStyle.display = 'block';
  }

  /**
   * Hide comments editor
   */
  hide() {
    this.editorStyle.display = 'none';
  }

  /**
   * Checks if editor is visible
   *
   * @returns {Boolean}
   */
  isVisible() {
    return this.editorStyle.display === 'block';
  }

  /**
   * Set comment value
   *
   * @param {String} [value]
   */
  setValue(value = '') {
    value = value || '';
    this.getInputElement().value = value;
  }

  /**
   * Get comment value
   *
   * @returns {String}
   */
  getValue() {
    return this.getInputElement().value;
  }

  /**
   * Checks if comment input element is focused
   *
   * @returns {Boolean}
   */
  isFocused() {
    return document.activeElement === this.getInputElement();
  }

  /**
   * Focus comments input element
   */
  focus() {
    this.getInputElement().focus();
  }

  /**
   * Create editor for comment textarea
   *
   * @returns {Element}
   */
  createEditor() {
    let container = document.querySelector('.' + CommentEditor.CLASS_EDITOR_CONTAINER);
    let editor;
    let textArea;

    if (!container) {
      container = document.createElement('div');
      dom.addClass(container, CommentEditor.CLASS_EDITOR_CONTAINER);
      document.body.appendChild(container);
    }
    editor = document.createElement('div');
    dom.addClass(editor, CommentEditor.CLASS_EDITOR);

    textArea = document.createElement('textarea');
    dom.addClass(textArea, CommentEditor.CLASS_INPUT);

    editor.appendChild(textArea);
    container.appendChild(editor);

    return editor;
  }

  /**
   * Get input element
   *
   * @returns {HTMLElement}
   */
  getInputElement() {
    return this.editor.querySelector('.' + CommentEditor.CLASS_INPUT);
  }

  /**
   * Destroy comment editor
   */
  destroy() {
    this.editor.parentNode.removeChild(this.editor);
    this.editor = null;
    this.editorStyle = null;
  }
}

export {CommentEditor};
