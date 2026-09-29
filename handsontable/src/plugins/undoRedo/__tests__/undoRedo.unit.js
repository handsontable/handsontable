import Handsontable from 'handsontable/base';
import { registerPlugin, TrimRows, UndoRedo } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);
registerPlugin(TrimRows);

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

  // `alter()` removes nothing when the index it gets names no row or column (DEV-117), and a removal that
  // removes nothing fires no `afterRemoveRow` / `afterRemoveCol` - the hooks these actions settle on.
  //
  // A recorded index names nothing once the grid changed shape outside the stack (`updateData`, a trim).
  // That case is predictable, so `canUndo()` / `canRedo()` refuse it before `beforeUndo` / `beforeRedo`,
  // and the action simply stays where it is. A `beforeRemoveRow` / `beforeRemoveCol` veto is not
  // predictable, so it reaches the removal, and `settleOnRemoveHook()` settles it late instead.
  describe('an undo or redo whose removal removes nothing', () => {
    it('should refuse undoing a row insertion whose index no longer exists, and keep recording', () => {
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

      hot.alter('insert_row_above', 5, 1); // recorded at index 5
      hot.updateData([['B1'], ['B2']]); // outside the stack: index 5 now names no row

      plugin.undo();

      // Refused before any hook, so the action never leaves the done stack.
      expect(beforeUndo).not.toHaveBeenCalled();
      expect(afterUndo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['B1'], ['B2']]);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['insert_row']);
      expect(plugin.undoneActions.length).toBe(0);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('B1');
    });

    it('should refuse undoing a column insertion whose index no longer exists, and keep recording', () => {
      const beforeUndo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1']],
        undo: true,
        beforeUndo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_col_start', 3, 1); // recorded at index 3
      hot.updateData([['X1', 'Y1']]); // outside the stack: index 3 now names no column

      plugin.undo();

      expect(beforeUndo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['X1', 'Y1']]);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['insert_col']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
    });

    it('should refuse redoing a column removal whose index no longer exists, and keep recording', () => {
      const beforeRedo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1', 'D1', 'E1']],
        undo: true,
        beforeRedo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_col', 4, 1); // recorded at index 4
      plugin.undo();
      hot.updateData([['X1', 'Y1']]); // outside the stack: index 4 now names no column

      plugin.redo();

      // Refused before any hook, so the action never leaves the undone stack.
      expect(beforeRedo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['X1', 'Y1']]);
      expect(plugin.undoneActions.map(action => action.actionType)).toEqual(['remove_col']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
    });

    it('should refuse redoing a row removal whose row is trimmed, instead of removing the last row', () => {
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
      // `RemoveRowAction` replays a physical index through `toVisualRow()`, which returns `null` for a
      // trimmed row. `alter()` reads `null` as "take the rows from the end", so the redo would remove `A5`.
      hot.getPlugin('trimRows').trimRows([1]);

      plugin.redo();

      expect(beforeRedo).not.toHaveBeenCalled();
      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
      expect(plugin.undoneActions.map(action => action.actionType)).toEqual(['remove_row']);
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
});
