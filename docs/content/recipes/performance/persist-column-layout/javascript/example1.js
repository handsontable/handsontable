import Handsontable from 'handsontable/base';
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

// Default column widths and order used when no saved layout exists.
const DEFAULT_COL_WIDTHS = [90, 200, 120, 90, 70, 110];
const DEFAULT_COL_ORDER = [0, 1, 2, 3, 4, 5];

/**
 * Reads the saved layout from localStorage.
 * Returns null when the key is absent, unparseable, or from an older schema.
 */
function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Guard against stale data that lacks expected keys.
    if (!Array.isArray(parsed.widths) || !Array.isArray(parsed.order)) return null;

    return parsed;
  } catch {
    return null;
  }
}

/** Persists column widths and order to localStorage. */
function saveLayout(widths, order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widths, order }));
}

const saved = loadLayout();
const initialWidths = saved ? saved.widths : DEFAULT_COL_WIDTHS;
const initialOrder = saved ? saved.order : null;

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data,
  colHeaders: ['SKU', 'Name', 'Category', 'Price ($)', 'Stock', 'Status'],
  columns: [
    { data: 'sku', type: 'text' },
    { data: 'name', type: 'text' },
    { data: 'category', type: 'text' },
    { data: 'price', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    { data: 'stock', type: 'numeric' },
    { data: 'status', type: 'text' },
  ],
  colWidths: initialWidths,
  manualColumnResize: true,
  manualColumnMove: initialOrder || true,
  rowHeaders: true,
  height: 320,
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',

  // Capture the new width array after every column resize and persist it.
  afterColumnResize() {
    const widths = hot.getColHeader().map((_, visualIndex) =>
      hot.getColWidth(visualIndex)
    );

    saveLayout(widths, getCurrentOrder());
  },

  // Capture the new column order after every column move and persist it.
  afterColumnMove(_movedColumns, _finalIndex, _dropIndex, _movePossible, movePerformed) {
    if (!movePerformed) return;
    saveLayout(getCurrentWidths(), getCurrentOrder());
  },
});

/** Returns the current visual-to-physical column order as an array of physical indices. */
function getCurrentOrder() {
  const count = hot.countCols();
  const order = [];

  for (let visualIndex = 0; visualIndex < count; visualIndex++) {
    order.push(hot.toPhysicalColumn(visualIndex));
  }

  return order;
}

/** Returns the current column widths in visual order. */
function getCurrentWidths() {
  const count = hot.countCols();
  const widths = [];

  for (let visualIndex = 0; visualIndex < count; visualIndex++) {
    widths.push(hot.getColWidth(visualIndex));
  }

  return widths;
}

// Reset button: clear localStorage and restore the default layout.
document.querySelector('#reset-layout-btn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);

  // Reset column order to the identity sequence [0, 1, 2, 3, 4, 5].
  hot.columnIndexMapper.setIndexesSequence(DEFAULT_COL_ORDER);

  // Reset each column width through the ManualColumnResize plugin API.
  const resizePlugin = hot.getPlugin('manualColumnResize');

  DEFAULT_COL_WIDTHS.forEach((width, visualIndex) => {
    resizePlugin.setManualSize(visualIndex, width);
  });

  hot.render();
});
