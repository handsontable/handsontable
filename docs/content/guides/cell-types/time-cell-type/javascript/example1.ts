import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;
const localeSelect = document.querySelector('#localeSelect')!;
const data = [
  { shift: 'Morning', start: '09:00', breakStart: '12:00', end: '17:00' },
  { shift: 'Afternoon', start: '13:30', breakStart: '16:00', end: '21:00' },
  { shift: 'Night', start: '22:00', breakStart: '01:00', end: '06:00' },
  { shift: 'Split', start: '08:00', breakStart: '12:30', end: '20:00' },
  { shift: 'Short day', start: '10:00', breakStart: '13:00', end: '15:00' },
];

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Shift', 'Start', 'Break start', 'End'],
  columns: [
    {
      type: 'text',
      data: 'shift',
    },
    {
      type: 'intl-time',
      data: 'start',
      timeFormat: {
        timeStyle: 'short',
      },
    },
    {
      type: 'intl-time',
      data: 'breakStart',
      timeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    },
    {
      type: 'intl-time',
      data: 'end',
      timeFormat: {
        hour: 'numeric',
        hourCycle: 'h12',
        dayPeriod: 'short',
      },
    },
  ],
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  autoWrapRow: true,
  autoWrapCol: true,
});

localeSelect.addEventListener('change', (event) => {
  hot.updateSettings({
    locale: (event.target as HTMLSelectElement).value,
  });
});
