import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

// Register all Handsontable's modules.
registerAllModules();

const data: (string | number)[][] = [
  ['Acme Corp', 1250, 1480, 1310, '=SUM(B1:D1)', '=E1/$E$7'],
  ['Vertex Industries', 890, 940, 1020, '=SUM(B2:D2)', '=E2/$E$7'],
  ['Harbor Goods', 640, 580, 710, '=SUM(B3:D3)', '=E3/$E$7'],
  ['Alpine Supply Co.', 1120, 1060, 990, '=SUM(B4:D4)', '=E4/$E$7'],
  ['Nimbus Software', 1540, 1620, 1735, '=SUM(B5:D5)', '=E5/$E$7'],
  ['Quill Media', 430, 510, 480, '=SUM(B6:D6)', '=E6/$E$7'],
  ['All companies', '=SUM(B1:B6)', '=SUM(C1:C6)', '=SUM(D1:D6)', '=SUM(E1:E6)', '=SUM(F1:F6)'],
];

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data,
  colHeaders: ['Company', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Total', 'Share'],
  rowHeaders: true,
  height: 342,
  editor: 'formula',
  formulas: {
    engine: HyperFormula,
  },
  formulaBuilder: {
    builder: formulaBuilder,
    showFormulaBar: true,
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
