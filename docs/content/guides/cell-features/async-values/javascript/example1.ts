import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const products: Record<string, string> = {
  'A-100': 'Desk lamp',
  'B-200': 'Office chair',
  'C-300': 'Standing desk',
  'D-400': 'Monitor arm',
};

// A stand-in for a server request: it answers after a delay, and stops when the signal is aborted.
function lookUpProduct(sku: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (products[sku]) {
        resolve(products[sku]);
      } else {
        reject(new Error(`Unknown SKU: ${sku}`));
      }
    }, 600 + Math.random() * 1400);

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

const container = document.querySelector<HTMLElement>('#example1')!;
const hot = new Handsontable(container, {
  data: [
    { sku: 'A-100', product: '' },
    { sku: 'B-200', product: '' },
    { sku: 'X-999', product: '' },
    { sku: 'C-300', product: '' },
    { sku: 'D-400', product: '' },
  ],
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'product', title: 'Product', readOnly: true },
  ],
  colWidths: [120, 220],
  rowHeaders: true,
  height: 'auto',
  asyncValues: true,
  // Look the product up again when its SKU changes.
  afterAsyncValueCancel(physicalRow, prop, reason) {
    if (reason === 'dependency') {
      lookUpRow(hot.toVisualRow(physicalRow));
    }
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function lookUpRow(row: number | null) {
  if (row === null) {
    return;
  }

  hot.getPlugin('asyncValues').setAsyncValue(row, 1, ({ physicalRow, signal }) => (
    lookUpProduct(hot.getSourceDataAtCell(physicalRow, 'sku') as string, signal)
  ), { dependsOn: ['sku'] });
}

document.querySelector<HTMLButtonElement>('#lookup')!.addEventListener('click', () => {
  for (let row = 0; row < hot.countRows(); row++) {
    lookUpRow(row);
  }
});
