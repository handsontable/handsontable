import Handsontable from 'handsontable/base';
import {
  ColumnSorting, HiddenColumns, HiddenRows, ManualRowMove, MergeCells, NestedRows, registerPlugin, TrimRows, UndoRedo,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);
registerPlugin(TrimRows);
registerPlugin(HiddenRows);
registerPlugin(HiddenColumns);
registerPlugin(NestedRows);
registerPlugin(MergeCells);
registerPlugin(ColumnSorting);
registerPlugin(ManualRowMove);

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

    it('should keep no steps for `maxHistory: 0`', () => {
      hot = new Handsontable(container, {
        data: [['A1']],
        undo: { maxHistory: 0 },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.setDataAtCell(0, 0, 'x');

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });

    it.each([-1, 1.5, '3', NaN, null])('should warn about `maxHistory: %p` and keep the previous limit', (value) => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = new Handsontable(container, {
        data: [['A1', 'B1', 'C1']],
        undo: { maxHistory: 2 },
        licenseKey: 'non-commercial-and-evaluation',
      });
      hot.updateSettings({ undo: { maxHistory: value } });

      ['a', 'b', 'c'].forEach((cellValue, column) => hot.setDataAtCell(0, column, cellValue));

      expect(hot.getPlugin('undoRedo').doneActions.length).toBe(2);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"maxHistory" option is not valid'));

      warnSpy.mockRestore();
    });

    it('should drop the oldest steps at once when the limit is lowered, with one hook pair', () => {
      const afterUndoStackChange = jest.fn();

      hot = new Handsontable(container, {
        data: [['A1', 'B1', 'C1', 'D1', 'E1']],
        undo: { maxHistory: 5 },
        licenseKey: 'non-commercial-and-evaluation',
      });
      const plugin = hot.getPlugin('undoRedo');

      ['a', 'b', 'c', 'd', 'e'].forEach((value, column) => hot.setDataAtCell(0, column, value));
      hot.addHook('afterUndoStackChange', afterUndoStackChange);
      hot.updateSettings({ undo: { maxHistory: 2 } });

      expect(plugin.doneActions.length).toBe(2);
      expect(afterUndoStackChange).toHaveBeenCalledTimes(1);
      expect(afterUndoStackChange.mock.calls[0][1]).toHaveLength(2);

      plugin.undo();
      plugin.undo();

      expect(hot.getDataAtRow(0)).toEqual(['a', 'b', 'c', 'D1', 'E1']);
    });

    it('should keep the limit through a settings update that does not mention `undo`', () => {
      hot = new Handsontable(container, {
        data: [['A1', 'B1', 'C1']],
        undo: { maxHistory: 2 },
        licenseKey: 'non-commercial-and-evaluation',
      });

      hot.updateSettings({ colHeaders: true });
      ['a', 'b', 'c'].forEach((value, column) => hot.setDataAtCell(0, column, value));

      expect(hot.getPlugin('undoRedo').doneActions.length).toBe(2);
    });

    it('should never let a redo push the undo stack past a lowered limit', () => {
      hot = new Handsontable(container, {
        data: [['A1', 'B1', 'C1']],
        undo: { maxHistory: 3 },
        licenseKey: 'non-commercial-and-evaluation',
      });
      const plugin = hot.getPlugin('undoRedo');

      ['a', 'b', 'c'].forEach((value, column) => hot.setDataAtCell(0, column, value));
      plugin.undo();
      plugin.undo();
      hot.updateSettings({ undo: { maxHistory: 1 } });
      plugin.redo();
      plugin.redo();

      expect(plugin.doneActions.length).toBe(1);
      expect(hot.getDataAtRow(0)).toEqual(['a', 'b', 'c']);
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

  // 19.0: the plugin records only while it is on (18.x recorded with `undo: false` too), so an API
  // `undo()` on a disabled grid has nothing to undo.
  it('should record nothing while `undo` is `false`', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A1', 'B1']],
      undo: false,
    });
    const plugin = hot.getPlugin('undoRedo');

    hot.setDataAtCell(0, 1, 'X');
    plugin.undo();

    expect(plugin.isUndoAvailable()).toBe(false);
    expect(hot.getDataAtCell(0, 1)).toBe('X');
  });

  // The hooks get the step object itself, and `beforeUndo` runs while the step is still on the stack.
  it('should hand `beforeUndo` the step on top of the undo stack', () => {
    const seen = [];

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [['A1']],
      undo: true,
      beforeUndo(action) {
        const { doneActions } = hot.getPlugin('undoRedo');

        seen.push(action === doneActions[doneActions.length - 1], doneActions.length);
      },
    });

    hot.setDataAtCell(0, 0, 'x');
    hot.getPlugin('undoRedo').undo();

    expect(seen).toEqual([true, 1]);
  });

  // A vetoed undo keeps its step, as a vetoed redo does, so it can be retried once the condition that
  // vetoed it is gone. The stacks do not change, so no stack hook fires.
  describe('an undo vetoed by `beforeUndo`', () => {
    it('should keep a recorded step on the undo stack and undo it on a retry', () => {
      const stackHooks = jest.fn();
      let veto = true;

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2']],
        undo: true,
        beforeUndo: () => !veto,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'edited');
      hot.addHook('beforeUndoStackChange', stackHooks);
      hot.addHook('afterUndoStackChange', stackHooks);
      hot.addHook('beforeRedoStackChange', stackHooks);
      hot.addHook('afterRedoStackChange', stackHooks);
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('edited');
      expect(plugin.doneActions.length).toBe(1);
      expect(plugin.undoneActions.length).toBe(0);
      expect(stackHooks).not.toHaveBeenCalled();

      veto = false;
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(plugin.doneActions.length).toBe(0);
      expect(plugin.undoneActions.length).toBe(1);
    });

    it('should keep an action registered through `done()` on the undo stack', () => {
      const undoAction = jest.fn((instance, callback) => callback());

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      plugin.done(() => ({ actionType: 'custom', undo: undoAction, redo() {} }));
      hot.addHook('beforeUndo', () => false);
      plugin.undo();

      expect(undoAction).not.toHaveBeenCalled();
      expect(plugin.doneActions.length).toBe(1);
      expect(plugin.isUndoAvailable()).toBe(true);
    });
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

    // The pop was announced through the stack hooks, so the put-back is too: the last stack a
    // listener was told about is the stack as it is.
    it('should announce a step put back after a vetoed replay, on both stacks', () => {
      const afterUndoStackChange = jest.fn();
      const afterRedoStackChange = jest.fn();
      const veto = () => false;

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
        afterUndoStackChange,
        afterRedoStackChange,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_row_above', 1, 1);
      hot.addHook('beforeRemoveRow', veto);
      plugin.undo();
      hot.removeHook('beforeRemoveRow', veto);

      expect(plugin.doneActions.length).toBe(1);
      expect(afterUndoStackChange.mock.calls.at(-1)[1]).toHaveLength(1);

      plugin.undo();
      hot.addHook('beforeCreateRow', veto);
      plugin.redo();
      hot.removeHook('beforeCreateRow', veto);

      expect(plugin.undoneActions.length).toBe(1);
      expect(afterRedoStackChange.mock.calls.at(-1)[1]).toHaveLength(1);
    });

    it('should put back a `done()` action that reports it could not redo, with no `afterRedo`', () => {
      const afterRedo = jest.fn();
      const afterRedoStackChange = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1']],
        undo: true,
        afterRedo,
        afterRedoStackChange,
      });
      const plugin = hot.getPlugin('undoRedo');

      plugin.done(() => ({
        actionType: 'custom',
        undo: (instance, callback) => callback(),
        redo: (instance, callback) => callback({ wasRedone: false }),
      }));
      plugin.undo();
      plugin.redo();

      expect(afterRedo).not.toHaveBeenCalled();
      expect(plugin.undoneActions.length).toBe(1);
      expect(afterRedoStackChange.mock.calls.at(-1)[1]).toHaveLength(1);
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

    it('should record a `batchExecution()` as one `batch` step', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');

      hot.batchExecution(() => {
        hot.setDataAtCell(0, 0, 'x');
        hot.setDataAtCell(1, 1, 'y');
      });

      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['batch']);

      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(hot.getDataAtCell(1, 1)).toBe('B2');
    });

    it('should record a `runOperation()` as one step named after the operation', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');
      const beforeUndoStackChange = jest.fn();

      hot.addHook('beforeUndoStackChange', beforeUndoStackChange);
      hot.runOperation('import', () => {
        hot.setDataAtCell(0, 0, 'x');
        hot.setDataAtCell(1, 0, 'y');
      }, 'myImport');

      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['import']);
      expect(beforeUndoStackChange).toHaveBeenCalledTimes(1);
      expect(beforeUndoStackChange.mock.calls[0][1]).toBe('myImport');

      plugin.undo();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
    });

    it('should read the source of an array-form `setSourceDataAtCell()` call from its second argument', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');
      const beforeUndoStackChange = jest.fn();

      hot.addHook('beforeUndoStackChange', beforeUndoStackChange);
      hot.setSourceDataAtCell([[0, 0, 'x']], 'auto');

      expect(hot.getSourceDataAtCell(0, 0)).toBe('x');
      expect(plugin.isUndoAvailable()).toBe(false);

      hot.setSourceDataAtCell([[1, 0, 'y']], 'myImport');

      expect(beforeUndoStackChange).toHaveBeenCalledTimes(1);
      expect(beforeUndoStackChange.mock.calls[0][1]).toBe('myImport');
      expect(plugin.doneActions.map(action => action.source)).toEqual(['myImport']);
    });

    // `beforeChange` reports an edit with no source as `edit`, and so did the step before the
    // operations recorded it.
    it('should record an edit made with no source as an `edit`', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');
      const beforeUndoStackChange = jest.fn();

      hot.addHook('beforeUndoStackChange', beforeUndoStackChange);
      hot.setDataAtCell(0, 0, 'x');
      hot.setDataAtCell([[1, 0, 'y']]);
      hot.setDataAtRowProp(2, 0, 'z');

      expect(beforeUndoStackChange.mock.calls.map(call => call[1])).toEqual(['edit', 'edit', 'edit']);
      expect(plugin.doneActions.map(action => action.source)).toEqual(['edit', 'edit', 'edit']);
    });

    // A source write past the last row lands nowhere, and one of the value a cell holds changes
    // nothing. Recorded, either one would empty the redo stack for a step that undoes nothing. (An
    // edit through `setDataAtCell()` is a step even then, as it always was - `UndoRedo.spec.js`.)
    it('should record no step for a source write that changes nothing', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');
      plugin.undo();
      hot.setSourceDataAtCell(1, 1, 'B2');
      hot.setSourceDataAtCell(50, 0, 'y');

      expect(hot.getSourceData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4']]);
      expect(plugin.isUndoAvailable()).toBe(false);
      expect(plugin.isRedoAvailable()).toBe(true);
    });

    // The undo selects the cell it put back. What a selection listener writes in reply is part of
    // the undo, not a step: recorded, it would empty the redo stack the undo is filling.
    it('should record nothing a selection listener writes while an undo puts the selection back', () => {
      createGrid();
      const plugin = hot.getPlugin('undoRedo');
      let listening = false;
      let hits = 0;

      hot.addHook('afterSelection', (row) => {
        if (listening) {
          hits += 1;
          hot.setCellMeta(row, 1, 'hits', hits);
        }
      });
      hot.selectCell(0, 0);
      hot.setDataAtCell(0, 0, 'x');
      hot.selectCell(1, 0);
      hot.setDataAtCell(1, 0, 'y');
      hot.selectCell(3, 1);
      listening = true;
      plugin.undo();

      expect(hot.getSelected()).toEqual([[1, 0, 1, 0]]);
      expect(hits).toBeGreaterThan(0);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['change']);
      expect(plugin.isRedoAvailable()).toBe(true);

      plugin.undo();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
      expect(plugin.undoneActions.length).toBe(2);
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

    it('should list a nested edit after the edit that caused it', () => {
      createGrid({
        afterChange(changes, source) {
          if (source === 'edit') {
            hot.setDataAtCell([[2, 0, 'z'], [3, 0, 'w']], 'nested');
          }
        },
      });
      const beforeUndo = jest.fn();

      hot.addHook('beforeUndo', beforeUndo);
      hot.setDataAtCell([[0, 0, 'x'], [1, 0, 'y']], 'edit');
      hot.getPlugin('undoRedo').undo();

      expect(beforeUndo.mock.calls[0][0].changes.map(([row]) => row)).toEqual([0, 1, 2, 3]);
      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4']);
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

  // Validation runs in a microtask, after the call that started it has returned. What it writes
  // belongs to the step of that call, and a step that waits for it keeps the history intact.
  describe('validation inside a step', () => {
    const settle = () => new Promise(resolve => setTimeout(resolve, 0));
    const actionTypes = () => hot.getPlugin('undoRedo').doneActions.map(action => action.actionType);

    it('should record an edit and the meta its `afterValidate` listener writes as one step', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2']],
        columns: [{ validator: (value, callback) => callback(value !== 'bad') }, {}],
        undo: true,
        afterValidate(isValid, value, row) {
          hot.setCellMeta(row, 0, 'className', isValid ? '' : 'error');
        },
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'bad');
      await settle();

      expect(actionTypes()).toEqual(['change']);
      expect(hot.getCellMeta(0, 0).className).toBe('error');

      plugin.undo();
      await settle();

      // The re-validation after the undo writes meta too, and must not record a step of its own:
      // that would empty the redo stack.
      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(hot.getCellMeta(0, 0).className).not.toBe('error');
      expect(plugin.doneActions.length).toBe(0);
      expect(plugin.isRedoAvailable()).toBe(true);
    });

    // The meta write settles while the batch waits for its validator, after the batch removed a row, so
    // it addresses the row in the numbering the removal left. Undone apart, one of the two would replay
    // at the wrong row, so it is recorded in the batch's step.
    it('should record a step made while a step that removes a row waits for its validator in that step', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4'], ['A5', 'B5']],
        columns: [{ validator: (value, callback) => callback(true) }, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const markedRows = () => [0, 1, 2, 3, 4]
        .filter(row => row < hot.countRows() && hot.getCellMeta(row, 1).className === 'Q');

      hot.setDataAtCell(4, 1, 'prior');
      hot.batch(() => {
        hot.alter('remove_row', 1);
        hot.setDataAtCell(0, 0, 'P');
      });
      // Row `A4`, below the removed one.
      hot.setCellMeta(2, 1, 'className', 'Q');
      await settle();

      expect(actionTypes()).toEqual(['change', 'batch']);

      plugin.undo();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
      expect(markedRows()).toEqual([]);

      plugin.redo();

      expect(hot.getDataAtCol(0)).toEqual(['P', 'A3', 'A4', 'A5']);
      expect(markedRows()).toEqual([2]);

      plugin.undo();
      plugin.undo();

      expect(hot.getDataAtCol(1)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);
      expect(markedRows()).toEqual([]);
    });

    // The batch writes `B1` after the edit made while it waited, so the undo takes the batch's value off
    // first and the edit's second.
    it('should undo and redo a joined step in the order its changes were made', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
        columns: [{ validator: (value, callback) => callback(true) }, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.batch(() => {
        hot.alter('remove_row', 2);
        hot.setDataAtCell([[0, 0, 'P'], [0, 1, 'P1']]);
      });
      // Column 1 has no validator, so this edit settles at once, while the batch waits.
      hot.setDataAtCell(0, 1, 'Q');
      await settle();

      expect(hot.getData()).toEqual([['P', 'P1'], ['A2', 'B2']]);

      plugin.undo();

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']]);

      plugin.redo();

      expect(hot.getData()).toEqual([['P', 'P1'], ['A2', 'B2']]);
    });

    // A step that already changed the grid and waits for its validator takes in the steps made
    // meanwhile. An undo then would restore around that half-made step: undoing a row removal that
    // joined it drops the whole history, and undoing an earlier row insert moves the meta the step
    // already wrote to a row its journal does not name.
    describe('while a step that already changed the grid waits for its validator', () => {
      const markedRows = () => [0, 1, 2, 3, 4, 5]
        .filter(row => row < hot.countRows() && hot.getCellMeta(row, 0).className === 'Q');
      let release = null;

      /**
       * Creates a 5x2 grid whose second column waits for `release()` to validate.
       */
      function createGrid() {
        hot = new Handsontable(container, {
          licenseKey: 'non-commercial-and-evaluation',
          data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4'], ['A5', 'B5']],
          columns: [{}, { validator: (value, callback) => { release = () => callback(true); } }],
          undo: true,
        });
      }

      /**
       * Starts a batch that marks the row at index 3 and edits a validated cell at index 1, and waits
       * until the validator holds it.
       */
      async function startPendingBatch() {
        hot.batch(() => {
          hot.setCellMeta(3, 0, 'className', 'Q');
          hot.setDataAtCell(1, 1, 'v');
        });
        await settle();
      }

      it('should neither undo nor redo, and record a row removal made meanwhile in that step', async() => {
        createGrid();
        const plugin = hot.getPlugin('undoRedo');

        hot.setDataAtCell(0, 0, 'prior');
        await startPendingBatch();
        hot.alter('remove_row', 4);

        expect(plugin.isUndoAvailable()).toBe(false);
        expect(plugin.isRedoAvailable()).toBe(false);

        plugin.undo();

        expect(hot.countRows()).toBe(4);

        release();
        await settle();

        expect(actionTypes()).toEqual(['change', 'batch']);

        plugin.undo();

        expect(hot.getDataAtCol(0)).toEqual(['prior', 'A2', 'A3', 'A4', 'A5']);
        expect(hot.getDataAtCol(1)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);
        expect(markedRows()).toEqual([]);

        plugin.undo();

        expect(hot.getDataAtCell(0, 0)).toBe('A1');
      });

      it('should not undo an earlier row insert, so the meta the step wrote keeps its row', async() => {
        createGrid();
        const plugin = hot.getPlugin('undoRedo');

        hot.alter('insert_row_above', 0, 1);
        await startPendingBatch();

        expect(plugin.isUndoAvailable()).toBe(false);

        plugin.undo();

        expect(hot.countRows()).toBe(6);

        release();
        await settle();
        plugin.undo();

        expect(markedRows()).toEqual([]);

        plugin.undo();

        expect(hot.countRows()).toBe(5);
        expect(markedRows()).toEqual([]);
      });
    });

    // A change that is not recorded (the `auto` source, `ignoreNewActions`) records no step, so an edit
    // made while it waits for its validator cannot join it: it would be lost with it. The edit is a step
    // of its own, and the change's row added at the end keeps the history.
    describe('while a change that is not recorded waits for its validator', () => {
      let release = null;

      /**
       * Creates a 3x2 grid whose first column waits for `release()` to validate.
       */
      function createGrid() {
        hot = new Handsontable(container, {
          licenseKey: 'non-commercial-and-evaluation',
          data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
          columns: [{ validator: (value, callback) => { release = () => callback(true); } }, {}],
          undo: true,
        });
      }

      /**
       * Edits a cell while the unrecorded change waits, lets the change finish, and undoes the edit.
       *
       * @returns {Promise<object>} Whether undo was available while the change waited, and the steps
       *   recorded once it finished.
       */
      async function editMeanwhileAndUndo() {
        const plugin = hot.getPlugin('undoRedo');

        hot.setDataAtCell(1, 1, 'user edit');

        const undoAvailableWhileWaiting = plugin.isUndoAvailable();

        release();
        await settle();

        const steps = actionTypes();

        plugin.undo();

        return { undoAvailableWhileWaiting, steps };
      }

      it('should record an edit made while a `runOperation()` with the `auto` source waits', async() => {
        createGrid();

        hot.runOperation('import', () => {
          hot.alter('insert_row_below', 2, 1, 'auto');
          hot.setDataAtCell(0, 0, 'P', 'auto');
        }, 'auto');
        await settle();

        const { undoAvailableWhileWaiting, steps } = await editMeanwhileAndUndo();

        expect(undoAvailableWhileWaiting).toBe(false);
        expect(steps).toEqual(['change']);
        expect(hot.getData()).toEqual([['P', 'B1'], ['A2', 'B2'], ['A3', 'B3'], [null, null]]);
      });

      it('should record an edit made while a change made with `ignoreNewActions` waits', async() => {
        createGrid();
        const plugin = hot.getPlugin('undoRedo');

        plugin.ignoreNewActions = true;
        hot.batch(() => {
          hot.alter('insert_row_below', 2, 1);
          hot.setDataAtCell(0, 0, 'P');
        });
        plugin.ignoreNewActions = false;
        await settle();

        const { undoAvailableWhileWaiting, steps } = await editMeanwhileAndUndo();

        expect(undoAvailableWhileWaiting).toBe(false);
        expect(steps).toEqual(['change']);
        expect(hot.getData()).toEqual([['P', 'B1'], ['A2', 'B2'], ['A3', 'B3'], [null, null]]);
      });
    });

    it('should record two edits that wait for their validators in the order they commit', async() => {
      const answers = new Map();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2']],
        columns: [{ validator: (value, callback) => answers.set(value, callback) }],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'slow');
      hot.setDataAtCell(1, 0, 'fast');
      await settle();
      answers.get('fast')(true);
      answers.get('slow')(true);

      expect(plugin.doneActions.map(action => action.changes[0][3])).toEqual(['fast', 'slow']);

      plugin.undo();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'fast']);
    });

    // A validator that throws never answers, so the change waiting for it would hold its step open for
    // good - and a step that inserted a row blocks every undo while it is open.
    it('should record a step whose validator throws, and keep undo working', async() => {
      const errors = [];
      // The validator throws in a microtask, which reports it as an uncaught error.
      const onError = (event) => {
        errors.push(event.error.message);
        event.preventDefault();
      };

      window.addEventListener('error', onError);
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['a', 'b'], ['c', 'd']],
        columns: [{
          validator() {
            throw new Error('validator boom');
          },
        }, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.batch(() => {
        hot.alter('insert_row_above', 0);
        hot.setDataAtCell(0, 0, 'v');
      });
      hot.setDataAtCell(1, 1, 'later');

      expect(plugin.isUndoAvailable()).toBe(false);

      await settle();
      window.removeEventListener('error', onError);

      expect(errors).toEqual(['validator boom']);
      expect(plugin.isUndoAvailable()).toBe(true);

      plugin.undo();

      expect(hot.getData()).toEqual([['a', 'b'], ['c', 'd']]);
      expect(plugin.isUndoAvailable()).toBe(false);
    });

    it('should ignore an undo made while a step that removes a row waits for its validator', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
        columns: [{ validator: (value, callback) => callback(true) }, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(2, 1, 'prior');
      hot.batch(() => {
        hot.alter('remove_row', 1);
        hot.setDataAtCell(0, 0, 'x');
      });

      expect(plugin.isUndoAvailable()).toBe(false);

      plugin.undo();

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A3', 'prior']]);

      await settle();

      expect(actionTypes()).toEqual(['change', 'batch']);
      expect(plugin.isUndoAvailable()).toBe(true);

      plugin.undo();

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'prior']]);

      plugin.undo();

      expect(hot.getData()).toEqual([['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']]);
    });

    it('should not let an edit whose validator never answers block the undo of an earlier step', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1']],
        columns: [{ validator: () => {} }, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 1, 'edited');
      hot.setDataAtCell(0, 0, 'never validated');
      await settle();
      plugin.undo();

      expect(hot.getDataAtCell(0, 1)).toBe('B1');
    });

    // The step that threw removed a row, so a hold it never released would block every undo for good.
    it('should record what a step did before a `beforeValidate` listener threw, and keep undo working', async() => {
      let shouldThrow = true;

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
        columns: [{ validator: (value, callback) => callback(true) }, {}],
        undo: true,
        beforeValidate() {
          if (shouldThrow) {
            shouldThrow = false;
            throw new Error('beforeValidate boom');
          }
        },
      });
      const plugin = hot.getPlugin('undoRedo');

      expect(() => hot.batch(() => {
        hot.alter('remove_row', 1);
        hot.setDataAtCell(0, 0, 'never applied');
      })).toThrow('beforeValidate boom');
      await settle();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A3']);
      expect(actionTypes()).toEqual(['batch']);

      plugin.undo();

      expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3']);

      hot.setDataAtCell(0, 1, 'y');
      await settle();

      expect(actionTypes()).toEqual(['change']);
    });

    it('should record an edit and the value its validator corrects as one step', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1']],
        columns: [{
          validator(value, callback) {
            if (value === 'raw') {
              hot.setDataAtCell(0, 0, 'corrected', 'correctingValidator');
            }

            callback(true);
          },
        }],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'raw');
      await settle();

      expect(hot.getDataAtCell(0, 0)).toBe('corrected');
      expect(actionTypes()).toEqual(['change']);

      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });
  });

  describe('`spliceCellsMeta()`', () => {
    it('should record a meta row insertion as one step that one undo reverts', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.spliceCellsMeta(0, 0, [{ className: 'x' }, { className: 'y' }]);

      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['splice_cells_meta']);

      plugin.undo();

      expect(hot.getCellMeta(0, 0).className).toBeUndefined();
      expect(hot.getCellMeta(0, 1).className).toBeUndefined();
    });

    it('should keep an older meta step on its row after a meta row removal', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5'], ['A6']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setCellMeta(5, 0, 'className', 'x');
      hot.spliceCellsMeta(0, 1);

      // The removal shifted the meta of row 5 up to row 4.
      expect(hot.getCellMeta(4, 0).className).toBe('x');

      plugin.undo();
      plugin.undo();

      expect(hot.getCellMeta(5, 0).className).toBeUndefined();
      expect(hot.getCellMeta(4, 0).className).toBeUndefined();
    });
  });

  // Every drop of the history is announced through the stack hooks, so a toolbar that follows them
  // disables its buttons at once.
  describe('a dropped history', () => {
    it('should fire the stack hooks when `updateData()` drops the history', () => {
      const afterUndoStackChange = jest.fn();
      const afterRedoStackChange = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');
      hot.setDataAtCell(0, 1, 'y');
      plugin.undo();
      hot.addHook('afterUndoStackChange', afterUndoStackChange);
      hot.addHook('afterRedoStackChange', afterRedoStackChange);
      hot.updateData([['C1', 'D1']]);

      expect(plugin.isUndoAvailable()).toBe(false);
      expect(plugin.isRedoAvailable()).toBe(false);
      expect(afterUndoStackChange).toHaveBeenCalledTimes(1);
      expect(afterUndoStackChange.mock.calls[0][1]).toEqual([]);
      expect(afterRedoStackChange).toHaveBeenCalledTimes(1);
      expect(afterRedoStackChange.mock.calls[0][1]).toEqual([]);
    });

    it('should fire no stack hook when an empty history is dropped', () => {
      const stackHooks = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1']],
        undo: true,
      });
      hot.addHook('afterUndoStackChange', stackHooks);
      hot.addHook('afterRedoStackChange', stackHooks);
      hot.updateData([['B1']]);

      expect(stackHooks).not.toHaveBeenCalled();
    });

    it('should drop the history at once when a settings update turns on a plugin that owns an index map', () => {
      const afterUndoStackChange = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');
      hot.addHook('afterUndoStackChange', afterUndoStackChange);
      hot.updateSettings({ hiddenRows: true });

      // Before any `undo()` call: a toolbar that asks, or follows the hooks, sees an empty stack.
      expect(plugin.isUndoAvailable()).toBe(false);
      expect(afterUndoStackChange).toHaveBeenCalledTimes(1);
      expect(afterUndoStackChange.mock.calls[0][1]).toEqual([]);
    });
  });

  // A `columns` update changes which field each column shows. A cell write is recorded by field, so it
  // survives; a step that addresses a column whose field changed is dropped, with every step that can
  // only be restored after it.
  describe('a `columns` settings update', () => {
    const people = () => [
      { id: 1, name: 'Ted Right', city: 'Boston' },
      { id: 2, name: 'Frank Honest', city: 'Denver' },
    ];
    const ID = { data: 'id' };
    const NAME = { data: 'name' };
    const CITY = { data: 'city' };

    /**
     * Builds a grid of `people()` rows with the given columns.
     *
     * @param {object[]} data The rows.
     * @param {object} settings More settings.
     * @returns {Handsontable}
     */
    function createPeopleGrid(data, settings) {
      return new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        undo: true,
        ...settings,
      });
    }

    it('should keep an edit through a narrower `columns`, and undo and redo it by field', () => {
      const data = people();
      const stackHooks = jest.fn();

      hot = createPeopleGrid(data, { columns: [ID, NAME, CITY] });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 1, 'Ann Lee');
      hot.addHook('afterUndoStackChange', stackHooks);
      hot.addHook('afterRedoStackChange', stackHooks);
      hot.updateSettings({ columns: [ID, NAME] });

      expect(stackHooks).not.toHaveBeenCalled();
      expect(plugin.isUndoAvailable()).toBe(true);

      plugin.undo();

      expect(data[0].name).toBe('Ted Right');

      plugin.redo();

      expect(data[0].name).toBe('Ann Lee');
    });

    it('should keep an edit through a wider `columns`', () => {
      const data = people();

      hot = createPeopleGrid(data, { columns: [ID, NAME] });

      hot.setDataAtCell(1, 1, 'Ann Lee');
      hot.updateSettings({ columns: [ID, NAME, CITY] });
      hot.getPlugin('undoRedo').undo();

      expect(data[1].name).toBe('Frank Honest');
      expect(hot.getDataAtCell(1, 2)).toBe('Denver');
    });

    it('should keep a cell meta step on a column that still shows its field', () => {
      hot = createPeopleGrid(people(), { columns: [ID, NAME, CITY] });

      hot.setCellMeta(0, 0, 'className', 'flagged');
      hot.updateSettings({ columns: [ID, NAME] });
      hot.getPlugin('undoRedo').undo();

      expect(hot.getCellMeta(0, 0).className).toBeUndefined();
    });

    it('should drop a cell meta step on a column that is gone, with every older step, and announce it', () => {
      const data = people();
      const afterUndoStackChange = jest.fn();

      hot = createPeopleGrid(data, { columns: [ID, NAME, CITY] });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 1, 'Ann Lee');
      hot.setCellMeta(0, 2, 'className', 'flagged');
      hot.setDataAtCell(1, 1, 'Bo Diaz');
      hot.addHook('afterUndoStackChange', afterUndoStackChange);
      hot.updateSettings({ columns: [ID, NAME] });

      expect(plugin.doneActions.length).toBe(1);
      expect(afterUndoStackChange).toHaveBeenCalledTimes(1);
      expect(afterUndoStackChange.mock.calls[0][0].length).toBe(3);
      expect(afterUndoStackChange.mock.calls[0][1]).toEqual([plugin.doneActions[0]]);

      plugin.undo();

      expect(data[1].name).toBe('Frank Honest');
      expect(data[0].name).toBe('Ann Lee');
      expect(plugin.isUndoAvailable()).toBe(false);
    });

    it('should drop such a step from the redo stack with every step redone after it', () => {
      const data = people();

      hot = createPeopleGrid(data, { columns: [ID, NAME, CITY] });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 1, 'Ann Lee');
      hot.setCellMeta(0, 2, 'className', 'flagged');
      hot.setDataAtCell(1, 1, 'Bo Diaz');
      plugin.undo();
      plugin.undo();
      plugin.undo();
      hot.updateSettings({ columns: [ID, NAME] });

      expect(plugin.undoneActions.length).toBe(1);

      plugin.redo();

      expect(data[0].name).toBe('Ann Lee');
      expect(data[1].name).toBe('Frank Honest');
      expect(plugin.isRedoAvailable()).toBe(false);
    });

    it('should drop a hide on a column that is gone, and keep a later hide on a column that stays', () => {
      hot = createPeopleGrid(people(), { columns: [ID, NAME, CITY], hiddenColumns: true });
      const plugin = hot.getPlugin('undoRedo');
      const hiddenColumns = hot.getPlugin('hiddenColumns');

      hiddenColumns.hideColumn(2);
      hiddenColumns.hideColumn(1);
      hot.updateSettings({ columns: [ID, NAME] });

      expect(plugin.doneActions.length).toBe(1);

      plugin.undo();

      expect(hiddenColumns.isHidden(1)).toBe(false);

      plugin.redo();

      expect(hiddenColumns.isHidden(1)).toBe(true);
    });

    // A merge step addresses the columns its merge covers, and no other.
    it('should keep a merge step, and the steps older than it, when a column outside the merge changes', () => {
      const data = people();

      hot = createPeopleGrid(data, { columns: [ID, NAME, CITY], mergeCells: true });
      const plugin = hot.getPlugin('undoRedo');
      const mergeCells = hot.getPlugin('mergeCells');

      hot.setDataAtCell(0, 1, 'Ann Lee');
      mergeCells.merge(0, 0, 1, 1);
      hot.updateSettings({ columns: [ID, NAME, { data: 'country' }] });

      expect(plugin.doneActions.length).toBe(2);

      plugin.undo();

      expect(mergeCells.mergedCellsCollection.mergedCells.length).toBe(0);

      plugin.undo();

      expect(data[0].name).toBe('Ted Right');
    });

    // The check cannot run while a step is pending, so it runs once the step settles - and records the
    // fields it checked, so the same `columns` sent again (a wrapper re-render) drops nothing more.
    describe('made while an edit waits for its validator', () => {
      let answer;
      const validatedId = { data: 'id', validator: (value, callback) => { answer = callback; } };

      /**
       * Records a meta step on the `name` column, then starts an edit that waits for its validator.
       *
       * @returns {Promise<UndoRedo>} The plugin.
       */
      async function startPendingEdit() {
        answer = null;
        hot = createPeopleGrid(people(), { columns: [validatedId, NAME, CITY] });
        hot.setCellMeta(0, 1, 'className', 'flagged');
        hot.setDataAtCell(0, 0, 5);
        await new Promise(resolve => setTimeout(resolve, 0));

        return hot.getPlugin('undoRedo');
      }

      it('should check the update once the edit settles, and not again when it is sent again', async() => {
        const plugin = await startPendingEdit();

        hot.updateSettings({ columns: [validatedId, CITY, NAME] });

        expect(plugin.doneActions.length).toBe(1);

        answer(true);

        // The meta step addresses a column that shows another field now. The edit is recorded by field.
        expect(plugin.doneActions.map(action => action.actionType)).toEqual(['change']);

        hot.updateSettings({ columns: [validatedId, CITY, NAME] });

        expect(plugin.doneActions.map(action => action.actionType)).toEqual(['change']);
      });

      // The check compares against the fields the steps were made on, so the settle must not refresh
      // them first. The edit's own states span the narrowing, so it goes too.
      it('should check a narrower update against the fields the steps were made on', async() => {
        const plugin = await startPendingEdit();

        hot.updateSettings({ columns: [validatedId, NAME] });
        answer(true);

        expect(plugin.doneActions.length).toBe(0);
      });
    });

    it('should drop a merge step when a column the merge covers changes', () => {
      hot = createPeopleGrid(people(), { columns: [ID, NAME, CITY], mergeCells: true });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 2, 'Austin');
      hot.getPlugin('mergeCells').merge(0, 0, 1, 1);
      hot.updateSettings({ columns: [ID, CITY, NAME] });

      expect(plugin.doneActions.length).toBe(0);
    });

    it('should drop a cell meta step on a column that now shows another field, and keep an edit', () => {
      const data = people();

      hot = createPeopleGrid(data, { columns: [ID, NAME] });
      const plugin = hot.getPlugin('undoRedo');

      hot.setCellMeta(0, 0, 'className', 'flagged');
      hot.setDataAtCell(0, 1, 'Ann Lee');
      // The same width, with the two fields swapped.
      hot.updateSettings({ columns: [NAME, ID] });

      expect(plugin.doneActions.length).toBe(1);

      plugin.undo();

      expect(data[0].name).toBe('Ted Right');
      expect(plugin.isUndoAvailable()).toBe(false);
    });

    it('should not validate the column that now shows another field when an undo restores a value', async() => {
      const data = [['A1', 'B1', 'C1', 'D1']];
      const validator = jest.fn((value, callback) => callback(true));

      hot = createPeopleGrid(data, { columns: [{ data: 0 }, { data: 1 }, { data: 2 }] });

      hot.setDataAtCell(0, 2, 'x');
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }, { data: 3, validator }] });
      hot.getPlugin('undoRedo').undo();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(data[0]).toEqual(['A1', 'B1', 'C1', 'D1']);
      // Column 2 shows field 3 now, which the undo did not write.
      expect(validator).not.toHaveBeenCalled();
    });

    it('should drop a column insertion once `columns` is set, because it cannot be replayed', () => {
      const data = [['A1', 'B1']];

      hot = createPeopleGrid(data, {});
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_col_start', 1);
      hot.setDataAtCell(0, 0, 'x');
      // Every column keeps its field, but a column `alter()` throws while `columns` is set.
      hot.updateSettings({ columns: [{ data: 0 }, { data: 1 }, { data: 2 }] });

      expect(plugin.doneActions.length).toBe(1);

      plugin.undo();

      expect(data[0][0]).toBe('A1');
      expect(plugin.isUndoAvailable()).toBe(false);
    });

    it('should keep the history and fire no stack hook when the same `columns` is sent again', () => {
      const data = people();
      const stackHooks = jest.fn();

      hot = createPeopleGrid(data, { columns: [ID, NAME] });

      hot.setCellMeta(0, 1, 'className', 'flagged');
      hot.addHook('afterUndoStackChange', stackHooks);
      hot.addHook('afterRedoStackChange', stackHooks);
      // What the React wrapper does on every render: a new array with the same fields.
      hot.updateSettings({ columns: [{ data: 'id' }, { data: 'name' }] });

      expect(stackHooks).not.toHaveBeenCalled();
      expect(hot.getPlugin('undoRedo').doneActions.length).toBe(1);
    });
  });

  describe('the cells a restore re-validates', () => {
    it('should re-validate a cell of a column whose `data` is an accessor function', async() => {
      const tick = () => new Promise(resolve => setTimeout(resolve, 0));

      /**
       * Reads and writes the `name` key of a row.
       *
       * @param {object} row The row.
       * @param {*} [value] The value to write.
       * @returns {*}
       */
      function name(row, value) {
        if (value !== undefined) {
          row.name = value;
        }

        return row.name;
      }

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [{ name: 'good' }],
        columns: [{ data: name, validator: (value, callback) => callback(value !== 'bad') }],
        undo: true,
      });

      hot.setDataAtCell(0, 0, 'bad');
      await tick();

      expect(hot.getCellMeta(0, 0).valid).toBe(false);

      hot.getPlugin('undoRedo').undo();
      await tick();

      expect(hot.getDataAtCell(0, 0)).toBe('good');
      expect(hot.getCellMeta(0, 0).valid).toBe(true);
    });
  });

  describe('a row or column count that changes outside a step', () => {
    it('should keep a row the grid appended by itself when an earlier step is undone', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
        minSpareRows: 1,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');
      // What Enter on the last row does with `minSpareRows`: the grid appends a row on its own, with the
      // `auto` source, which no step records.
      hot.alter('insert_row_above', hot.countRows(), 1, 'auto');

      expect(hot.countRows()).toBe(5);

      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(hot.countRows()).toBe(5);
      expect(hot.rowIndexMapper.getNumberOfIndexes()).toBe(hot.countSourceRows());

      plugin.redo();

      expect(hot.getDataAtCell(0, 0)).toBe('x');
      expect(hot.countRows()).toBe(5);
    });

    // While a `batch()` that already removed a row waits for its validator, an unrecorded change is
    // judged from where it started, not from where the batch started.
    describe('while a step that removed a row waits for its validator', () => {
      /**
       * Records an edit, then starts a batch that removes a row and waits for its validator.
       *
       * @returns {UndoRedo} The plugin.
       */
      function startPendingRemoval() {
        hot = new Handsontable(container, {
          licenseKey: 'non-commercial-and-evaluation',
          data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3'], ['A4', 'B4']],
          columns: [{ validator: (value, callback) => callback(true) }, {}],
          undo: true,
        });
        hot.setDataAtCell(3, 1, 'prior');
        hot.batch(() => {
          hot.alter('remove_row', 1);
          hot.setDataAtCell(0, 0, 'x');
        });

        return hot.getPlugin('undoRedo');
      }

      it('should keep the history when the grid appends a row at the end', async() => {
        const plugin = startPendingRemoval();

        hot.alter('insert_row_above', hot.countRows(), 1, 'auto');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(plugin.doneActions.map(action => action.actionType)).toEqual(['change', 'batch']);
      });

      it('should drop the history when an unrecorded change inserts a row in the middle', async() => {
        const plugin = startPendingRemoval();

        hot.alter('insert_row_above', 1, 1, 'auto');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(plugin.doneActions.length).toBe(0);
      });
    });

    it('should keep a column a settings update added inside the step when the step is undone', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']],
        columns: [{}, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.batch(() => {
        hot.updateSettings({ columns: [{}, {}, {}] });
        hot.setDataAtCell(0, 2, 'x');
      });

      expect(hot.countCols()).toBe(3);

      plugin.undo();

      expect(hot.getDataAtCell(0, 2)).toBe('C1');
      expect(hot.countCols()).toBe(3);
      expect(hot.columnIndexMapper.getNumberOfIndexes()).toBe(3);

      plugin.redo();

      expect(hot.getDataAtCell(0, 2)).toBe('x');
      expect(hot.countCols()).toBe(3);
    });

    it('should keep rows a settings update added from a change listener when the step is undone', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      // The settings update runs inside the edit's step, and the rows it adds are not journaled.
      hot.addHook('afterChange', (changes) => {
        if (changes?.some(([, , , value]) => value === 'grow')) {
          hot.updateSettings({ minRows: 5 });
        }
      });
      hot.setDataAtCell(0, 0, 'grow');

      expect(hot.countRows()).toBe(5);

      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
      expect(hot.countRows()).toBe(5);
      expect(hot.rowIndexMapper.getNumberOfIndexes()).toBe(hot.countSourceRows());

      plugin.redo();

      expect(hot.getDataAtCell(0, 0)).toBe('grow');
      expect(hot.countRows()).toBe(5);
    });

    it('should drop the history when an unrecorded change inserts a row before the last one', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        hiddenRows: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const hiddenRecords = () => hot.getPlugin('hiddenRows').getHiddenRows()
        .map(row => hot.getSourceDataAtCell(hot.toPhysicalRow(row), 0));

      hot.getPlugin('hiddenRows').hideRows([3]);
      // A legacy action whose undo inserts a row in the middle: its transaction is not recorded, and it
      // moves the physical index of every row below.
      plugin.done(() => ({
        actionType: 'insert_in_the_middle',
        undo(instance, settle) {
          instance.alter('insert_row_above', 1, 1);
          settle();
        },
        redo(instance, settle) {
          instance.alter('remove_row', 1, 1);
          settle();
        },
      }));
      plugin.undo();

      expect(hiddenRecords()).toEqual(['A4']);

      // The hiding step was recorded against the old numbering, so it must not be replayed.
      plugin.undo();
      plugin.redo();

      expect(hiddenRecords()).toEqual(['A4']);
    });
  });

  describe('the unsorted order a sorting plugin keeps', () => {
    it('should put the unsorted order back when a row removal on a sorted grid is undone', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['a'], ['b'], ['c'], ['d'], ['e']],
        columnSorting: true,
        manualRowMove: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const column = () => Array.from({ length: hot.countRows() }, (_, row) => hot.getDataAtCell(row, 0));

      hot.getPlugin('manualRowMove').moveRow(0, 3);
      hot.render();

      const movedOrder = column();

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      hot.alter('remove_row', 1, 1);
      plugin.undo();
      hot.getPlugin('columnSorting').clearSort();

      // Clearing the sort brings back the order the rows had before it - the moved one.
      expect(column()).toEqual(movedOrder);
    });
  });

  describe('merges restored while rows are trimmed', () => {
    it('should keep a visible merge that sits where a fully trimmed merge was drawn', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: Array.from({ length: 10 }, (_, row) => [`A${row + 1}`, `B${row + 1}`]),
        mergeCells: [
          { row: 2, col: 0, rowspan: 2, colspan: 1 },
          { row: 6, col: 0, rowspan: 2, colspan: 1 },
        ],
        trimRows: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const collection = () => hot.getPlugin('mergeCells').mergedCellsCollection;

      // The first merge loses every row and keeps its stale coordinates; the second one moves up onto
      // the same visual slot.
      hot.getPlugin('trimRows').trimRows([2, 3, 4, 5]);

      expect(collection().get(2, 0)?.rowspan).toBe(2);

      // Undoing a column insert puts the merge state back, the trimmed merge first in the list.
      hot.alter('insert_col_end', 2, 1);
      plugin.undo();

      expect(collection().mergedCells.length).toBe(2);
      expect(collection().get(2, 0)?.rowspan).toBe(2);
      expect(hot.getDataAtCell(2, 0)).toBe('A7');

      plugin.undo();

      expect(collection().get(2, 0)?.rowspan).toBe(2);
      expect(collection().get(6, 0)?.rowspan).toBe(2);
      expect(hot.getDataAtCell(6, 0)).toBe('A7');
    });
  });

  // `mergeSelection()` unmerges the merges inside the range before it merges it. That unmerge is part
  // of the user's merge, so both are one undo step (DEV-160, DEV-514).
  describe('a merge over existing merges', () => {
    /**
     * Lists the merges as `[row, col, rowspan, colspan]`, sorted.
     *
     * @returns {Array}
     */
    function listMerges() {
      return hot.getPlugin('mergeCells').mergedCellsCollection.mergedCells
        .map(({ row, col, rowspan, colspan }) => [row, col, rowspan, colspan])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    }

    /**
     * Builds a grid of `A1`-style values.
     *
     * @param {number} rows The number of rows.
     * @param {number} columns The number of columns.
     * @returns {Array}
     */
    function sheet(rows, columns) {
      return Array.from({ length: rows }, (_, row) => Array.from(
        { length: columns }, (__, column) => `${String.fromCharCode(65 + column)}${row + 1}`,
      ));
    }

    // An undo writes back only the merges its step changed, so a merge a settings update made since
    // survives it.
    it('should keep a merge a settings update made after the step when the step is undone and redone', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: sheet(6, 4),
        mergeCells: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.getPlugin('mergeCells').merge(0, 0, 1, 1);
      hot.updateSettings({ mergeCells: [{ row: 3, col: 0, rowspan: 2, colspan: 2 }] });

      expect(listMerges()).toEqual([[3, 0, 2, 2]]);

      plugin.undo();

      expect(listMerges()).toEqual([[3, 0, 2, 2]]);

      plugin.redo();

      expect(listMerges()).toEqual([[0, 0, 2, 2], [3, 0, 2, 2]]);

      plugin.undo();

      expect(listMerges()).toEqual([[3, 0, 2, 2]]);
    });

    // A merge is put back with no overlap check, so a merge a settings update made on the same cells
    // makes the undo rebuild the whole list instead of stacking the two.
    it('should not put a merge back over one a settings update made on its cells', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: sheet(6, 4),
        mergeCells: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const mergeCells = hot.getPlugin('mergeCells');

      mergeCells.merge(0, 0, 1, 1);
      mergeCells.unmerge(0, 0, 1, 1);
      hot.updateSettings({ mergeCells: [{ row: 1, col: 1, rowspan: 2, colspan: 2 }] });
      plugin.undo();

      const collection = mergeCells.mergedCellsCollection;

      expect(listMerges()).toEqual([[0, 0, 2, 2]]);
      expect(collection.get(1, 1)).toBe(collection.get(0, 0));
      expect(collection.get(2, 2)).toBe(false);
    });

    it('should be one step, and one undo should bring back the merges it replaced', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: sheet(5, 5),
        mergeCells: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const mergeCells = hot.getPlugin('mergeCells');

      hot.selectCell(0, 1, 2, 1);
      mergeCells.mergeSelection();
      hot.selectCell(0, 3, 2, 3);
      mergeCells.mergeSelection();

      const dataBefore = hot.getData();

      hot.selectCell(0, 0, 2, 3);
      mergeCells.mergeSelection();

      expect(plugin.doneActions.map(step => step.actionType)).toEqual(['merge_cells', 'merge_cells', 'merge_cells']);
      expect(listMerges()).toEqual([[0, 0, 3, 4]]);

      plugin.undo();

      expect(listMerges()).toEqual([[0, 1, 3, 1], [0, 3, 3, 1]]);
      expect(hot.getData()).toEqual(dataBefore);

      plugin.redo();

      expect(listMerges()).toEqual([[0, 0, 3, 4]]);
    });

    it('should bring back a merge declared at initialization with one undo', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: sheet(6, 6),
        mergeCells: [{ row: 0, col: 0, rowspan: 3, colspan: 3 }],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const dataBefore = hot.getData();

      hot.selectCell(0, 0, 4, 3);
      hot.getPlugin('mergeCells').mergeSelection();

      expect(plugin.doneActions.length).toBe(1);

      plugin.undo();

      expect(listMerges()).toEqual([[0, 0, 3, 3]]);
      expect(hot.getData()).toEqual(dataBefore);
      expect(plugin.isUndoAvailable()).toBe(false);
    });

    it('should describe the step with the merged range and the values it collapses', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: sheet(3, 3),
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      // The declared merge already cleared A2, the cell it covers.
      const valuesBefore = hot.getData(0, 0, 1, 1);

      hot.selectCell(0, 0, 1, 1);
      hot.getPlugin('mergeCells').mergeSelection();

      const [step] = plugin.doneActions;

      expect(step.actionType).toBe('merge_cells');
      expect([step.cellRange.from.row, step.cellRange.from.col, step.cellRange.to.row, step.cellRange.to.col])
        .toEqual([0, 0, 1, 1]);
      expect(step.data).toEqual(valuesBefore);
      expect(valuesBefore).toEqual([['A1', 'B1'], [null, 'B2']]);
    });

    // The undo adds back only the merge the step removed, and keeps the list in the order it had.
    it('should put a merge an undo brings back in its place in the list', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: Array.from({ length: 6 }, (_, row) => [`A${row + 1}`]),
        mergeCells: [
          { row: 0, col: 0, rowspan: 2, colspan: 1 },
          { row: 2, col: 0, rowspan: 2, colspan: 1 },
          { row: 4, col: 0, rowspan: 2, colspan: 1 },
        ],
        undo: true,
      });
      const mergeCells = hot.getPlugin('mergeCells');

      mergeCells.unmerge(0, 0, 1, 0);
      hot.getPlugin('undoRedo').undo();

      expect(mergeCells.mergedCellsCollection.mergedCells.map(({ row }) => row)).toEqual([0, 2, 4]);
    });
  });

  describe('a step that replaces the data', () => {
    it('should not record a step whose transaction spans `updateData()`', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.batch(() => {
        hot.setDataAtCell(0, 0, 'x');
        hot.updateData([['new 1'], ['new 2']]);
      });

      expect(plugin.isUndoAvailable()).toBe(false);

      plugin.undo();

      // The journal describes the replaced dataset, so its old value must not land in the new one.
      expect(hot.getDataAtCell(0, 0)).toBe('new 1');
    });
  });

  describe('the values a restore writes', () => {
    it('should write the stored values back without running the `valueSetter` again', () => {
      // Not idempotent on purpose: a setter that ran on the replay would append a second `+`.
      const valueSetter = jest.fn(value => `${value}+`);

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2'], ['A3', 'B3']],
        columns: [{ valueSetter }, {}],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');

      expect(hot.getSourceDataAtCell(0, 0)).toBe('x+');

      valueSetter.mockClear();
      plugin.undo();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('A1');

      plugin.redo();

      expect(hot.getSourceDataAtCell(0, 0)).toBe('x+');

      hot.alter('remove_row', 1, 1);
      plugin.undo();

      expect(hot.getSourceDataAtRow(1)).toEqual(['A2', 'B2']);
      expect(valueSetter).not.toHaveBeenCalled();
    });

    it('should write the values of an array-form call with an undo source as they are', () => {
      const valueSetter = jest.fn(value => `${value}+`);
      const sourceDataValidator = jest.fn(value => value !== 'y');

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1'], ['A2', 'B2']],
        columns: [{ valueSetter }, { sourceDataValidator, allowInvalid: false }],
        undo: true,
      });

      hot.setSourceDataAtCell([[1, 0, 'x'], [1, 1, 'y']], 'myImport');

      expect(hot.getSourceDataAtRow(1)).toEqual(['x+', 'B2']);

      valueSetter.mockClear();
      sourceDataValidator.mockClear();
      hot.setSourceDataAtCell([[0, 0, 'x'], [0, 1, 'y']], 'UndoRedo.undo');

      expect(hot.getSourceDataAtRow(0)).toEqual(['x', 'y']);
      expect(valueSetter).not.toHaveBeenCalled();
      expect(sourceDataValidator).not.toHaveBeenCalled();
    });
  });

  describe('a prop with a dot in its name', () => {
    it('should write a literal dotted key back as a literal key with `dataDotNotation: false`', () => {
      const data = [{ 'a.b': 1, c: 2 }, { 'a.b': 3, c: 4 }, { 'a.b': 5, c: 6 }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        dataDotNotation: false,
        columns: [{ data: 'a.b' }, { data: 'c' }],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');

      expect(data[0]).toEqual({ 'a.b': 'x', c: 2 });

      plugin.undo();

      expect(data[0]).toEqual({ 'a.b': 1, c: 2 });

      plugin.redo();

      expect(data[0]).toEqual({ 'a.b': 'x', c: 2 });

      hot.alter('remove_row', 1, 1);
      plugin.undo();

      expect(hot.getSourceDataAtRow(1)).toEqual({ 'a.b': 3, c: 4 });
      expect(hot.getDataAtCell(1, 0)).toBe(3);
    });

    it('should write a literal dotted key the row owns back as a literal key with `dataDotNotation: true`', () => {
      const data = [{ 'a.b': 1 }, { 'a.b': 2 }];

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data,
        columns: [{ data: 'a.b' }],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.setDataAtCell(0, 0, 'x');

      expect(data[0]).toEqual({ 'a.b': 'x' });

      plugin.undo();

      expect(data[0]).toEqual({ 'a.b': 1 });

      plugin.redo();

      expect(data[0]).toEqual({ 'a.b': 'x' });
    });
  });

  describe('a step on a nested rows grid', () => {
    // NestedRows expands the collapsed parents before a removal and collapses them again a tick later.
    it('should record a row removal next to a collapsed parent as one step that keeps it collapsed', async() => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [
          { name: 'Root A', __children: [{ name: 'A-1' }, { name: 'A-2' }] },
          { name: 'Root B', __children: [{ name: 'B-1' }, { name: 'B-2' }] },
        ],
        columns: [{ data: 'name' }],
        nestedRows: true,
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');
      const collapsing = hot.getPlugin('nestedRows').collapsingUI;
      const settle = () => new Promise(resolve => setTimeout(resolve, 0));

      collapsing.collapseChildren(3);
      plugin.clear();
      hot.alter('remove_row', 1);
      await settle();

      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['remove_row']);
      expect(hot.countRows()).toBe(3);

      plugin.undo();
      await settle();

      expect(hot.countRows()).toBe(4);
      expect(hot.getDataAtCell(1, 0)).toBe('A-1');
      expect(collapsing.areChildrenCollapsed(3)).toBe(true);
      expect(plugin.isRedoAvailable()).toBe(true);

      plugin.redo();
      await settle();

      expect(hot.countRows()).toBe(3);
      expect(collapsing.areChildrenCollapsed(2)).toBe(true);
    });

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
