import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  manualRowMove: true,
});

new Handsontable(document.createElement('div'), {
  manualRowMove: [1, 4],
});

const manualRowMove = new Handsontable.plugins.ManualRowMove(hot);

manualRowMove.isMovePossible([0], 3);

manualRowMove.moveRow(0, 5);
manualRowMove.moveRows([0, 1], 5);

manualRowMove.dragRow(0, 5);
manualRowMove.dragRows([0, 1], 5);
