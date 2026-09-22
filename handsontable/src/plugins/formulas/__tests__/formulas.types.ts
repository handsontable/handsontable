import Hyperformula from 'hyperformula';
import Handsontable from 'handsontable';
import type { FormulasCellAddress, FormulasCellRange } from 'handsontable/plugins/formulas';

new Handsontable(document.createElement('div'), {
  formulas: {
    engine: Hyperformula,
  },
});
new Handsontable(document.createElement('div'), {
  formulas: {
    engine: Hyperformula.buildEmpty(),
  },
});
new Handsontable(document.createElement('div'), {
  formulas: {
    engine: Hyperformula,
    sheetName: 'sheet1',
    namedExpressions: [
      {
        name: 'ADDITIONAL_COST',
        expression: 100,
      },
    ],
  },
});
new Handsontable(document.createElement('div'), {
  formulas: {
    engine: Hyperformula,
    sheetName: 'sheet1',
    namedExpressions: [
      {
        name: 'ADDITIONAL_COST',
        expression: 100,
        scope: 0,
        options: {
          volatile: true,
        },
      },
    ],
  },
});
new Handsontable(document.createElement('div'), {
  formulas: {
    engine: Hyperformula,
    hyperlinks: true,
  },
});
new Handsontable(document.createElement('div'), {
  formulas: {
    engine: Hyperformula,
    hyperlinks: {
      target: '_self',
      schemes: ['http', 'https'],
    },
  },
});
const hot = new Handsontable(document.createElement('div'), {});
const formulas = hot.getPlugin('formulas');

formulas.engine!.addSheet();
formulas.sheetName!.toLowerCase();
formulas.sheetId!.toFixed();

formulas.addSheet('sheet2', [[]]);
formulas.getCellType(0, 0, 1);
formulas.switchSheet('sheet2');

const hfAddress: FormulasCellAddress = { sheet: 0, row: 0, col: 0 };
const hfRange: FormulasCellRange = { start: hfAddress, end: hfAddress };
const dependents: (FormulasCellAddress | FormulasCellRange)[] = formulas.getCellDependents(hfAddress);
const precedents: (FormulasCellAddress | FormulasCellRange)[] = formulas.getCellPrecedents(hfRange);

dependents.length.toFixed();
precedents.length.toFixed();

// Deprecated no-op shims, kept for backward compatibility - must still compile.
formulas.registerShortcuts();
formulas.unregisterShortcuts();

// DEV-207
formulas.showFormulas();
formulas.hideFormulas();
const isShowingFormulas: boolean = formulas.isShowingFormulas();

isShowingFormulas.valueOf();
