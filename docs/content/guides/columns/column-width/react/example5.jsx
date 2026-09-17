import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods'],
        ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.'],
        ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors'],
        ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading'],
        ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale'],
      ]}
      width="100%"
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      stretchH="all"
      contextMenu={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
