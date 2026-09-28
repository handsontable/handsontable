import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example2')!;

new Handsontable(container, {
  data: [
    ['Update API docs', 'https://tracker.example.com/tasks/4821', 'mailto:ana.garcia@example.com', 'Draft at https://wiki.example.com/api-docs'],
    ['Deploy hotfix', 'https://tracker.example.com/tasks/4830', 'mailto:james.okafor@example.com', 'Rollback plan: https://wiki.example.com/rollback'],
    ['Migrate CI runners', 'https://tracker.example.com/tasks/4835', 'tel:+48123456789', 'Blocked on vendor call.'],
    ['Renew TLS certificates', 'https://tracker.example.com/tasks/4841', 'mailto:priya.nair@example.com', 'See https://wiki.example.com/tls'],
    ['Audit access logs', 'https://tracker.example.com/tasks/4846', 'tel:+48987654321', 'Report due 2025-06-30.'],
  ],
  colHeaders: ['Task', 'Tracker', 'Contact', 'Notes'],
  colWidths: [180, 260, 220, 320],
  height: 'auto',
  // Open links in the same tab, link web URLs only, and add a class to every link.
  autoLink: {
    target: '_self',
    schemes: ['http', 'https'],
    className: 'tracker-link',
  },
  columns: [
    {},
    // Link only a cell whose whole value is a URL.
    { autoLink: { inline: false } },
    // Keep the contact column as plain text.
    { autoLink: false },
    {},
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
