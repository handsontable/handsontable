import Handsontable from 'handsontable';

const manualRowMove = Handsontable.plugins.ManualRowMove;

manualRowMove.isMovePossible([0], 3);

manualRowMove.moveRow(0, 5);
manualRowMove.moveRows([0, 1], 5);

manualRowMove.dragRow(0, 5);
manualRowMove.dragRows([0, 1], 5);
