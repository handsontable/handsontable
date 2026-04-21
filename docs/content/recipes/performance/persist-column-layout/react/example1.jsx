import { useCallback, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const STORAGE_KEY = 'ht-column-layout-v1';

/* start:skip-in-preview */
const data = [
  { sku: 'SKU-001', name: 'Wireless Keyboard', category: 'Electronics', price: 49.99, stock: 142, status: 'Active' },
  { sku: 'SKU-002', name: 'USB-C Hub', category: 'Electronics', price: 34.99, stock: 87, status: 'Active' },
  { sku: 'SKU-003', name: 'Ergonomic Chair', category: 'Furniture', price: 399.00, stock: 23, status: 'Active' },
  { sku: 'SKU-004', name: 'Monitor Stand', category: 'Furniture', price: 79.99, stock: 55, status: 'Active' },
  { sku: 'SKU-005', name: 'Noise-Cancelling Headphones', category: 'Electronics', price: 199.99, stock: 0, status: 'Out of Stock' },
  { sku: 'SKU-006', name: 'Mechanical Keyboard', category: 'Electronics', price: 129.99, stock: 34, status: 'Active' },
  { sku: 'SKU-007', name: 'Standing Desk', category: 'Furniture', price: 549.00, stock: 12, status: 'Active' },
  { sku: 'SKU-008', name: 'Webcam HD', category: 'Electronics', price: 89.99, stock: 61, status: 'Active' },
  { sku: 'SKU-009', name: 'Cable Organizer', category: 'Accessories', price: 14.99, stock: 203, status: 'Active' },
  { sku: 'SKU-010', name: 'Laptop Stand', category: 'Accessories', price: 29.99, stock: 0, status: 'Discontinued' },
  { sku: 'SKU-011', name: 'Blue Light Glasses', category: 'Accessories', price: 24.99, stock: 98, status: 'Active' },
  { sku: 'SKU-012', name: 'Desk Lamp', category: 'Furniture', price: 44.99, stock: 77, status: 'Active' },
];
/* end:skip-in-preview */

const DEFAULT_COL_WIDTHS = [90, 200, 120, 90, 70, 110];
const DEFAULT_COL_ORDER = [0, 1, 2, 3, 4, 5];

const COLUMNS = [
  { data: 'sku', type: 'text' },
  { data: 'name', type: 'text' },
  { data: 'category', type: 'text' },
  { data: 'price', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
  { data: 'stock', type: 'numeric' },
  { data: 'status', type: 'text' },
];

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.widths) || !Array.isArray(parsed.order)) return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveLayout(widths, order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widths, order }));
}

const saved = loadLayout();
const initialWidths = saved ? saved.widths : DEFAULT_COL_WIDTHS;
const initialOrder = saved ? saved.order : null;

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const getCurrentOrder = useCallback(() => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) return DEFAULT_COL_ORDER;
    const count = hot.countCols();
    const order = [];

    for (let i = 0; i < count; i++) {
      order.push(hot.toPhysicalColumn(i));
    }

    return order;
  }, []);

  const getCurrentWidths = useCallback(() => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) return DEFAULT_COL_WIDTHS;
    const count = hot.countCols();
    const widths = [];

    for (let i = 0; i < count; i++) {
      widths.push(hot.getColWidth(i));
    }

    return widths;
  }, []);

  const handleAfterColumnResize = useCallback(() => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) return;
    const widths = hot.getColHeader().map((_, visualIndex) => hot.getColWidth(visualIndex));

    saveLayout(widths, getCurrentOrder());
  }, [getCurrentOrder]);

  const handleAfterColumnMove = useCallback(
    (_movedColumns, _finalIndex, _dropIndex, _movePossible, movePerformed) => {
      if (!movePerformed) return;
      saveLayout(getCurrentWidths(), getCurrentOrder());
    },
    [getCurrentWidths, getCurrentOrder]
  );

  const handleReset = useCallback(() => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) return;
    localStorage.removeItem(STORAGE_KEY);
    hot.columnIndexMapper.setIndexesSequence(DEFAULT_COL_ORDER);
    const resizePlugin = hot.getPlugin('manualColumnResize');

    DEFAULT_COL_WIDTHS.forEach((width, visualIndex) => {
      resizePlugin.setManualSize(visualIndex, width);
    });
    hot.render();
  }, []);

  return (
    <div>
      <div className="example-controls-container">
        <div className="controls">
          <button type="button" onClick={handleReset}>Reset layout</button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={['SKU', 'Name', 'Category', 'Price ($)', 'Stock', 'Status']}
        columns={COLUMNS}
        colWidths={initialWidths}
        manualColumnResize={true}
        manualColumnMove={initialOrder || true}
        rowHeaders={true}
        height={320}
        width="100%"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
        afterColumnResize={handleAfterColumnResize}
        afterColumnMove={handleAfterColumnMove}
      />
    </div>
  );
};

export default ExampleComponent;
