import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example')!;

new Handsontable(container, {
  sheetsBar: {
    sheets: [
      {
        name: 'Budget',
        data: [
          ['Marketing', 4200, 5100],
          ['Engineering', 18700, 19200],
          ['Operations', 3100, 2900],
        ],
        settings: {
          colHeaders: ['Category • A', 'Q1 2026 • B', 'Q2 2026 • C'],
        },
      },
      {
        name: 'Notes',
        data: [
          ['Reviewed by Ana García on 2026-03-14'],
          ['Pending sign-off from Finance'],
        ],
        settings: {
          colHeaders: ['Note • A'],
        },
      },
    ],
    activeSheet: 0,
  },
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 240,
  licenseKey: 'non-commercial-and-evaluation',
});
