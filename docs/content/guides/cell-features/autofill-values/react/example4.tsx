import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  [12, 4.5, '=A1*B1', '=C1*(1+$E$1)', 0.2],
  [8, 12.25, null, null, null],
  [20, 3.8, null, null, null],
  [5, 29.99, null, null, null],
  [15, 7.2, null, null, null],
];

// create an external HyperFormula instance
const hyperformulaInstance = HyperFormula.buildEmpty({
  // this demo uses the GPLv3 key,
  // use your own HyperFormula license key in your app
  licenseKey: 'gpl-v3',
});

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Quantity', 'Unit price', 'Total', 'Total with tax', 'Tax rate (E1 only)']}
      rowHeaders={true}
      stretchH="all"
      fillHandle={true}
      formulas={{
        engine: hyperformulaInstance,
        sheetName: 'Sheet1',
      }}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
