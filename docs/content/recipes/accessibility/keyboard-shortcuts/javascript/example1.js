import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const employees = [
  { name: 'Ana García', department: 'Engineering', role: 'Senior Developer', salary: 95000, startDate: '2021-03-15' },
  { name: 'James Okafor', department: 'Marketing', role: 'Marketing Manager', salary: 82000, startDate: '2020-07-01' },
  { name: 'Li Wei', department: 'Engineering', role: 'Frontend Developer', salary: 78000, startDate: '2022-01-10' },
  { name: 'Priya Nair', department: 'HR', role: 'HR Specialist', salary: 68000, startDate: '2019-11-20' },
  { name: 'Carlos Mendes', department: 'Finance', role: 'Financial Analyst', salary: 88000, startDate: '2021-09-05' },
  { name: 'Fatima Al-Hassan', department: 'Engineering', role: 'Backend Developer', salary: 92000, startDate: '2020-04-18' },
  { name: 'Noah Kim', department: 'Design', role: 'UX Designer', salary: 75000, startDate: '2023-02-14' },
  { name: 'Sara Lindqvist', department: 'Marketing', role: 'Content Strategist', salary: 71000, startDate: '2019-06-30' },
];
/* end:skip-in-preview */

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: employees,
  colHeaders: ['Name', 'Department', 'Role', 'Salary', 'Start Date'],
  columns: [
    { data: 'name', type: 'text' },
    { data: 'department', type: 'text' },
    { data: 'role', type: 'text' },
    { data: 'salary', type: 'numeric', locale: 'en-US', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    { data: 'startDate', type: 'text' },
  ],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const preview = container.closest('.hot-example-preview') ?? container.parentElement;
const lastShortcutEl = preview.querySelector('.last-shortcut');
const lastSubmissionEl = preview.querySelector('.last-submission');

const gridContext = hot.getShortcutManager().getContext('grid');

// Ctrl+D: duplicate the currently selected row
gridContext.addShortcut({
  keys: [['Control', 'd']],
  group: 'customActions',
  runOnlyIf: () => hot.getSelected() !== undefined,
  callback: (event) => {
    event.preventDefault();

    const selectedRange = hot.getSelectedRangeLast();

    if (!selectedRange) {
      return;
    }

    const row = selectedRange.from.row;
    const rowData = hot.getSourceDataAtRow(row);

    hot.alter('insert_row_below', row);
    hot.populateFromArray(row + 1, 0, [Object.values(rowData)]);

    lastShortcutEl.textContent = 'Ctrl+D -- row duplicated';
  },
});

// Ctrl+Enter: submit the grid data
gridContext.addShortcut({
  keys: [['Control', 'Enter']],
  group: 'customActions',
  runOnlyIf: () => true,
  callback: (event) => {
    event.preventDefault();

    const data = hot.getData();
    const headers = hot.getColHeader();
    const rowCount = data.length;
    const timestamp = new Date().toLocaleTimeString();

    lastShortcutEl.textContent = 'Ctrl+Enter -- data submitted';
    lastSubmissionEl.textContent = `[${timestamp}] Submitted ${rowCount} rows -- columns: ${headers.join(', ')}`;
  },
});
