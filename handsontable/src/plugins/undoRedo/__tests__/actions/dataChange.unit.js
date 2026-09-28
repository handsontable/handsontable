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

    it('should keep the rows a lifted trim revealed when it removes the created ones', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        trimRows: true,
        undo: true,
      });

      hot.getPlugin('trimRows').trimRows([0, 1]);

      // Three rows are visible, so this lands past the last one and appends a sixth source row.
      hot.setDataAtCell(3, 0, 'x');

      expect(hot.countSourceRows()).toBe(6);

      hot.getPlugin('trimRows').untrimAll();

      hot.getPlugin('undoRedo').undo();

      // The visible row count went 3 -> 6 because the trim was lifted, so a guard measured in
      // visible rows wants three rows removed and takes A4 and A5 with the created one.
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should not remove a populated row in place of a created row that is trimmed', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        trimRows: true,
        undo: true,
      });

      hot.setDataAtCell(3, 0, 'x');

      expect(hot.countSourceRows()).toBe(4);

      hot.getPlugin('trimRows').trimRows([3]);

      hot.getPlugin('undoRedo').undo();

      // The created row has no visual index left, so it cannot be removed. Removing "the last
      // visible row" instead takes A3, which this change never touched.
      expect(hot.getSourceDataAtCell(2, 0)).toBe('A3');
      expect(hot.countSourceRows()).toBe(4);
    });

    it('should not blank a pre-existing record the stale visual index slid onto', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        trimRows: true,
        undo: true,
      });

      hot.getPlugin('trimRows').trimRows([0, 1, 2, 3]);

      // One row is visible, so this lands past it and appends a sixth source row. The row did not
      // exist when the change was recorded, so it carries no physical index - only visual row 1.
      hot.setDataAtCell(1, 0, 'x');

      expect(hot.countSourceRows()).toBe(6);

      // Lifting the trim pushes four rows back into the visual space, so visual row 1 now names
      // A2 - a record that existed all along.
      hot.getPlugin('trimRows').untrimAll();

      expect(hot.toPhysicalRow(1)).toBe(1);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getSourceDataAtCell(1, 0)).toBe('A2');
    });

    it('should not run a row removal when no created row is reachable', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        trimRows: true,
        undo: true,
      });

      hot.setDataAtCell(3, 0, 'x');
      hot.getPlugin('trimRows').trimRows([0, 1, 2, 3]);

      expect(hot.countRows()).toBe(0);

      const beforeRemoveRow = jest.fn();

      hot.addHook('beforeRemoveRow', beforeRemoveRow);

      hot.getPlugin('undoRedo').undo();

      // With no visible row to address, `alter('remove_row')` resolves an empty index list and a
      // `NaN` row index. Listeners must not be handed that round at all.
      expect(beforeRemoveRow).not.toHaveBeenCalled();
      expect(hot.countSourceRows()).toBe(4);
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

      // What a filter excluding empty values does to the two trailing rows.
      hot.getPlugin('trimRows').trimRows([3, 4]);

      hot.getPlugin('undoRedo').undo();

      expect(hot.getSourceDataAtCell(2, 0)).toBe('A3');
      expect(hot.getSourceDataAtCell(3, 0)).toBe(null);
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

  // `setDataAtCell()` skips a column past the last one of an object data source and fires no
  // `afterChange` for it (#5409). The replay settles on that hook, so a change routed through the
  // grid there would leave `ignoreNewActions` on and every later edit unrecorded.
  describe('columns the grid cannot address (#5409)', () => {
    it('should undo a numeric prop past the last column and keep recording', () => {
      const data = [{ id: 1, name: 'Ted Right' }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        dataSchema: { id: null, name: null },
        undo: true,
      });

      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtRowProp(0, 5, 'x');
      undoRedo.undo();

      expect(data[0][5]).toBeUndefined();

      undoRedo.redo();

      expect(data[0][5]).toBe('x');

      hot.setDataAtCell(0, 1, 'Frank Honest');
      undoRedo.undo();

      // The edit after the replay was recorded, so it is what this undo reverts.
      expect(data[0].name).toBe('Ted Right');
      expect(data[0][5]).toBe('x');
    });

    it('should restore the recorded field after the `columns` option narrowed', () => {
      const data = [{ id: 1, name: 'Ted Right', address: 'Main St' }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        undo: true,
      });

      hot.setDataAtCell(0, 2, 'Oak St');
      hot.updateSettings({ columns: [{ data: 'id' }, { data: 'name' }] });
      hot.getPlugin('undoRedo').undo();

      // `colToPropOrIndex(2)` now answers `2`, so replaying by column would have written a `2` key.
      expect(data[0]).toEqual({ id: 1, name: 'Ted Right', address: 'Main St' });
    });

    it('should undo a write to a declared field that has no column', () => {
      const data = [{ id: 1, name: 'Ted Right', city: null }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        dataSchema: { id: null, name: null, city: null },
        columns: [{ data: 'id' }, { data: 'name' }],
        undo: true,
      });

      hot.setDataAtRowProp(0, 'city', 'Boston');

      // `propToCol('city')` has no column to return, so it records the prop itself, which
      // `setDataAtCell()` rejects by throwing.
      expect(() => hot.getPlugin('undoRedo').undo()).not.toThrow();
      expect(data[0].city).toBeNull();
    });

    it('should remove the rows a write past the last row and column created', () => {
      const data = [{ id: 1, name: 'Ted Right' }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        dataSchema: { id: null, name: null },
        undo: true,
      });

      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtRowProp(2, 5, 'x');

      expect(hot.countSourceRows()).toBe(3);

      undoRedo.undo();

      expect(hot.countSourceRows()).toBe(1);

      hot.setDataAtCell(0, 1, 'Frank Honest');
      undoRedo.undo();

      expect(data[0].name).toBe('Ted Right');
    });

    it('should redo a write past the last row and column, re-creating its rows', () => {
      const data = [{ id: 1, name: 'Ted Right' }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        dataSchema: { id: null, name: null },
        undo: true,
      });

      const undoRedo = hot.getPlugin('undoRedo');

      hot.setDataAtRowProp(2, 5, 'x');
      undoRedo.undo();
      undoRedo.redo();

      // The undo removed the rows, so the redo has no physical row to write the source data at.
      expect(hot.countSourceRows()).toBe(3);
      expect(data[2][5]).toBe('x');

      undoRedo.undo();

      expect(hot.countSourceRows()).toBe(1);
    });

    it('should redo a change set that writes both through the grid and by prop exactly once', () => {
      const data = [{ id: 1, name: 'Ted Right' }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        dataSchema: { id: null, name: null },
        undo: true,
      });

      const undoRedo = hot.getPlugin('undoRedo');
      const afterChange = jest.fn();

      hot.setDataAtRowProp([[0, 'name', 'Frank Honest'], [2, 5, 'x']]);
      undoRedo.undo();
      hot.addHook('afterChange', afterChange);
      undoRedo.redo();

      // The by-prop write runs inside the settle callback, which the grid write's `afterChange`
      // fires. Its own `afterChange` must not run the settle callback a second time.
      expect(afterChange).toHaveBeenCalledTimes(2);
      expect(data[0].name).toBe('Frank Honest');
      expect(data[2][5]).toBe('x');
    });

    it('should restore a trimmed row by its recorded field after the `columns` option narrowed', () => {
      const data = [
        { id: 1, name: 'Ted Right', address: 'Main St' },
        { id: 2, name: 'Frank Honest', address: 'Elm St' },
      ];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        trimRows: true,
        undo: true,
      });

      hot.setDataAtCell(1, 2, 'Oak St');
      hot.updateSettings({ columns: [{ data: 'id' }, { data: 'name' }] });
      hot.getPlugin('trimRows').trimRows([1]);
      hot.getPlugin('undoRedo').undo();

      // A trimmed row is written to the source data. `colToPropOrIndex(2)` answers `2` there too.
      expect(data[1]).toEqual({ id: 2, name: 'Frank Honest', address: 'Elm St' });
    });
  });
});
