import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const categories = [
  ['bottle', 'Drinkware'],
  ['water', 'Drinkware'],
  ['mouse', 'Electronics'],
  ['usb', 'Electronics'],
  ['speaker', 'Electronics'],
  ['chair', 'Furniture'],
  ['desk', 'Furniture'],
  ['stand', 'Furniture'],
  ['bag', 'Apparel'],
];

// A stand-in for a model call: it classifies a batch after a delay, and stops when the signal is aborted.
function classifyProducts(products, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        resolve(
          products.map((product) => {
            if (product === 'Ceramic Mug Set') {
              return new Error('The model could not classify this product');
            }

            return categories.find(([keyword]) => product.toLowerCase().includes(keyword))?.[1] ?? 'Other';
          }),
        );
      },
      500 + Math.random() * 700,
    );

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

const container = document.querySelector('#example2');
const output = document.querySelector('#progress');
const hot = new Handsontable(container, {
  data: [
    { id: 1, sku: 'SKU-4821', product: 'Stainless Steel Water Bottle', category: null },
    { id: 2, sku: 'SKU-0093', product: 'Wireless Mouse', category: null },
    { id: 3, sku: 'SKU-1170', product: 'Ergonomic Office Chair', category: null },
    { id: 4, sku: 'SKU-2208', product: 'USB-C Charging Cable', category: null },
    { id: 5, sku: 'SKU-3341', product: 'Aluminum Water Filter', category: null },
    { id: 6, sku: 'SKU-4412', product: 'Canvas Tote Bag', category: null },
    { id: 7, sku: 'SKU-5088', product: 'USB-C Hub', category: null },
    { id: 8, sku: 'SKU-6120', product: 'Ceramic Mug Set', category: null },
    { id: 9, sku: 'SKU-7294', product: 'Desk Lamp', category: null },
    { id: 10, sku: 'SKU-8015', product: 'Laptop Stand', category: null },
    { id: 11, sku: 'SKU-9166', product: 'Bluetooth Speaker', category: null },
    { id: 12, sku: 'SKU-1042', product: 'Standing Desk', category: null },
  ],
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'product', title: 'Product' },
    { data: 'category', title: 'Category', readOnly: true },
  ],
  colWidths: [110, 230, 130],
  rowId: 'id',
  asyncValues: { concurrency: 2 },
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
const plugin = hot.getPlugin('asyncValues');

// Show how many cells are done and how many failed.
const updateProgress = () => {
  const done = hot.getSourceDataAtCol(2).filter((category) => category !== null).length;

  output.textContent = `${done} of ${hot.countRows()} done, ${plugin.countErrors()} failed`;
};

hot.addHook('afterAsyncValueStart', updateProgress);
hot.addHook('afterAsyncValueResolve', updateProgress);
hot.addHook('afterAsyncValueReject', updateProgress);
hot.addHook('afterAsyncValueCancel', updateProgress);
hot.addHook('afterAsyncValuesIdle', updateProgress);

document.querySelector('#classify').addEventListener('click', () => {
  plugin.setAsyncValuesInBatches(
    'all',
    'category',
    (cells, signal) =>
      classifyProducts(
        cells.map((cell) => hot.getSourceDataAtCell(cell.physicalRow, 'product')),
        signal,
      ),
    { batchSize: 4, dependsOn: ['product'], source: 'AI.classify', meta: { aiGenerated: true } },
  );
});
document.querySelector('#retry').addEventListener('click', () => plugin.retryErrors());
document.querySelector('#stop').addEventListener('click', () => plugin.cancelAll());
updateProgress();
