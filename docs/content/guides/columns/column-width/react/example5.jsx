import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['H', 'Hydrogen', 'Nonmetal'],
        ['He', 'Helium', 'Noble gas'],
        ['Li', 'Lithium', 'Alkali metal'],
        ['Be', 'Beryllium', 'Alkaline earth metal'],
        ['B', 'Boron', 'Metalloid'],
      ]}
      width="100%"
      height="auto"
      colHeaders={['Symbol', 'Name', 'Category']}
      rowHeaders={true}
      stretchH="all"
      contextMenu={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
