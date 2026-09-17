import Handsontable from 'handsontable/base';
import { registerPlugin, UndoRedo } from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';

registerAllCellTypes();
registerPlugin(UndoRedo);

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

  // `alter()` removes nothing when the index it gets names no row or column (DEV-117), so it fires no
  // `afterRemoveRow` / `afterRemoveCol`. A recorded index names nothing once the grid has changed shape
  // outside the stack - here, `updateData`. The actions below settle on those hooks, so without a
  // fallback the settle never runs and `ignoreNewActions` stays on for the rest of the session.
  describe('an undo or redo whose removal removes nothing', () => {
    it('should keep recording new actions after undoing a row insertion whose index no longer exists', () => {
      const afterUndo = jest.fn();

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3'], ['A4'], ['A5']],
        undo: true,
        afterUndo,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_row_above', 5, 1); // recorded at index 5
      hot.updateData([['B1'], ['B2']]); // outside the stack: index 5 now names no row

      plugin.undo();

      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['B1'], ['B2']]);
      // The undo did not apply, so the action goes back on the done stack and `afterUndo` stays silent.
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['insert_row']);
      expect(plugin.undoneActions.length).toBe(0);
      expect(afterUndo).not.toHaveBeenCalled();

      // The listener armed for the undo must not be left behind: a later real removal would otherwise
      // settle the stale undo a second time and move the action onto the undone stack.
      hot.alter('remove_row', 0);

      expect(plugin.undoneActions.length).toBe(0);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('B2');
    });

    it('should keep recording new actions after undoing a column insertion whose index no longer exists', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('insert_col_start', 3, 1); // recorded at index 3
      hot.updateData([['X1', 'Y1']]); // outside the stack: index 3 now names no column

      plugin.undo();

      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['X1', 'Y1']]);
      expect(plugin.doneActions.map(action => action.actionType)).toEqual(['insert_col']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
    });

    it('should keep recording new actions after redoing a column removal whose index no longer exists', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1', 'B1', 'C1', 'D1', 'E1']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_col', 4, 1); // recorded at index 4
      plugin.undo();
      hot.updateData([['X1', 'Y1']]); // outside the stack: index 4 now names no column

      plugin.redo();

      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['X1', 'Y1']]);
      // The redo did not apply, so the action goes back on the undone stack.
      expect(plugin.undoneActions.map(action => action.actionType)).toEqual(['remove_col']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('X1');
    });

    it('should keep recording new actions after a row removal redo is vetoed', () => {
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [['A1'], ['A2'], ['A3']],
        undo: true,
      });
      const plugin = hot.getPlugin('undoRedo');

      hot.alter('remove_row', 1, 1);
      plugin.undo();

      // `RemoveRowAction` replays a physical index through `toVisualRow()`, which yields an existing row
      // or `null`, never an index past the end - so the way its redo removes nothing is a veto.
      const veto = () => false;

      hot.addHook('beforeRemoveRow', veto);
      plugin.redo();
      hot.removeHook('beforeRemoveRow', veto);

      expect(plugin.ignoreNewActions).toBe(false);
      expect(hot.getData()).toEqual([['A1'], ['A2'], ['A3']]);
      expect(plugin.undoneActions.map(action => action.actionType)).toEqual(['remove_row']);

      hot.setDataAtCell(0, 0, 'edited');
      plugin.undo();

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });
  });
});
