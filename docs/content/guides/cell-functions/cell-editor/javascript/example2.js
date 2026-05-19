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
    const options = Array.isArray(rawOptions) ? Object.fromEntries(rawOptions.map((v) => [v, v])) : rawOptions;

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
const PRIORITY_COLORS = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
  Critical: '#7c3aed',
};

const STATUS_COLORS = {
  'To Do': '#6b7280',
  'In Progress': '#3b82f6',
  Review: '#f59e0b',
  Done: '#22c55e',
};

function badgeRenderer(colorMap) {
  return (hotInstance, td, row, col, prop, value) => {
    td.innerText = '';

    if (value) {
      const badge = hotInstance.rootDocument.createElement('span');

      badge.className = 'htSelectBadge';
      badge.style.background = colorMap[value] ?? '#6b7280';
      badge.innerText = value;
      td.appendChild(badge);
    }

    return td;
  };
}

const container = document.querySelector('#example2');

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
      editor: SelectEditor,
      renderer: badgeRenderer(PRIORITY_COLORS),
      selectOptions: ['Low', 'Medium', 'High', 'Critical'],
    },
    {
      editor: SelectEditor,
      renderer: badgeRenderer(STATUS_COLORS),
      selectOptions: ['To Do', 'In Progress', 'Review', 'Done'],
    },
  ],
  colWidths: [220, 110, 130],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
