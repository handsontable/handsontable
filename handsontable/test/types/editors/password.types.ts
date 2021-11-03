import Handsontable from 'handsontable';

class PasswordEditor extends Handsontable.editors.TextEditor {
  createElements() {
    // Call the original createElements method
    super.createElements();

    // Create password input and update relevant properties
    this.TEXTAREA = document.createElement('input');
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', '');
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';

    //replace textarea with password input
    Handsontable.dom.empty(this.TEXTAREA_PARENT);
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}
