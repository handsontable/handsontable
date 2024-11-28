import { TextEditor } from '../textEditor';
import { createInputElementResizer } from '../../utils/autoResize';
import { empty } from '../../helpers/dom/element';

export const EDITOR_TYPE = 'password';

/**
 * @private
 * @class PasswordEditor
 */
export class PasswordEditor extends TextEditor {
  /**
   * Autoresize instance for resizing the editor to the size of the entered text. Its overwrites the default
   * resizer of the TextEditor.
   *
   * @private
   * @type {Function}
   */
  autoResize = createInputElementResizer(this.hot.rootDocument, {
    textContent: element => '•'.repeat(element.value.length)
  });

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
