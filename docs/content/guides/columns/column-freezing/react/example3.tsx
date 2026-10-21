import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// units sold per SKU and month, with the yearly total in the last column
const data: (string | number)[][] = Array.from({ length: 100 }, (_, row) => {
  const units = months.map((_, month) => 120 + ((row * 37 + month * 53) % 380));

  return [`SKU-${4000 + row}`, ...units, units.reduce((sum, value) => sum + value, 0)];
});

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['SKU', ...months, 'Total']}
      colWidths={100}
      width="100%"
      height={320}
      rowHeaders={true}
      fixedColumnsStart={1}
      fixedColumnsEnd={1}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
