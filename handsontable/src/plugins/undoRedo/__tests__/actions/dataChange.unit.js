import Handsontable from 'handsontable/base';
import {
  registerPlugin,
  TrimRows,
  UndoRedo,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(TrimRows);
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
      licenseKey: 'non-commercial-and-evaluation',
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
      licenseKey: 'non-commercial-and-evaluation',
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
      licenseKey: 'non-commercial-and-evaluation',
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

  describe('rows trimmed since the change was recorded (DEV-2665)', () => {
    /**
     * Builds a five-row, one-column grid with `trimRows` and undo on.
     *
     * @returns {Handsontable} The instance.
     */
    function buildTrimmableGrid() {
      return new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        trimRows: true,
        undo: true,
      });
    }

    it('should restore the record the edit was made on, not the row now at that visual index', () => {
      hot = buildTrimmableGrid();

      hot.setDataAtCell(1, 0, 'changed');
      hot.getPlugin('trimRows').trimRows([1]);

      expect(hot.countRows()).toBe(4);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getSourceDataAtCell(1, 0)).toBe('A2');
      // The record that took over visual row 1 when the edited one was trimmed away must not have
      // been written to - that is where a visually addressed undo lands.
      expect(hot.getSourceDataAtCell(2, 0)).toBe('A3');
      // And no row was invented to hold the restored value.
      expect(hot.countSourceRows()).toBe(5);
    });

    it('should restore and settle when every changed row is trimmed away', () => {
      hot = buildTrimmableGrid();

      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'changed');
      hot.getPlugin('trimRows').trimRows([0, 1, 2, 3, 4]);

      expect(hot.countRows()).toBe(0);

      undoRedo.undo();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('A1');
      expect(hot.countSourceRows()).toBe(5);
      // With no visible row to write through there is no `afterChange` to settle on, so the action
      // has to settle itself - otherwise it is neither redoable nor out of the way.
      expect(undoRedo.isRedoAvailable()).toBe(true);
      expect(undoRedo.ignoreNewActions).toBe(false);

      undoRedo.redo();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('changed');
    });

    it('should leave no settle hook armed when every changed row is trimmed away', () => {
      hot = buildTrimmableGrid();

      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'changed');
      hot.getPlugin('trimRows').trimRows([0, 1, 2, 3, 4]);
      undoRedo.undo();
      hot.getPlugin('trimRows').untrimAll();

      hot.setDataAtCell(3, 0, 'later');

      // An `afterChange` listener still armed from the undo settles that action on this edit
      // instead, and `ignoreNewActions` is still on while the edit is recorded - so the edit is
      // dropped from the stack.
      expect(undoRedo.doneActions.length).toBe(1);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'later', 'A5']);
    });

    it('should not delete rows off the end when rows were untrimmed after the change', () => {
      hot = buildTrimmableGrid();

      hot.getPlugin('trimRows').trimRows([2, 3, 4]);
      hot.setDataAtCell(1, 0, 'changed');
      hot.getPlugin('trimRows').untrimAll();

      hot.getPlugin('undoRedo').undo();

      // The row count grew because the trim was lifted, not because this change added rows. Reading
      // it as rows to remove takes three rows of the user's data with it.
      expect(hot.countSourceRows()).toBe(5);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should still remove the rows that a write past the last row created', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
      });

      hot.setDataAtCell([[3, 0, 'x'], [4, 0, 'y']]);

      expect(hot.countSourceRows()).toBe(5);

      hot.getPlugin('undoRedo').undo();

      expect(hot.countSourceRows()).toBe(3);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);
    });
  });
});
