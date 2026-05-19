import React, { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
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

const columns: Handsontable.ColumnSettings[] = [
  { data: 0, type: 'text', width: 90 },
  { data: 1, type: 'text', width: 200 },
  { data: 2, type: 'numeric', width: 100 },
  { data: 3, type: 'numeric', width: 95 },
  { data: 4, type: 'text', width: 70 },
];

const ExampleComponent: React.FC = () => {
  const hotTableRef = useRef<HotTable>(null);

  const getPlugin = () => hotTableRef.current?.hotInstance?.getPlugin('notification');

  const onSave = () => {
    getPlugin()?.showMessage({
      title: 'Saved',
      message: 'Inventory updates were written.',
      variant: 'success',
      position: 'top-end',
      duration: 2500,
    });
  };

  const onSyncError = () => {
    const plugin = getPlugin();

    plugin?.showMessage({
      title: 'Sync failed',
      message: 'The service is unavailable. Retry when your connection is stable.',
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
  };

  const onLowStock = () => {
    getPlugin()?.showMessage({
      title: 'Review quantities',
      message:
        'SKUs below reorder: USB-C cable 1m, Wireless mouse, HDMI cable 2m. Out of stock: Notebook A5 ruled, Laptop stand.',
      variant: 'warning',
      position: 'top-start',
      duration: 6000,
    });
  };

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" className="button button--primary" onClick={onSave}>Save</button>
          <button type="button" className="button button--primary" onClick={onSyncError}>Sync error</button>
          <button type="button" className="button button--primary" onClick={onLowStock}>Low stock</button>
        </div>
      </div>
      <HotTable
        ref={hotTableRef}
        data={data}
        columns={columns}
        colHeaders={['SKU', 'Product', 'Qty on hand', 'Reorder at', 'Bin']}
        rowHeaders
        width="100%"
        height={280}
        licenseKey="non-commercial-and-evaluation"
        notification
      />
    </div>
  );
};

export default ExampleComponent;
