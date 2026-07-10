<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';
import type { CellProperties } from 'handsontable/settings';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type RadioOption = { value: string; label: string } | string;

interface RadioCellProperties extends CellProperties {
  options: RadioOption[];
}

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
      e.stopPropagation();
    });
  });

  td.appendChild(wrapper);
  td.style.verticalAlign = 'top';
});

registerCellType('radio', { editor: RadioEditor, renderer: radioRenderer });

/* start:skip-in-preview */
const data = [
  { task: 'Refactor licensing app navigation', priority: 'high',   status: 'in-progress' },
  { task: 'Theme Builder onboarding tour',     priority: 'medium', status: 'todo'        },
  { task: 'MCP server v1 release prep',        priority: 'high',   status: 'in-progress' },
  { task: 'GitHub triage rotation docs',       priority: 'low',    status: 'done'        },
  { task: 'shadcn/ui integration recipe',      priority: 'medium', status: 'todo'        },
];
/* end:skip-in-preview */

const priorityOptions = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
];

const statusOptions = [
  { value: 'todo',        label: 'Todo'        },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done',        label: 'Done'        },
];

const hotSettings: GridSettings = {
  rowHeights: 96,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  licenseKey: 'non-commercial-and-evaluation',
};

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

onMounted(() => {
  const hot = hotRef.value?.hotInstance;

  if (!hot) return;
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
});
</script>

<template>
  <div id="example1">
    <HotTable
      ref="hotRef"
      :data="data"
      :col-headers="['Task', 'Priority', 'Status']"
      :settings="hotSettings"
    >
      <HotColumn data="task"     type="text"  :width="300" />
      <HotColumn data="priority" type="radio" :width="160" :settings="{ options: priorityOptions }" />
      <HotColumn data="status"   type="radio" :width="170" :settings="{ options: statusOptions }" />
    </HotTable>
  </div>
</template>

<style>
/* Not scoped: Handsontable cells are outside the component root. */
.htRadioCell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  line-height: 1.4;
}

.htRadioCell .htUIRadio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ht-foreground-color, #1f2937);
  padding: 2px 6px !important;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}

.htRadioCell .htUIRadioLabel {
  flex: 1;
}

.htRadioCell .htUIRadio > input[type='radio'] {
  cursor: pointer;
}
</style>
