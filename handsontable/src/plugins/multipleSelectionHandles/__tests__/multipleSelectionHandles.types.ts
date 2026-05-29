import Handsontable, {
  CellCoords,
} from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {});
const plugin = hot.getPlugin('multipleSelectionHandles');

const coords = plugin.getCurrentRangeCoords(
  hot.getSelectedRangeLast()!,
  hot._createCellCoords(0, 0),
  'NE-SW',
  'SE-NW',
  'top',
);
const isDragged: boolean = plugin.isDragged();
