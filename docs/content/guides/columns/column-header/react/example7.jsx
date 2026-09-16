import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
        ['Helium', 'He', 2, 4.003, 9, -458.3, -452.1],
        ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
        ['Beryllium', 'Be', 4, 9.012, 11, 2348.6, 4478.8],
        ['Boron', 'B', 5, 10.81, 11, 3768.8, 7100.6],
      ]}
      colHeaders={['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes', 'Melting Point (°F)', 'Boiling Point (°F)']}
      columns={[
        {},
        {},
        { type: 'numeric', numericFormat: { pattern: '0' } },
        { type: 'numeric', numericFormat: { pattern: '0.0' } },
        { type: 'numeric', numericFormat: { pattern: '0' } },
        { type: 'numeric', numericFormat: { pattern: '0.0' } },
        { type: 'numeric', numericFormat: { pattern: '0.0' } },
      ]}
      rowHeaders={true}
      // Wide enough that no label gets cut off by the header's ellipsis truncation.
      colWidths={[90, 90, 120, 130, 120, 155, 155]}
      columnHeaderHeight={50}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
