import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';

// Register all Handsontable's modules.
registerAllModules();

// Named expressions that reference cell ranges must be registered after the sheet
// exists. Pre-build the engine, add the sheet, then add the named expressions.
const hfInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

hfInstance.addSheet('Sheet1');
hfInstance.addNamedExpression('Q1_TOTAL', '=SUM(Sheet1!$B$1:$B$3)');
hfInstance.addNamedExpression('Q2_TOTAL', '=SUM(Sheet1!$C$1:$C$3)');

const data = [
  ['Widget A', 200, 250],
  ['Widget B', 150, 300],
  ['Widget C', 400, 350],
  ['Totals', '=Q1_TOTAL', '=Q2_TOTAL'],
];

const container = document.querySelector('#example-named-expressions2');

new Handsontable(container, {
  data,
  colHeaders: ['Product', 'Q1 Sales', 'Q2 Sales'],
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: hfInstance,
    sheetName: 'Sheet1',
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
