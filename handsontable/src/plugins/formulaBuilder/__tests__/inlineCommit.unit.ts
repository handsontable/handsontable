import { FormulaBuilder } from '../formulaBuilder';
import { makeIndexMapperStub, makePluginHotStub } from './helpers/pluginHotStub';

/**
 * Builds an enabled plugin over a 5x5 grid whose host editor records `setValue`
 * and runs the `finishEditing` callback at once, with the given cell selected.
 *
 * @param {number[] | undefined} selected The `getSelectedLast` result.
 * @returns {{ plugin: FormulaBuilder, setValue: jest.Mock, finishEditing: jest.Mock, selectCell: jest.Mock }}
 */
function makeCommitContext(selected: number[] | undefined) {
  const stub = makePluginHotStub();
  const setValue = jest.fn();
  const finishEditing = jest.fn((_restore?: boolean, _ctrl?: boolean, callback?: () => void) =>
    callback?.(),
  );

  stub.hot.getActiveEditor = () => ({ setValue, finishEditing });
  stub.hot.getSelectedLast = () => selected;
  stub.hot.countRows = () => 5;
  stub.hot.countCols = () => 5;
  stub.hot.rowIndexMapper = makeIndexMapperStub(5);
  stub.hot.columnIndexMapper = makeIndexMapperStub(5);

  const plugin = new FormulaBuilder(stub.instance);

  plugin.enablePlugin();

  return { plugin, setValue, finishEditing, selectCell: stub.hot.selectCell };
}

describe('FormulaBuilder.commitInlineEdit', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('without a direction saves the value and finishes the edit in place', () => {
    const { plugin, setValue, finishEditing, selectCell } = makeCommitContext([2, 2, 2, 2]);

    plugin.commitInlineEdit('=A1');

    expect(setValue).toHaveBeenCalledWith('=A1');
    expect(finishEditing).toHaveBeenCalledTimes(1);
    expect(finishEditing.mock.calls[0]).toEqual([]);
    expect(selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });

  it.each([
    ['up', [1, 2]],
    ['down', [3, 2]],
    ['left', [2, 1]],
    ['right', [2, 3]],
  ] as const)('with direction %j saves the value and moves the selection to %j', (direction, target) => {
    const { plugin, setValue, selectCell } = makeCommitContext([2, 2, 2, 2]);

    plugin.commitInlineEdit('=B2', direction);

    expect(setValue).toHaveBeenCalledWith('=B2');
    expect(selectCell.mock.calls).toEqual([target]);

    plugin.disablePlugin();
  });

  it.each([
    ['up', [0, 0], [0, 0]],
    ['left', [0, 0], [0, 0]],
    ['down', [4, 4], [4, 4]],
    ['right', [4, 4], [4, 4]],
  ] as const)('with direction %j from the edge cell %j stays at %j', (direction, start, target) => {
    const { plugin, selectCell } = makeCommitContext([start[0], start[1], start[0], start[1]]);

    plugin.commitInlineEdit('1', direction);

    expect(selectCell.mock.calls).toEqual([target]);

    plugin.disablePlugin();
  });

  it.each([
    ['down', [0, 0], [1, 0]],
    ['right', [0, 0], [0, 1]],
    ['down', [0, 3], [1, 3]],
    ['right', [3, 0], [3, 1]],
  ] as const)('with direction %j from the row-0/column-0 cell %j moves to %j', (direction, start, target) => {
    const { plugin, selectCell } = makeCommitContext([start[0], start[1], start[0], start[1]]);

    plugin.commitInlineEdit('1', direction);

    expect(selectCell.mock.calls).toEqual([target]);

    plugin.disablePlugin();
  });

  it('with a direction finishes the edit as a save with no Ctrl fill and moves only in the callback', () => {
    const { plugin, finishEditing, selectCell } = makeCommitContext([2, 2, 2, 2]);

    finishEditing.mockImplementation(() => undefined);
    plugin.commitInlineEdit('=B2', 'down');

    expect(finishEditing).toHaveBeenCalledTimes(1);
    expect(finishEditing.mock.calls[0]).toEqual([false, false, expect.any(Function)]);
    // The editor manager runs the callback once the value is saved; nothing moves before that.
    expect(selectCell).not.toHaveBeenCalled();

    const callback = finishEditing.mock.calls[0][2] as () => void;

    callback();

    expect(selectCell.mock.calls).toEqual([[3, 2]]);

    plugin.disablePlugin();
  });

  it('moves from the cell selected when the commit started, not the one after the save', () => {
    const stub = makePluginHotStub();
    let selected = [2, 2, 2, 2];
    const finishEditing = jest.fn((_restore?: boolean, _ctrl?: boolean, callback?: () => void) => {
      selected = [0, 0, 0, 0];
      callback?.();
    });

    stub.hot.getActiveEditor = () => ({ setValue: jest.fn(), finishEditing });
    stub.hot.getSelectedLast = () => selected;
    stub.hot.rowIndexMapper = makeIndexMapperStub(5);
    stub.hot.columnIndexMapper = makeIndexMapperStub(5);

    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    plugin.commitInlineEdit('1', 'right');

    expect(stub.hot.selectCell.mock.calls).toEqual([[2, 3]]);

    plugin.disablePlugin();
  });

  it('with a direction but no selection saves the value and leaves the selection alone', () => {
    const { plugin, setValue, finishEditing, selectCell } = makeCommitContext(undefined);

    plugin.commitInlineEdit('7', 'down');

    expect(setValue).toHaveBeenCalledWith('7');
    expect(finishEditing).toHaveBeenCalledTimes(1);
    expect(selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });

  it('does nothing without a host editor', () => {
    const stub = makePluginHotStub();
    const plugin = new FormulaBuilder(stub.instance);

    plugin.enablePlugin();
    plugin.commitInlineEdit('=A1', 'down');

    expect(stub.hot.selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });
});

describe('FormulaBuilder.cancelInlineEdit', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('restores the original value and re-selects the edited cell', () => {
    const { plugin, finishEditing, selectCell } = makeCommitContext([3, 1, 3, 1]);

    plugin.cancelInlineEdit();

    expect(finishEditing).toHaveBeenCalledWith(true);
    expect(selectCell.mock.calls).toEqual([[3, 1]]);

    plugin.disablePlugin();
  });

  it('restores the original value without re-selecting when nothing is selected', () => {
    const { plugin, finishEditing, selectCell } = makeCommitContext(undefined);

    plugin.cancelInlineEdit();

    expect(finishEditing).toHaveBeenCalledWith(true);
    expect(selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });

  it('does not re-select a header selection', () => {
    const { plugin, finishEditing, selectCell } = makeCommitContext([-1, 2, -1, 2]);

    plugin.cancelInlineEdit();

    expect(finishEditing).toHaveBeenCalledWith(true);
    expect(selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });
});
