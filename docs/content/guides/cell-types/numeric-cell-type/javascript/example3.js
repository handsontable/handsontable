import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3');

new Handsontable(container, {
  data: [
    {
      productName: 'Product A',
      JP_price: 1450.32,
      TR_price: 202.14,
    },
    {
      productName: 'Product B',
      JP_price: 2430.22,
      TR_price: 338.86,
    },
    {
      productName: 'Product C',
      JP_price: 3120.1,
      TR_price: 435.2,
    },
  ],
  columns: [
    {
      data: 'productName',
      type: 'text',
      width: '150',
    },
    {
      data: 'JP_price',
      type: 'numeric',
      width: '150',
      locale: 'ja-JP',
      numericFormat: {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
    {
      data: 'TR_price',
      type: 'numeric',
      width: '150',
      locale: 'tr-TR',
      numericFormat: {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
  ],
  autoRowSize: false,
  autoColumnSize: false,
  columnSorting: true,
  colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
