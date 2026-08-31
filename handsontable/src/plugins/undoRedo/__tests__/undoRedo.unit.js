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
});
