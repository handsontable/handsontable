import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { TextEditor } from 'handsontable/editors/textEditor';

registerAllModules();

class PasswordEditor extends TextEditor {
  createElements(): void {
    super.createElements();
    this.TEXTAREA = this.hot.rootDocument.createElement('input') as HTMLInputElement;
    this.TEXTAREA.setAttribute('type', 'password');
    this.TEXTAREA.setAttribute('data-hot-input', 'true');
    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = '0';
    this.textareaStyle.height = '0';
    this.TEXTAREA_PARENT.innerText = '';
    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
  }
}

const container = document.querySelector('#example1') as HTMLElement;

new Handsontable(container, {
  data: [
    ['Alice', 'abc123'],
    ['Bob', 'letmein'],
    ['Carol', 'hunter2'],
    ['Dave', 'p@ssword'],
    ['Eve', 'qwerty'],
  ],
  colHeaders: ['Username', 'Password'],
  columns: [
    { type: 'text' },
    { editor: PasswordEditor as typeof TextEditor },
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
