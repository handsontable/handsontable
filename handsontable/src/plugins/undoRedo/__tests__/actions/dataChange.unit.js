import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  UndoRedo,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);

describe('UndoRedo -> DataChange action', () => {
  let container;
  let hot;
  let originalScrollIntoView;
  let originalScrollTo;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    originalScrollTo = window.scrollTo;
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.scrollTo = () => {};
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.scrollTo = originalScrollTo;
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

  it('should restore all data after undoing clear of ctrl/cmd+A-like overlap with checkbox cells', () => {
    hot = new Handsontable(container, {
      data: [
        { car: 'Nissan', year: 2016, available: false },
        { car: 'Volvo', year: 2019, available: true },
        { car: 'Chrysler', year: 2020, available: false },
      ],
      columns: [
        { data: 'car', type: 'text' },
        { data: 'year', type: 'numeric' },
        { data: 'available', type: 'checkbox' },
      ],
      colHeaders: true,
      undo: true,
    });

    const originalData = hot.getData().map(row => [...row]);

    hot.selectCell(0, 0);
    hot.selectAll();
    hot.selectCells([[0, 0, 2, 2], [1, 1, 1, 1]]);
    hot.emptySelectedCells();
    hot._getEditorManager().prepareEditor();

    hot.getPlugin('undoRedo').undo();

    expect(hot.getData()).toEqual(originalData);
  });

  it('should not register header coordinates when clearing a ctrl/cmd+A-like selection', () => {
    hot = new Handsontable(container, {
      data: [
        { car: 'Nissan', year: 2016, available: false },
        { car: 'Volvo', year: 2019, available: true },
        { car: 'Chrysler', year: 2020, available: false },
      ],
      columns: [
        { data: 'car', type: 'text' },
        { data: 'year', type: 'numeric' },
        { data: 'available', type: 'checkbox' },
      ],
      colHeaders: true,
      undo: true,
    });

    hot.selectCell(0, 0);
    hot.selection.selectAll(true, true, {
      disableHeadersHighlight: true,
    });
    hot.emptySelectedCells();

    const action = hot.getPlugin('undoRedo').doneActions[0];
    const hasHeaderCoordinates = action.changes.some(([row, column]) => row < 0 || column < 0);

    expect(hasHeaderCoordinates).toBe(false);
  });

  it('should register a single undo action when deleting mixed non-consecutive selection with checkbox cells', () => {
    hot = new Handsontable(container, {
      data: [
        { car: 'Nissan', year: 2016, available: false },
        { car: 'Volvo', year: 2019, available: true },
        { car: 'Chrysler', year: 2020, available: false },
      ],
      columns: [
        { data: 'car', type: 'text' },
        { data: 'year', type: 'numeric' },
        { data: 'available', type: 'checkbox' },
      ],
      colHeaders: true,
      autoWrapRow: true,
      autoWrapCol: true,
      undo: true,
    });

    hot.selectCell(0, 0);
    hot.selectAll();
    hot.selectCells([[0, 0, 2, 2], [1, 1, 1, 1]]);
    hot.listen();

    hot.rootDocument.documentElement.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Delete',
      code: 'Delete',
      bubbles: true,
      cancelable: true,
    }));
    hot.rootDocument.documentElement.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'Delete',
      code: 'Delete',
      bubbles: true,
      cancelable: true,
    }));

    expect(hot.getPlugin('undoRedo').doneActions.length).toBe(1);
  });
});
