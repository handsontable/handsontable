import Hyperformula from 'hyperformula';
import Handsontable from 'handsontable';

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
const hot = new Handsontable(document.createElement('div'), {});
const formulas = hot.getPlugin('formulas');

formulas.engine!.addSheet();
formulas.sheetName!.toLowerCase();
formulas.sheetId!.toFixed();

formulas.addSheet('sheet2', [[]]);
formulas.getCellType(0, 0, 1);
formulas.switchSheet('sheet2');
