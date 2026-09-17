import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['H', 'Nonmetal', 1],
  ['He', 'Noble gas', 2],
  ['Li', 'Alkali metal', 3],
  ['Be', 'Alkaline earth', 4],
  ['B', 'Metalloid', 5],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      width="100%"
      height="auto"
      colHeaders={['Symbol', 'Group', 'Atomic Number']}
      rowHeaders={true}
      columns={[{ width: 90 }, {}, { width: 60 }]}
      modifyColWidth={(width, column) => {
        if (column === 1 && width > 150) {
          return 100;
        }
      }}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
