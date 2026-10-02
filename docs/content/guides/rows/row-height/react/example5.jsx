import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const notes = [
  [
    'SKU-4821',
    'Stainless Steel Water Bottle',
    'Ships in recyclable packaging. Harbor Goods needs ten days to restock this item, so order early.',
  ],
  [
    'SKU-0093',
    'Wireless Mouse',
    'Available in black and silver. The silver version is on backorder until the end of the month.',
  ],
  [
    'SKU-1170',
    'Ergonomic Office Chair',
    'Assembly required. Cascade Distributors includes a hex key and a printed guide in the box.',
  ],
  ['SKU-2208', 'USB-C Charging Cable', 'In stock.'],
];

// show the same note in three columns, to compare how each one is truncated
const data = notes.map(([sku, product, note]) => [sku, product, note, note, note]);

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['SKU', 'Product', 'Note', 'Note (one line)', 'Note (two lines)']}
      colWidths={[100, 190, 170, 170, 170]}
      columns={[
        {},
        {},
        // no truncation (default): the row grows to fit the whole note
        {},
        // keep the note on one line and end it with an ellipsis
        { textEllipsis: true },
        // show two lines of the note and end the second one with an ellipsis
        { textEllipsis: 2 },
      ]}
      width="100%"
      height="auto"
      rowHeaders={true}
      autoRowSize={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
