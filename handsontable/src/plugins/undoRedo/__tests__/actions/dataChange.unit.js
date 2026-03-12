import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  UndoRedo,
} from 'handsontable/plugins';

registerPlugin(UndoRedo);

describe('UndoRedo -> DataChange action', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  it('should restore all data after undoing clear of overlapping non-consecutive ranges', () => {
    const data = Array.from({ length: 5 }, (rowValue, row) => (
      Array.from({ length: 5 }, (columnValue, column) => `${String.fromCharCode(65 + column)}${row + 1}`)
    ));

    hot = new Handsontable(container, {
      data,
      undo: true,
    });

    const originalData = hot.getData().map(row => [...row]);

    hot.selectCells([[0, 0, 4, 4], [1, 1, 2, 2]]);
    hot.emptySelectedCells();

    hot.getPlugin('undoRedo').undo();

    expect(hot.getData()).toEqual(originalData);
  });
});
