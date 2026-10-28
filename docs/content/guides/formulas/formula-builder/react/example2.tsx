import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import * as formulaBuilder from 'hyperformula-ui';

// register Handsontable's modules
registerAllModules();

// Declared outside the component: the wrapper compares `data` by identity, so a new array on
// every render would replace the grid's data, the user's edits included.
const data: (string | number)[][] = [
  ['Spring Sale 2025', 18200, 640, '=C1/B1'],
  ['Brand Awareness Q3', 45100, 1490, '=C2/B2'],
  ['Product Launch', 9800, 410, '=C3/B3'],
  ['Newsletter Reactivation', 12600, 505, '=C4/B4'],
  ['All campaigns', '=SUM(B1:B4)', '=SUM(C1:C4)', '=C5/B5'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      colHeaders={['Campaign', 'Impressions', 'Conversions', 'Rate']}
      rowHeaders={true}
      height={296}
      columns={[
        { editor: 'formula' },
        { editor: 'formula' },
        { editor: 'formula' },
        { editor: 'formula' },
      ]}
      formulas={{
        engine: HyperFormula,
      }}
      formulaBuilder={{
        builder: formulaBuilder,
        showFormulaBar: true,
        popups: {
          showClose: true,
          suggestions: {
            showKeyboardHelp: false,
            showNamedExpressions: false,
          },
        },
      }}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
