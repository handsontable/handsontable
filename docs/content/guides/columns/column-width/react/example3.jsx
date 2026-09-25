import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['H', 1, -434.4, 0.00009, 'Nonmetal'],
        ['He', 2, -458.0, 0.00018, 'Noble gas'],
        ['Li', 3, 356.9, 0.534, 'Alkali metal'],
        ['Be', 4, 2348.6, 1.85, 'Alkaline earth metal'],
        ['B', 5, 3768.8, 2.34, 'Metalloid'],
      ]}
      width="100%"
      height="auto"
      colHeaders={['Symbol', 'Atomic Number', 'Melting Point (°F)', 'Density (g/cm³)', 'Category']}
      rowHeaders={true}
      colWidths={(index) => {
        return (index + 1) * 40;
      }}
      manualColumnResize={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
