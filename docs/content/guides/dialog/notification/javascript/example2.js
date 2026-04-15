import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  ['SKU-001', 'Alkaline AA 4pk', 240, 40, 'A-12'],
  ['SKU-002', 'USB-C cable 1m', 18, 24, 'B-03'],
  ['SKU-003', 'Notebook A5 ruled', 0, 30, 'C-01'],
  ['SKU-004', 'Wireless mouse', 6, 15, 'B-07'],
  ['SKU-005', 'HDMI cable 2m', 2, 10, 'A-04'],
  ['SKU-006', 'Desk lamp LED', 45, 12, 'D-02'],
  ['SKU-007', 'Laptop stand aluminum', 0, 8, 'C-14'],
  ['SKU-008', 'Mechanical keycap set', 112, 20, 'B-01'],
];

const root = document.getElementById('example2');
const toolbar = document.createElement('div');

toolbar.style.cssText =
  'display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;';
root.appendChild(toolbar);

const container = document.createElement('div');

root.appendChild(container);

const hot = new Handsontable(container, {
  data,
  colHeaders: ['SKU', 'Product', 'Qty on hand', 'Reorder at', 'Bin'],
  columns: [
    { data: 0, type: 'text', width: 90 },
    { data: 1, type: 'text', width: 200 },
    { data: 2, type: 'numeric', width: 100 },
    { data: 3, type: 'numeric', width: 95 },
    { data: 4, type: 'text', width: 70 },
  ],
  rowHeaders: true,
  width: '100%',
  height: 280,
  notification: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const plugin = hot.getPlugin('notification');

function addToolButton(text, handler) {
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.textContent = text;
  btn.addEventListener('click', handler);
  toolbar.appendChild(btn);
}

addToolButton('Save', () => {
  plugin.showMessage({
    title: 'Saved',
    message: 'Inventory updates were written.',
    variant: 'success',
    position: 'top-end',
    duration: 2500,
  });
});
addToolButton('Sync error', () => {
  plugin.showMessage({
    title: 'Sync failed',
    message:
      'The service is unavailable. Retry when your connection is stable.',
    variant: 'error',
    position: 'bottom-end',
    duration: 0,
    actions: [
      {
        label: 'Retry',
        type: 'primary',
        callback: () => {
          plugin.hideAll();
          plugin.showMessage({
            message: 'Sync completed.',
            variant: 'success',
            position: 'bottom-end',
          });
        },
      },
      { label: 'Dismiss', type: 'secondary', callback: () => plugin.hideAll() },
    ],
  });
});
addToolButton('Low stock', () => {
  plugin.showMessage({
    title: 'Review quantities',
    message:
      'SKUs below reorder: USB-C cable 1m, Wireless mouse, HDMI cable 2m. Out of stock: Notebook A5 ruled, Laptop stand.',
    variant: 'warning',
    position: 'top-start',
    duration: 6000,
  });
});
