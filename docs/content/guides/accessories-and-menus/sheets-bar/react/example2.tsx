import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';

// register Handsontable's modules
registerAllModules();

// One engine, shared by every sheet of the workbook.
const engine = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

const ratesData = [
  ['VAT rate', 0.23],
  ['Service fee', 0.05],
];

const ExampleComponent = () => {
  return (
    <HotTable
      sheetsBar={{
        sheets: [
          {
            name: 'Budget',
            data: [
              ['Laptops', 4200, '=B1*Rates!B1', '=B1*Rates!B2', '=B1+C1+D1'],
              ['Desks', 1200, '=B2*Rates!B1', '=B2*Rates!B2', '=B2+C2+D2'],
              ['Monitors', 2600, '=B3*Rates!B1', '=B3*Rates!B2', '=B3+C3+D3'],
              ['Chairs', 950, '=B4*Rates!B1', '=B4*Rates!B2', '=B4+C4+D4'],
              ['Docking stations', 780, '=B5*Rates!B1', '=B5*Rates!B2', '=B5+C5+D5'],
              ['Total', '=SUM(B1:B5)', '=SUM(C1:C5)', '=SUM(D1:D5)', '=SUM(E1:E5)'],
            ],
            settings: {
              colHeaders: ['Item • A', 'Net • B', 'VAT • C', 'Fee • D', 'Gross • E'],
              formulas: { engine, sheetName: 'Budget' },
            },
          },
          {
            name: 'Rates',
            data: ratesData,
            settings: {
              colHeaders: ['Rate • A', 'Value • B'],
              formulas: { engine, sheetName: 'Rates' },
            },
          },
        ],
        activeSheet: 0,
      }}
      rowHeaders={true}
      colHeaders={true}
      stretchH="all"
      height={240}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
