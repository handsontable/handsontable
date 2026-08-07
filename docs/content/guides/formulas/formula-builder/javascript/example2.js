import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import * as formulaBuilder from '@hfe/core';
// Register all Handsontable's modules.
registerAllModules();
const data = [
    ['Spring Sale 2025', 18200, 640, '=C1/B1'],
    ['Brand Awareness Q3', 45100, 1490, '=C2/B2'],
    ['Product Launch', 9800, 410, '=C3/B3'],
    ['Newsletter Reactivation', 12600, 505, '=C4/B4'],
    ['All campaigns', '=SUM(B1:B4)', '=SUM(C1:C4)', '=C5/B5'],
];
const container = document.querySelector('#example2');
new Handsontable(container, {
    data,
    colHeaders: ['Campaign', 'Impressions', 'Conversions', 'Rate'],
    rowHeaders: true,
    height: 296,
    editor: 'formula',
    formulas: {
        engine: HyperFormula,
    },
    formulaBuilder: {
        builder: formulaBuilder,
        showFormulaBar: true,
        popups: {
            showClose: true,
            suggestions: {
                showKeyboardHelp: false,
                showNamedExpressions: false,
            },
        },
    },
    autoWrapRow: true,
    autoWrapCol: true,
    licenseKey: 'non-commercial-and-evaluation',
});
