import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
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

const data = [
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
];

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [progress, setProgress] = useState(`0 of ${data.length} done, 0 failed`);

  const getPlugin = () => hotRef.current.hotInstance.getPlugin('asyncValues');

  // Show how many cells are done and how many failed.
  const updateProgress = () => {
    const hot = hotRef.current.hotInstance;
    const done = hot.getSourceDataAtCol(2).filter((category) => category !== null).length;

    setProgress(`${done} of ${hot.countRows()} done, ${getPlugin().countErrors()} failed`);
  };

  const classify = () => {
    const hot = hotRef.current.hotInstance;

    getPlugin().setAsyncValuesInBatches(
      'all',
      'category',
      (cells, signal) =>
        classifyProducts(
          cells.map((cell) => hot.getSourceDataAtCell(cell.physicalRow, 'product')),
          signal,
        ),
      { batchSize: 4, dependsOn: ['product'], source: 'AI.classify', meta: { aiGenerated: true } },
    );
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button className="button button--primary" onClick={classify}>
            Classify
          </button>
          <button className="button button--primary" onClick={() => getPlugin().retryErrors()}>
            Retry failed
          </button>
          <button className="button button--primary" onClick={() => getPlugin().cancelAll()}>
            Stop
          </button>
          <output aria-live="polite">{progress}</output>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        columns={[
          { data: 'sku', title: 'SKU' },
          { data: 'product', title: 'Product' },
          { data: 'category', title: 'Category', readOnly: true },
        ]}
        colWidths={[110, 230, 130]}
        rowId="id"
        asyncValues={{ concurrency: 2 }}
        rowHeaders={true}
        height="auto"
        afterAsyncValueStart={updateProgress}
        afterAsyncValueResolve={updateProgress}
        afterAsyncValueReject={updateProgress}
        afterAsyncValueCancel={updateProgress}
        afterAsyncValuesIdle={updateProgress}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
