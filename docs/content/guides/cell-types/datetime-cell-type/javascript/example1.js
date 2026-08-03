import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
// register all of Handsontable's modules
registerAllModules();
const container = document.querySelector('#example1');
const data = [
    { task: 'Design review', deadline: '2024-03-15T09:30:00', created: '2024-03-01T08:00:00' },
    { task: 'Sprint demo', deadline: '2024-03-16 14:00:00', created: '2024-03-02T11:20:00' },
    { task: 'Release', deadline: '2024-03-20T23:59:59', created: '2024-03-05T16:45:00' },
    { task: 'Retro', deadline: '2024-03-22', created: '2024-03-06T09:00:00' },
    { task: 'Planning', deadline: '2024-03-25T10:15:00', created: '2024-03-08T13:30:00' },
];
new Handsontable(container, {
    data,
    colHeaders: ['Task', 'Deadline', 'Created'],
    columns: [
        {
            type: 'text',
            data: 'task',
        },
        {
            type: 'intl-datetime',
            data: 'deadline',
            locale: 'en-US',
            dateTimeFormat: {
                dateStyle: 'medium',
                timeStyle: 'short',
            },
        },
        {
            type: 'intl-datetime',
            data: 'created',
            locale: 'en-US',
            dateTimeFormat: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            },
        },
    ],
    columnSorting: true,
    filters: true,
    dropdownMenu: true,
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
