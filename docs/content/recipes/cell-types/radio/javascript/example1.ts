import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';
import type { CellProperties } from 'handsontable/settings';

// Register all Handsontable's modules.
registerAllModules();

/* start:skip-in-preview */
const data = [
  { task: 'Refactor licensing app navigation', priority: 'high',   status: 'in-progress' },
  { task: 'Theme Builder onboarding tour',     priority: 'medium', status: 'todo'        },
  { task: 'MCP server v1 release prep',        priority: 'high',   status: 'in-progress' },
  { task: 'GitHub triage rotation docs',       priority: 'low',    status: 'done'        },
  { task: 'shadcn/ui integration recipe',      priority: 'medium', status: 'todo'        },
];
/* end:skip-in-preview */

type RadioOption = { value: string; label: string } | string;

interface RadioCellProperties extends CellProperties {
  options: RadioOption[];
}

// Minimal editor stub — all interaction is handled by the renderer.
class RadioEditor extends BaseEditor {
  init(): void {}
  open(): void {}
  close(): void {}
  focus(): void {}
  getValue(): string { return this.originalValue as string; }
  setValue(value: string): void { this.originalValue = value; }
}

const radioRenderer = rendererFactory(({ instance, td, row, column, value, cellProperties }) => {
  while (td.firstChild) td.removeChild(td.firstChild);

  const options: RadioOption[] = (cellProperties as RadioCellProperties).options || [];
  const wrapper = document.createElement('div');

  wrapper.className = 'htRadioCell';
  wrapper.setAttribute('role', 'radiogroup');

  const colHeader = instance.getColHeader(column as number);

  if (colHeader) wrapper.setAttribute('aria-label', String(colHeader));

  const isReadOnly = !!cellProperties.readOnly;

  const hasChecked = options.some((opt) => {
    const v = typeof opt === 'object' ? opt.value : opt;

    return String(v) === String(value);
  });

  // Cycle to the next or previous option and commit via setDataAtCell.
  // queueMicrotask restores focus after Handsontable re-renders the cell.
  const cycle = (direction: 'next' | 'prev') => {
    if (!options.length) return;
    const i = options.findIndex((opt) => {
      const v = typeof opt === 'object' ? opt.value : opt;

      return String(v) === String(value);
    });
    const last = options.length - 1;
    const next = direction === 'next'
      ? (i === last || i === -1 ? 0 : i + 1)
      : (i <= 0 ? last : i - 1);
    const newValue = typeof options[next] === 'object'
      ? (options[next] as { value: string }).value
      : (options[next] as string);

    instance.setDataAtCell(row as number, column as number, newValue);
    queueMicrotask(() => {
      const newTd = instance.getCell(row as number, column as number);

      newTd?.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(newValue)}"]`)?.focus();
    });
  };

  options.forEach((opt, idx) => {
    const optValue = typeof opt === 'object' ? opt.value : opt;
    const optLabel = typeof opt === 'object' ? opt.label : opt;
    const label = document.createElement('label');

    label.className = 'htUIRadio';

    const input = document.createElement('input');

    input.type = 'radio';
    input.className = 'htUIRadioInput';
    input.name = `radio-r${row}-c${column}`;
    input.value = optValue;
    input.checked = String(optValue) === String(value);
    // Roving tabindex: exactly one radio per group is tabbable.
    input.tabIndex = (input.checked || (!hasChecked && idx === 0)) ? 0 : -1;
    input.disabled = isReadOnly;

    const span = document.createElement('span');

    span.className = 'htUIRadioLabel';
    span.textContent = optLabel;

    label.appendChild(input);
    label.appendChild(span);
    wrapper.appendChild(label);

    input.addEventListener('change', (e) => {
      e.stopPropagation();
      const v = (e.target as HTMLInputElement).value;

      instance.setDataAtCell(row as number, column as number, v);
      queueMicrotask(() => {
        const newTd = instance.getCell(row as number, column as number);

        newTd?.querySelector<HTMLInputElement>(`input[type="radio"][value="${CSS.escape(v)}"]`)?.focus();
      });
    });

    // Stop mousedown so Handsontable doesn't hijack the click for cell selection.
    label.addEventListener('mousedown', (e) => e.stopPropagation());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        instance.selectCell(row as number, column as number);

        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        cycle('next');

        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        cycle('prev');

        return;
      }
      // Block other keys from reaching Handsontable's shortcut system.
      e.stopPropagation();
    });
  });

  td.appendChild(wrapper);
  td.style.verticalAlign = 'top';
});

registerCellType('radio', { editor: RadioEditor, renderer: radioRenderer });

// Get the DOM element with the ID 'example1' where the Handsontable will be rendered
const container = document.querySelector('#example1')!;

const priorityOptions: RadioOption[] = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
];

const statusOptions: RadioOption[] = [
  { value: 'todo',        label: 'Todo'        },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done',        label: 'Done'        },
];

// Define configuration options for the Handsontable
const hotOptions: Handsontable.GridSettings = {
  data,
  colHeaders: ['Task', 'Priority', 'Status'],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  rowHeights: 96,
  columns: [
    { data: 'task',     type: 'text',  width: 300 },
    { data: 'priority', type: 'radio', options: priorityOptions, width: 160 } as Handsontable.ColumnSettings,
    { data: 'status',   type: 'radio', options: statusOptions,   width: 170 } as Handsontable.ColumnSettings,
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

// Initialize the Handsontable instance with the specified configuration options
// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, hotOptions);

// Enter / F2 on a radio cell: move focus to the checked (or first) radio input.
// Use capture so this fires before Handsontable's own keydown handlers.
hot.rootElement.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return;
  if (e.key !== 'Enter' && e.key !== 'F2') return;

  const sel = hot.getSelectedLast();

  if (!sel) return;

  const [r, c] = sel;

  if (hot.getCellMeta(r, c).type !== 'radio') return;

  const td = hot.getCell(r, c);
  const target = td?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
    ?? td?.querySelector<HTMLInputElement>('input[type="radio"]');

  if (target) {
    e.stopImmediatePropagation();
    e.preventDefault();
    target.focus();
  }
}, true);
