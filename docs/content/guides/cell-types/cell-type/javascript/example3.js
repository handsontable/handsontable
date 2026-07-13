import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();
const projectMembers = [
    ['Ana García', 'Product Manager'], ['James Okafor', 'Senior Engineer'], ['Li Wei', 'UX Designer'],
];
const valueCellMeta = [
    { type: 'dropdown', source: ['Planning', 'In progress', 'Blocked'] },
    {
        type: 'numeric',
        locale: 'en-US',
        numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    },
    { type: 'intl-date', locale: 'en-US', dateFormat: { year: 'numeric', month: 'short', day: 'numeric' } },
    { type: 'checkbox' },
    { type: 'text' },
    {
        type: 'handsontable',
        handsontable: {
            colHeaders: ['Name', 'Role'],
            autoColumnSize: true,
            data: projectMembers,
            getValue() {
                const selection = this.getSelectedLast();
                return this.getSourceDataAtCell(Math.max(selection?.[0] ?? 0, 0), 0);
            },
        },
    },
    { type: 'password' },
];
const container = document.querySelector('#example3');
new Handsontable(container, {
    data: [
        ['Status', 'In progress'],
        ['Budget', 250000],
        ['Due date', '2026-09-30'],
        ['Approved', true],
        ['Project name', 'Website redesign'],
        ['Owner', 'Ana García'],
        ['Access code', 'release-2026'],
    ],
    colHeaders: ['Setting', 'Value'],
    columns: [{ readOnly: true }, {}],
    cells(row, col) {
        return col === 1 ? (valueCellMeta[row] ?? {}) : {};
    },
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
