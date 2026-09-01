import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { sku: '004821', category: '032', quantity: 142, unitPrice: 18.5 },
        { sku: '000093', category: '032', quantity: 0, unitPrice: 42.0 },
        { sku: '017640', category: '015', quantity: 67, unitPrice: 9.99 },
        { sku: '002210', category: '015', quantity: 310, unitPrice: 4.25 },
        { sku: '008875', category: '048', quantity: 24, unitPrice: 129.0 },
      ]}
      colHeaders={['SKU', 'Category code', 'Quantity', 'Unit price ($)']}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        { data: 'sku', type: 'text' },
        { data: 'category', type: 'text' },
        { data: 'quantity', type: 'numeric' },
        { data: 'unitPrice', type: 'numeric' },
      ]}
    />
  );
};

export default ExampleComponent;
