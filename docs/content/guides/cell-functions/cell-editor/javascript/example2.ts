import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { BaseEditor } from 'handsontable/editors/baseEditor';

registerAllModules();

class SelectEditor extends BaseEditor {
  declare select: HTMLSelectElement;

  init(): void {
    this.select = this.hot.rootDocument.createElement('SELECT') as HTMLSelectElement;
    this.select.setAttribute('data-hot-input', 'true');
    this.select.classList.add('htSelectEditor');
    this.select.style.display = 'none';
    this.hot.rootElement.appendChild(this.select);
  }

  override prepare(
    row: number,
    col: number,
    prop: number | string,
    td: HTMLTableCellElement,
    originalValue: any,
    cellProperties: object
  ): void {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const rawOptions = (this.cellProperties as any).selectOptions ?? [];
    const options: Record<string, string> = Array.isArray(rawOptions)
      ? Object.fromEntries(rawOptions.map((v: any) => [v, v]))
      : rawOptions;

    this.select.innerText = '';
    Object.keys(options).forEach((key) => {
      const option = this.hot.rootDocument.createElement('OPTION') as HTMLOptionElement;

      option.value = key;
      option.innerText = options[key];
      this.select.appendChild(option);
    });
  }

  getValue(): string {
    return this.select.value;
  }

  setValue(value: string): void {
    this.select.value = value;
  }

  open(): void {
    const { top, start, width, height } = this.getEditedCellRect();
    const s = this.select.style;

    s.height = `${height}px`;
    s.minWidth = `${width}px`;
    s.top = `${top}px`;
    (s as any)[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`;
    s.margin = '0px';
    s.display = '';

    this.addHook('beforeKeyDown', (event: KeyboardEvent) => {
      const { selectedIndex, length } = this.select;

      if (event.keyCode === 38 && selectedIndex > 0) {
        (this.select[selectedIndex - 1] as HTMLOptionElement).selected = true;
        event.stopImmediatePropagation();
        event.preventDefault();
      } else if (event.keyCode === 40 && selectedIndex < length - 1) {
        (this.select[selectedIndex + 1] as HTMLOptionElement).selected = true;
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    });
  }

  close(): void {
    this.select.style.display = 'none';
    this.clearHooks();
  }

  focus(): void {
    this.select.focus();
  }
}

const container = document.querySelector('#example2') as HTMLElement;

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
      editor: SelectEditor as typeof BaseEditor,
      selectOptions: ['black', 'white', 'red', 'blue', 'silver'],
    } as any,
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
