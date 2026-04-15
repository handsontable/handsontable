import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  UndoRedo,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);

/**
 * Fires Delete/Up on the instance document, matching the grid shortcut path (checkbox renderer runs before `emptySelectedCells`).
 *
 * @param {Handsontable} hotInstance Handsontable instance.
 */
function pressGridDeleteKey(hotInstance) {
  hotInstance.listen();
  const { documentElement } = hotInstance.rootDocument;

  documentElement.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Delete',
    code: 'Delete',
    keyCode: 46,
    which: 46,
    bubbles: true,
    cancelable: true,
  }));
  documentElement.dispatchEvent(new KeyboardEvent('keyup', {
    key: 'Delete',
    code: 'Delete',
    keyCode: 46,
    which: 46,
    bubbles: true,
    cancelable: true,
  }));
  hotInstance._getEditorManager().prepareEditor();
}

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
    const base = Array.from({ length: 5 }, (rowValue, row) => (
      Array.from({ length: 4 }, (columnValue, column) => `${String.fromCharCode(65 + column)}${row + 1}`)
    ));
    const data = base.map((row, rowIndex) => [...row, rowIndex % 2 === 0]);

    hot = new Handsontable(container, {
      data,
      columns: [{}, {}, {}, {}, { type: 'checkbox' }],
      undo: true,
    });

    const originalData = hot.getData().map(row => [...row]);

    hot.selectCells([[0, 0, 4, 4], [1, 1, 2, 2]]);
    pressGridDeleteKey(hot);

    expect(hot.getPlugin('undoRedo').doneActions.length).toBe(1);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getData()).toEqual(originalData);
  });

  it('should batch layered ctrl/cmd+A-like delete into one setDataAtCell (checkbox shortcut path)', () => {
    hot = new Handsontable(container, {
      data: [
        ['Nissan', 2016, false],
        ['Volvo', 2019, true],
        ['Chrysler', 2020, false],
      ],
      columns: [
        { type: 'text' },
        { type: 'numeric' },
        { type: 'checkbox' },
      ],
      colHeaders: true,
      undo: true,
    });

    hot.selectCell(0, 0);
    hot.selectAll();
    hot.selectCells([[0, 0, 2, 2], [1, 1, 1, 1]]);

    const setDataSpy = jest.spyOn(hot, 'setDataAtCell');

    pressGridDeleteKey(hot);

    expect(setDataSpy).toHaveBeenCalledTimes(1);

    const [bulkChanges] = setDataSpy.mock.calls[0];

    expect(Array.isArray(bulkChanges)).toBe(true);

    const innerYearChange = bulkChanges.find(([row, column]) => row === 1 && column === 1);

    expect(innerYearChange).toBeDefined();
    expect(innerYearChange[2]).toBeNull();
    setDataSpy.mockRestore();
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
    expect(action.changes.length).toBe(9);
  });
});
