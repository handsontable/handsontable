import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods'],
  ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.'],
  ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      data={data}
      colHeaders={true}
      rowHeaders={true}
      manualColumnMove={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
    />
  );
};

export default ExampleComponent;
