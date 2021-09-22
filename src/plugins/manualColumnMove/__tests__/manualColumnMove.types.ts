import Handsontable from 'handsontable';

const manualColumnMove = Handsontable.plugins.ManualColumnMove;

manualColumnMove.isMovePossible([0], 3);

manualColumnMove.moveColumn(0, 5);
manualColumnMove.moveColumns([0, 1], 5);

manualColumnMove.dragColumn(0, 5);
manualColumnMove.dragColumns([0, 1], 5);
