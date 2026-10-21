import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', 'Be', 4, 9.012, 11],
  ['Boron', 'B', 5, 10.81, 15],
];

const ExampleComponent = () => {
  return (
    <section dir="rtl">
      <HotTable
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        data={data}
        colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass', 'Known isotopes']}
        rowHeaders={true}
        height="auto"
        layoutDirection="inherit"
      />
    </section>
  );
};

export default ExampleComponent;
