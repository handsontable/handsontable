import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { BaseEditor } from 'handsontable/editors/baseEditor';

registerAllModules();

class SelectEditor extends BaseEditor {
  init() {
    this.select = this.hot.rootDocument.createElement('SELECT');
    this.select.setAttribute('data-hot-input', 'true');
    this.select.classList.add('htSelectEditor');
    this.select.style.display = 'none';
    this.hot.rootElement.appendChild(this.select);
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const rawOptions = this.cellProperties.selectOptions ?? [];
    const options = Array.isArray(rawOptions)
      ? Object.fromEntries(rawOptions.map((v) => [v, v]))
      : rawOptions;

    this.select.innerText = '';
    Object.keys(options).forEach((key) => {
      const option = this.hot.rootDocument.createElement('OPTION');

      option.value = key;
      option.innerText = options[key];
      this.select.appendChild(option);
    });
  }

  getValue() {
    return this.select.value;
  }

  setValue(value) {
    this.select.value = value;
  }

  open() {
    const { top, start, width, height } = this.getEditedCellRect();
    const s = this.select.style;

    s.height = `${height}px`;
    s.minWidth = `${width}px`;
    s.top = `${top}px`;
    s[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;
    s.margin = '0px';
    s.display = '';

    this.addHook('beforeKeyDown', (event) => {
      const { selectedIndex, length } = this.select;

      if (event.keyCode === 38 && selectedIndex > 0) {
        this.select[selectedIndex - 1].selected = true;
        event.stopImmediatePropagation();
        event.preventDefault();
      } else if (event.keyCode === 40 && selectedIndex < length - 1) {
        this.select[selectedIndex + 1].selected = true;
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    });
  }

  close() {
    this.select.style.display = 'none';
    this.clearHooks();
  }

  focus() {
    this.select.focus();
  }
}

const container = document.querySelector('#example2');

new Handsontable(container, {
  data: [
    ['Tesla', 'black'],
    ['Nissan', 'white'],
    ['Toyota', 'red'],
    ['Honda', 'blue'],
    ['Ford', 'silver'],
  ],
  colHeaders: ['Car', 'Color'],
  columns: [
    { type: 'text' },
    {
      editor: SelectEditor,
      selectOptions: ['black', 'white', 'red', 'blue', 'silver'],
    },
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
