import { TextEditor } from '../textEditor';
import { empty } from '../../helpers/dom/element';

export const EDITOR_TYPE = 'password';

/**
 * @private
 * @class PasswordEditor
 */
export class PasswordEditor extends TextEditor {
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

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
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}
