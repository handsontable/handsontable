import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const manualColumnMove = hot.getPlugin('manualColumnMove');

manualColumnMove.isMovePossible([0], 3);

manualColumnMove.moveColumn(0, 5);
manualColumnMove.moveColumns([0, 1], 5);

manualColumnMove.dragColumn(0, 5);
manualColumnMove.dragColumns([0, 1], 5);
