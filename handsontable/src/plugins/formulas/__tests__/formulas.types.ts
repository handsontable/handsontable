import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const formulas = hot.getPlugin('formulas');

formulas.engine!.addSheet();
formulas.sheetName!.toLowerCase();
formulas.sheetId!.toFixed();

formulas.addSheet('sheet2', [[]]);
formulas.getCellType(0, 0, 1);
formulas.switchSheet('sheet2');
