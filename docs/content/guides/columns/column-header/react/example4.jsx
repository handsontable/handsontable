import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['Hydrogen', 'H', 1],
        ['Helium', 'He', 2],
        ['Lithium', 'Li', 3],
        ['Beryllium', 'Be', 4],
        ['Boron', 'B', 5],
      ]}
      colHeaders={['Name', 'Symbol', 'Atomic Number']}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      stretchH="all"
      headerClassName="htCenter"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn headerClassName="htRight" />
      <HotColumn headerClassName="htLeft" />
      <HotColumn type="numeric" numericFormat={{ pattern: '0' }} />
    </HotTable>
  );
};

export default ExampleComponent;
