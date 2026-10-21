import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { createIcons, Flag, FlagOff } from 'lucide';
// Register all Handsontable's modules.
registerAllModules();
const data = [
    { task: 'Update API docs', assignee: 'Ana García', dueDate: '2025-06-30', flagged: true },
    { task: 'Deploy hotfix', assignee: 'James Okafor', dueDate: '2025-06-18', flagged: false },
    { task: 'Review pull request', assignee: 'Li Wei', dueDate: '2025-06-20', flagged: false },
    { task: 'Write release notes', assignee: 'Sara Nowak', dueDate: '2025-06-25', flagged: true },
    { task: 'Fix flaky test', assignee: 'Marco Rossi', dueDate: '2025-06-22', flagged: false },
];
// Lucide reads a `data-lucide` placeholder and replaces it with an inline
// `<svg>`. The renderer writes the placeholder, then triggers the swap.
const flagRenderer = (instance, td, row, _col, _prop, value) => {
    const taskName = String(instance.getDataAtCell(row, 0));
    const button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = 'background: none; border: none; cursor: pointer; padding: 0.25rem;';
    button.innerHTML = `<i data-lucide="${value ? 'flag' : 'flag-off'}"></i>`;
    // The icon has no accessible name, so the button carries an `aria-label`
    // that describes what clicking it does.
    button.setAttribute('aria-label', value ? `Remove the follow-up flag from ${taskName}` : `Flag ${taskName} for follow-up`);
    button.addEventListener('click', () => {
        instance.setDataAtCell(row, 3, !value);
    });
    td.innerText = '';
    td.appendChild(button);
    // `root` scopes the scan to this cell. Without it, Lucide walks the whole
    // document on every cell render, which a grid does once per visible cell.
    // `currentColor` keeps the icon visible in both light and dark themes.
    createIcons({
        icons: { Flag, FlagOff },
        attrs: { width: '18', height: '18', stroke: 'currentColor' },
        root: td,
    });
    return td;
};
const container = document.querySelector('#example2');
new Handsontable(container, {
    data,
    colHeaders: ['Task', 'Assignee', 'Due date', 'Flagged'],
    columns: [
        { data: 'task' },
        { data: 'assignee' },
        { data: 'dueDate', type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
        { data: 'flagged', renderer: flagRenderer, className: 'htCenter' },
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
