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
        ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', '190'],
        ['SKU-5088', 'USB-C Hub', 'Harbor Goods', '54'],
        ['SKU-6120', 'Ceramic Mug Set', 'Alpine Supply Co.', '88'],
      ]}
      colHeaders={true}
      rowHeaders={true}
      trimRows={[1, 2, 5]}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
