import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  { id: 1, product: 'Keyboard', stock: 14, price: 89, status: 'active' },
  { id: 2, product: 'Monitor', stock: 5, price: 249, status: 'active' },
  { id: 3, product: 'Dock', stock: 22, price: 139, status: 'draft' },
  { id: 4, product: 'Webcam', stock: 9, price: 119, status: 'active' },
  { id: 5, product: 'Headset', stock: 16, price: 99, status: 'paused' },
];

const statusLabels = {
  idle: 'No pending changes',
  saving: 'Saving...',
  saved: 'Saved ✓',
  error: 'Error',
};

const saveRowsToBackend = (rows) => {
  return new Promise((resolve) => setTimeout(resolve, 450)).then(() => {
    // Replace this with fetch('/api/products', { method: 'PATCH', body: ... }) in production.
    // eslint-disable-next-line no-console
    console.log('PATCH /api/products', rows);
  });
};

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const dirtyRowsRef = useRef(new Set());
  const saveTimeoutRef = useRef(null);
  const saveRequestCounterRef = useRef(0);

  const handleAfterChange = (changes, source) => {
    if (!changes || source === 'loadData') {
      return;
    }

    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    changes.forEach(([visualRow, _prop, oldValue, newValue]) => {
      if (oldValue !== newValue) {
        const physicalRow = hot.toPhysicalRow(visualRow);

        if (physicalRow !== null && physicalRow >= 0) {
          dirtyRowsRef.current.add(physicalRow);
        }
      }
    });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const physicalRows = Array.from(dirtyRowsRef.current);

      if (physicalRows.length === 0) {
        return;
      }

      const requestId = ++saveRequestCounterRef.current;
      const visualRows = physicalRows
        .map((physicalRow) => hot.toVisualRow(physicalRow))
        .filter((row) => row !== null);

      hot.validateRows(visualRows, (valid) => {
        if (!valid) {
          if (requestId === saveRequestCounterRef.current) {
            setSaveStatus('error');
          }

          return;
        }

        const rowsToSave = physicalRows
          .map((physicalRow) => hot.getSourceDataAtRow(physicalRow))
          .filter((row) => row !== undefined && row !== null);

        dirtyRowsRef.current.clear();
        setSaveStatus('saving');

        void saveRowsToBackend(rowsToSave)
          .then(() => {
            if (requestId === saveRequestCounterRef.current) {
              setSaveStatus('saved');
            }
          })
          .catch(() => {
            physicalRows.forEach((physicalRow) => dirtyRowsRef.current.add(physicalRow));

            if (requestId === saveRequestCounterRef.current) {
              setSaveStatus('error');
            }
          });
      });
    }, 800);
  };

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <span className="auto-save-backend-status" data-state={saveStatus}>
            {statusLabels[saveStatus]}
          </span>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['ID', 'Product', 'Stock', 'Price', 'Status']}
        columns={[
          { data: 'id', type: 'numeric', readOnly: true, width: 70 },
          { data: 'product', type: 'text', width: 180 },
          { data: 'stock', type: 'numeric', width: 90 },
          { data: 'price', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }, width: 110 },
          { data: 'status', type: 'text', width: 120 },
        ]}
        stretchH="all"
        height="auto"
        afterChange={handleAfterChange}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
