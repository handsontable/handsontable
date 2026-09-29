import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, -434.4, 'Gas'],
  ['Helium', 'He', 2, -458.0, 'Gas'],
  ['Lithium', 'Li', 3, 356.9, 'Solid'],
  ['Beryllium', 'Be', 4, 2348.6, 'Solid'],
  ['Boron', 'B', 5, 3768.8, 'Solid'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      width="100%"
      height="auto"
      colHeaders={['Name', 'Symbol', 'Atomic Number', 'Melting Point (°F)', 'State']}
      rowHeaders={true}
      colWidths={[200, 100, 100, 150, 100]}
      manualColumnResize={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
