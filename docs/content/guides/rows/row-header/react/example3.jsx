import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        [42000, 31000, 11000],
        [45500, 33200, 12300],
        [48700, 35100, 13600],
        [51200, 36800, 14400],
        [54800, 38900, 15900],
        [57300, 40100, 17200],
      ]}
      colHeaders={['Revenue', 'Expenses', 'Profit']}
      rowHeaders={(index) => {
        return `Row ${index + 1}`;
      }}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
