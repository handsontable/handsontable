import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';

// Register all Handsontable's modules.
registerAllModules();

const data: (string | number)[][] = [
  ['SKU-4821', 142, 96, '=(B1-C1)/C1'],
  ['SKU-0093', 67, 88, '=(B2-C2)/C2'],
  ['SKU-3310', 205, 0, '=(B3-C3)/C3'],
  ['SKU-1275', 58, 41, '=(B4-C4)/C4'],
  ['SKU-9004', 310, 264, '=(B5-C5)/C5'],
];

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  data,
  colHeaders: ['Product', 'Stock 2025', 'Stock 2024', 'Change'],
  rowHeaders: true,
  height: 296,
  columns: [
    { editor: 'formula' },
    { editor: 'formula' },
    { editor: 'formula' },
    { editor: 'formula', readOnly: true },
  ],
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
