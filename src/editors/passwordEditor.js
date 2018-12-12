import { empty } from './../helpers/dom/element';
import TextEditor from './textEditor';

/**
 * @private
 * @editor PasswordEditor
 * @class PasswordEditor
 * @dependencies TextEditor
 */
class PasswordEditor extends TextEditor {
  createElements() {
    super.createElements();

    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    empty(this.TEXTAREA_PARENT);
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

export default PasswordEditor;
