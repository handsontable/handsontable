import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
registerAllModules();

const data = [
  { id: 1, product: 'Keyboard', stock: 14, price: 89, status: 'active' },
  { id: 2, product: 'Monitor', stock: 5, price: 249, status: 'active' },
  { id: 3, product: 'Dock', stock: 22, price: 139, status: 'draft' },
  { id: 4, product: 'Webcam', stock: 9, price: 119, status: 'active' },
  { id: 5, product: 'Headset', stock: 16, price: 99, status: 'paused' },
];
const rootContainer = document.querySelector('#example1');
if (rootContainer instanceof HTMLElement) {
  const toolbar = document.createElement('div');
  const controls = document.createElement('div');
  const statusEl = document.createElement('span');
  const gridContainer = document.createElement('div');
  toolbar.className = 'example-controls-container';
  controls.className = 'controls';
  statusEl.className = 'auto-save-backend-status';
  toolbar.appendChild(controls);
  controls.appendChild(statusEl);
  rootContainer.appendChild(toolbar);
  rootContainer.appendChild(gridContainer);
  const dirtyRows = new Set();
  let saveTimeout = null;
  let saveRequestCounter = 0;
  const setSaveStatus = (state) => {
    const labels = {
      idle: 'No pending changes',
      saving: 'Saving...',
      saved: 'Saved ✓',
      error: 'Error',
    };
    statusEl.textContent = labels[state];
    statusEl.dataset.state = state;
  };
  const saveRowsToBackend = (rows) => {
    return new Promise((resolve) => setTimeout(resolve, 450)).then(() => {
      // Replace this with fetch('/api/products', { method: 'PATCH', body: ... }) in production.
      // eslint-disable-next-line no-console
      console.log('PATCH /api/products', rows);
    });
  };
  const hot = new Handsontable(gridContainer, {
    data,
    colHeaders: ['ID', 'Product', 'Stock', 'Price', 'Status'],
    columns: [
      { data: 'id', type: 'numeric', readOnly: true, width: 70 },
      { data: 'product', type: 'text', width: 180 },
      { data: 'stock', type: 'numeric', width: 90 },
      { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 110 },
      { data: 'status', type: 'text', width: 120 },
    ],
    stretchH: 'all',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    afterChange(changes, source) {
      if (!changes || source === 'loadData') {
        return;
      }
      changes.forEach(([visualRow, _prop, oldValue, newValue]) => {
        if (oldValue !== newValue) {
          const physicalRow = hot.toPhysicalRow(visualRow);
          if (physicalRow !== null && physicalRow >= 0) {
            dirtyRows.add(physicalRow);
          }
        }
      });
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(() => {
        const physicalRows = Array.from(dirtyRows);
        if (physicalRows.length === 0) {
          return;
        }
        const requestId = ++saveRequestCounter;
        const visualRows = physicalRows
          .map((physicalRow) => hot.toVisualRow(physicalRow))
          .filter((row) => row !== null);
        hot.validateRows(visualRows, (valid) => {
          if (!valid) {
            if (requestId === saveRequestCounter) {
              setSaveStatus('error');
            }
            return;
          }
          const rowsToSave = physicalRows
            .map((physicalRow) => hot.getSourceDataAtRow(physicalRow))
            .filter((row) => row !== undefined && row !== null);
          dirtyRows.clear();
          setSaveStatus('saving');
          void saveRowsToBackend(rowsToSave)
            .then(() => {
              if (requestId === saveRequestCounter) {
                setSaveStatus('saved');
              }
            })
            .catch(() => {
              physicalRows.forEach((physicalRow) => dirtyRows.add(physicalRow));
              if (requestId === saveRequestCounter) {
                setSaveStatus('error');
              }
            });
        });
      }, 800);
    },
  });
  // Demonstrate that loadData updates do not trigger save requests.
  hot.loadData(data.map((row) => ({ ...row })));
  setSaveStatus('idle');
}
