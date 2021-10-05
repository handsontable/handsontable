import Handsontable from 'handsontable';

const formulas = Handsontable.plugins.Formulas;

formulas.engine!.addSheet();
formulas.sheetName!.toLowerCase();
formulas.sheetId!.toFixed();

formulas.addSheet('sheet2', [[]]);
formulas.getCellType(0, 0, 1);
formulas.switchSheet('sheet2');
