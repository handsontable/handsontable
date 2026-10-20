import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const products = {
  'A-100': 'Desk lamp',
  'B-200': 'Office chair',
  'C-300': 'Standing desk',
  'D-400': 'Monitor arm',
};

// A stand-in for a server request: it answers after a delay, and stops when the signal is aborted.
function lookUpProduct(sku, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        if (products[sku]) {
          resolve(products[sku]);
        } else {
          reject(new Error(`Unknown SKU: ${sku}`));
        }
      },
      600 + Math.random() * 1400,
    );

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

const data = [
  { sku: 'A-100', product: '' },
  { sku: 'B-200', product: '' },
  { sku: 'X-999', product: '' },
  { sku: 'C-300', product: '' },
  { sku: 'D-400', product: '' },
];

const ExampleComponent = () => {
  const hotRef = useRef(null);

  const lookUpRows = (fromRow, toRow) => {
    const hot = hotRef.current?.hotInstance;

    hot
      ?.getPlugin('asyncValues')
      .setAsyncValues(
        fromRow,
        1,
        toRow,
        1,
        ({ physicalRow, signal }) => lookUpProduct(hot.getSourceDataAtCell(physicalRow, 'sku'), signal),
        { dependsOn: ['sku'] },
      );
  };

  const lookUpAll = () => {
    lookUpRows(0, (hotRef.current?.hotInstance?.countRows() ?? 0) - 1);
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button className="button button--primary" onClick={lookUpAll}>
            Look up products
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={data}
        columns={[
          { data: 'sku', title: 'SKU' },
          { data: 'product', title: 'Product', readOnly: true },
        ]}
        colWidths={[120, 220]}
        rowHeaders={true}
        height="auto"
        asyncValues={true}
        // Look the product up again when its SKU changes.
        afterChange={(changes) => {
          changes?.forEach(([row, prop]) => {
            if (prop === 'sku') {
              lookUpRows(row, row);
            }
          });
        }}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
