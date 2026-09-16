import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
        ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
        ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
        ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', '215'],
        ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', '38'],
      ]}
      width="100%"
      height="auto"
      colWidths={80}
      colHeaders={true}
      rowHeaders={true}
      stretchH="last"
      contextMenu={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
