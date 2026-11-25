import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('Formulas: a NestedRows detach keeps the source formulas in step', () => {
  let container;
  let hot;
  let data;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  const build = (sourceData = [
    { a: 1, b: 2, __children: [{ a: 2, b: 6 }] },
    { a: 3, b: '=A3*2' },
    { a: 4, b: '=A4*2' },
  ]) => {
    data = sourceData;
    hot = new Handsontable(container, {
      data,
      columns: [{ data: 'a' }, { data: 'b' }],
      nestedRows: true,
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      licenseKey: TEST_LICENSE_KEY,
    });
  };

  const detachFirstChild = () => {
    const { dataManager } = hot.getPlugin('nestedRows');

    dataManager.detachFromParent(dataManager.getDataObject(1));
  };

  const rawSourceData = () => JSON.parse(JSON.stringify(data));

  /**
   * Waits for the re-collapse a detach runs a tick later.
   *
   * @returns {Promise}
   */
  const settle = () => new Promise(resolve => setTimeout(resolve, 0));

  const engineSheet = () => {
    const { engine, sheetId } = hot.getPlugin('formulas');

    return engine.getSheetSerialized(sheetId);
  };

  it('writes the formulas the detach rewrote into the source data', async() => {
    build();
    detachFirstChild();

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    expect(rawSourceData()).toEqual([
      { a: 1, b: 2, __children: [] },
      { a: 3, b: '=A2*2' },
      { a: 4, b: '=A3*2' },
      { a: 2, b: 6 },
    ]);
  });

  it('keeps the values on a settings update after the detach', async() => {
    build();
    detachFirstChild();
    hot.updateSettings({});

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    expect(engineSheet()).toEqual([[1, 2], [3, '=A2*2'], [4, '=A3*2'], [2, 6]]);
  });

  it('undoes the detach and its formula text in one step', async() => {
    build();
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    expect(undoRedo.doneActions.length).toBe(1);

    undoRedo.undo();

    expect(hot.getData()).toEqual([[1, 2], [2, 6], [3, 6], [4, 8]]);
    expect(rawSourceData()).toEqual([
      { a: 1, b: 2, __children: [{ a: 2, b: 6 }] },
      { a: 3, b: '=A3*2' },
      { a: 4, b: '=A4*2' },
    ]);
    expect(engineSheet()).toEqual([[1, 2], [2, 6], [3, '=A3*2'], [4, '=A4*2']]);
  });

  it('redoes the detach with the values the detach showed', async() => {
    build();
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    undoRedo.undo();
    undoRedo.redo();

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    expect(rawSourceData()).toEqual([
      { a: 1, b: 2, __children: [] },
      { a: 3, b: '=A2*2' },
      { a: 4, b: '=A3*2' },
      { a: 2, b: 6 },
    ]);
    expect(engineSheet()).toEqual([[1, 2], [3, '=A2*2'], [4, '=A3*2'], [2, 6]]);
  });

  it('keeps the values over repeated undo and redo cycles', async() => {
    build();
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    for (let cycle = 0; cycle < 3; cycle++) {
      undoRedo.undo();

      expect(hot.getData()).toEqual([[1, 2], [2, 6], [3, 6], [4, 8]]);

      undoRedo.redo();

      expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6]]);
    }
  });

  it('keeps the values when the detached row has a child of its own', async() => {
    build([
      { a: 1, b: 2, __children: [{ a: 2, b: 6, __children: [{ a: 5, b: 4 }] }] },
      { a: 3, b: '=A4*2' },
      { a: 4, b: '=A5*2' },
    ]);
    detachFirstChild();

    const undoRedo = hot.getPlugin('undoRedo');

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6], [5, 4]]);

    undoRedo.undo();

    expect(hot.getData()).toEqual([[1, 2], [2, 6], [5, 4], [3, 6], [4, 8]]);
    expect(rawSourceData()[1]).toEqual({ a: 3, b: '=A4*2' });

    undoRedo.redo();

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6], [5, 4]]);

    hot.updateSettings({});

    expect(hot.getData()).toEqual([[1, 2], [3, 6], [4, 8], [2, 6], [5, 4]]);
  });

  it('keeps the values when two selected rows are detached in one step', async() => {
    build([
      { a: 1, b: 2, __children: [{ a: 2, b: 6 }, { a: 5, b: 7 }] },
      { a: 3, b: '=A4*2' },
      { a: 4, b: '=A5*2' },
    ]);
    hot.getPlugin('nestedRows').dataManager.detachFromParent([1, 0, 2, 1]);

    const undoRedo = hot.getPlugin('undoRedo');
    const detached = hot.getData();

    expect(undoRedo.doneActions.length).toBe(1);
    expect(detached.filter(([a]) => a === 3 || a === 4)).toEqual([[3, 6], [4, 8]]);

    undoRedo.undo();

    expect(hot.getData()).toEqual([[1, 2], [2, 6], [5, 7], [3, 6], [4, 8]]);

    undoRedo.redo();

    expect(hot.getData()).toEqual(detached);

    hot.updateSettings({});

    expect(hot.getData()).toEqual(detached);
  });

  it('keeps the values when a collapsed parent sits below the detached row', async() => {
    build([
      { a: 1, b: 2, __children: [{ a: 2, b: 6 }] },
      { a: 9, b: 0, __children: [{ a: 7, b: 0 }, { a: 8, b: 0 }] },
      { a: 3, b: '=A6*2' },
      { a: 4, b: '=A7*2' },
    ]);

    const nestedRows = hot.getPlugin('nestedRows');
    const undoRedo = hot.getPlugin('undoRedo');

    nestedRows.collapseParent(2);
    undoRedo.clear();

    expect(hot.getData()).toEqual([[1, 2], [2, 6], [9, 0], [3, 6], [4, 8]]);

    const formulaRows = () => hot.getData().filter(([a]) => a === 3 || a === 4);

    detachFirstChild();
    await settle();

    expect(formulaRows()).toEqual([[3, 6], [4, 8]]);

    undoRedo.undo();
    await settle();

    expect(hot.getData()).toEqual([[1, 2], [2, 6], [9, 0], [3, 6], [4, 8]]);
    expect(nestedRows.isParentCollapsed(2)).toBe(true);

    undoRedo.redo();
    await settle();

    expect(formulaRows()).toEqual([[3, 6], [4, 8]]);
    expect(rawSourceData().slice(2)).toEqual([
      { a: 3, b: '=A5*2' },
      { a: 4, b: '=A6*2' },
      { a: 2, b: 6 },
    ]);
  });

  it('keeps the old text of a formula that read the detached row, which the engine turned into #REF!', async() => {
    build([
      { a: 1, b: 2, __children: [{ a: 2, b: 6 }] },
      { a: 3, b: '=A2*10' },
      { a: 4, b: '=A3*10' },
    ]);
    detachFirstChild();

    expect(hot.getDataAtCell(1, 1)).toBe('#REF!');
    expect(hot.getDataAtCell(2, 1)).toBe(30);
    expect(rawSourceData()[1]).toEqual({ a: 3, b: '=A2*10' });
    expect(rawSourceData()[2]).toEqual({ a: 4, b: '=A2*10' });
  });
});
