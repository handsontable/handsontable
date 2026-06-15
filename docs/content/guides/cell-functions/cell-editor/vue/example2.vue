<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { stopImmediatePropagation } from 'handsontable/helpers/dom/event';
import type Handsontable from 'handsontable/base';
import type { GridSettings } from 'handsontable/settings';

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
    originalValue: Handsontable.CellValue,
    cellProperties: object
  ): void {
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const rawOptions = (this.cellProperties as any).selectOptions ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const options: Record<string, string> = Array.isArray(rawOptions)
      ? Object.fromEntries(rawOptions.map((v: string) => [v, v]))
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
    (s as any)[this.hot.isRtl() ? 'right' : 'left'] = `${start}px`; // eslint-disable-line @typescript-eslint/no-explicit-any
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
    instance: Handsontable.Core,
    td: HTMLTableCellElement,
    _row: number,
    _col: number,
    _prop: string | number,
    value: string
  ): HTMLTableCellElement => {
    td.innerText = '';

    if (value) {
      const badge = instance.rootDocument.createElement('span');

      badge.className = 'htSelectBadge';
      badge.style.background = colorMap[value] ?? '#6b7280';
      badge.innerText = value;
      td.appendChild(badge);
    }

    return td;
  };
}

const hotSettings = ref<GridSettings>({
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
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    {
      editor: SelectEditor as typeof BaseEditor,
      renderer: badgeRenderer(STATUS_COLORS),
      selectOptions: ['To Do', 'In Progress', 'Review', 'Done'],
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ],
  colWidths: [220, 110, 130],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<style>
.htSelectEditor {
  /* Enables dimension changes for <select> in WebKit browsers */
  -webkit-appearance: menulist-button !important;
  position: absolute;
  width: auto;
  z-index: 300;
}

.htSelectBadge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
</style>
