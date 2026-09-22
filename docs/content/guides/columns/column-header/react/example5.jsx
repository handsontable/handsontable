import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['Hydrogen', 'H', 1, 1.008],
        ['Helium', 'He', 2, 4.003],
        ['Lithium', 'Li', 3, 6.94],
        ['Beryllium', 'Be', 4, 9.012],
        ['Boron', 'B', 5, 10.81],
      ]}
      colHeaders={['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)']}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      stretchH="all"
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn headerClassName="italic-text" />
      <HotColumn headerClassName="bold-text italic-text" />
      <HotColumn
        headerClassName="htRight bold-text italic-text"
        type="numeric"
        numericFormat={{ maximumFractionDigits: 0, useGrouping: false }}
      />
      <HotColumn
        type="numeric"
        numericFormat={{ minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false }}
      />
    </HotTable>
  );
};

export default ExampleComponent;
