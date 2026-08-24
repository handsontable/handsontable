import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const skuValidator = (value: string, callback: (isValid: boolean) => void) => {
  callback(/^\d{6}$/.test(value));
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { sku: '004821', supplier: 'Harbor Goods', quantity: 142 },
        { sku: '000093', supplier: 'Alpine Supply Co.', quantity: 0 },
        { sku: '017640', supplier: 'Harbor Goods', quantity: 67 },
        { sku: '002210', supplier: 'Crestline Wholesale', quantity: 310 },
        { sku: '008875', supplier: 'Alpine Supply Co.', quantity: 24 },
      ]}
      colHeaders={['SKU', 'Supplier', 'Quantity']}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        { data: 'sku', type: 'text', validator: skuValidator, allowInvalid: false },
        { data: 'supplier', type: 'text' },
        { data: 'quantity', type: 'numeric' },
      ]}
    />
  );
};

export default ExampleComponent;
