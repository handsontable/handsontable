import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Hydrogen', 'H', 1],
  ['Helium', 'He', 2],
  ['Lithium', 'Li', 3],
  ['Beryllium', 'Be', 4],
  ['Boron', 'B', 5],
];

const ExampleComponent = () => {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      data={data}
      colHeaders={['Name', 'Symbol', 'Atomic Number']}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      stretchH="all"
      headerClassName="htCenter"
    >
      <HotColumn headerClassName="htRight" />
      <HotColumn headerClassName="htLeft" />
      <HotColumn type="numeric" />
    </HotTable>
  );
};

export default ExampleComponent;
