import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['H', 1, 'Hydrogen', 'Nonmetal', 1.008, -434.4, -423.2, 0.00009, 2.20, 25],
        ['He', 2, 'Helium', 'Noble gas', 4.003, -458.0, -452.0, 0.00018, undefined, undefined],
        ['Li', 3, 'Lithium', 'Alkali metal', 6.94, 356.9, 2447.6, 0.534, 0.98, 145],
        ['Be', 4, 'Beryllium', 'Alkaline earth', 9.012, 2348.6, 4478, 1.85, 1.57, 105],
        ['B', 5, 'Boron', 'Metalloid', 10.81, 3768.8, 7100.6, 2.34, 2.04, 85],
      ]}
      width="100%"
      height="auto"
      colHeaders={[
        'Symbol',
        'Atomic Number',
        'Name',
        'Group',
        'Atomic Mass',
        'Melting Point (°F)',
        'Boiling Point (°F)',
        'Density (g/cm³)',
        'Electronegativity',
        'Atomic Radius (pm)',
      ]}
      rowHeaders={true}
      colWidths={[30, 40, 50, 60, 90, 90, 90, 90, 90, 90]}
      manualColumnResize={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
