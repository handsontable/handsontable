import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data = [
    ['Hydrogen', 'H', 1, 1.008, 7],
    ['Helium', 'He', 2, 4.003, 9],
    ['Lithium', 'Li', 3, 6.94, 9],
    ['Beryllium', '', '', '', ''],
    ['Boron', '', '', '', ''],
  ];

  return (
    <HotTable
      data={data}
      rowHeaders={true}
      colHeaders={['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes']}
      colWidths={[80, 62, 110, 118, 110]}
      stretchH="all"
      fillHandle={true} // possible values: true, false, "horizontal", "vertical",
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
