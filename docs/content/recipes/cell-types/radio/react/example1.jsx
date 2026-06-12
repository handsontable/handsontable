import { useRef } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { rendererFactory } from 'handsontable/renderers';
import { BaseEditor } from 'handsontable/editors/baseEditor';
import { registerCellType } from 'handsontable/cellTypes';
import './example1.css';

registerAllModules();

class RadioEditor extends BaseEditor {
  init() {}
  open() {}
  close() {}
  focus() {}
  getValue() { return this.originalValue; }
  setValue(value) { this.originalValue = value; }
}

const radioRenderer = rendererFactory(({ instance, td, row, column, value, cellProperties }) => {
  while (td.firstChild) td.removeChild(td.firstChild);

  const options = cellProperties.options || [];
  const wrapper = document.createElement('div');

  wrapper.className = 'htRadioCell';
  wrapper.setAttribute('role', 'radiogroup');

  const colHeader = instance.getColHeader(column);

  if (colHeader) wrapper.setAttribute('aria-label', String(colHeader));

  const isReadOnly = !!cellProperties.readOnly;

  const hasChecked = options.some((opt) => {
    const v = typeof opt === 'object' ? opt.value : opt;

    return String(v) === String(value);
  });

  const cycle = (direction) => {
    if (!options.length) return;
    const i = options.findIndex((opt) => {
      const v = typeof opt === 'object' ? opt.value : opt;

      return String(v) === String(value);
    });
    const last = options.length - 1;
    const next = direction === 'next'
      ? (i === last || i === -1 ? 0 : i + 1)
      : (i <= 0 ? last : i - 1);
    const newValue = typeof options[next] === 'object' ? options[next].value : options[next];

    instance.setDataAtCell(row, column, newValue);
    queueMicrotask(() => {
      const newTd = instance.getCell(row, column);

      newTd?.querySelector(`input[type="radio"][value="${CSS.escape(newValue)}"]`)?.focus();
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
      const v = e.target.value;

      instance.setDataAtCell(row, column, v);
      queueMicrotask(() => {
        const newTd = instance.getCell(row, column);

        newTd?.querySelector(`input[type="radio"][value="${CSS.escape(v)}"]`)?.focus();
      });
    });

    label.addEventListener('mousedown', (e) => e.stopPropagation());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        instance.selectCell(row, column);

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

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const afterInit = function() {
    this.rootElement.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key !== 'Enter' && e.key !== 'F2') return;

      const sel = this.getSelectedLast();

      if (!sel) return;

      const [r, c] = sel;

      if (this.getCellMeta(r, c).type !== 'radio') return;

      const td = this.getCell(r, c);
      const target = td?.querySelector('input[type="radio"]:checked')
        ?? td?.querySelector('input[type="radio"]');

      if (target) {
        e.stopImmediatePropagation();
        e.preventDefault();
        target.focus();
      }
    }, true);
  };

  return (
    <HotTable
      ref={hotRef}
      data={data}
      colHeaders={['Task', 'Priority', 'Status']}
      rowHeaders={true}
      height="auto"
      width="100%"
      rowHeights={96}
      afterInit={afterInit}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="task"     type="text"  width={300} />
      <HotColumn data="priority" type="radio" width={160} options={priorityOptions} />
      <HotColumn data="status"   type="radio" width={170} options={statusOptions}   />
    </HotTable>
  );
};

export default ExampleComponent;
