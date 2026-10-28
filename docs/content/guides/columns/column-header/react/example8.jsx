import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
  ['Helium', 'He', 2, 4.003, 9, -458.0, -452.1],
  ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
  ['Beryllium', 'Be', 4, 9.012, 11, 2348.6, 4478.8],
  ['Boron', 'B', 5, 10.81, 15, 3768.8, 7100.6],
];

// Descriptions keyed by header label, so each one stays with its column when users move columns.
const descriptions = {
  'Atomic Number': 'Number of protons in the nucleus',
  'Atomic Mass (u)': 'Average mass of an atom, in unified atomic mass units (u)',
  'Melting Point (°F)': 'Temperature at which the element melts, in degrees Fahrenheit',
  'Boiling Point (°F)': 'Temperature at which the element boils, in degrees Fahrenheit',
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={[
        'Name',
        'Symbol',
        'Atomic Number',
        'Atomic Mass (u)',
        'Known Isotopes',
        'Melting Point (°F)',
        'Boiling Point (°F)',
      ]}
      columns={[
        {},
        {},
        { type: 'numeric' },
        { type: 'numeric', numericFormat: { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: false } },
        { type: 'numeric' },
        { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
        { type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
      ]}
      // Handsontable reuses header cells, so set or remove the `title` attribute on every call.
      afterGetColHeader={(column, TH) => {
        const label = TH.querySelector('.colHeader')?.textContent ?? '';
        const description = descriptions[label];

        if (description) {
          TH.title = description;
        } else {
          TH.removeAttribute('title');
        }
      }}
      rowHeaders={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
