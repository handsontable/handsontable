import { TextEditor } from 'handsontable/editors';

class CustomPasswordEditor extends TextEditor {
  createElements() {
    // Call the original createElements method
    super.createElements();

    // Create password input and update relevant properties
    this.TEXTAREA = document.createElement('input') as unknown as HTMLTextAreaElement;
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', '');
    this.TEXTAREA.className = 'handsontableInput';
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';

    // replace textarea with password input
    this.TEXTAREA_PARENT.textContent = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}
