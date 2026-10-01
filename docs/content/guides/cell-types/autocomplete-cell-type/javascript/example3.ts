import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
    ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
    ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
    ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
    ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
  ],
  colHeaders: ['Supplier', 'SKU', 'Warehouse', 'Product'],
  columns: [
    {
      type: 'autocomplete',
      source(_query, process) {
        fetch('/docs/scripts/json/autocomplete.json')
          .then((response) => response.json())
          .then((response) => process(response.data));
      },
      strict: true,
    },
    {}, // SKU is a default text column
    {}, // Warehouse is a default text column
    {}, // Product is a default text column
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
