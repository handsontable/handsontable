import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { stopImmediatePropagation } from 'handsontable/helpers/dom/event';

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
        stopImmediatePropagation(event);
        event.preventDefault();
      } else if (event.keyCode === 40 && selectedIndex < length - 1) {
        (this.select[selectedIndex + 1] as HTMLOptionElement).selected = true;
        stopImmediatePropagation(event);
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

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
  Critical: '#7c3aed',
};

const STATUS_COLORS: Record<string, string> = {
  'To Do': '#6b7280',
  'In Progress': '#3b82f6',
  Review: '#f59e0b',
  Done: '#22c55e',
};

function badgeRenderer(colorMap: Record<string, string>) {
  return (
    hotInstance: Handsontable.Core,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: any
  ): HTMLTableCellElement => {
    td.innerText = '';

    if (value) {
      const badge = hotInstance.rootDocument.createElement('span');

      badge.className = 'htSelectBadge';
      badge.style.background = colorMap[value] ?? '#6b7280';
      badge.innerText = value as string;
      td.appendChild(badge);
    }

    return td;
  };
}

const container = document.querySelector('#example2') as HTMLElement;

new Handsontable(container, {
  data: [
    ['Migrate database schema', 'High', 'In Progress'],
    ['Update API documentation', 'Medium', 'To Do'],
    ['Fix authentication bug', 'Critical', 'Review'],
    ['Add dark mode support', 'Low', 'Done'],
    ['Improve test coverage', 'Medium', 'In Progress'],
    ['Deploy to staging server', 'High', 'To Do'],
    ['Refactor billing module', 'Medium', 'Done'],
  ],
  colHeaders: ['Task', 'Priority', 'Status'],
  columns: [
    { type: 'text' },
    {
      editor: SelectEditor as typeof BaseEditor,
      renderer: badgeRenderer(PRIORITY_COLORS),
      selectOptions: ['Low', 'Medium', 'High', 'Critical'],
    } as any,
    {
      editor: SelectEditor as typeof BaseEditor,
      renderer: badgeRenderer(STATUS_COLORS),
      selectOptions: ['To Do', 'In Progress', 'Review', 'Done'],
    } as any,
  ],
  colWidths: [220, 110, 130],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
