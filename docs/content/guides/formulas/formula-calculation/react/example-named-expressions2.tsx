import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// Named expressions Q1_TOTAL and Q2_TOTAL reference absolute column ranges.
// The sheet name 'Sheet1' matches the default sheetName for this instance.
const data = [
  ['Widget A', 200, 250],
  ['Widget B', 150, 300],
  ['Widget C', 400, 350],
  ['Totals', '=Q1_TOTAL', '=Q2_TOTAL'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Product', 'Q1 Sales', 'Q2 Sales']}
      rowHeaders={true}
      height="auto"
      formulas={{
        engine: HyperFormula,
        namedExpressions: [
          {
            name: 'Q1_TOTAL',
            expression: '=SUM(Sheet1!$B$1:Sheet1!$B$3)',
          },
          {
            name: 'Q2_TOTAL',
            expression: '=SUM(Sheet1!$C$1:Sheet1!$C$3)',
          },
        ],
      }}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
