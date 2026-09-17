import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data: [
    ['Update API docs', 'Ana García', 'https://tracker.example.com/tasks/4821', 'mailto:ana.garcia@example.com', 'Draft at https://wiki.example.com/api-docs, review by Friday.'],
    ['Deploy hotfix', 'James Okafor', 'https://tracker.example.com/tasks/4830', 'mailto:james.okafor@example.com', 'Rollback plan: https://wiki.example.com/rollback'],
    ['Migrate CI runners', 'Li Wei', 'https://tracker.example.com/tasks/4835', 'tel:+48123456789', 'Blocked on vendor call.'],
    ['Renew TLS certificates', 'Priya Nair', 'https://tracker.example.com/tasks/4841', 'mailto:priya.nair@example.com', 'See https://wiki.example.com/tls for the checklist.'],
    ['Audit access logs', 'Tomás Rivera', 'https://tracker.example.com/tasks/4846', 'tel:+48987654321', 'Report due 2025-06-30.'],
  ],
  colHeaders: ['Task', 'Owner', 'Tracker', 'Contact', 'Notes'],
  colWidths: [180, 120, 260, 220, 320],
  height: 'auto',
  autoLink: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
