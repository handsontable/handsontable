import Handsontable from 'handsontable/base';
import { HiddenRows, NestedRows, registerPlugin, TrimRows, UndoRedo } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);
registerPlugin(TrimRows);
registerPlugin(HiddenRows);
registerPlugin(NestedRows);

describe('UndoRedo plugin', () => {
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

  /**
   * Registers a custom action whose undo/redo throws, the same way an action's `undo()` throwing
   * mid-flight (e.g. a failing `setSourceDataAtCell`) would.
   *
   * @param {UndoRedo} plugin The plugin instance.
   */
  function registerThrowingAction(plugin) {
    plugin.done(() => ({
      actionType: 'throwing',
      undo() { throw new Error('undo boom'); },
      redo() { throw new Error('redo boom'); },
    }));
  }

  describe('the `maxHistory` limit', () => {
    it('should drop the oldest steps past the limit and keep the rest restorable', () => {
      hot = new Handsontable(container, {
        data: [['A1', 'B1', 'C1', 'D1', 'E1']],
        undo: { maxHistory: 3 },
        licenseKey: 'non-commercial-and-evaluation',
      });

      const plugin = hot.getPlugin('undoRedo');

      ['a', 'b', 'c', 'd', 'e'].forEach((value, column) => {
        hot.setDataAtCell(0, column, value);
      });

      expect(plugin.doneActions.length).toBe(3);

      plugin.undo();
      plugin.undo();
      plugin.undo();

      // The last three edits are undone; the first two fell off the stack and stay.
      expect(hot.getDataAtRow(0)).toEqual(['a', 'b', 'C1', 'D1', 'E1']);
      expect(plugin.isUndoAvailable()).toBe(false);

      plugin.redo();

      expect(hot.getDataAtRow(0)).toEqual(['a', 'b', 'c', 'D1', 'E1']);
    });

    it('should keep an unlimited stack for `undo: true`', () => {
      hot = new Handsontable(container, {
        data: [[1]],
        undo: true,
        licenseKey: 'non-commercial-and-evaluation',
      });

      for (let value = 2; value <= 60; value++) {
        hot.setDataAtCell(0, 0, value);
      }

      expect(hot.getPlugin('undoRedo').doneActions.length).toBe(59);
    });
  });

  it('should keep recording new actions after an action throws during undo', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A1'], ['A2'], ['A3']],
      undo: true,
    });
    const plugin = hot.getPlugin('undoRedo');

    registerThrowingAction(plugin);

    expect(() => plugin.undo()).toThrow('undo boom');
    expect(plugin.ignoreNewActions).toBe(false);
    // The partially applied action is deliberately discarded – it lands on neither stack.
    expect(plugin.doneActions.length).toBe(0);
    expect(plugin.undoneActions.length).toBe(0);

    hot.alter('remove_row', 0);

    expect(plugin.isUndoAvailable()).toBe(true);

    plugin.undo();

    expect(hot.getSourceData()).toEqual([['A1'], ['A2'], ['A3']]);
  });

  it('should keep recording new actions after an action throws during redo', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A1'], ['A2'], ['A3']],
      undo: true,
    });
    const plugin = hot.getPlugin('undoRedo');

    plugin.undoneActions.push({
      actionType: 'throwing',
      undo() {},
      redo() { throw new Error('redo boom'); },
    });

    expect(() => plugin.redo()).toThrow('redo boom');
    expect(plugin.ignoreNewActions).toBe(false);
    // Same contract as undo: the throwing action is discarded from both stacks.
    expect(plugin.doneActions.length).toBe(0);
    expect(plugin.undoneActions.length).toBe(0);

    hot.alter('remove_row', 0);

    expect(plugin.isUndoAvailable()).toBe(true);
  });

  // A step records the grid it was made on. Once `updateData()` replaced the dataset, those steps
  // describe data that is gone, so the history is dropped - and recording goes on for the new data.
  // A listener that vetoes a row or column change while a step is replayed leaves the grid as it was,
  // and the step stays on the stack it came from.
  describe('an undo or redo whose grid changed or whose replay is vetoed', () => {
    it('should take back the rows of a restored insertion that landed only in part', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const afterUndo = jest.fn();

      hot.addHook('afterUndo', afterUndo);
      hot.alter('remove_row', 1, 3);
      // The undo has to put back three rows, and `maxRows` lets only one in.
      hot.updateSettings({ maxRows: 3 });
      plugin.undo();

      expect(hot.getData()).toEqual([['A1'], ['A5']]);
      expect(hot.rowIndexMapper.getNumberOfIndexes()).toBe(2);
      expect(afterUndo).not.toHaveBeenCalled();
      expect(plugin.doneActions.length).toBe(1);
    });

    it('should drop a row insertion when updateData replaced the dataset, and keep recording', () => {
      const beforeUndo = jest.fn();
      const afterUndo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        undo: true,
        beforeUndo,
        afterUndo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_row_above', 5, 1);
      hot.updateData([['B1'], ['B2']]); // the recorded row insertion describes the old dataset

      expect(plugin.isUndoAvailable()).toBe(false);

      plugin.undo();

      expect(beforeUndo).not.toHaveBeenCalled();
      expect(afterUndo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['B1'], ['B2']]);
      expect(plugin.doneActions.length).toBe(0);
      expect(plugin.undoneActions.length).toBe(0);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('B1');
    });

    it('should drop a column insertion when updateData replaced the dataset, and keep recording', () => {
      const beforeUndo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1']],
        undo: true,
        beforeUndo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_col_start', 3, 1);
      hot.updateData([['X1', 'Y1']]); // the recorded column insertion describes the old dataset

      plugin.undo();

      expect(beforeUndo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['X1', 'Y1']]);
      expect(plugin.doneActions.length).toBe(0);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
    });

    it('should drop an undone column removal when updateData replaced the dataset, and keep recording', () => {
      const beforeRedo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1', 'D1', 'E1']],
        undo: true,
        beforeRedo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_col', 4, 1);
      plugin.undo();
      hot.updateData([['X1', 'Y1']]); // the undone column removal describes the old dataset

      plugin.redo();

      expect(beforeRedo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['X1', 'Y1']]);
      expect(plugin.undoneActions.length).toBe(0);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
    });

    it('should clear the redo stack when a row is trimmed after an undo, instead of removing the last row', () => {
      const beforeRedo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        undo: true,
        trimRows: true,
        beforeRedo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1, 1); // records physical row 1 (`A2`)
      plugin.undo();
      // Trimming is an undoable step of its own, so it clears the redo stack. (The old recipe replayed
      // the physical row through `toVisualRow()`, which is `null` for a trimmed row, and `alter()` read
      // `null` as "take the rows from the end" - the redo removed `A5`.)
      hot.getPlugin('trimRows').trimRows([1]);

      plugin.redo();

      expect(beforeRedo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
      expect(plugin.undoneActions.length).toBe(0);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['trim_rows']);
    });

    it('should settle a vetoed row insertion undo late, and keep recording', () => {
      const afterUndo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
        afterUndo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_row_above', 1, 1);

      // The index still exists, so `canUndo()` lets the undo start; only the removal learns of the veto.
      const veto = () => false;

      hot.addHook('beforeRemoveRow', veto);
      plugin.undo();
      hot.removeHook('beforeRemoveRow', veto);

      // Settled late with `{ wasUndone: false }`: back on the done stack, and no `afterUndo`.
      expect(plugin.ignoreNewActions).toBe(false);
      expect(afterUndo).not.toHaveBeenCalled();
      expect(hot.countRows()).toBe(4);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['insert_row']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should settle a vetoed row removal redo late, and keep recording', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1, 1);
      plugin.undo();

      // The row is not trimmed, so `canRedo()` lets the redo start; only the removal learns of the veto.
      const veto = () => false;

      hot.addHook('beforeRemoveRow', veto);
      plugin.redo();
      hot.removeHook('beforeRemoveRow', veto);

      // Settled late with `{ wasRedone: false }`: back on the undone stack.
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['A1'], ['A2'], ['A3']]);
      expect(plugin.undoneActions.map(action => action.actionType)).toEqual(['remove_row']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should not leave the settle listener armed when the removal throws', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_row_above', 1, 1);

      const boom = () => {
        throw new Error('remove boom');
      };

      hot.addHook('beforeRemoveRow', boom);

      expect(() => plugin.undo()).toThrow('remove boom');

      hot.removeHook('beforeRemoveRow', boom);

      // `undo()` discarded the throwing action. A listener left armed would settle it on the next real
      // removal and push that discarded action onto the undone stack.
      hot.alter('remove_row', 0, 1);

      expect(plugin.undoneActions.length).toBe(0);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['remove_row']);
    });
  });

  describe('a plugin that owns an index map, turned on or off at runtime', () => {
    /**
     * Creates a 4x1 grid.
     *
     * @param {object} settings Extra settings.
     */
    function createGrid(settings = {}) {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4']],
        undo: true,
        ...settings,
      });
    }

    it('should drop the history when the plugin is turned on', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      hot.updateSettings({ hiddenRows: true });
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('edited');
      expect(plugin.doneActions.length).toBe(0);
    });

    it('should drop the history when the plugin is turned off', () => {
      createGrid({ hiddenRows: true });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      hot.updateSettings({ hiddenRows: false });
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('edited');
      expect(plugin.doneActions.length).toBe(0);
    });

    it('should keep the history when a settings update disables and enables the plugin again', () => {
      createGrid({ hiddenRows: { rows: [] } });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      // What a framework wrapper does on every render: the plugin re-registers its map by name.
      hot.updateSettings({ hiddenRows: { rows: [] } });
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should undo the first action of a plugin turned on at runtime', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');

      hot.updateSettings({ hiddenRows: true });
      hot.getPlugin('hiddenRows').hideRows([1]);

      expect(hot.getPlugin('hiddenRows').isHidden(1)).toBe(true);

      // The map is registered with no write, so the state before the hide must still name it.
      plugin.undo();

      expect(hot.getPlugin('hiddenRows').isHidden(1)).toBe(false);

      plugin.redo();

      expect(hot.getPlugin('hiddenRows').isHidden(1)).toBe(true);
    });
  });

  describe('transactions', () => {
    /**
     * Creates a 4x2 grid holding `A1`, `B1`, ... - the column letter and the row number.
     *
     * @param {object} settings Extra settings.
     */
    function createGrid(settings = {}) {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4']],
        undo: true,
        ...settings,
      });
    }

    it('should record a `batch()` as one step, and undo and redo all of it', () => {
      createGrid({ trimRows: true });
      const plugin = hot.getPlugin('undoRedo');

      hot.batch(() => {
        hot.setDataAtCell(0, 0, 'edited');
        hot.alter('remove_row', 1, 1);
        hot.setDataAtCell(1, 1, 'also edited');
        hot.getPlugin('trimRows').trimRows([2]);
      });

      expect(hot.getData()).toEqual([['edited', 'B1'], ['A3', 'also edited']]);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['batch']);

      plugin.undo();

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4']]);

      plugin.redo();

      expect(hot.getData()).toEqual([['edited', 'B1'], ['A3', 'also edited']]);
    });

    it('should record a `runOperation()` as one step named after the operation', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');
      const beforeUndoStackChange = jest.fn();

      hot.addHook('beforeUndoStackChange', beforeUndoStackChange);
      hot.runOperation('import', 'myImport', () => {
        hot.setDataAtCell(0, 0, 'x');
        hot.setDataAtCell(1, 0, 'y');
      });

      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['import']);
      expect(beforeUndoStackChange).toHaveBeenCalledTimes(1);
      expect(beforeUndoStackChange.mock.calls[0][1]).toBe('myImport');

      plugin.undo();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
    });

    it('should keep recording after a `batch()` callback throws', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');

      expect(() => hot.batch(() => {
        hot.setDataAtCell(0, 0, 'written before the throw');
        throw new Error('batch boom');
      })).toThrow('batch boom');

      // What the callback changed before it threw is one step, like any other.
      expect(plugin.doneActions.length).toBe(1);

      hot.setDataAtCell(1, 0, 'next');

      expect(plugin.doneActions.length).toBe(2);

      plugin.undo();

      expect(hot.getDataAtCell(1, 0)).toBe('A2');
      expect(hot.getDataAtCell(0, 0)).toBe('written before the throw');

      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should list the changes of an edit in the order they were passed', () => {
      createGrid();
      const beforeUndo = jest.fn();

      hot.addHook('beforeUndo', beforeUndo);
      hot.setDataAtCell([[0, 0, 'x'], [1, 1, 'y'], [2, 0, 'z']]);
      hot.getPlugin('undoRedo').undo();

      expect(beforeUndo.mock.calls[0][0].changes).toEqual([
        [0, 0, 'A1', 'x'],
        [1, 1, 'B2', 'y'],
        [2, 0, 'A3', 'z'],
      ]);
    });

    it('should report the physical row of the first visual row removed as the `index` of a removal', () => {
      createGrid();
      hot.rowIndexMapper.setIndexesSequence([2, 0, 1, 3]);
      // Visual rows 0 and 1 are physical rows 2 and 0.
      hot.alter('remove_row', 0, 2);

      const [step] = hot.getPlugin('undoRedo').doneActions;

      expect(step.index).toBe(2);
      expect(step.indexes).toEqual([0, 2]);
    });

    it('should record nothing when an async validator rejects every change', async() => {
      let validated;
      const rejectLater = (value, callback) => {
        setTimeout(() => {
          callback(false);
          validated();
        });
      };

      createGrid({ columns: [{ validator: rejectLater, allowInvalid: false }, {}] });
      const plugin = hot.getPlugin('undoRedo');

      await new Promise((resolve) => {
        validated = resolve;
        hot.setDataAtCell(0, 0, 'rejected');
      });

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(plugin.doneActions.length).toBe(0);

      // The held step settled, so the next edit is recorded as usual.
      hot.setDataAtCell(0, 1, 'accepted');
      plugin.undo();

      expect(hot.getDataAtCell(0, 1)).toBe('B1');
    });
  });

  describe('a step on a nested rows grid', () => {
    it('should write a cell edited after a parent removal in the same step to the row it named', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [
          { name: 'Root A', __children: [{ name: 'A-1' }, { name: 'A-2' }] },
          { name: 'Root B', __children: [{ name: 'B-1' }] },
          { name: 'After' },
        ],
        columns: [{ data: 'name' }],
        nestedRows: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      // `getDataAtCol()` answers one value per top-level row on a nested grid, so read row by row.
      const names = () => Array.from({ length: hot.countRows() }, (_, row) => hot.getDataAtCell(row, 0));

      // The removal takes `Root A` with its two children, so the edit addresses `After` as row 2. An
      // undo restores the whole tree shape first, where row 2 is `A-2`.
      hot.batch(() => {
        hot.alter('remove_row', 0, 1);
        hot.setDataAtCell(2, 0, 'After edited');
      });

      expect(names()).toEqual(['Root B', 'B-1', 'After edited']);

      plugin.undo();

      expect(names()).toEqual(['Root A', 'A-1', 'A-2', 'Root B', 'B-1', 'After']);

      plugin.redo();

      expect(names()).toEqual(['Root B', 'B-1', 'After edited']);

      plugin.undo();

      expect(names()).toEqual(['Root A', 'A-1', 'A-2', 'Root B', 'B-1', 'After']);
    });

    it('should skip, on undo, a cell edited in a row the same step added', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [
          { name: 'Root A', __children: [{ name: 'A-1' }] },
          { name: 'After' },
        ],
        columns: [{ data: 'name' }],
        nestedRows: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const dataManager = hot.getPlugin('nestedRows').dataManager;
      const names = () => Array.from({ length: hot.countRows() }, (_, row) => hot.getDataAtCell(row, 0));

      // The new child lands at row 2. The shape an undo restores has no such row - `After` sits there.
      hot.batch(() => {
        dataManager.addChild(dataManager.getDataObject(0));
        hot.setDataAtCell(2, 0, 'typed');
      });

      expect(names()).toEqual(['Root A', 'A-1', 'typed', 'After']);

      plugin.undo();

      expect(names()).toEqual(['Root A', 'A-1', 'After']);

      plugin.redo();

      expect(names()).toEqual(['Root A', 'A-1', 'typed', 'After']);
    });
  });
});
