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

  it('should not register header coordinates when clearing a ctrl/cmd+A-like selection', async() => {
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

    // The numeric column has a validator, and validation always runs in a microtask: the step is
    // recorded once the change it describes has been applied.
    await new Promise(resolve => setTimeout(resolve, 0));

    const action = hot.getPlugin('undoRedo').doneActions[0];
    const hasHeaderCoordinates = action.changes.some(([row, column]) => row < 0 || column < 0);

    expect(hasHeaderCoordinates).toBe(false);
    expect(action.changes.length).toBe(9);
  });

  describe('rows trimmed since the change was recorded (DEV-2665)', () => {
    /**
     * Trims exactly the given physical rows through the `trimRows` setting. A settings update is not
     * a recorded step, so the undo that follows reverts the data change rather than the trim - which
     * is the case these specs are about. (A `trimRows()` call is a step of its own.)
     *
     * @param {Handsontable} hotInstance The instance.
     * @param {number[]} rows The physical rows to trim.
     */
    function setTrimmedRows(hotInstance, rows) {
      hotInstance.updateSettings({ trimRows: rows });
    }

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
      setTrimmedRows(hot, [1]);

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
      setTrimmedRows(hot, [0, 1, 2, 3, 4]);

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
      setTrimmedRows(hot, [0, 1, 2, 3, 4]);
      undoRedo.undo();
      setTrimmedRows(hot, []);

      hot.setDataAtCell(3, 0, 'later');

      // An `afterChange` listener still armed from the undo settles that action on this edit
      // instead, and `ignoreNewActions` is still on while the edit is recorded - so the edit is
      // dropped from the stack.
      expect(undoRedo.doneActions.length).toBe(1);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'later', 'A5']);
    });

    it('should not delete rows off the end when rows were untrimmed after the change', () => {
      hot = buildTrimmableGrid();

      setTrimmedRows(hot, [2, 3, 4]);
      hot.setDataAtCell(1, 0, 'changed');
      setTrimmedRows(hot, []);

      hot.getPlugin('undoRedo').undo();

      // The row count grew because the trim was lifted, not because this change added rows. Reading
      // it as rows to remove takes three rows of the user's data with it.
      expect(hot.countSourceRows()).toBe(5);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should keep the rows a lifted trim revealed when it removes the created ones', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        trimRows: true,
        undo: true,
      });

      setTrimmedRows(hot, [0, 1]);

      // Three rows are visible, so this lands past the last one and appends a sixth source row.
      hot.setDataAtCell(3, 0, 'x');

      expect(hot.countSourceRows()).toBe(6);

      setTrimmedRows(hot, []);

      hot.getPlugin('undoRedo').undo();

      // The visible row count went 3 -> 6 because the trim was lifted, so a guard measured in
      // visible rows wants three rows removed and takes A4 and A5 with the created one.
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should remove the row the change created even when it is trimmed, and leave the others alone', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        trimRows: true,
        undo: true,
      });

      hot.setDataAtCell(3, 0, 'x');

      expect(hot.countSourceRows()).toBe(4);

      setTrimmedRows(hot, [3]);

      hot.getPlugin('undoRedo').undo();

      // The created row has no visual index, but the undo addresses it physically, so it is the row
      // removed - never "the last visible row" A3, which this change did not touch.
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);
    });

    it('should not blank a pre-existing record the stale visual index slid onto', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        trimRows: true,
        undo: true,
      });

      setTrimmedRows(hot, [0, 1, 2, 3]);

      // One row is visible, so this lands past it and appends a sixth source row. The row did not
      // exist when the change was recorded, so it carries no physical index - only visual row 1.
      hot.setDataAtCell(1, 0, 'x');

      expect(hot.countSourceRows()).toBe(6);

      // Lifting the trim pushes four rows back into the visual space, so visual row 1 now names
      // A2 - a record that existed all along.
      setTrimmedRows(hot, []);

      expect(hot.toPhysicalRow(1)).toBe(1);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getSourceDataAtCell(1, 0)).toBe('A2');
    });

    it('should remove the created row by its physical index when every row is trimmed', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        trimRows: true,
        undo: true,
      });

      hot.setDataAtCell(3, 0, 'x');
      setTrimmedRows(hot, [0, 1, 2, 3]);

      expect(hot.countRows()).toBe(0);

      const beforeRemoveRow = jest.fn();

      hot.addHook('beforeRemoveRow', beforeRemoveRow);

      hot.getPlugin('undoRedo').undo();

      // The replay runs in physical order, so the removal names the created row itself - never an
      // empty index list or a `NaN` index, which is what a visual address resolved to here.
      expect(beforeRemoveRow).toHaveBeenCalledTimes(1);
      expect(beforeRemoveRow.mock.calls[0].slice(0, 3)).toEqual([3, 1, [3]]);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);
    });

    it('should remove the created rows measured in source rows, not visible ones', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        minSpareRows: 1,
        trimRows: true,
        undo: true,
      });

      // The grid carries one spare row, so this fills it and `minSpareRows` tops it up again.
      hot.setDataAtCell(3, 0, 'typed');

      expect(hot.countSourceRows()).toBe(5);

      // What a filter excluding empty values does to the two trailing rows. The trim is a step of its
      // own (a trim through the settings would make `minSpareRows` grow the data outside any step,
      // which drops the history), so the first undo lifts it and the second reverts the change.
      hot.getPlugin('trimRows').trimRows([3, 4]);

      hot.getPlugin('undoRedo').undo();
      hot.getPlugin('undoRedo').undo();

      expect(hot.getSourceDataAtCell(2, 0)).toBe('A3');
      expect(hot.getSourceDataAtCell(3, 0)).toBe(null);
      expect(hot.countSourceRows()).toBe(4);
    });

  });

  // Nothing is trimmed here, so this passes with or without the physical-row addressing. It guards
  // the plain case of the row removal the undo performs, which the DEV-2665 cases above rewrote.
  it('should remove the rows that a write past the last row created', () => {
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
