import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import * as formulaBuilder from '@hfe/core';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data: (string | number)[][] = [
    ['Spring Sale 2025', 18200, 640, '=C1/B1'],
    ['Brand Awareness Q3', 45100, 1490, '=C2/B2'],
    ['Product Launch', 9800, 410, '=C3/B3'],
    ['Newsletter Reactivation', 12600, 505, '=C4/B4'],
    ['All campaigns', '=SUM(B1:B4)', '=SUM(C1:C4)', '=C5/B5'],
  ];

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
